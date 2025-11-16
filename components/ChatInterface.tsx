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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationActive = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);

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
        const data = await response.json();
        console.log('TTS response data:', data);
        
        if (data.audioUrl) {
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
          
          // Set source and load
          audio.src = data.audioUrl;
          await audio.load();
          
          // Ensure audio context is resumed before playing (iOS requirement)
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
          
          try {
            await audio.play();
            console.log('Audio started playing');
          } catch (playError) {
            console.warn('Audio playback failed:', playError);
            setIsSpeaking(false);
            
            // Continue conversation even if audio fails
            if (conversationActive.current) {
              console.log('Skipping TTS, starting listening');
              setTimeout(() => {
                if (conversationActive.current) {
                  startListening();
                }
              }, 500);
            }
          }
        } else {
          console.error('No audioUrl in TTS response');
          setIsSpeaking(false);
          conversationActive.current = false;
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

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not initialized. Web Speech API may not be available in PWA mode.');
      console.error('Recognition not initialized');
      return;
    }
    
    if (isListening || isSpeaking) return;
    
    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.log('Recognition already active');
      setIsListening(false);
    }
  };

  const startVoiceConversation = async () => {
    console.log('Voice button clicked, conversationActive:', conversationActive.current);
    
    // Check if Web Speech API is available
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not available. Please use Safari browser instead of PWA mode.');
      return;
    }
    
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
