import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '', disabled = false, onDisabledClick }) => {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) {
      onDisabledClick?.();
      return;
    }
    
    navigate(-1); // Goes back exactly one step
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleBack}
      disabled={disabled}
      className={`p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 text-gray-300 hover:text-white transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      aria-label="Go back"
      data-testid="button-back"
    >
      <ArrowLeft className="w-5 h-5" />
    </motion.button>
  );
};

export default BackButton;