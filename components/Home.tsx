import React, { useEffect, useState } from 'react';
import ScrollSequence from './ScrollSequence';
import Orb from './Orb';
import CircularGallery from './CircularGallery';
import MagicBento from './MagicBento/MagicBento';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  const [opacity, setOpacity] = useState(1);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Fade out the hero section over the first 300px of scroll
      const newOpacity = Math.max(0, 1 - scrollY / 300);
      setOpacity(newOpacity);

      // Hide button at bottom of page
      // Using a buffer (e.g. 200px) to detect near bottom
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
      setShowButton(!isAtBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const successStories = [
    { image: 'https://picsum.photos/id/1011/600/800?grayscale', text: 'Alex - Google' },
    { image: 'https://picsum.photos/id/1027/600/800?grayscale', text: 'Sarah - OpenAI' },
    { image: 'https://picsum.photos/id/1012/600/800?grayscale', text: 'David - Tesla' },
    { image: 'https://picsum.photos/id/1025/600/800?grayscale', text: 'Emily - Meta' },
    { image: 'https://picsum.photos/id/1005/600/800?grayscale', text: 'Michael - AWS' },
    { image: 'https://picsum.photos/id/1006/600/800?grayscale', text: 'Anna - Netflix' },
    { image: 'https://picsum.photos/id/1009/600/800?grayscale', text: 'James - Stripe' },
  ];

  return (
    <div className="relative w-full">
      {/* 
        Layer 1: Background Sequence 
        This stays fixed via CSS inside the component
      */}
      <ScrollSequence />

      {/* 
        Scroll Spacer
        We need height to allow scrolling. 
        2000px matches the scroll mapping in ScrollSequence 
      */}
      <div className="relative w-full h-[2200px] pointer-events-none"></div>

      {/* 
        Layer 2: Hero Foreground 
        Fixed position, fades out on scroll
      */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ opacity: opacity }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          {/* The Orb is the "Energy Core" */}
          <div className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] opacity-60 pointer-events-auto">
             {/* 
               Note: pointer-events-auto is needed on the container/canvas 
               if we want the mouse interaction on the orb to work 
             */}
            <Orb hoverIntensity={0.4} rotateOnHover={true} hue={0} forceHoverState={false} />
          </div>

      {/* Text Removed as requested */}
        </div>
      </div>

       {/* Magic Bento Grid Section */}
       <div className="relative z-20 w-full pt-20 pb-20">
          <div className="container mx-auto px-4 text-center mb-10">
               <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 tracking-tighter mb-4">
                  SYSTEM MODULES
               </h2>
          </div>
          <MagicBento 
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={600}
            particleCount={12}
            glowColor="0, 255, 255"
          />
       </div>
      
      {/* Success Stories Section */}
      <div className="relative z-20 w-full bg-gradient-to-t from-black via-black to-transparent pt-32 pb-20">
         <div className="container mx-auto px-4 mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 tracking-tighter">
              SUCCESS STORIES
            </h2>
            <p className="text-gray-400 font-mono tracking-widest uppercase text-sm">
              They upgraded their career. Will you?
            </p>
         </div>
         <div className="w-full h-[600px] relative">
            <CircularGallery 
              items={successStories} 
              bend={3} 
              textColor="#ffffff" 
              borderRadius={0.05} 
              scrollEase={0.02}
              autoScroll={true}
            />
         </div>
      </div>

      {/* Call to Action Sticky Button */}
      <div 
        className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-500 w-full flex justify-center px-4 ${
          opacity < 0.1 && showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
         <button 
           onClick={onStart}
           className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-4 px-10 rounded-full shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all transform hover:scale-105 whitespace-nowrap"
         >
           Ready to Get yourself hired?
         </button>
      </div>
    </div>
  );
};

export default Home;