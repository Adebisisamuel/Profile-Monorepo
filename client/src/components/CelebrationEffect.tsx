import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { motion } from 'framer-motion';
import { ROLES, ROLE_COLORS } from '@shared/constants';

interface CelebrationEffectProps {
  show: boolean;
  onComplete?: () => void;
  primaryRole?: string | null;
  message?: string;
}

export default function CelebrationEffect({
  show,
  onComplete,
  primaryRole,
  message = "Gefeliciteerd! Je beoordeling is voltooid."
}: CelebrationEffectProps) {
  const [isActive, setIsActive] = useState(false);
  const { width, height } = useWindowSize();
  
  // Get the primary role color for the confetti
  const getPrimaryColors = () => {
    if (!primaryRole) return ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444'];
    
    const roleKey = primaryRole.toLowerCase() as keyof typeof ROLE_COLORS;
    const color = ROLE_COLORS[roleKey] || '#3b82f6';
    const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    
    if (rgba) {
      const [_, r, g, b] = rgba;
      return [
        `rgba(${r}, ${g}, ${b}, 1)`,
        `rgba(${r}, ${g}, ${b}, 0.8)`,
        `rgba(${r}, ${g}, ${b}, 0.6)`,
        `rgba(255, 255, 255, 0.9)`,
        `rgba(${r}, ${g}, ${b}, 0.7)`
      ];
    }
    
    return ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444'];
  };

  useEffect(() => {
    if (show) {
      setIsActive(true);
      // Set a timeout to hide the celebration effect after 5 seconds
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
      <Confetti
        width={width}
        height={height}
        numberOfPieces={300}
        gravity={0.15}
        colors={getPrimaryColors()}
        recycle={false}
      />
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center relative z-10"
      >
        <motion.div
          initial={{ rotate: -5 }}
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 0.5, repeat: 5, repeatType: 'reverse' }}
          className="mb-4 mx-auto"
        >
          <div className="text-5xl">🎉</div>
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2">
          {message}
        </h2>
        
        {primaryRole && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mb-4"
          >
            Je primaire bediening is <span className="font-semibold">{primaryRole}</span>
          </motion.p>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg"
          onClick={() => {
            setIsActive(false);
            if (onComplete) onComplete();
          }}
        >
          Ga verder
        </motion.button>
      </motion.div>
    </div>
  );
}