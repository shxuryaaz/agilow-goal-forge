import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (active) {
      setPieces(Array.from({ length: 50 }, (_, i) => i));
      
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            background: `hsl(${Math.random() * 360}, 70%, 60%)`,
            left: `${Math.random() * 100}%`,
            top: '100%',
          }}
          initial={{ 
            y: 0,
            rotate: 0,
            opacity: 1,
            scale: 1
          }}
          animate={{
            y: -window.innerHeight - 100,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: 0,
            scale: 0.5,
            x: (Math.random() - 0.5) * 200
          }}
          transition={{
            duration: 3,
            ease: "easeOut",
            delay: Math.random() * 0.5
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;