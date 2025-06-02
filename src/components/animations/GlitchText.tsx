import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchOnHover?: boolean;
  disableAnimation?: boolean;
  disableGlitchStyle?: boolean;
}

const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  className = '',
  glitchOnHover = true,
  disableAnimation = false,
  disableGlitchStyle = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const characters = text.split('');

  const isActive = glitchOnHover ? isHovering : true;

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {characters.map((char, index) => (
        <GlitchChar
          key={index}
          char={char}
          isAnimating={!disableAnimation && isActive}
          showGlitch={!disableGlitchStyle && isActive}
        />
      ))}
    </span>
  );
};

interface GlitchCharProps {
  char: string;
  isAnimating: boolean;
  showGlitch: boolean;
}

const GlitchChar: React.FC<GlitchCharProps> = ({ char, isAnimating, showGlitch }) => {
  const props = useSpring({
    from: { transform: 'translate(0, 0)' },
    to: async (next) => {
      if (isAnimating && char !== ' ') {
        for (let i = 0; i < 3; i++) {
          const offset = () => (Math.random() - 0.5) * 10;
          await next({
            transform: `translate(${offset()}px, ${offset()}px)`,
            config: { duration: 50 },
          });
          await next({
            transform: 'translate(0, 0)',
            config: { duration: 50 },
          });
        }
      }
    },
    config: { mass: 1, tension: 200, friction: 20 },
  });

  return (
    <animated.span
      style={props}
      className={`inline-block relative text-white ${char === ' ' ? 'mr-[0.25em]' : ''}`}
    >
      {char}
      {showGlitch && char !== ' ' && (
        <>
          <span className="absolute left-0 top-0 text-neon-blue opacity-80 translate-x-[1px] translate-y-[-1px] blur-[0.5px]">
            {char}
          </span>
          <span className="absolute left-0 top-0 text-neon-pink opacity-80 translate-x-[-1px] translate-y-[1px] blur-[0.5px]">
            {char}
          </span>
        </>
      )}
    </animated.span>
  );
};

export default GlitchText;
