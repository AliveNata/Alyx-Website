import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { EXPERIENCES } from '../../constants/data';
import Timeline from '../ui/Timeline';
import GlitchText from '../animations/GlitchText';

const Experience: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  return (
    <section id="experience" className="section-container scroll-mt-24 relative overflow-hidden">
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
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-transparent blur-3xl transform rotate-45" />
        <div className="absolute bottom-1/3 right-1/4 w-[32rem] h-[32rem] bg-gradient-to-l from-neon-pink/5 via-neon-purple/5 to-transparent blur-3xl transform -rotate-12" />
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
      
      {/* Content */}
      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-2 font-sans">
            <GlitchText text="Experience" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-neon-pink to-neon-purple mx-auto"></div>
          <p className="text-white/70 mt-4 max-w-2xl mx-auto">
            My professional journey and career milestones.
          </p>
        </motion.div>
        
        <Timeline experiences={EXPERIENCES} />
      </div>
    </section>
  );
};

export default Experience