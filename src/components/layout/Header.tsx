import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Code, MessageSquare } from 'lucide-react';
import MagneticButton from '../ui/MagneticButton';
import ChatWithAI from '../ui/ChatWithAI';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [showHeaderChat, setShowHeaderChat] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      const shouldShowFloating = window.scrollY > 100;
      setScrolled(isScrolled);
      setShowFloatingChat(shouldShowFloating);
      setShowHeaderChat(!shouldShowFloating);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'About', href: 'about' },
    { name: 'Projects', href: 'projects' },
    { name: 'Skills', href: 'skills' },
    { name: 'Experience', href: 'experience' },
    { name: 'Achievements', href: 'achievements' },
    { name: 'Certificates', href: 'certificates' },
    { name: 'Contact', href: 'contact' },
  ];

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 96;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-space-black/80 backdrop-blur-md py-2 sm:py-3 border-b border-neon-blue/10'
            : 'py-3 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <button
              onClick={() => handleScrollTo('home')}
              className="text-white font-bold text-lg sm:text-xl flex items-center gap-2"
            >
              <motion.div
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 5,
                  ease: 'easeInOut',
                }}
                className="bg-neon-purple/20 p-1.5 sm:p-2 rounded-lg"
              >
                <Code size={20} className="text-neon-purple sm:w-6 sm:h-6" />
              </motion.div>
              <span className="font-mono text-sm sm:text-base">Alyx</span>
            </button>

            {/* Hire Me Button and Menu Button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <AnimatePresence>
                {showHeaderChat && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChatWithAI isNavbar={true} />
                  </motion.div>
                )}
              </AnimatePresence>
              <MagneticButton
                onClick={() => window.open('https://drive.google.com/uc?export=download&id=1JcGgx0lQRQZha_qSNkIJt3CmmLFobWnW', '_blank')}
                className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3"
              >
                <span className="hidden sm:inline">Hire Me</span>
                <span className="sm:hidden">Hire</span>
              </MagneticButton>
              <button
                className="text-white p-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X size={20} className="text-neon-pink sm:w-6 sm:h-6" />
                ) : (
                  <Menu size={20} className="text-neon-blue sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Full Screen Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 w-full bg-space-navy/95 backdrop-blur-md border-b border-neon-blue/10"
            >
              <nav className="max-w-7xl mx-auto px-4 py-4 sm:py-6 grid gap-2 sm:gap-4">
                {navItems.map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleScrollTo(item.href)}
                    className="w-full text-left py-2 sm:py-3 px-3 sm:px-4 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 font-mono flex items-center justify-between group text-sm sm:text-base"
                  >
                    <span>{item.name}</span>
                    <span className="text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      →
                    </span>
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Floating Chat Button */}
      <AnimatePresence>
        {showFloatingChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-8 left-4 z-50"
          >
            <ChatWithAI isNavbar={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;