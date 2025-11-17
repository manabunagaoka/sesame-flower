'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mic, AudioLines, Send } from 'lucide-react';

const VOICE_CHOICE = 'sage';
const VOICE_SPEED = 1.05;

interface ChatInterfaceProps {
  inPanel?: boolean;
}

export default function ChatInterface({ inPanel = false }: ChatInterfaceProps) {
  const [textInput, setTextInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'ai', timestamp: number}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaError, setMediaError] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationActive = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect if we're on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      // Smooth scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, isProcessing]);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Setup speech recognition and handle iOS media permission resets
  useEffect(() => {
    // Track user interactions to detect when iOS might have reset permissions
    const trackInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    
    // Initialize Audio Context on first user interaction for mobile
    const unlockAudio = () => {
      trackInteraction();
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

    // Re-initialize on visibility change (iOS resets media when app backgrounds)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible - checking media permissions');
        const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
        
        // If it's been more than 30 seconds, iOS likely reset permissions
        if (timeSinceLastInteraction > 30000) {
          console.log('Long time since last interaction, media may need re-initialization');
          audioUnlockedRef.current = false;
          
          // Force recreation on next interaction
          if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
          }
        }
      }
    };

    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also track interactions globally
    document.addEventListener('touchstart', trackInteraction);
    document.addEventListener('click', trackInteraction);

    // Debug: Check API availability
    console.log('=== Media API Check ===');
    console.log('MediaRecorder available:', 'MediaRecorder' in window);
    console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log('AudioContext available:', 'AudioContext' in window || 'webkitAudioContext' in window);
    console.log('User agent:', navigator.userAgent);
    console.log('Is standalone:', window.matchMedia('(display-mode: standalone)').matches);

    // Cleanup: Revoke blob URLs when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', trackInteraction);
      document.removeEventListener('click', trackInteraction);
      
      if (audioRef.current?.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
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
    setChatMessages(prev => [...prev, { text, sender: 'user', timestamp: Date.now() }]);
    
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
          setChatMessages(prev => [...prev, { text: data.reply, sender: 'ai', timestamp: Date.now() }]);
          
          if (isVoice && conversationActive.current) {
            await speakText(data.reply);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        text: 'Sorry, I had trouble responding. Can you try again?', 
        sender: 'ai', 
        timestamp: Date.now() 
      }]);
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
        
        // Create blob URL first
        const blobUrl = URL.createObjectURL(audioBlob);
        
        // Reuse existing audio element if available (iOS requirement)
        let audio = audioRef.current;
        if (!audio) {
          console.log('Creating new Audio element');
          audio = new Audio();
          audioRef.current = audio;
          
          audio.onended = () => {
            console.log('Audio playback ended');
            setIsSpeaking(false);
            // Revoke blob URL after playback finishes
            if (audio && audio.src && audio.src.startsWith('blob:')) {
              URL.revokeObjectURL(audio.src);
            }
            if (conversationActive.current) {
              console.log('Starting listening after TTS finished');
              startListening();
            }
          };
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setIsSpeaking(false);
            // Revoke blob URL on error
            if (audio && audio.src && audio.src.startsWith('blob:')) {
              URL.revokeObjectURL(audio.src);
            }
            if (conversationActive.current) {
              startListening();
            }
          };
        } else {
          // Revoke previous blob URL before setting new one
          if (audio.src && audio.src.startsWith('blob:')) {
            console.log('Revoking previous blob URL');
            URL.revokeObjectURL(audio.src);
          }
        }
        
        // Set new source
        audio.src = blobUrl;
        console.log('Set audio src to blob URL');
        
        // Ensure audio context is created and resumed before playing (iOS requirement)
        if (!audioContextRef.current) {
          console.log('Creating AudioContext');
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        if (audioContextRef.current.state === 'suspended') {
          console.log('Resuming suspended AudioContext');
          await audioContextRef.current.resume();
        }
        
        console.log('AudioContext state:', audioContextRef.current.state);
        
        // Load and play
        await audio.load();
        console.log('Audio loaded, attempting to play...');
        
        try {
          await audio.play();
          console.log('Audio started playing successfully');
          setMediaError(''); // Clear any previous errors
        } catch (playError) {
          console.error('Audio playback failed:', playError);
          setIsSpeaking(false);
          setMediaError('Audio playback failed. Try closing and reopening the app.');
          
          // Revoke blob URL on play failure
          URL.revokeObjectURL(blobUrl);
          
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

  const startListening = async () => {
    if (isListening || isSpeaking) {
      console.log('Cannot start listening:', { isListening, isSpeaking });
      return;
    }
    
    try {
      console.log('Starting voice recording with MediaRecorder (iOS compatible)');
      setIsListening(true);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setIsListening(false);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Create audio blob - try different formats for iOS compatibility
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Audio blob:', { size: audioBlob.size, type: mimeType });
        
        if (audioBlob.size > 100) { // Minimum 100 bytes to have actual audio
          // Send to Whisper API
          const formData = new FormData();
          const extension = mimeType === 'audio/webm' ? 'webm' : 'mp4';
          formData.append('audio', audioBlob, `recording.${extension}`);
          
          try {
            const response = await fetch('/api/whisper', {
              method: 'POST',
              body: formData,
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('Transcription:', data.text);
              
              if (data.text && data.text.trim().length > 0) {
                setMediaError(''); // Clear error on success
                await sendToOpenAI(data.text, true);
              } else {
                console.log('Empty transcription, retrying...');
                if (conversationActive.current) {
                  setTimeout(() => startListening(), 500);
                }
              }
            } else {
              const errorData = await response.json();
              console.error('Whisper API error:', response.status, errorData);
              setMediaError(`Voice recognition failed: ${errorData.details || 'Unknown error'}`);
              conversationActive.current = false;
            }
          } catch (error) {
            console.error('Failed to transcribe:', error);
            setMediaError('Voice recognition failed. Please try again.');
            if (conversationActive.current) {
              setTimeout(() => startListening(), 1000);
            }
          }
        } else {
          console.log('Empty recording, retrying...');
          if (conversationActive.current) {
            setTimeout(() => startListening(), 500);
          }
        }
      };
      
      // Start recording (5 second max)
      mediaRecorder.start();
      console.log('Recording started...');
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Auto-stopping recording after 5 seconds');
          mediaRecorderRef.current.stop();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsListening(false);
      setMediaError('Microphone access denied. Please check permissions.');
      conversationActive.current = false;
    }
  };

  const startVoiceConversation = async () => {
    console.log('Voice button clicked, conversationActive:', conversationActive.current);
    
    if (conversationActive.current) {
      console.log('Stopping conversation');
      stopConversation();
      return;
    }
    
    // Clear any previous errors
    setMediaError('');
    
    console.log('Starting voice conversation');
    conversationActive.current = true;
    
    // CRITICAL: Recreate AudioContext on every interaction (iOS resets it)
    try {
      console.log('Recreating AudioContext for iOS compatibility');
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContextRef.current.resume();
      console.log('Fresh AudioContext created, state:', audioContextRef.current.state);
    } catch (error) {
      console.warn('AudioContext creation failed:', error);
    }
    
    // CRITICAL: Recreate Audio element on every interaction (iOS requirement)
    console.log('Recreating Audio element for iOS');
    
    // Clean up old audio element
    if (audioRef.current) {
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    // Create fresh audio element
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
    
    const greeting = "Hi! How are you doing?";
    
    // Add the greeting to chat history so user can see it
    setChatMessages(prev => [...prev, { text: greeting, sender: 'ai', timestamp: Date.now() }]);
    
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
    conversationActive.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    
    // Stop MediaRecorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping MediaRecorder:', e);
      }
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Legacy: stop old speech recognition if exists
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
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
    setChatMessages([]);
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
              <MessageCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="text-base text-gray-700 font-medium">Ready to chat!</p>
              <p className="text-sm text-gray-500 mt-2">Type a message or tap the mic to speak</p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message, index) => (
              <div key={index} className="text-sm break-words">
                <span className="font-medium text-gray-600">
                  {message.sender === 'user' ? 'You' : 'Flower'}:
                </span>
                <span className="text-gray-800 ml-1">{message.text}</span>
              </div>
            ))}
            {isProcessing && (
              <div className="text-sm text-gray-500 italic">Flower is typing...</div>
            )}
            {mediaError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="font-medium mb-1">⚠️ Media Error</div>
                <div>{mediaError}</div>
                <button 
                  onClick={() => setMediaError('')}
                  className="mt-2 text-xs underline"
                >
                  Dismiss
                </button>
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
            className="flex-1 bg-gray-50 text-base outline-none placeholder-gray-500 disabled:opacity-50 px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            autoComplete="off"
            autoFocus
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
