'use client';

import { useState, useRef, useCallback } from 'react';

const VOICE_SERVICE_URL = process.env.NEXT_PUBLIC_VOICE_SERVICE_URL || 'https://voice-chat-service-i5u9.onrender.com';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseVoiceChatReturn {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ transcription: string; response: string } | null>;
  conversationHistory: Message[];
  clearHistory: () => void;
}

export function useVoiceChat(): UseVoiceChatReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Use webm for best compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied');
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ transcription: string; response: string } | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }
    
    setIsRecording(false);
    setIsProcessing(true);
    
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        if (audioBlob.size < 1000) {
          setError('Recording too short');
          setIsProcessing(false);
          resolve(null);
          return;
        }
        
        try {
          const result = await sendToVoiceService(audioBlob);
          resolve(result);
        } catch (err) {
          console.error('Voice service error:', err);
          setError('Failed to process voice');
          resolve(null);
        } finally {
          setIsProcessing(false);
        }
      };
      
      mediaRecorder.stop();
    });
  }, [isRecording]);

  const sendToVoiceService = async (audioBlob: Blob): Promise<{ transcription: string; response: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('conversation_history', JSON.stringify(conversationHistory));
    
    const response = await fetch(`${VOICE_SERVICE_URL}/voice-chat`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Voice service error: ${response.status}`);
    }
    
    // Process streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    let transcription = '';
    let aiResponse = '';
    const audioChunks: Uint8Array[] = [];
    
    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Try to parse as JSON metadata or collect as audio
      const text = new TextDecoder().decode(value);
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            if (json.type === 'transcription') {
              transcription = json.text;
            } else if (json.type === 'response') {
              aiResponse = json.text;
            }
          } catch {
            // Not JSON, must be audio data
            audioChunks.push(value);
          }
        }
      }
    }
    
    // Play audio if we have any
    if (audioChunks.length > 0) {
      await playAudio(audioChunks);
    }
    
    // Update conversation history
    if (transcription) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: transcription },
        { role: 'assistant', content: aiResponse }
      ]);
    }
    
    return { transcription, response: aiResponse };
  };

  const playAudio = async (chunks: Uint8Array[]): Promise<void> => {
    return new Promise((resolve) => {
      setIsPlaying(true);
      
      // Combine all chunks into a single Uint8Array, then create blob
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const audioBlob = new Blob([combined.buffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }
      
      const audio = audioElementRef.current;
      audio.src = audioUrl;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        resolve();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        resolve();
      };
      
      audio.play().catch(() => {
        setIsPlaying(false);
        resolve();
      });
    });
  };

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    isRecording,
    isProcessing,
    isPlaying,
    error,
    startRecording,
    stopRecording,
    conversationHistory,
    clearHistory,
  };
}
