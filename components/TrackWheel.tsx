'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Compass, Play, AlertCircle, Users, GraduationCap, Calendar, Flower2, Clock, Gamepad2, ShoppingBag } from 'lucide-react';
import { MenuItem } from '@/lib/types';

interface TrackWheelProps {
  isMenuOpen: boolean;
  onToggle: () => void;
  onRotate: (angle: number) => void;
  currentAngle: number;
  menuState: 'closed' | 'main' | 'more';
  onActivate: () => void;
  onBack: () => void;
  selectedMenu: string;
  menuItems: MenuItem[];
}

export default function TrackWheel({ 
  isMenuOpen, 
  onToggle, 
  onRotate, 
  currentAngle,
  menuState,
  onActivate,
  onBack,
  selectedMenu,
  menuItems
}: TrackWheelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle single vs double click
  const handleCenterClick = () => {
    setClickCount(prev => prev + 1);

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      if (clickCount === 0) {
        // Single click - forward action
        if (!isMenuOpen) {
          onToggle();
        } else {
          onActivate();
        }
      } else if (clickCount === 1) {
        // Double click - back action
        onBack();
      }
      setClickCount(0);
    }, 300);
  };

  // Track mouse/touch position to highlight nearest menu button
  const handleTrackStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMenuOpen) return;
    setIsDragging(true);
    updateAngleFromEvent(e);
    e.preventDefault();
  };

  const handleTrackMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isMenuOpen) return;
    updateAngleFromEvent(e);
  };

  const handleTrackEnd = () => {
    if (isDragging && isMenuOpen) {
      onActivate(); // Activate the highlighted button on release
    }
    setIsDragging(false);
  };

  const updateAngleFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const angle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90 + 360) % 360;
    
    onRotate(angle);
  };

  // Add keyboard controls for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMenuOpen) return;
      
      if (e.key === 'ArrowLeft') {
        onRotate((currentAngle - 45 + 360) % 360);
      } else if (e.key === 'ArrowRight') {
        onRotate((currentAngle + 45) % 360);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, currentAngle, onRotate, onActivate]);

  // Optional: Click on track ring to move to that position
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!isMenuOpen || isDragging) return;
    updateAngleFromEvent(e);
  };

  // Render the appropriate icon based on menu state
  const renderCenterIcon = () => {
    if (!isMenuOpen) {
      return <Play size={40} className="text-gray-600" />;
    }

    // Only show menu icon if a menu is actually selected (not empty string)
    if (!selectedMenu) {
      return <Play size={40} className="text-gray-600" />;
    }

    // Find the selected menu item
    const selectedItem = menuItems.find(item => item.id === selectedMenu);
    if (!selectedItem) {
      return <Play size={40} className="text-gray-600" />;
    }

    // Map icon names to icon components
    const iconMap: { [key: string]: React.ReactNode } = {
      'AlertCircle': <AlertCircle size={40} style={{ color: selectedItem.color }} />,
      'Users': <Users size={40} style={{ color: selectedItem.color }} />,
      'GraduationCap': <GraduationCap size={40} style={{ color: selectedItem.color }} />,
      'Calendar': <Calendar size={40} style={{ color: selectedItem.color }} />,
      'Flower2': <Flower2 size={40} style={{ color: selectedItem.color }} />,
      'Clock': <Clock size={40} style={{ color: selectedItem.color }} />,
      'Gamepad2': <Gamepad2 size={40} style={{ color: selectedItem.color }} />,
      'ShoppingBag': <ShoppingBag size={40} style={{ color: selectedItem.color }} />,
    };

    return iconMap[selectedItem.icon] || <Play size={40} className="text-gray-600" />;
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Track Ring - NO DOT, just the ring for dragging */}
      {isMenuOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute rounded-full border-8 cursor-pointer z-10"
          style={{
            width: '180px',
            height: '180px',
            borderColor: isDragging ? '#9CA3AF' : '#D1D5DB',
            transition: 'border-color 0.2s'
          }}
          onClick={handleTrackClick}
          onMouseDown={handleTrackStart}
          onMouseMove={handleTrackMove}
          onMouseUp={handleTrackEnd}
          onMouseLeave={handleTrackEnd}
          onTouchStart={handleTrackStart}
          onTouchMove={handleTrackMove}
          onTouchEnd={handleTrackEnd}
        />
      )}

      {/* Center Button - Main control */}
      <motion.button
        onClick={handleCenterClick}
        className="rounded-full flex items-center justify-center bg-white text-gray-700 shadow-xl hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 border-2 border-gray-300 z-30"
        style={{
          width: '100px',
          height: '100px',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {renderCenterIcon()}
      </motion.button>
    </div>
  );
}