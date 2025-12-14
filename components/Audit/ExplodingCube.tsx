import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExplodingCubeProps {
  status: 'idle' | 'analyzing' | 'success' | 'error';
}

const ExplodingCube: React.FC<ExplodingCubeProps> = ({ status }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center perspective-[1000px]">
      <AnimatePresence>
        {status !== 'success' && (
          <motion.div
            className="w-32 h-32 relative transform-style-3d"
            initial={{ rotateX: 0, rotateY: 0 }}
            animate={
              status === 'analyzing'
                ? {
                    rotateX: [0, 360],
                    rotateY: [0, 720],
                    scale: [1, 1.2, 0.8, 1.1],
                    x: [0, -5, 5, -5, 0], // Glitch shake
                  }
                : { rotateX: 360, rotateY: 360 }
            }
            transition={
              status === 'analyzing'
                ? { duration: 2, repeat: Infinity, ease: "linear" }
                : { duration: 10, repeat: Infinity, ease: "linear" }
            }
          >
            {/* Cube Faces */}
            <div className="absolute w-full h-full border-2 border-cyan-500 bg-black/80 backdrop-blur-sm opacity-90 translate-z-[64px]" />
            <div className="absolute w-full h-full border-2 border-cyan-500 bg-black/80 backdrop-blur-sm opacity-90 rotate-y-180 translate-z-[64px]" />
            <div className="absolute w-full h-full border-2 border-cyan-500 bg-black/80 backdrop-blur-sm opacity-90 rotate-y-90 translate-z-[64px]" />
            <div className="absolute w-full h-full border-2 border-cyan-500 bg-black/80 backdrop-blur-sm opacity-90 rotate-y--90 translate-z-[64px]" />
            <div className="absolute w-full h-full border-2 border-cyan-500 bg-black/80 backdrop-blur-sm opacity-90 rotate-x-90 translate-z-[64px]" />
            <div className="absolute w-full h-full border-2 border-cyan-500 bg-black/80 backdrop-blur-sm opacity-90 rotate-x--90 translate-z-[64px]" />
            
            {/* Core Glow */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion Effect when Success */}
      {status === 'success' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-sm"
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                x: (Math.random() - 0.5) * 500,
                y: (Math.random() - 0.5) * 500,
                rotate: Math.random() * 360,
                opacity: [1, 0],
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          ))}
          <motion.div
             className="absolute inset-0 bg-cyan-500/30 blur-3xl rounded-full"
             initial={{ scale: 0.5, opacity: 0 }}
             animate={{ scale: 2, opacity: [0, 0.5, 0] }}
             transition={{ duration: 0.8 }}
          />
        </div>
      )}
    </div>
  );
};

export default ExplodingCube;
