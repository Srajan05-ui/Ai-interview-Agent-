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

    // Start fade out after 5 seconds for a slower, cinematic feel
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5000);

    // Completely remove from DOM after 6.5 seconds
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 6500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-[1500ms] ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } overflow-hidden`}
    >
      {/* Light sweep effect across the screen */}
      <div className="absolute top-0 bottom-0 w-[200%] bg-gradient-to-r from-transparent via-white to-transparent opacity-5 animate-[cinematic-light-sweep_4s_ease-in-out_forwards] blur-[100px] transform -skew-x-[30deg]"></div>

      <div className="relative flex flex-col items-center justify-center h-full animate-[cinematic-fade-scale_6s_ease-out_forwards]">
        {/* Subtle cinematic glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-100/5 blur-[80px] rounded-full"></div>
        
        {/* Logo (no background box, just pure logo) */}
        <div className="relative z-10 flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Paradox Logo" 
            width={160} 
            height={160} 
            className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] filter grayscale contrast-125 brightness-150"
            priority
          />
        </div>

        {/* Cinematic Text Reveal */}
        <div className="mt-8 flex flex-col items-center z-10">
          <div className="text-xl sm:text-2xl font-light text-slate-200 uppercase animate-[cinematic-text-reveal_5s_ease-out_forwards]">
            A <span className="font-semibold text-white">Paradox</span> Production
          </div>
        </div>
      </div>
    </div>
  );
}
