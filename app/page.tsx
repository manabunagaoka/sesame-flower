'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, ChevronUp, MapPin } from 'lucide-react';
import MenuWheel from '@/components/MenuWheel';
import TrackWheel from '@/components/TrackWheel';
import SidePanel from '@/components/SidePanel';
import { ChatMessage } from '@/components/ChatInterface';
import { MENU_CONTENT, ANIMATION_DURATION, MAIN_MENU_ITEMS, MORE_MENU_ITEMS } from '@/lib/constants';
import { MenuState, ContentItem, TabbedContent } from '@/lib/types';

export default function HomePage() {
  const [menuState, setMenuState] = useState<MenuState>('closed');
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState<{
    title: string;
    content: ContentItem[] | TabbedContent;
  }>({ title: '', content: [] });
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [videoKey, setVideoKey] = useState<number>(0); // Force iframe reload when needed
  const [wheelCollapsed, setWheelCollapsed] = useState(false); // Collapsible wheel state
  
  // Chat state lifted here for persistence across panel open/close
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Touch handling for swipe gestures
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const isMenuOpen = menuState !== 'closed';
  const currentMenuItems = menuState === 'more' ? MORE_MENU_ITEMS : MAIN_MENU_ITEMS;

  // Handle visibility changes to reset media permissions on iOS
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedContent?.videoId) {
        console.log('App became visible - reloading video iframe for iOS');
        setVideoKey(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedContent]);

  // Find closest menu item based on wheel angle
  const findClosestMenuItem = (angle: number) => {
    let closestItem = currentMenuItems[0];
    let smallestDiff = Math.abs(angle - closestItem.angle);

    currentMenuItems.forEach(item => {
      const diff = Math.min(
        Math.abs(angle - item.angle),
        Math.abs(angle - item.angle + 360),
        Math.abs(angle - item.angle - 360)
      );
      
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestItem = item;
      }
    });

    return closestItem;
  };

  // Update selected menu based on wheel position
  useEffect(() => {
    if (isMenuOpen && wheelAngle !== 0) {
      const closestItem = findClosestMenuItem(wheelAngle);
      setSelectedMenu(closestItem.id);
    }
  }, [wheelAngle, isMenuOpen, menuState]);

  const handleMenuToggle = () => {
    if (menuState === 'closed') {
      setMenuState('main');
      setWheelAngle(0); // Reset wheel position
    } else {
      setMenuState('closed');
      setSelectedMenu('');
      setSidePanelOpen(false);
    }
  };

  const handleWheelRotate = (angle: number) => {
    setWheelAngle(angle);
  };

  // Get content for a menu
  const getMenuContent = (menuId: string) => {
    return MENU_CONTENT[menuId] || [];
  };

  const handleWheelActivate = () => {
    // COMMENTED OUT: More submenu functionality
    // if (selectedMenu === 'more') {
    //   // Switch to more submenu
    //   setMenuState('more');
    //   setWheelAngle(0); // Reset for submenu
    // } else 
    if (selectedMenu) {
      // Open side panel with content
      const content = getMenuContent(selectedMenu);
      setSidePanelContent({
        title: selectedMenu,
        content,
      });
      setSidePanelOpen(true);
    }
  };

  const handleMenuClick = (menuId: string) => {
    // Find the angle of the clicked item and set wheel to that position
    const clickedItem = currentMenuItems.find(item => item.id === menuId);
    if (clickedItem) {
      setWheelAngle(clickedItem.angle);
      setSelectedMenu(menuId);
      
      // Handle menu action directly based on the clicked item
      // COMMENTED OUT: More submenu functionality
      // if (menuId === 'more') {
      //   // Switch to more submenu
      //   setMenuState('more');
      //   setWheelAngle(0); // Reset for submenu
      // } else {
        // Open side panel with content
        const content = getMenuContent(menuId);
        setSidePanelContent({
          title: menuId,
          content,
        });
        setSidePanelOpen(true);
      // } // COMMENTED OUT: Closing brace for More submenu
    }
  };

  const handleBackToMain = () => {
    setMenuState('main');
    setSelectedMenu('');
    setWheelAngle(0);
  };

  const handleCloseSidePanel = () => {
    setSidePanelOpen(false);
    setSelectedMenu('');
  };

  const handleBack = () => {
    if (sidePanelOpen) {
      // If side panel is open, close it and return to menu
      setSidePanelOpen(false);
      setSelectedMenu('');
      setSelectedContent(null);
    } else if (menuState === 'more') {
      // If in more submenu, return to main menu
      setMenuState('main');
      setSelectedMenu('');
      setWheelAngle(0);
    } else if (menuState === 'main') {
      // If in main menu, close menu entirely
      setMenuState('closed');
      setSelectedMenu('');
      setWheelAngle(0);
      setSelectedContent(null);
    }
  };

  // Swipe handlers for collapsible wheel
  const handleWheelTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleWheelTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchEndY - touchStartY.current;
    const deltaX = Math.abs(touchEndX - touchStartX.current);
    
    // Only trigger if vertical swipe is dominant (not horizontal scrolling)
    if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > deltaX) {
      if (deltaY > 0 && !wheelCollapsed) {
        // Swipe down - collapse wheel
        setWheelCollapsed(true);
      } else if (deltaY < 0 && wheelCollapsed) {
        // Swipe up - expand wheel
        setWheelCollapsed(false);
      }
    }
  };

  const toggleWheelCollapsed = () => {
    setWheelCollapsed(!wheelCollapsed);
  };

  return (
    <div 
      className="flex flex-col bg-gray-50"
      style={{
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto',
        height: '100dvh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Header */}
      <header 
        className="flex justify-between items-center p-4 bg-[#5cb85c]" 
        style={{ 
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <h1 className="text-xl font-semibold text-white">123 Sesame Street</h1>
        <button className="p-2 hover:bg-green-600 rounded-lg transition-colors">
          <MoreVertical size={20} className="text-white" />
        </button>
      </header>
      
      {/* Main Layout - Responsive: vertical on mobile, horizontal on tablet/desktop */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: 0 }}>
        
        {/* Wheel Container - Bottom on mobile (collapsible), Left on tablet/desktop */}
        <motion.div 
          className={`order-2 md:order-1 flex flex-col items-center justify-center md:border-r md:border-t-0 md:shadow-none relative ${wheelCollapsed ? 'bg-transparent' : 'bg-white'}`}
          style={{ 
            boxShadow: wheelCollapsed ? 'none' : '0 -4px 16px -4px rgba(0, 0, 0, 0.1)',
            borderTop: wheelCollapsed ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
          }}
          initial={false}
          animate={{ 
            height: wheelCollapsed ? 'auto' : 'auto',
            paddingTop: wheelCollapsed ? 0 : 16,
            paddingBottom: wheelCollapsed ? 0 : 16,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onTouchStart={handleWheelTouchStart}
          onTouchEnd={handleWheelTouchEnd}
        >
          {/* Pull-up handle when collapsed (mobile only) */}
          <AnimatePresence>
            {wheelCollapsed && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={toggleWheelCollapsed}
                className="md:hidden fixed flex items-center justify-center gap-2 py-4 px-8 bg-green-500 hover:bg-green-600 text-white rounded-t-2xl shadow-lg transition-colors z-50"
                style={{ 
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  minHeight: '56px',
                }}
              >
                <ChevronUp size={24} />
                <span className="text-base font-medium">Show Menu</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Wheel content - hidden when collapsed on mobile */}
          <motion.div
            initial={false}
            animate={{ 
              opacity: wheelCollapsed ? 0 : 1,
              scale: wheelCollapsed ? 0.8 : 1,
              height: wheelCollapsed ? 0 : 'auto',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:!opacity-100 md:!scale-100 md:!h-auto p-4"
            style={{ overflow: 'hidden' }}
          >
            {/* Swipe hint indicator (mobile only, when expanded) */}
            {!wheelCollapsed && selectedContent && (
              <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 z-10">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
            )}
            
            {/* Wheel size: responsive to viewport but capped */}
            <div 
              className="relative flex items-center justify-center wheel-container"
            >
              {/* Menu Wheel */}
              <AnimatePresence mode="wait">
                {isMenuOpen && (
                  <motion.div
                    key="menu-wheel"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      duration: ANIMATION_DURATION / 1000,
                    }}
                  >
                    <MenuWheel
                      menuState={menuState}
                      selectedMenu={selectedMenu}
                      onMenuClick={handleMenuClick}
                      isOpen={isMenuOpen}
                      currentAngle={wheelAngle}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* iPod Track Wheel */}
              <div className="absolute inset-0 flex items-center justify-center">
                <TrackWheel
                  isMenuOpen={isMenuOpen}
                  onToggle={handleMenuToggle}
                  onRotate={handleWheelRotate}
                  currentAngle={wheelAngle}
                  menuState={menuState}
                  onActivate={handleWheelActivate}
                  onBack={handleBack}
                  selectedMenu={selectedMenu}
                  menuItems={currentMenuItems}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Content Window - Top on mobile, Right on tablet/desktop */}
        <div 
          className="order-1 md:order-2 flex-1 bg-white overflow-hidden" 
          style={{ 
            minHeight: 0,
            boxShadow: 'inset 0 1px 0 rgba(0, 0, 0, 0.06)'
          }}
        >
          {!selectedContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
              <img src="/gif/elmo.gif" alt="Elmo" className="w-32 h-32 object-cover rounded-full" />
              <motion.p 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ANIMATION_DURATION }}
                className="text-2xl text-gray-600 font-light text-center"
              >
                Hi. Let&apos;s play!
              </motion.p>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-white">
              {selectedContent.videoId ? (
                <>
                  {/* Wistia Video container - responsive 16:9 that fits container */}
                  <div className="flex-1 flex items-center justify-center bg-white overflow-hidden p-2">
                    <div 
                      className="relative w-full h-full"
                      style={{ maxWidth: 'calc((100vh - 120px) * 16 / 9)', maxHeight: 'calc(100vw * 9 / 16)' }}
                    >
                      <div className="absolute inset-0" style={{ aspectRatio: '16/9', margin: 'auto', maxWidth: '100%', maxHeight: '100%' }}>
                        <iframe
                          key={`video-${selectedContent.videoId}-${videoKey}`}
                          src={`https://fast.wistia.net/embed/iframe/${selectedContent.videoId}?playsinline=1&controlsVisibleOnLoad=true&playerColor=54bb6a&plugin%5BpostRoll-v1%5D%5Btext%5D=&volume=1`}
                          title={selectedContent.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          className="w-full h-full"
                          style={{ border: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Title section below video */}
                  <div className="flex-shrink-0 bg-white px-4 py-2 border-t border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">{selectedContent.title}</h2>
                    <p className="text-xs text-gray-600">{selectedContent.description}</p>
                  </div>
                </>
              ) : selectedContent.youtubePlaylistId ? (
                <>
                  {/* YouTube Playlist container - responsive 16:9 that fits container */}
                  <div className="flex-1 flex items-center justify-center bg-white overflow-hidden p-2">
                    <div 
                      className="relative w-full h-full"
                      style={{ maxWidth: 'calc((100vh - 120px) * 16 / 9)', maxHeight: 'calc(100vw * 9 / 16)' }}
                    >
                      <div className="absolute inset-0" style={{ aspectRatio: '16/9', margin: 'auto', maxWidth: '100%', maxHeight: '100%' }}>
                        <iframe
                          key={`youtube-playlist-${selectedContent.youtubePlaylistId}-${videoKey}`}
                          src={`https://www.youtube.com/embed/videoseries?list=${selectedContent.youtubePlaylistId}&playsinline=1`}
                          title={selectedContent.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          className="w-full h-full"
                          style={{ border: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Title section below video */}
                  <div className="flex-shrink-0 bg-white px-4 py-2 border-t border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">{selectedContent.title}</h2>
                    <p className="text-xs text-gray-600">{selectedContent.description}</p>
                  </div>
                </>
              ) : selectedContent.youtubeVideoId ? (
                <>
                  {/* YouTube Single Video container - responsive 16:9 that fits container */}
                  <div className="flex-1 flex items-center justify-center bg-white overflow-hidden p-2">
                    <div 
                      className="relative w-full h-full"
                      style={{ maxWidth: 'calc((100vh - 120px) * 16 / 9)', maxHeight: 'calc(100vw * 9 / 16)' }}
                    >
                      <div className="absolute inset-0" style={{ aspectRatio: '16/9', margin: 'auto', maxWidth: '100%', maxHeight: '100%' }}>
                        <iframe
                          key={`youtube-video-${selectedContent.youtubeVideoId}-${videoKey}`}
                          src={`https://www.youtube.com/embed/${selectedContent.youtubeVideoId}?playsinline=1`}
                          title={selectedContent.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          className="w-full h-full"
                          style={{ border: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Title section below video */}
                  <div className="flex-shrink-0 bg-white px-4 py-2 border-t border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">{selectedContent.title}</h2>
                    <p className="text-xs text-gray-600">{selectedContent.description}</p>
                  </div>
                </>
              ) : selectedContent.gameUrl ? (
                <>
                  {/* Game container - full height for interactive games */}
                  <div className="flex-1 flex items-center justify-center bg-white overflow-hidden">
                    <iframe
                      key={`game-${selectedContent.gameUrl}-${videoKey}`}
                      src={selectedContent.gameUrl}
                      title={selectedContent.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  {/* Title section below game */}
                  <div className="flex-shrink-0 bg-white px-4 py-2 border-t border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">{selectedContent.title}</h2>
                    <p className="text-xs text-gray-600">{selectedContent.description}</p>
                  </div>
                </>
              ) : selectedContent.eventUrl ? (
                <>
                  {/* Event website container - full height for browsing */}
                  <div className="flex-1 flex items-center justify-center bg-white overflow-hidden">
                    <iframe
                      key={`event-${selectedContent.eventUrl}-${videoKey}`}
                      src={selectedContent.eventUrl}
                      title={selectedContent.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  {/* Title section below event */}
                  <div className="flex-shrink-0 bg-white px-4 py-2 border-t border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">{selectedContent.title}</h2>
                    <p className="text-xs text-gray-600">{selectedContent.description}</p>
                  </div>
                </>
              ) : selectedContent.venue || selectedContent.time ? (
                <>
                  {/* Event detail card */}
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6 overflow-auto">
                    <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4">
                      {/* Event Icon */}
                      <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                          <span className="text-4xl">🎉</span>
                        </div>
                      </div>
                      
                      {/* Event Title */}
                      <h2 className="text-2xl font-bold text-gray-900 text-center">
                        {selectedContent.title}
                      </h2>
                      
                      {/* Event Details */}
                      <div className="space-y-3 text-gray-600">
                        {selectedContent.time && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">📅</span>
                            <div>
                              <p className="text-sm text-gray-500">Fecha y Hora</p>
                              <p className="font-medium text-gray-900">{selectedContent.time}</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedContent.venue && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <MapPin size={24} className="text-gray-600" />
                            <div>
                              <p className="text-sm text-gray-500">Lugar</p>
                              <p className="font-medium text-gray-900">{selectedContent.venue}</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedContent.description && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Descripción</p>
                            <p className="text-gray-700">{selectedContent.description}</p>
                          </div>
                        )}
                        
                        {selectedContent.isFree !== undefined && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">💰</span>
                            <div>
                              <p className="text-sm text-gray-500">Precio</p>
                              <p className={`font-medium ${selectedContent.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                                {selectedContent.isFree ? '¡Gratis!' : 'Consultar precio'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      {selectedContent.eventUrl && (
                        <button
                          onClick={() => window.open(selectedContent.eventUrl, '_blank', 'noopener,noreferrer')}
                          className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                        >
                          Más Información →
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No video available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Side Panel */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={handleCloseSidePanel}
        title={sidePanelContent.title}
        content={sidePanelContent.content}
        onContentSelect={(item) => {
          setSelectedContent(item);
        }}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />
    </div>
  );
}