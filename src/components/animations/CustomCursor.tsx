import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  return (
    <div 
      className="custom-cursor"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `translate(${position.x - 20}px, ${position.y - 20}px)`,
        transition: 'opacity 0.2s ease, transform 0.05s ease',
        pointerEvents: 'none'
      }}
    >
      <div className="relative">
        <div 
          className="absolute w-10 h-10 rounded-full border border-neon-blue"
          style={{
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.3), 0 0 45px rgba(0, 240, 255, 0.1)'
          }}
        ></div>
        <div 
          className="absolute w-1.5 h-1.5 rounded-full bg-neon-pink top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            boxShadow: '0 0 8px rgba(255, 0, 214, 0.8), 0 0 16px rgba(255, 0, 214, 0.5)'
          }}
        ></div>
      </div>
    </div>
  );
};

export default CustomCursor;