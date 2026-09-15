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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050914] transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } overflow-hidden`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-b from-transparent via-indigo-500 to-transparent h-20 animate-[scanline_3s_linear_infinite]"></div>

      <div className="relative flex flex-col items-center animate-[popin_0.8s_ease-out_forwards]">
        {/* Glow behind logo */}
        <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full animate-pulse"></div>
        
        {/* Logo Container with Cyberpulse */}
        <div className="relative rounded-full animate-[cyberpulse_2s_infinite] p-4 bg-slate-900/50 border border-indigo-500/30 backdrop-blur-md">
          <Image 
            src="/logo.png" 
            alt="Paradox Logo" 
            width={180} 
            height={180} 
            className="object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            priority
          />
        </div>

        {/* Text Area */}
        <div className="mt-10 flex flex-col items-center">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-[0.2em] uppercase relative">
            Paradox AI
            {/* Glitch Overlay */}
            <span className="absolute inset-0 text-indigo-500 opacity-50 animate-[glitch_2s_infinite]">Paradox AI</span>
          </div>
          
          <div className="text-indigo-400/60 font-mono text-[10px] tracking-widest mt-3 uppercase animate-pulse">
            Initializing neural pathways...
          </div>
        </div>

        {/* Futuristic Loader */}
        <div className="mt-10 relative w-64 h-[2px] bg-slate-800/80 rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-cyan-400 to-indigo-600 rounded-full w-0 animate-[progress_2.5s_cubic-bezier(0.4,0,0.2,1)_forwards]">
            <div className="absolute inset-0 bg-white/20 animate-[progress_1s_ease-in-out_infinite_alternate]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
