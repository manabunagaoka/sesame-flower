'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { 
  Phone, Heart, AlertTriangle, Stethoscope, Users, Users2, Baby, Coffee,
  Sparkles, Car, UtensilsCrossed, BookOpen, Palette, Trees, Book, Music,
  Plus, Search, Shield, FileText, GraduationCap, Zap, PenTool, User,
  Building, ShoppingBag, DollarSign, PlayCircle, Grid3x3, MessageCircle, Mic, AudioLines, Flower2
} from 'lucide-react';
import { clsx } from 'clsx';
import { ContentItem } from '@/lib/types';
import { ANIMATION_DURATION } from '@/lib/constants';
import ChatInterface from './ChatInterface';

// Icon mapping for content items
const contentIconMap = {
  Phone, Heart, AlertTriangle, Stethoscope, Users, Users2, Baby, Coffee,
  Sparkles, Car, UtensilsCrossed, BookOpen, Palette, Trees, Book, Music,
  Plus, Search, Shield, FileText, GraduationCap, Zap, PenTool, User,
  Building, ShoppingBag, DollarSign, PlayCircle, Grid3x3, MessageCircle, Mic, AudioLines, Flower2
};

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ContentItem[];
  onContentSelect: (item: ContentItem) => void;
}

export default function SidePanel({ isOpen, onClose, title, content, onContentSelect }: SidePanelProps) {
  const [showChat, setShowChat] = useState(false);
  const isConnect = title.toLowerCase() === 'connect';
  const isChat = title.toLowerCase() === 'chat';

  // Reset chat when panel closes, or auto-open chat for chat menu
  React.useEffect(() => {
    if (!isOpen) {
      setShowChat(false);
    } else if (isChat) {
      setShowChat(true);
    }
  }, [isOpen, isChat]);
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
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'hidden', // Changed from 'auto' to prevent scroll issues
        overscrollBehavior: 'none',
        width: '100%',
        maxWidth: '28rem' // 448px - same as max-w-sm but explicit
      }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 capitalize">
                {isChat ? 'Chat' : title}
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
                'p-4 space-y-3',
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
                        'flex items-center p-3 rounded-lg',
                        'bg-gray-50 hover:bg-gray-100 transition-colors duration-200',
                        'border border-gray-200 hover:border-gray-300',
                        'cursor-pointer group'
                      )}
                      onClick={() => {
                        console.log('Item clicked:', item);
                        if ((isConnect && (item.title.toLowerCase().includes('chat') || item.title.toLowerCase().includes('support') || item.title.toLowerCase().includes('talk'))) || isChat) {
                          setShowChat(true);
                        } else {
                          console.log('Calling onContentSelect with:', item);
                          onContentSelect(item);
                          onClose();
                        }
                      }}
                    >
                      {/* Icon or Thumbnail */}
                      {item.videoId && item.thumbnail ? (
                        <div className="relative w-20 h-14 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <PlayCircle size={24} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className={clsx(
                          'flex items-center justify-center rounded-full',
                          'w-10 h-10 bg-white border border-gray-200',
                          'group-hover:border-gray-300 transition-colors duration-200'
                        )}>
                          {IconComponent && (
                            <IconComponent 
                              size={18} 
                              className="text-gray-600 group-hover:text-gray-700" 
                            />
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          {item.time && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {item.time}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.description}
                        </p>
                      </div>

                      {/* Chevron */}
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg 
                          className="w-4 h-4 text-gray-400" 
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
                    initial={{ height: 0, opacity: 0, y: 20 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: 20 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: "easeInOut",
                      height: { duration: 0.4 }
                    }}
                    className="flex-1 flex flex-col min-h-0 mt-4 mx-4 mb-4 rounded-lg border border-gray-200 shadow-lg bg-white overflow-hidden"
                    style={{
                      overscrollBehavior: 'none',
                      position: 'relative',
                      minHeight: '400px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      borderTop: '2px solid #e5e7eb'
                    }}
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">Speak with Flower</span>
                    </div>
                    <ChatInterface inPanel={true} />
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