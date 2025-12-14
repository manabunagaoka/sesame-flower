'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Users, 
  Wrench, 
  Calendar, 
  Briefcase, 
  Clock, 
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  ShoppingBag,
  GraduationCap,
  DollarSign,
  PlayCircle,
  Grid3x3,
  Plane,
  AudioLines,
  MessageCircleHeart,
  Gamepad2,
  MonitorPlay,
  Award
} from 'lucide-react';
import { clsx } from 'clsx';
import { MAIN_MENU_ITEMS, MORE_MENU_ITEMS, MENU_RADIUS, MENU_BUTTON_SIZE, ANIMATION_DURATION, STAGGER_DELAY } from '@/lib/constants';

// Icon mapping
const iconMap = {
  AlertCircle,
  Users,
  Wrench,
  Calendar,
  Briefcase,
  Clock,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  ShoppingBag,
  GraduationCap,
  DollarSign,
  PlayCircle,
  Grid3x3,
  Plane,
  AudioLines,
  MessageCircleHeart,
  Gamepad2,
  MonitorPlay,
  Award,
};

interface MenuWheelProps {
  isOpen: boolean;
  onMenuClick: (menuId: string) => void;
  selectedMenu?: string;
  menuState: 'closed' | 'main' | 'more';
  currentAngle: number; // Add current angle for highlighting
}

export default function MenuWheel({ isOpen, onMenuClick, selectedMenu, menuState, currentAngle }: MenuWheelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const currentMenuItems = menuState === 'more' ? MORE_MENU_ITEMS : MAIN_MENU_ITEMS;
  
  // Use fixed responsive values to avoid hydration issues
  const getResponsiveRadius = () => {
    return MENU_RADIUS; // Use base radius, let CSS handle responsiveness
  };
  
  const getButtonSize = () => {
    return MENU_BUTTON_SIZE; // Use base size, let CSS handle responsiveness
  };

  const getButtonPosition = (angle: number, radius: number) => {
    const radians = (angle - 90) * (Math.PI / 180); // -90 to start at top
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <>
            {currentMenuItems.map((item, index) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap];
              const responsiveRadius = getResponsiveRadius();
              const responsiveButtonSize = getButtonSize();
              const position = getButtonPosition(item.angle, responsiveRadius);
              const isSelected = selectedMenu === item.id;
              
              // Check if this button is highlighted based on current angle
              const angleDiff = Math.min(
                Math.abs(currentAngle - item.angle),
                Math.abs(currentAngle - item.angle + 360),
                Math.abs(currentAngle - item.angle - 360)
              );
              const isHighlighted = angleDiff < 22.5; // 45 degrees / 2
              
              return (
                <motion.button
                  key={`${menuState}-${item.id}`}
                  initial={{ 
                    scale: 0, 
                    opacity: 0,
                    x: position.x,
                    y: position.y,
                  }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    x: position.x,
                    y: position.y,
                  }}
                  exit={{ 
                    scale: 0, 
                    opacity: 0,
                    transition: { duration: ANIMATION_DURATION / 2 }
                  }}
                  transition={{ 
                    duration: ANIMATION_DURATION,
                    delay: index * STAGGER_DELAY,
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                  onClick={() => onMenuClick(item.id)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={clsx(
                    'absolute rounded-full flex items-center justify-center z-20',
                    'border-2 shadow-lg hover:shadow-xl transition-all duration-200',
                    'hover:scale-110 active:scale-95 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-white',
                    hoveredIndex === index ? 'brightness-110 scale-110' : '',
                    isHighlighted && 'ring-4 ring-gray-400 scale-110 brightness-110'
                  )}
                  style={{
                    width: MENU_BUTTON_SIZE,
                    height: MENU_BUTTON_SIZE,
                    backgroundColor: isSelected ? item.color : `${item.color}CC`, // More contrast when not selected
                    borderColor: isSelected ? '#ffffff' : item.borderColor,
                    boxShadow: isSelected ? '0 0 20px rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
                    transform: `translate(${position.x}px, ${position.y}px) ${isSelected ? 'scale(1.15)' : 'scale(1)'}`,
                    left: '50%',
                    top: '50%',
                    marginLeft: -MENU_BUTTON_SIZE / 2,
                    marginTop: -MENU_BUTTON_SIZE / 2,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {IconComponent && (
                    <IconComponent 
                      size={22} 
                      className={isSelected ? "text-white" : "text-white"}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />
                  )}
                </motion.button>
              );
            })}
            
            {/* Selection arrow pointing to current menu item */}
            {selectedMenu && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {(() => {
                  const selectedItem = currentMenuItems.find(item => item.id === selectedMenu);
                  if (!selectedItem) return null;
                  
                  const position = getButtonPosition(selectedItem.angle, MENU_RADIUS + 30);
                  const rotation = selectedItem.angle + 90; // Point towards the button
                  
                  return (
                    <motion.div
                      className="w-4 h-4 text-blue-500"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M7 14l5-5 5 5H7z" />
                      </svg>
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}