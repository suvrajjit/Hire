import React, { useEffect, useRef, useState } from 'react';

const FRAME_COUNT = 200;
// Note: Keeping path as "RedFlag.AI" as requested
const BASE_URL = 'https://gjehtzbbjhcvaxmlxsdb.supabase.co/storage/v1/object/public/RedFlag.AI/';

const ScrollSequence: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const indexStr = i.toString().padStart(3, '0');
      img.src = `${BASE_URL}frame_${indexStr}_delay-0.04s.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          setIsLoaded(true);
        }
      };
      imgArray.push(img);
    }
    setImages(imgArray);
  }, []);

  // Draw logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Calculate frame index based on scroll
      // Mapping 0px -> 2000px scroll range to 0 -> 199 frames
      const scrollY = window.scrollY;
      const maxScroll = 2000; 
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(progress * (FRAME_COUNT - 1))
      );

      // 2. Get current image
      const img = images[frameIndex];

      // 3. Clear and resizing logic
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (img) {
        // "object-fit: cover" implementation for canvas
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);
        
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShift_x,
          centerShift_y,
          img.width * ratio,
          img.height * ratio
        );
      }
      
      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [images, isLoaded]);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 text-cyan-400 font-mono text-sm animate-pulse">
          INITIALIZING SYSTEM...
        </div>
      )}
    </div>
  );
};

export default ScrollSequence;