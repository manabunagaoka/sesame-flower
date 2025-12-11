'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Mic, AudioLines, Send, Square, RotateCcw } from 'lucide-react';

const VOICE_CHOICE = 'sage';
const VOICE_SPEED = 1.05;
// Hardcoded for now - move to env var later
const VOICE_SERVICE_URL = 'https://voice-chat-service-i5u9.onrender.com';

// Use fast voice service if URL is configured
const USE_FAST_VOICE = true;

// Typing animation component
function TypewriterText({ text, speed = 30, onComplete, onUpdate }: { text: string; speed?: number; onComplete?: () => void; onUpdate?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (!text) return;
    
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        // Notify parent on each character for scroll updates
        onUpdate?.();
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed, onComplete, onUpdate]);
  
  return <span>{displayedText}</span>;
}

// Message type for chat history
export type ChatMessage = {
  id: string; // Unique ID for React keys
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isAnimating?: boolean;
};

// Helper to generate unique message IDs
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

interface ChatInterfaceProps {
  inPanel?: boolean;
  // Optional: lift state to parent for persistence across panel open/close
  chatMessages?: ChatMessage[];
  setChatMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatInterface({ 
  inPanel = false,
  chatMessages: externalMessages,
  setChatMessages: setExternalMessages 
}: ChatInterfaceProps) {
  const [textInput, setTextInput] = useState('');
  // Use external state if provided, otherwise internal state
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  
  const chatMessages = externalMessages ?? internalMessages;
  const setChatMessages = setExternalMessages ?? setInternalMessages;
  
  // Keep a ref to always have latest messages for async callbacks
  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false); // Transcribing user speech
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [animatingMessageId, setAnimatingMessageId] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationActive = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  
  // Fast voice service refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingVoiceRef = useRef(false); // Guard against duplicate voice processing
  
  // Voice Activity Detection refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef(false);
  const isListeningRef = useRef(false); // Track listening state for VAD closure
  
  // Reset ALL refs on mount (MUST be after ref definitions)
  useEffect(() => {
    console.log('=== ChatInterface MOUNTED - Resetting all refs ===');
    conversationActive.current = false;
    isListeningRef.current = false;
    isProcessingVoiceRef.current = false;
    hasSpokenRef.current = false;
    console.log('Refs reset:', {
      conversationActive: conversationActive.current,
      isListeningRef: isListeningRef.current,
      isProcessingVoiceRef: isProcessingVoiceRef.current
    });
  }, []);

  // Detect if we're on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
  };

  // Track if we've greeted the user in this session
  const hasGreetedRef = useRef(false);
  
  // On mount, check if returning to existing conversation
  useEffect(() => {
    console.log('=== ChatInterface mounted ===', {
      chatMessagesLength: chatMessages.length
    });
    
    // If returning to existing conversation, mark as greeted
    if (chatMessages.length > 0) {
      console.log('Returning to existing conversation');
      hasGreetedRef.current = true;
    }
  }, []);

  // Speak greeting and then start listening (called on first mic tap)
  const speakGreetingThenListen = async () => {
    console.log('=== speakGreetingThenListen called ===');
    const greeting = "Hi! How are you doing? What's on your mind?";
    
    // Add greeting message with typing animation
    const timestamp = Date.now();
    setChatMessages([{ id: generateMessageId(), text: greeting, sender: 'ai', timestamp }]);
    setAnimatingMessageId(timestamp);
    
    try {
      setIsSpeaking(true);
      const response = await fetch(`${VOICE_SERVICE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: greeting })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        console.log('Got greeting audio, size:', audioBlob.size);
        const audio = new Audio();
        audioRef.current = audio;
        
        const blobUrl = URL.createObjectURL(audioBlob);
        audio.src = blobUrl;
        
        audio.onended = () => {
          console.log('Greeting audio ended - now listening');
          URL.revokeObjectURL(blobUrl);
          setIsSpeaking(false);
          // Auto-start listening after greeting
          if (conversationActive.current) {
            startFastRecording();
          }
        };
        
        audio.onerror = (e) => {
          console.error('Greeting audio error:', e);
          URL.revokeObjectURL(blobUrl);
          setIsSpeaking(false);
          // Still try to listen even if audio failed
          if (conversationActive.current) {
            startFastRecording();
          }
        };
        
        try {
          await audio.play();
          console.log('Greeting audio playing');
        } catch (playErr) {
          console.warn('Greeting play failed:', playErr);
          setIsSpeaking(false);
          // Still start listening
          if (conversationActive.current) {
            startFastRecording();
          }
        }
      } else {
        console.log('Greeting TTS not available (status:', response.status, ')');
        setIsSpeaking(false);
        // Still start listening
        if (conversationActive.current) {
          startFastRecording();
        }
      }
    } catch (err) {
      console.error('Greeting TTS error:', err);
      setIsSpeaking(false);
      // Still start listening
      if (conversationActive.current) {
        startFastRecording();
      }
    }
  };

  // Scroll to bottom helper - used by both useEffect and typewriter callback
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Small delay to ensure DOM has updated with new content
    const scrollTimer = setTimeout(scrollToBottom, 50);
    
    return () => {
      clearTimeout(scrollTimer);
    };
  }, [chatMessages, isProcessing, isSpeaking, isListening, isTranscribing, scrollToBottom]);

  // Blur input when voice mode starts (prevents keyboard from blocking audio on mobile)
  useEffect(() => {
    if (isListening || isSpeaking) {
      inputRef.current?.blur();
    }
  }, [isListening, isSpeaking]);

  // Setup speech recognition
  useEffect(() => {
    // Initialize Audio Context on first user interaction for mobile
    const unlockAudio = () => {
      if (!audioUnlockedRef.current && typeof window !== 'undefined') {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current.resume();
          audioUnlockedRef.current = true;
          console.log('Audio context unlocked');
        } catch (error) {
          console.warn('Failed to create AudioContext:', error);
        }
      }
    };

    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    // Debug: Check API availability
    console.log('=== Voice API Check ===');
    console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
    console.log('AudioContext available:', 'AudioContext' in window || 'webkitAudioContext' in window);
    console.log('User agent:', navigator.userAgent);
    console.log('Is standalone:', window.matchMedia('(display-mode: standalone)').matches);
    
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        console.log('Voice input received:', transcript);
        await sendToOpenAI(transcript, true);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          console.log('No speech detected, retrying...');
          if (conversationActive.current) {
            setTimeout(() => startListening(), 1000);
          }
        } else if (event.error === 'audio-capture' || event.error === 'not-allowed') {
          console.error('Microphone access issue:', event.error);
          conversationActive.current = false;
          setIsListening(false);
          setIsSpeaking(false);
        } else {
          console.log('Other speech error, stopping conversation');
          conversationActive.current = false;
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup: Revoke blob URLs when component unmounts
    return () => {
      // Stop all voice activity
      conversationActive.current = false;
      isListeningRef.current = false;
      isProcessingVoiceRef.current = false;
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      
      // Stop audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Cleanup audio - revoke blob URL before stopping
      if (audioRef.current) {
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Cleanup audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, []);

  const handleTextSubmit = async () => {
    const inputElement = inputRef.current;
    if (!inputElement || !inputElement.value.trim() || isProcessing) return;
    
    const userMessage = inputElement.value.trim();
    console.log('Submitting message:', `"${userMessage}"`);
    
    // Clear the input manually
    inputElement.value = '';
    setTextInput(''); // Keep state in sync
    
    await sendToOpenAI(userMessage, false);
  };

  const sendToOpenAI = async (text: string, isVoice: boolean = false) => {
    setIsProcessing(true);
    
    // Add user message immediately
    setChatMessages(prev => [...prev, { id: generateMessageId(), text, sender: 'user', timestamp: Date.now() }]);
    
    // Get current time of day
    const hour = new Date().getHours();
    let timeContext = '';
    if (hour >= 5 && hour < 12) {
      timeContext = 'It is morning time. ';
    } else if (hour >= 12 && hour < 17) {
      timeContext = 'It is afternoon time. ';
    } else if (hour >= 17 && hour < 21) {
      timeContext = 'It is evening time. ';
    } else {
      timeContext = 'It is nighttime. ';
    }
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          context: timeContext + 'You are Flower - friendly and cheerful! Use I/me. Talk naturally like a friend. Be warm and positive but keep it simple. No drama, no over-the-top language, no emojis. Just be nice and friendly. Examples: "That\'s great!" "What happened?" "Tell me about it!" "Sounds good!" Keep it real and easy.'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          const timestamp = Date.now();
          const msgId = generateMessageId();
          setChatMessages(prev => [...prev, { id: msgId, text: data.reply, sender: 'ai', timestamp }]);
          setAnimatingMessageId(timestamp); // Start typing animation
          
          if (isVoice && conversationActive.current) {
            await speakText(data.reply);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const timestamp = Date.now();
      setChatMessages(prev => [...prev, { 
        id: generateMessageId(),
        text: 'Sorry, I had trouble responding. Can you try again?', 
        sender: 'ai', 
        timestamp
      }]);
      setAnimatingMessageId(timestamp);
      conversationActive.current = false;
      setIsListening(false);
      setIsSpeaking(false);
    } finally {
      setIsProcessing(false);
      // Don't stop conversation mode here - let it continue
      // Restore focus after processing completes
      setTimeout(() => {
        if (inputRef.current && !isVoice) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const speakText = async (text: string) => {
    try {
      console.log('Starting TTS for:', text);
      setIsSpeaking(true);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: VOICE_CHOICE, speed: VOICE_SPEED })
      });
      
      console.log('TTS response status:', response.status);
      
      if (response.ok) {
        // Get audio as blob to avoid memory leaks from data URLs
        const audioBlob = await response.blob();
        console.log('TTS audio blob size:', audioBlob.size);
        
        // Reuse existing audio element if available (iOS requirement)
        let audio = audioRef.current;
        if (!audio) {
          audio = new Audio();
          audioRef.current = audio;
          
          audio.onended = () => {
            console.log('Audio playback ended');
            setIsSpeaking(false);
            if (conversationActive.current) {
              console.log('Starting listening after TTS finished');
              startListening();
            }
          };
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setIsSpeaking(false);
            if (conversationActive.current) {
              startListening();
            }
          };
        }
        
        // Revoke old blob URL if exists to prevent memory leak
        if (audio.src && audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
        
        // Create blob URL (automatically garbage collected)
        const blobUrl = URL.createObjectURL(audioBlob);
        audio.src = blobUrl;
        await audio.load();
        
        // Ensure audio context is resumed before playing (iOS requirement)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        try {
          console.log('Attempting to play audio...');
          await audio.play();
          console.log('Audio started playing');
        } catch (playError) {
          console.warn('Audio playback failed:', playError);
          setIsSpeaking(false);
          
          // Continue conversation even if audio fails
          if (conversationActive.current) {
            console.log('Skipping TTS, starting listening immediately');
            setTimeout(() => {
              if (conversationActive.current) {
                startListening();
              }
            }, 100);
          }
        }
      } else {
        console.error('TTS API error:', response.status);
        const errorText = await response.text();
        console.error('TTS error details:', errorText);
        setIsSpeaking(false);
        conversationActive.current = false;
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      conversationActive.current = false;
    }
  };

  // ===== FAST VOICE SERVICE FUNCTIONS =====
  const startFastRecording = async () => {
    // GUARD: Prevent starting if already listening or processing
    if (isListeningRef.current || isListening || isProcessing || isTranscribing) {
      console.log('startFastRecording blocked - already active:', { 
        isListeningRef: isListeningRef.current, 
        isListening, 
        isProcessing, 
        isTranscribing 
      });
      return;
    }
    
    try {
      console.log('Starting fast voice recording with VAD...');
      
      // Reuse existing stream if available (preserves user gesture context on mobile)
      // Otherwise request a new one
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        console.log('No existing stream, requesting new one...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        streamRef.current = stream;
      } else {
        console.log('Reusing existing stream');
      }
      
      audioChunksRef.current = [];
      hasSpokenRef.current = false;
      isListeningRef.current = true; // Set ref for VAD closure
      
      // Set up Voice Activity Detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85; // Higher = more smoothing, less sensitive to spikes
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SILENCE_THRESHOLD = 25; // INCREASED from 15 - less sensitive to quiet noise
      const SILENCE_DURATION = 2000; // INCREASED from 1500 - wait 2 seconds of silence
      const MIN_SPEECH_DURATION = 800; // INCREASED from 500 - must speak for 0.8s to count
      const MIN_AUDIO_LEVEL_TO_SEND = 20; // NEW - minimum average level to consider it real speech
      
      let speechStartTime: number | null = null;
      let peakLevel = 0; // Track peak audio level during speech
      
      // Monitor audio levels using ref instead of state
      const checkAudioLevel = () => {
        if (!analyserRef.current || !isListeningRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        // Track peak level during this listening session
        if (average > peakLevel) {
          peakLevel = average;
        }
        
        if (average > SILENCE_THRESHOLD) {
          // User is speaking
          if (!speechStartTime) {
            speechStartTime = Date.now();
            console.log('Speech detected, level:', average.toFixed(1));
          }
          
          // Mark that user has spoken (after minimum duration AND sufficient volume)
          if (speechStartTime && Date.now() - speechStartTime > MIN_SPEECH_DURATION && peakLevel > MIN_AUDIO_LEVEL_TO_SEND) {
            hasSpokenRef.current = true;
          }
          
          // Clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpokenRef.current && !silenceTimerRef.current) {
          // User stopped speaking - start silence timer
          console.log('Silence detected, starting 1.5s timer...');
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence threshold reached, auto-stopping');
            stopFastRecording();
          }, SILENCE_DURATION);
        }
        
        // Continue monitoring using ref
        if (isListeningRef.current) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      console.log('Using mimeType:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100);
      setIsListening(true);
      conversationActive.current = true;
      console.log('Recording started, isListening=true, conversationActive=true');
      
      // Start VAD monitoring
      requestAnimationFrame(checkAudioLevel);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      // Reset ALL state on error
      isListeningRef.current = false;
      setIsListening(false);
      setIsProcessing(false);
      setIsTranscribing(false);
      conversationActive.current = false;
      setChatMessages(prev => [...prev, { id: generateMessageId(), text: `Mic error: ${err}`, sender: 'ai', timestamp: Date.now() }]);
    }
  };

  const stopFastRecording = async () => {
    console.log('stopFastRecording called', { 
      hasMediaRecorder: !!mediaRecorderRef.current, 
      isListeningRef: isListeningRef.current 
    });
    
    if (!mediaRecorderRef.current || !isListeningRef.current) {
      console.log('stopFastRecording - early return (no recorder or not listening)');
      return;
    }
    
    console.log('Stopping fast voice recording...');
    
    // IMPORTANT: Capture userActuallySpoke BEFORE resetting anything
    const userActuallySpoke = hasSpokenRef.current;
    console.log('User actually spoke:', userActuallySpoke);
    
    isListeningRef.current = false; // Stop VAD loop
    setIsListening(false);
    setIsTranscribing(true); // Show "Processing..." while transcribing
    
    // Clean up VAD resources
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    analyserRef.current = null;
    hasSpokenRef.current = false;
    
    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        // DON'T stop the stream here - keep it alive for the conversation
        // Stream will be stopped when conversation ends (X button or stop)
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // STRICTER CHECK: Don't send if user didn't actually speak or recording too short
        // Increased minimum size from 1000 to 3000 bytes to filter out noise
        if (!userActuallySpoke || audioBlob.size < 3000) {
          console.log('No real speech detected - skipping (spoke:', userActuallySpoke, ', size:', audioBlob.size, ')');
          setIsTranscribing(false);
          setIsProcessing(false);
          
          // Auto-restart listening if conversation is active (but user didn't speak)
          if (conversationActive.current) {
            console.log('Restarting listening (no speech detected)...');
            setTimeout(() => startFastRecording(), 500);
          }
          resolve();
          return;
        }
        
        console.log('Sending audio for transcription, size:', audioBlob.size);
        
        try {
          await sendToFastVoiceService(audioBlob);
        } catch (err: any) {
          console.error('Voice service error:', err);
          setChatMessages(prev => [...prev, { 
            id: generateMessageId(),
            text: `Error: ${err.message || err}`, 
            sender: 'ai', 
            timestamp: Date.now() 
          }]);
          // Only stop conversation on error
          conversationActive.current = false;
        } finally {
          setIsProcessing(false);
          setIsTranscribing(false);
          // DON'T reset conversationActive here - let it continue
        }
        resolve();
      };
      
      mediaRecorder.stop();
    });
  };

  const sendToFastVoiceService = async (audioBlob: Blob) => {
    // GUARD: Prevent duplicate voice processing
    if (isProcessingVoiceRef.current) {
      console.log('sendToFastVoiceService blocked - already processing');
      return;
    }
    isProcessingVoiceRef.current = true;
    
    try {
      // Use ref to get latest messages (avoids stale closure issue)
      const currentMessages = chatMessagesRef.current;
      
      // Build conversation history for context (use more messages for better context)
      const history = currentMessages.slice(-20).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
    
    console.log('=== CONVERSATION HISTORY BEING SENT ===');
    console.log('Total messages:', currentMessages.length);
    console.log('History being sent:', JSON.stringify(history, null, 2));
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('conversation_history', JSON.stringify(history));
    
    console.log('Sending to fast voice service:', VOICE_SERVICE_URL);
    console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    const response = await fetch(`${VOICE_SERVICE_URL}/voice-chat`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice service error response:', errorText);
      throw new Error(`Voice service error: ${response.status} - ${errorText}`);
    }
    
    // Process streaming response - collect all data first
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    // Collect all chunks
    const allChunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) allChunks.push(value);
    }
    
    // Combine all data
    const totalLength = allChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of allChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Find where JSON ends and audio begins
    // JSON lines end with newline, then audio (binary) starts
    const decoder = new TextDecoder();
    let transcription = '';
    let aiResponse = '';
    let transcriptionProcessed = false; // Guard against duplicate processing
    let responseProcessed = false; // Guard against duplicate processing
    
    // Look for JSON lines at the start of the response
    // Each JSON line ends with \n, audio data follows after last JSON line
    const fullText = decoder.decode(combined);
    const lines = fullText.split('\n');
    
    let bytesProcessed = 0;
    for (const line of lines) {
      const lineBytes = new TextEncoder().encode(line + '\n').length;
      
      if (line.trim().startsWith('{')) {
        try {
          const json = JSON.parse(line.trim());
          if (json.type === 'transcription' && json.text && !transcriptionProcessed) {
            transcriptionProcessed = true; // Mark as processed
            transcription = json.text;
            console.log('Got transcription:', transcription);
            setChatMessages(prev => [...prev, { id: generateMessageId(), text: transcription, sender: 'user', timestamp: Date.now() }]);
            // Switch from "Listening..." to "Thinking..."
            setIsTranscribing(false);
            setIsProcessing(true);
            bytesProcessed += lineBytes;
          } else if (json.type === 'response' && json.text && !responseProcessed) {
            responseProcessed = true; // Mark as processed
            aiResponse = json.text;
            console.log('Got AI response:', aiResponse);
            // Add response to chat immediately so user sees it while audio plays
            const timestamp = Date.now();
            setChatMessages(prev => [...prev, { id: generateMessageId(), text: aiResponse, sender: 'ai', timestamp }]);
            setAnimatingMessageId(timestamp); // Start typing animation
            setIsProcessing(false); // Stop showing "thinking"
            bytesProcessed += lineBytes;
          } else if (json.type === 'error') {
            console.error('Service error:', json.message);
            const timestamp = Date.now();
            setChatMessages(prev => [...prev, { id: generateMessageId(), text: json.message, sender: 'ai', timestamp }]);
            setAnimatingMessageId(timestamp);
            setIsProcessing(false);
            setIsTranscribing(false);
            bytesProcessed += lineBytes;
          } else {
            // Unknown JSON or binary data that looks like JSON - stop parsing
            break;
          }
        } catch {
          // Not valid JSON - this is likely audio data
          break;
        }
      } else if (line.trim() === '') {
        // Empty line between JSON and audio
        bytesProcessed += lineBytes;
      } else {
        // Non-JSON content - audio data starts here
        break;
      }
    }
    
    // Extract audio bytes (everything after the JSON lines)
    const audioData = combined.slice(bytesProcessed);
    console.log(`Parsed: transcription=${transcription?.length || 0} chars, response=${aiResponse?.length || 0} chars, audio=${audioData.length} bytes, bytesProcessed=${bytesProcessed}`);
    
    // Play audio - the voice service returns audio with the response
    if (audioData.length > 100) {
      console.log('Playing response audio...');
      await playFastAudio([audioData]);
    } else {
      console.log('No audio data received, skipping playback. Total combined length:', combined.length);
      // Still continue conversation even without audio
      if (conversationActive.current) {
        console.log('No audio but continuing conversation...');
        setTimeout(() => startFastRecording(), 300);
      }
    }
    } finally {
      isProcessingVoiceRef.current = false;
    }
  };

  const playFastAudio = async (chunks: Uint8Array[]): Promise<void> => {
    return new Promise((resolve) => {
      console.log('=== playFastAudio called ===');
      setIsSpeaking(true);
      
      // Combine all chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      console.log('Audio data size:', combined.length, 'bytes');
      const audioBlob = new Blob([combined], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Always create a fresh Audio element for reliable playback
      const audio = new Audio();
      audioRef.current = audio;
      
      audio.src = audioUrl;
      
      audio.onended = () => {
        console.log('Audio playback ended');
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        // Auto-continue conversation - start listening after Flower speaks
        if (conversationActive.current) {
          console.log('Auto-continuing conversation after Flower spoke');
          setTimeout(() => startFastRecording(), 300);
        }
        resolve();
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        // Still continue conversation even if audio failed
        if (conversationActive.current) {
          console.log('Audio failed but continuing conversation');
          setTimeout(() => startFastRecording(), 300);
        }
        resolve();
      };
      
      audio.play()
        .then(() => {
          console.log('Audio playing successfully');
        })
        .catch((err) => {
          console.error('Audio play() failed:', err);
          setIsSpeaking(false);
          // Still continue conversation even if audio failed
          if (conversationActive.current) {
            console.log('Play failed but continuing conversation');
            setTimeout(() => startFastRecording(), 300);
          }
          resolve();
        });
    });
  };
  // ===== END FAST VOICE SERVICE =====

  const startListening = () => {
    if (!recognitionRef.current || isListening || isSpeaking) {
      console.log('Cannot start listening:', { hasRecognition: !!recognitionRef.current, isListening, isSpeaking });
      return;
    }
    
    try {
      console.log('Starting speech recognition...');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.log('Recognition error:', error);
      setIsListening(false);
    }
  };

  const startVoiceConversation = async () => {
    console.log('Voice button clicked, conversationActive:', conversationActive.current);
    
    if (conversationActive.current) {
      console.log('Stopping conversation');
      stopConversation();
      return;
    }
    
    console.log('Starting voice conversation');
    conversationActive.current = true;
    
    // Pre-create audio element on user interaction (iOS requirement)
    if (!audioRef.current) {
      console.log('Initializing audio element for iOS');
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        console.log('Audio playback ended');
        setIsSpeaking(false);
        if (conversationActive.current) {
          console.log('Starting listening after TTS finished');
          startListening();
        }
      };
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        if (conversationActive.current) {
          startListening();
        }
      };
    }
    
    const greeting = "Hi! How are you doing?";
    
    // Add the greeting to chat history so user can see it
    const timestamp = Date.now();
    setChatMessages(prev => [...prev, { id: generateMessageId(), text: greeting, sender: 'ai', timestamp }]);
    setAnimatingMessageId(timestamp); // Start typing animation
    
    // Try to play TTS, but don't let it block the conversation on mobile
    try {
      await speakText(greeting);
    } catch (ttsError) {
      console.warn('TTS failed, continuing conversation without audio:', ttsError);
      
      // Skip to listening if TTS fails (common on mobile)
      setTimeout(() => {
        if (conversationActive.current && !isListening) {
          console.log('Starting to listen after TTS failure');
          startListening();
        }
      }, 500);
    }
  };

  const stopConversation = () => {
    console.log('stopConversation called - stopping everything');
    conversationActive.current = false;
    isListeningRef.current = false; // Stop VAD loop
    isProcessingVoiceRef.current = false; // Reset voice processing guard
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setIsTranscribing(false);
    
    // Stop any active media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.log('MediaRecorder stop error:', e);
      }
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const clearChat = () => {
    // Stop any ongoing conversation
    stopConversation();
    
    // Clear messages
    setChatMessages([]);
    
    // Reset greeting flag so next mic tap will greet
    hasGreetedRef.current = false;
    
    // Panel is now silent - user taps mic to start fresh conversation
    console.log('Conversation reset - ready for new conversation');
  };

  return (
    <div 
      className="relative flex flex-col h-full bg-transparent overflow-hidden"
      style={{
        position: 'relative',
        height: '100%',
        minHeight: '300px', // Reduced since we have header above
        maxHeight: '100%',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto'
      }}
      onWheel={(e) => {
        // Prevent wheel events from bubbling up to parent containers
        e.stopPropagation();
      }}
    >
      {/* New Chat Button - only show if there are messages */}
      {chatMessages.length > 0 && (
        <div className="flex justify-end p-2 border-b border-gray-100">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Start new conversation"
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>
        </div>
      )}

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2" 
        style={{ 
          paddingBottom: '200px',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}
        onWheel={(e) => {
          const container = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = container;
          
          // Allow scrolling within the container bounds
          if (
            (e.deltaY > 0 && scrollTop >= scrollHeight - clientHeight) ||
            (e.deltaY < 0 && scrollTop <= 0)
          ) {
            // At boundaries - prevent parent scrolling
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageCircle size={56} className="mx-auto mb-4 text-green-500" />
              <p className="text-lg sm:text-xl text-gray-700 font-medium">Ready to chat!</p>
              <p className="text-base text-gray-500 mt-2">Type a message or tap the mic to speak</p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message, index) => (
              <div key={message.id || `${message.timestamp}-${index}`} className={`text-base sm:text-lg break-words ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                {message.sender === 'user' ? (
                  <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-[85%]">
                    {message.text}
                  </div>
                ) : (
                  <div>
                    <span className="font-medium text-gray-600">Flower:</span>
                    <span className="text-gray-800 ml-2">
                      {animatingMessageId === message.timestamp ? (
                        <TypewriterText 
                          text={message.text} 
                          speed={35}
                          onComplete={() => setAnimatingMessageId(null)}
                          onUpdate={scrollToBottom}
                        />
                      ) : (
                        message.text
                      )}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {isListening && (
              <div className="text-base text-green-600 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-4 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="w-2 h-5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></span>
                  <span className="w-2 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-2 h-5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                  <span className="w-2 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                </span>
                Listening...
              </div>
            )}
            {(isProcessing || isTranscribing) && !isListening && (
              <div className="text-base text-gray-500 italic flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                {isTranscribing ? 'Processing...' : 'Flower is thinking...'}
              </div>
            )}
            {/* Extra spacing at bottom */}
            <div className="h-4"></div>
          </>
        )}
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white"
        style={{
          position: 'absolute',
          zIndex: 110,
          paddingTop: '12px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          paddingLeft: '16px',
          paddingRight: '16px',
          boxShadow: '0 -4px 12px -4px rgba(0, 0, 0, 0.08)',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Text Input Area - Full Width */}
        <div className="mb-4 flex items-center gap-2 px-2">
          <input
            ref={inputRef}
            type="text"
            defaultValue=""
            onChange={(e) => {
              const newValue = e.target.value;
              setTextInput(newValue);
            }}
            onKeyDown={(e) => {
              // FORCE space to work if it's being blocked
              if (e.code === 'Space') {
                e.stopPropagation();
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement;
                const cursorPos = input.selectionStart || 0;
                const currentValue = input.value;
                const newValue = currentValue.slice(0, cursorPos) + ' ' + currentValue.slice(cursorPos);
                input.value = newValue;
                input.setSelectionRange(cursorPos + 1, cursorPos + 1);
                setTextInput(newValue);
                return;
              }
              
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            onInput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              // Also update React state from raw input
              setTextInput(target.value);
            }}
            placeholder="Type or speak..."
            disabled={isProcessing}
            className="flex-1 bg-gray-50 text-lg outline-none placeholder-gray-500 disabled:opacity-50 px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            autoComplete="off"
            spellCheck="false"
          />
          {(textInput.trim() || (inputRef.current?.value?.trim())) && !isProcessing && (
            <button 
              onClick={handleTextSubmit} 
              className="p-3 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors"
            >
              <Send size={22} className="text-white" />
            </button>
          )}
        </div>

        {/* Bottom Button Row - Centered */}
        <div className="flex items-center justify-center gap-6">
          {USE_FAST_VOICE ? (
            /* Fast Voice Service - Simple Stop/Start button */
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('=== MIC BUTTON CLICKED ===', {
                  isListening,
                  isSpeaking,
                  isProcessing,
                  isTranscribing,
                  isListeningRef: isListeningRef.current,
                  conversationActive: conversationActive.current
                });
                
                if (isListening) {
                  // Stop recording AND END conversation mode
                  console.log('Stop button pressed - stopping recording AND conversation');
                  conversationActive.current = false; // STOP the conversation loop
                  // Clean up mic stream since user deliberately stopped
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                  }
                  stopFastRecording();
                } else if (isSpeaking) {
                  // Stop Flower from speaking and END conversation mode
                  console.log('Stop button pressed - stopping speech, ending conversation');
                  conversationActive.current = false;
                  // Clean up mic stream since user deliberately stopped
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                  }
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setIsSpeaking(false);
                } else if (!isProcessing && !isTranscribing) {
                  // Start conversation
                  console.log('Mic button pressed');
                  conversationActive.current = true;
                  
                  // First time? Greet then listen. Otherwise just listen.
                  if (!hasGreetedRef.current) {
                    console.log('First time - greeting then listening');
                    hasGreetedRef.current = true;
                    // Request mic permission first, then greet + listen
                    navigator.mediaDevices.getUserMedia({ audio: true })
                      .then(stream => {
                        streamRef.current = stream;
                        speakGreetingThenListen();
                      })
                      .catch(err => {
                        console.error('Mic permission denied:', err);
                        conversationActive.current = false;
                      });
                  } else {
                    console.log('Continuing conversation - just listening');
                    startFastRecording();
                  }
                } else {
                  console.log('Mic button blocked by isProcessing or isTranscribing');
                }
              }}
              disabled={isProcessing || isTranscribing}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors disabled:opacity-50 disabled:bg-gray-100 min-w-[80px] ${
                isListening 
                  ? 'bg-red-500 scale-110' 
                  : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
              }`}
              type="button"
            >
              {isListening ? (
                <Square size={32} className="text-white" />
              ) : (
                <Mic size={32} className="text-red-500" />
              )}
            </button>
          ) : (
            /* Original Voice - Tap to Start Conversation */
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('MIC BUTTON CLICKED');
                startVoiceConversation();
              }}
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors disabled:opacity-50 disabled:bg-gray-100 min-w-[80px]"
              type="button"
            >
              {conversationActive.current || isListening ? (
                <AudioLines size={32} className="text-blue-500 animate-pulse" />
              ) : (
                <Mic size={32} className="text-red-500" />
              )}
              <span className="text-xs text-gray-600 font-medium">
                {conversationActive.current || isListening ? 'Listening' : 'Speak'}
              </span>
            </button>
          )}
          
          <button 
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[80px]"
            type="button"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
            </svg>
            <span className="text-xs text-gray-600 font-medium">Type</span>
          </button>
        </div>
      </div>
    </div>
  );
}
