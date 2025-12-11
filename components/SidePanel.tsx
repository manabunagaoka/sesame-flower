'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { 
  Phone, Heart, AlertTriangle, Stethoscope, Users, Users2, Baby, Coffee,
  Sparkles, Car, UtensilsCrossed, BookOpen, Palette, Trees, Book, Music,
  Plus, Search, Shield, FileText, GraduationCap, Zap, PenTool, User,
  Building, ShoppingBag, DollarSign, PlayCircle, Grid3x3, MessageCircle, Mic, AudioLines, MessageCircleHeart
} from 'lucide-react';
import { clsx } from 'clsx';
import { ContentItem } from '@/lib/types';
import { ANIMATION_DURATION } from '@/lib/constants';
import ChatInterface, { ChatMessage } from './ChatInterface';

// Icon mapping for content items
const contentIconMap = {
  Phone, Heart, AlertTriangle, Stethoscope, Users, Users2, Baby, Coffee,
  Sparkles, Car, UtensilsCrossed, BookOpen, Palette, Trees, Book, Music,
  Plus, Search, Shield, FileText, GraduationCap, Zap, PenTool, User,
  Building, ShoppingBag, DollarSign, PlayCircle, Grid3x3, MessageCircle, Mic, AudioLines, MessageCircleHeart
};

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ContentItem[];
  onContentSelect: (item: ContentItem) => void;
  // Chat state lifted from page for persistence
  chatMessages?: ChatMessage[];
  setChatMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function SidePanel({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  onContentSelect,
  chatMessages,
  setChatMessages 
}: SidePanelProps) {
  const [showChat, setShowChat] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const isConnect = title.toLowerCase() === 'connect';
  const isChat = title.toLowerCase() === 'chat';

  // Calculate viewport height for Safari mobile
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const updateHeight = () => {
      // On iOS Safari, subtract extra space for the bottom toolbar
      const offset = (isSafari || isIOS) ? 50 : 0;
      setViewportHeight(`${window.innerHeight - offset}px`);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    // Also update on scroll (Safari toolbar hides/shows on scroll)
    window.addEventListener('scroll', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.removeEventListener('scroll', updateHeight);
    };
  }, []);

  // Auto-open chat for chat menu (but don't reset when panel closes to preserve state)
  React.useEffect(() => {
    if (isOpen && isChat && !showChat) {
      setShowChat(true);
    }
    // Note: We intentionally DON'T reset showChat when panel closes
    // This preserves chat history when user closes and reopens the panel
  }, [isOpen, isChat, showChat]);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATION }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: ANIMATION_DURATION 
            }}
            className="fixed top-0 right-0 bg-white shadow-2xl w-full max-w-sm border-l border-gray-200 flex flex-col"
            style={{
        position: 'fixed',
        right: '0',
        top: '0',
        zIndex: 100,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        // Use JS-calculated height for Safari mobile compatibility
        height: viewportHeight,
        maxHeight: viewportHeight,
        overflowY: 'hidden',
        overscrollBehavior: 'none',
        width: '100%',
        maxWidth: '28rem'
      }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 bg-white"
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <h2 className="text-xl font-semibold text-gray-800 capitalize">
                {isChat ? 'Speak with Flower' : title}
              </h2>
              <button
                onClick={onClose}
                className={clsx(
                  'rounded-full flex items-center justify-center',
                  'bg-gray-600 hover:bg-gray-700 transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-gray-500',
                  'shadow-sm hover:shadow-md'
                )}
                style={{ width: 36, height: 36 }}
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {!isChat && (
              <div className={clsx(
                'space-y-0',
                showChat ? 'flex-shrink-0 overflow-y-auto max-h-48' : 'flex-1 overflow-y-auto'
              )}>
                {content.map((item, index) => {
                  const IconComponent = contentIconMap[item.icon as keyof typeof contentIconMap];
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: ANIMATION_DURATION 
                      }}
                      className={clsx(
                        'flex items-center p-4',
                        'bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200',
                        'border-b border-gray-100',
                        'cursor-pointer group'
                      )}
                      onClick={() => {
                        if ((isConnect && (item.title.toLowerCase().includes('chat') || item.title.toLowerCase().includes('support') || item.title.toLowerCase().includes('talk'))) || isChat) {
                          setShowChat(true);
                        } else {
                          onContentSelect(item);
                          onClose();
                        }
                      }}
                    >
                      {/* Icon or Thumbnail */}
                      {item.videoId && item.thumbnail ? (
                        <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                            <PlayCircle size={28} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className={clsx(
                          'flex items-center justify-center',
                          'w-12 h-12 bg-gray-50 rounded-full',
                          'group-hover:bg-gray-100 transition-colors duration-200'
                        )}>
                          {IconComponent && (
                            <IconComponent 
                              size={20} 
                              className="text-gray-600" 
                            />
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          {item.time && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {item.time}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {item.description}
                        </p>
                      </div>

                      {/* Chevron */}
                      <div className="ml-3 transition-transform duration-200 group-hover:translate-x-1">
                        <svg 
                          className="w-5 h-5 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}
              
              {/* Chat positioned right after content for Connect panel */}
              <AnimatePresence>
                {showChat && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.2
                    }}
                    className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden"
                    style={{
                      overscrollBehavior: 'none',
                      position: 'relative',
                      minHeight: '400px'
                    }}
                  >
                    <ChatInterface 
                      inPanel={true} 
                      chatMessages={chatMessages}
                      setChatMessages={setChatMessages}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}