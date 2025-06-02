import React, { useEffect, useState } from 'react';

interface ScrambledTextProps {
  text: string;
  className?: string;
  isInView: boolean;
  delay?: number;
  speed?: number;
}

const ScrambledText: React.FC<ScrambledTextProps> = ({
  text,
  className = '',
  isInView,
  delay = 0,
  speed = 60,
}) => {
  const [displayText, setDisplayText] = useState('');
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    const scrambleOnce = () => {
      let iteration = 0;
      const maxIterations = 10;
      let currentText = text.split('').map(() => '').join('');

      interval = setInterval(() => {
        currentText = text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration / 2) return text[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('');

        setDisplayText(currentText);
        iteration++;

        if (iteration >= maxIterations * 2) {
          if (interval) clearInterval(interval);
          setDisplayText(text);
        }
      }, speed);
    };

    const scrambleLoop = () => {
      interval = setInterval(() => {
        const scrambled = text
          .split('')
          .map((char) => (char === ' ' ? ' ' : characters[Math.floor(Math.random() * characters.length)]))
          .join('');
        setDisplayText(scrambled);
      }, speed);
    };

    if (isInView) {
      timeout = setTimeout(() => {
        scrambleOnce();
      }, delay * 1000);
    } else {
      if (timeout) clearTimeout(timeout);
      scrambleLoop();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [text, isInView, delay, speed]);

  return (
    <p className={`relative ${className}`}>
      {/* Layer untuk menjaga tinggi dan lebar tetap */}
      <span className="invisible block">{text}</span>

      {/* Layer untuk animasi scramble */}
      <span className="absolute inset-0">{displayText || text}</span>
    </p>
  );
};

export default ScrambledText;
