// Ripple Effect Component
import { useState } from 'react';
import { motion } from 'framer-motion';

const Ripple = ({ x, y, key }) => {
  return (
    <motion.div
      key={key}
      className="absolute rounded-full bg-white/30 pointer-events-none"
      initial={{ width: 0, height: 0, opacity: 0.7, left: x, top: y }}
      animate={{ width: 400, height: 400, opacity: 0, left: x - 200, top: y - 200 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  );
};

export const RippleButton = ({ children, onClick, className = '', disabled = false, ...props }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };

    setRipples([...ripples, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden transition-all ${className}`}
      {...props}
    >
      {ripples.map((ripple) => (
        <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
      ))}
      {children}
    </button>
  );
};

export default RippleButton;
