import React from 'react';
import { motion } from 'framer-motion';
import { useScroll, useTransform } from 'framer-motion';
import GlitchText from '../animations/GlitchText';
import MagneticButton from '../ui/MagneticButton';

const Hero: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Parallax Background Elements */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute inset-0 bg-stars bg-cover bg-center opacity-20"
      />
      
      {/* Animated space objects */}
      <motion.div 
        style={{ y: y2 }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Nebula effects */}
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-transparent blur-3xl transform rotate-45" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-gradient-to-l from-neon-pink/5 via-neon-purple/5 to-transparent blur-3xl transform -rotate-12" />
      </motion.div>

      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: `linear-gradient(to right, #9D00FF 1px, transparent 1px), 
                           linear-gradient(to bottom, #9D00FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Main content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center"
      >
        {/* Floating Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-48 h-48 md:w-56 md:h-56 mb-8"
        >
          {/* Animated glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-75 blur-md animate-pulse"></div>
          
          {/* Floating orb */}
          <motion.div
            animate={{
              y: [-10, 10, -10],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-full h-full"
          >
            <div className="absolute inset-0 rounded-full bg-space-navy border-2 border-neon-blue/30 overflow-hidden">
              {/* Profile Image */}
              <img 
                src="https://i.imgur.com/2zatALZ.jpeg" 
                alt="Profile"
                className="w-full h-full object-cover opacity-90"
              />
              
              {/* Inner glow overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 mix-blend-overlay"></div>
              
              {/* Orbital rings */}
              <div className="absolute inset-0 rounded-full border-2 border-neon-purple/20 animate-spin-slow"></div>
              <div className="absolute inset-2 rounded-full border border-neon-blue/10 -rotate-45"></div>
              
              {/* Floating particles */}
              <div className="absolute w-2 h-2 rounded-full bg-neon-blue blur-sm animate-float" style={{ top: '20%', left: '20%' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-neon-purple blur-sm animate-float" style={{ top: '60%', right: '20%', animationDelay: '1s' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-neon-pink blur-sm animate-float" style={{ bottom: '20%', left: '40%', animationDelay: '2s' }}></div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-xl md:text-2xl font-mono text-neon-blue">
              Hello, I'm 
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold font-sans">
              <GlitchText text="Alief Akbar" glitchOnHover={true} disableAnimation={false} disableGlitchStyle={false} className="text-white tracking-tight" />
            </h1>
          </div>
          
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-white/80 font-mono">
              <span className="text-neon-pink">Analyze</span> | Development | <span className="text-neon-green">Data</span> Enthusiast
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <MagneticButton 
              className="text-base" 
              onClick={() => {
                const projectsSection = document.getElementById('projects');
                if (projectsSection) {
                  projectsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              View Projects
            </MagneticButton>
            <MagneticButton 
              className="text-base bg-transparent border border-neon-purple/30 hover:border-neon-purple/60" 
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Get In Touch
            </MagneticButton>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero