'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
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
  
  // Chat state lifted here for persistence across panel open/close
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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

  const handleWheelActivate = () => {
    // COMMENTED OUT: More submenu functionality
    // if (selectedMenu === 'more') {
    //   // Switch to more submenu
    //   setMenuState('more');
    //   setWheelAngle(0); // Reset for submenu
    // } else 
    if (selectedMenu) {
      // Open side panel with content
      const content = MENU_CONTENT[selectedMenu] || [];
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
        const content = MENU_CONTENT[menuId] || [];
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
        
        {/* Wheel Container - Bottom on mobile, Left on tablet/desktop */}
        <div 
          className="order-2 md:order-1 bg-white flex items-center justify-center p-4 md:border-r md:border-t-0 md:shadow-none" 
          style={{ 
            boxShadow: '0 -4px 16px -4px rgba(0, 0, 0, 0.1)',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
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
        </div>

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