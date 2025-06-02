import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ABOUT_ME } from '../../constants/data';
import GlitchText from '../animations/GlitchText';
import ScrambledText from '../animations/ScrambledText';
import OrbitAnimation from '../animations/OrbitAnimation';

const About: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.3 });

  return (
    <section id="about" className="section-container scroll-mt-24 relative min-h-screen">
      {/* Section background with subtle gradient */}
      <div className="absolute inset-0 bg-space-gradient opacity-50 -z-10"></div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-2 font-sans">
          <GlitchText 
            text="About Me" 
            glitchOnHover={false}  
            disableAnimation={true}  
            disableGlitchStyle={false}
          />
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-neon-blue to-neon-purple mx-auto"></div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
        <motion.div 
          className="md:col-span-3 order-2 md:order-1"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          ref={ref}
        >
          <div className="space-y-6">
            {ABOUT_ME.description.map((paragraph, index) => (
              <div 
                key={index} 
                className="scrambled-paragraph"
              >
                <ScrambledText 
                  text={paragraph}
                  className="text-white/80 leading-relaxed"
                  isInView={isInView}
                  delay={index * 0.5}
                />
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-neon-blue font-mono text-lg mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {ABOUT_ME.interests.map((interest, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full bg-space-navy text-white border border-neon-blue/30 text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="md:col-span-2 order-1 md:order-2"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <OrbitAnimation />
        </motion.div>
      </div>
    </section>
  );
};

export default About;
