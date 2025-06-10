import React from 'react';
import { Heart, ArrowUp } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <footer className="bg-space-black border-t border-white/10 py-8 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, #9D00FF 1px, transparent 1px), 
                              linear-gradient(to bottom, #9D00FF 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-white/60 text-center md:text-left">
                &copy; {currentYear} Alief Akbar. All rights reserved.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <p className="text-white/60 text-sm">Made with</p>
              <a href="https://yupinata.netlify.app/" target="_blank" rel="noopener noreferrer">
              <Heart
                size={16}
                className="text-neon-pink fill-neon-pink animate-pulse"
              />
              </a>
              <p className="text-white/60 text-sm">and Joyfull!</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll up button at outside footer */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-4 z-40 p-3 bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] group"
        aria-label="Scroll to top"
      >
        <ArrowUp
          size={20}
          className="text-neon-blue group-hover:transform group-hover:-translate-y-1 transition-transform duration-300"
        />
      </button>
    </>
  );
};

export default Footer;