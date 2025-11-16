'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mic, AudioLines, Send, X } from 'lucide-react';

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
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          
          audio.onended = () => {
            console.log('Audio playback ended');
            setIsSpeaking(false);
            audioRef.current = null;
            if (conversationActive.current) {
              console.log('Starting listening after TTS finished');
              startListening();
            }
          };
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setIsSpeaking(false);
            conversationActive.current = false;
          };
          
          try {
            await audio.play();
            console.log('Audio started playing');
          } catch (playError) {
            console.warn('Audio playback failed (likely mobile autoplay policy):', playError);
            setIsSpeaking(false);
            
            // On mobile, we can't auto-play audio, so show a message and continue
            if (isMobile()) {
              setChatMessages(prev => [...prev, { 
                text: '🔊 (Audio playback not available on mobile - continuing with voice recognition)', 
                sender: 'ai', 
                timestamp: Date.now() 
              }]);
            }
            
            if (conversationActive.current) {
              console.log('Skipping TTS due to autoplay restrictions, starting listening');
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
    if (!recognitionRef.current || isListening || isSpeaking) return;
    
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
    
    if (conversationActive.current) {
      console.log('Stopping conversation');
      stopConversation();
      return;
    }
    
    console.log('Starting voice conversation');
    conversationActive.current = true;
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
        className="flex-1 overflow-y-auto p-3 space-y-2" 
        style={{ 
          paddingBottom: '100px',
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
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm text-gray-400">Start chatting</p>
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
        className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200"
        style={{
          position: 'absolute',
          zIndex: 110,
          minHeight: '80px'
        }}
      >
        <div 
          className="bg-white rounded-full px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-200"
        >
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
            placeholder="Type a message or speak with Flower"
            disabled={isProcessing}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 disabled:opacity-50"
            autoComplete="off"
            autoFocus
            spellCheck="false"
          />
          {(textInput.trim() || (inputRef.current?.value?.trim())) && !isProcessing && (
            <button onClick={handleTextSubmit} className="p-2 rounded-full hover:bg-gray-100">
              <Send size={16} className="text-gray-600" />
            </button>
          )}
          <button 
            onClick={startVoiceConversation}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {conversationActive.current || isListening ? (
              <AudioLines size={16} className="text-blue-500 animate-pulse" />
            ) : (
              <Mic size={16} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
