'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import MenuWheel from '@/components/MenuWheel';
import TrackWheel from '@/components/TrackWheel';
import SidePanel from '@/components/SidePanel';
import { MENU_CONTENT, ANIMATION_DURATION, MAIN_MENU_ITEMS, MORE_MENU_ITEMS } from '@/lib/constants';
import { MenuState, ContentItem } from '@/lib/types';

export default function HomePage() {
  const [menuState, setMenuState] = useState<MenuState>('closed');
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState<{
    title: string;
    content: ContentItem[];
  }>({ title: '', content: [] });
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [greeting, setGreeting] = useState('Good evening');

  // Debug logging
  useEffect(() => {
    if (selectedContent) {
      console.log('Selected content:', selectedContent);
    }
  }, [selectedContent]);

  const isMenuOpen = menuState !== 'closed';
  const currentMenuItems = menuState === 'more' ? MORE_MENU_ITEMS : MAIN_MENU_ITEMS;

  useEffect(() => {
    // Update greeting on client side only
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon');
      } else {
        // Everything else is evening (17-5)
        setGreeting('Good evening');
      }
    };

    updateGreeting();
    // Update every minute
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

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
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-[#5cb85c] border-b border-green-600">
        <h1 className="text-xl font-semibold text-white">123 Sesame Street</h1>
        <button className="p-2 hover:bg-green-600 rounded-lg transition-colors">
          <MoreVertical size={20} className="text-white" />
        </button>
      </header>
      
      {/* Main Layout - Upper Content + Lower Wheel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content Window - Upper Half */}
        <div className="flex-1 bg-white overflow-y-auto p-4">
          {console.log('Rendering content area, selectedContent:', selectedContent)}
          {!selectedContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <img src="/gif/elmo.gif" alt="Elmo" className="w-32 h-32 object-cover rounded-full" />
              <motion.p 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ANIMATION_DURATION }}
                className="text-2xl text-gray-600 font-light text-center"
              >
                Hi. Let's play!
              </motion.p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {selectedContent.videoId ? (
                <>
                  <iframe
                    src={`https://fast.wistia.net/embed/iframe/${selectedContent.videoId}?videoFoam=true`}
                    title={selectedContent.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ border: 'none' }}
                  />
                  {/* Title overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
                    <h2 className="text-sm font-semibold text-white">{selectedContent.title}</h2>
                    <p className="text-xs text-white/80">{selectedContent.description}</p>
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
        
        {/* Wheel Container - Lower Bottom */}
        <div className="bg-gray-50 flex items-center justify-center p-4" style={{ minHeight: '50vh' }}>
          <div className="relative w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] flex items-center justify-center">
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
      </main>

      {/* Side Panel */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={handleCloseSidePanel}
        title={sidePanelContent.title}
        content={sidePanelContent.content}
        onContentSelect={(item) => {
          console.log('onContentSelect called in page.tsx with:', item);
          setSelectedContent(item);
          console.log('setSelectedContent called');
        }}
      />
    </div>
  );
}