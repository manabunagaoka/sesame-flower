'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Mic, Send, Square, RotateCcw } from 'lucide-react';

const VOICE_SERVICE_URL = 'https://voice-chat-service-i5u9.onrender.com';

// Typing animation
function TypewriterText({ text, speed = 30, onComplete, onUpdate }: { text: string; speed?: number; onComplete?: () => void; onUpdate?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!text) return;
    setDisplayedText('');
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        onUpdate?.();
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed, onComplete, onUpdate]);
  
  return <span>{displayedText}</span>;
}

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
};

let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

interface ChatInterfaceProps {
  inPanel?: boolean;
  chatMessages?: ChatMessage[];
  setChatMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatInterface({ 
  inPanel = false,
  chatMessages: externalMessages,
  setChatMessages: setExternalMessages 
}: ChatInterfaceProps) {
  const [textInput, setTextInput] = useState('');
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  
  const chatMessages = externalMessages ?? internalMessages;
  const setChatMessages = setExternalMessages ?? setInternalMessages;
  
  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages);
  useEffect(() => { chatMessagesRef.current = chatMessages; }, [chatMessages]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [animatingMessageId, setAnimatingMessageId] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null); // For consistent volume
  const conversationActive = useRef(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingVoiceRef = useRef(false);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef(false);
  const isListeningRef = useRef(false);
  const hasGreetedRef = useRef(false);

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator?.userAgent || '');

  // Cleanup on mount/unmount
  useEffect(() => {
    console.log('=== ChatInterface MOUNTED ===');
    conversationActive.current = false;
    isListeningRef.current = false;
    isProcessingVoiceRef.current = false;
    
    if (chatMessages.length > 0) hasGreetedRef.current = true;
    
    return () => {
      conversationActive.current = false;
      isListeningRef.current = false;
      try { mediaRecorderRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioRef.current?.pause();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(t);
  }, [chatMessages, scrollToBottom]);

  // Scroll when status changes (so user sees Listening/Thinking immediately)
  useEffect(() => {
    if (isListening || isProcessing || isTranscribing) {
      setTimeout(scrollToBottom, 50);
    }
  }, [isListening, isProcessing, isTranscribing, scrollToBottom]);

  useEffect(() => {
    if (isListening || isSpeaking) inputRef.current?.blur();
  }, [isListening, isSpeaking]);

  // === RECORDING ===
  const startRecording = async () => {
    if (isListeningRef.current || isListening || isProcessing || isTranscribing) {
      console.log('startRecording blocked');
      return;
    }
    
    try {
      console.log('Starting recording...');
      
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        console.log('Requesting mic...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
        streamRef.current = stream;
      }
      
      audioChunksRef.current = [];
      hasSpokenRef.current = false;
      isListeningRef.current = true;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let speechStartTime: number | null = null;
      let peakLevel = 0;
      
      const checkAudioLevel = () => {
        if (!analyserRef.current || !isListeningRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        if (avg > peakLevel) peakLevel = avg;
        
        if (avg > 25) {
          if (!speechStartTime) speechStartTime = Date.now();
          if (speechStartTime && Date.now() - speechStartTime > 800 && peakLevel > 20) {
            hasSpokenRef.current = true;
          }
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpokenRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => stopRecording(), 2000);
        }
        
        if (isListeningRef.current) requestAnimationFrame(checkAudioLevel);
      };
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(100);
      setIsListening(true);
      console.log('Recording started');
      
      requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.error('Recording error:', err);
      isListeningRef.current = false;
      setIsListening(false);
      conversationActive.current = false;
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isListeningRef.current) return;
    
    console.log('Stopping recording...');
    const userSpoke = hasSpokenRef.current;
    
    isListeningRef.current = false;
    setIsListening(false);
    setIsTranscribing(true);
    
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    analyserRef.current = null;
    hasSpokenRef.current = false;
    
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        if (!userSpoke || audioBlob.size < 3000) {
          console.log('No speech, restarting...');
          setIsTranscribing(false);
          if (conversationActive.current) setTimeout(() => startRecording(), 500);
          resolve();
          return;
        }
        
        console.log('Sending audio:', audioBlob.size);
        try {
          await sendToVoiceService(audioBlob);
        } catch (err: any) {
          console.error('Error:', err);
          setChatMessages(prev => [...prev, { id: generateMessageId(), text: `Error: ${err.message}`, sender: 'ai', timestamp: Date.now() }]);
          conversationActive.current = false;
        } finally {
          setIsProcessing(false);
          setIsTranscribing(false);
        }
        resolve();
      };
      
      recorder.stop();
    });
  };

  const sendToVoiceService = async (audioBlob: Blob) => {
    if (isProcessingVoiceRef.current) return;
    isProcessingVoiceRef.current = true;
    
    try {
      const history = chatMessagesRef.current.slice(-20).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant', content: m.text
      }));
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('conversation_history', JSON.stringify(history));
      
      console.log('Calling voice service...');
      const response = await fetch(`${VOICE_SERVICE_URL}/voice-chat`, { method: 'POST', body: formData });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No body');
      
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      
      const totalLen = chunks.reduce((a, c) => a + c.length, 0);
      const combined = new Uint8Array(totalLen);
      let off = 0;
      for (const c of chunks) { combined.set(c, off); off += c.length; }
      
      // Find where JSON ends and audio begins by looking for MP3 header or non-text data
      let jsonEndIndex = 0;
      let transcription = '', aiResponse = '';
      
      // Look for JSON lines at the start
      const textPart = new TextDecoder().decode(combined.slice(0, Math.min(5000, combined.length)));
      const lines = textPart.split('\n');
      
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const json = JSON.parse(line.trim());
            if (json.type === 'transcription' && json.text) {
              transcription = json.text;
              console.log('Transcription:', transcription);
              
              // Filter out likely hallucinations (common Whisper artifacts on silence/noise)
              const hallucinations = ['thank you', 'thanks', 'bye', 'goodbye', 'you', 'okay', 'ok', 'yes', 'no', 'um', 'uh'];
              const cleanText = transcription.toLowerCase().trim().replace(/[.!?,]/g, '');
              if (hallucinations.includes(cleanText) || transcription.length < 3) {
                console.log('Filtered likely hallucination:', transcription);
                // Don't add to chat, just continue to listening
                if (conversationActive.current) setTimeout(() => startRecording(), 500);
                setIsTranscribing(false);
                return;
              }
              
              setChatMessages(prev => [...prev, { id: generateMessageId(), text: transcription, sender: 'user', timestamp: Date.now() }]);
              setIsTranscribing(false);
              setIsProcessing(true);
            } else if (json.type === 'response' && json.text) {
              aiResponse = json.text;
              console.log('Response:', aiResponse);
              const ts = Date.now();
              setChatMessages(prev => [...prev, { id: generateMessageId(), text: aiResponse, sender: 'ai', timestamp: ts }]);
              setAnimatingMessageId(ts);
              setIsProcessing(false);
            }
            jsonEndIndex += new TextEncoder().encode(line + '\n').length;
          } catch {
            // Not valid JSON, might be start of audio
            break;
          }
        } else if (line.trim() === '') {
          jsonEndIndex += new TextEncoder().encode(line + '\n').length;
        } else {
          // Non-JSON non-empty line = audio data starts
          break;
        }
      }
      
      console.log('JSON ended at byte:', jsonEndIndex, 'total bytes:', combined.length);
      
      const audioData = combined.slice(jsonEndIndex);
      console.log('Audio data extracted:', audioData.length, 'bytes');
      
      // Always try to play audio - user gesture context should allow it
      if (audioData.length > 100) {
        console.log('Attempting to play audio...');
        await playAudio(audioData);
        console.log('playAudio completed');
      } else {
        console.log('No audio data, skipping playback');
        // No audio data, continue to listening
        if (conversationActive.current) setTimeout(() => startRecording(), 500);
      }
    } finally {
      isProcessingVoiceRef.current = false;
    }
  };

  const playAudio = (data: Uint8Array): Promise<void> => {
    return new Promise(async (resolve) => {
      console.log('playAudio called, data size:', data.length);
      setIsSpeaking(true);
      
      const cleanup = () => {
        setIsSpeaking(false);
        if (conversationActive.current) setTimeout(() => startRecording(), 300);
        resolve();
      };

      // Try Web Audio API first (better mobile support)
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        
        // Resume context if suspended (required on mobile after user interaction)
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        const audioBuffer = await ctx.decodeAudioData(data.buffer.slice(0) as ArrayBuffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Use GainNode for consistent volume across all audio
        if (!gainNodeRef.current) {
          gainNodeRef.current = ctx.createGain();
          gainNodeRef.current.connect(ctx.destination);
        }
        // Always set gain value before playing to ensure consistent volume
        gainNodeRef.current.gain.value = 0.3;
        source.connect(gainNodeRef.current);
        
        source.onended = cleanup;
        source.start(0);
        console.log('Playing via Web Audio API with normalized volume');
        return;
      } catch (e) {
        console.log('Web Audio failed, falling back to HTML Audio:', e);
      }
      
      // Fallback to HTML Audio
      const blob = new Blob([new Uint8Array(data)], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 0.3; // Lower volume for mobile fallback
      audioRef.current = audio;
      
      audio.onended = () => { URL.revokeObjectURL(url); cleanup(); };
      audio.onerror = () => { URL.revokeObjectURL(url); cleanup(); };
      audio.play().catch(() => { URL.revokeObjectURL(url); cleanup(); });
    });
  };

  const greetAndListen = async () => {
    const greeting = "Hi! How are you doing? What's on your mind?";
    const ts = Date.now();
    
    // Show message with typing animation first
    setChatMessages([{ id: generateMessageId(), text: greeting, sender: 'ai', timestamp: ts }]);
    setAnimatingMessageId(ts);
    
    // Initialize AudioContext and GainNode on user interaction (required for mobile)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Pre-create GainNode for consistent volume from first audio
    if (!gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.3;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    // Fetch and play TTS
    setIsSpeaking(true);
    try {
      const res = await fetch(`${VOICE_SERVICE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: greeting })
      });
      
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        // Use playAudio which handles Web Audio API
        await playAudio(data);
      } else {
        setIsSpeaking(false);
        if (conversationActive.current) startRecording();
      }
    } catch {
      setIsSpeaking(false);
      if (conversationActive.current) startRecording();
    }
  };

  const stopAll = () => {
    conversationActive.current = false;
    isListeningRef.current = false;
    isProcessingVoiceRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setIsTranscribing(false);
    try { mediaRecorderRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    audioRef.current?.pause();
  };

  const handleTextSubmit = async () => {
    const text = textInput.trim();
    if (!text || isProcessing) return;
    
    setTextInput('');
    setIsProcessing(true);
    
    const userMsg = { id: generateMessageId(), text, sender: 'user' as const, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    
    try {
      // Use local API route for text chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          const ts = Date.now();
          setChatMessages(prev => [...prev, { 
            id: generateMessageId(), 
            text: data.reply, 
            sender: 'ai', 
            timestamp: ts 
          }]);
          setAnimatingMessageId(ts);
        }
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const ts = Date.now();
      setChatMessages(prev => [...prev, { 
        id: generateMessageId(), 
        text: "Sorry, I couldn't process that. Please try again or use the mic button!", 
        sender: 'ai', 
        timestamp: ts 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = () => { stopAll(); setChatMessages([]); hasGreetedRef.current = false; };

  const handleMicClick = () => {
    console.log('=== MIC CLICK ===', { isListening, isSpeaking, isProcessing, isTranscribing });
    
    if (isListening) {
      conversationActive.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      stopRecording();
    } else if (isSpeaking) {
      conversationActive.current = false;
      audioRef.current?.pause();
      setIsSpeaking(false);
    } else if (!isProcessing && !isTranscribing) {
      conversationActive.current = true;
      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        greetAndListen();
      } else {
        startRecording();
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: 'white'
    }}>
      {/* Header */}
      {chatMessages.length > 0 && (
        <div style={{ flexShrink: 0, padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}>
            <RotateCcw size={14} /> New Chat
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 }}>
        {chatMessages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
            <div>
              <MessageCircle size={48} style={{ margin: '0 auto 12px', color: '#22c55e' }} />
              <p style={{ fontSize: '18px', color: '#374151', fontWeight: 500 }}>Ready to chat!</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>Tap the mic to speak</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {chatMessages.map((msg, i) => (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.sender === 'user' ? (
                  <div style={{ background: '#3b82f6', color: 'white', padding: '12px 18px', borderRadius: '20px', maxWidth: '85%', fontSize: '17px', lineHeight: '1.5' }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{ 
                    background: '#fce7f3', 
                    color: '#1f2937', 
                    padding: '12px 18px', 
                    borderRadius: '20px', 
                    maxWidth: '85%', 
                    fontSize: '17px', 
                    lineHeight: '1.5' 
                  }}>
                    {animatingMessageId === msg.timestamp ? (
                      <TypewriterText text={msg.text} speed={35} onComplete={() => setAnimatingMessageId(null)} onUpdate={scrollToBottom} />
                    ) : msg.text}
                  </div>
                )}
              </div>
            ))}
            
            {isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '14px' }}>
                <span style={{ display: 'flex', gap: '3px' }}>
                  {[4,5,6,5,4].map((h, i) => (
                    <span key={i} style={{ width: '6px', height: `${h*4}px`, background: '#22c55e', borderRadius: '3px', animation: 'pulse 1s infinite', animationDelay: `${i*100}ms` }} />
                  ))}
                </span>
                Listening...
              </div>
            )}
            
            {(isProcessing || isTranscribing) && !isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
                <span style={{ display: 'flex', gap: '3px' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: `${i*150}ms` }} />
                  ))}
                </span>
                Thinking...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - fixed at bottom */}
      <div style={{ 
        flexShrink: 0, 
        padding: '12px 16px 24px 16px',
        borderTop: '1px solid #eee', 
        background: 'white'
      }}>
        {/* Text Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => {
              console.log('Input change:', e.target.value);
              setTextInput(e.target.value);
            }}
            onKeyDown={(e) => { 
              console.log('KeyDown:', e.key);
              if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                handleTextSubmit(); 
              }
            }}
            placeholder="Type a message..."
            disabled={isProcessing}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{ 
              flex: 1, 
              minWidth: 0,
              height: '44px',
              padding: '10px 16px', 
              fontSize: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '22px', 
              outline: 'none', 
              background: '#f9fafb',
              WebkitAppearance: 'none',
              appearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
          <button 
            onClick={handleTextSubmit} 
            disabled={!textInput.trim() || isProcessing}
            style={{ 
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              maxWidth: '44px',
              maxHeight: '44px',
              flexShrink: 0,
              flexGrow: 0,
              borderRadius: '50%', 
              background: textInput.trim() ? '#22c55e' : '#e5e7eb', 
              border: 'none', 
              cursor: textInput.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              opacity: textInput.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              padding: 0
            }}
          >
            <Send size={20} color="white" />
          </button>
        </div>

        {/* Mic Button */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
          <button
            onClick={handleMicClick}
            disabled={isProcessing || isTranscribing}
            style={{
              width: '64px',
              height: '64px',
              minWidth: '64px',
              minHeight: '64px',
              borderRadius: '50%',
              border: 'none',
              cursor: isProcessing || isTranscribing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isListening ? '#ef4444' : isSpeaking ? '#3b82f6' : '#f3f4f6',
              transform: isListening ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s',
              opacity: isProcessing || isTranscribing ? 0.5 : 1,
              boxSizing: 'border-box',
              padding: 0
            }}
          >
            {isListening ? (
              <Square size={28} color="white" />
            ) : (
              <Mic size={28} color="#ef4444" />
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
