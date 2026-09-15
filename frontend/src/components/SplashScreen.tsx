'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if we've already shown the splash screen in this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Mark as seen
    sessionStorage.setItem('hasSeenSplash', 'true');

    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Completely remove from DOM after 3 seconds
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative animate-pulse flex flex-col items-center">
        <Image 
          src="/logo.png" 
          alt="Paradox Logo" 
          width={300} 
          height={300} 
          className="object-contain"
          priority
        />
      </div>
      <div className="mt-8 relative w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full w-0 animate-[progress_2.5s_ease-in-out_forwards]"></div>
      </div>
    </div>
  );
}
