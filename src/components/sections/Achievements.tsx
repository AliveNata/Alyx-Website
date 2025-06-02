import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Medal, Building } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import GlitchText from '../animations/GlitchText';
import { ACHIEVEMENTS } from '../../constants/data';

const Achievements: React.FC = () => {
  return (
    <section id="achievements" className="section-container scroll-mt-24 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-space-gradient opacity-50 -z-10"></div>
      <div className="absolute inset-0 bg-stars bg-cover bg-center opacity-20"></div>
      
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: `linear-gradient(to right, #9D00FF 1px, transparent 1px), 
                           linear-gradient(to bottom, #9D00FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Section header */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-2 font-sans">
          <GlitchText text="Achievements" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-neon-blue to-neon-purple mx-auto"></div>
        <p className="text-white/70 mt-4 max-w-2xl mx-auto">
          Key milestones and recognition in my professional journey
        </p>
      </motion.div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ACHIEVEMENTS.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative group"
          >
            <div className="bg-space-navy/50 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300 h-full">
              {/* Achievement icon */}
              <div className="mb-6 relative">
                <Player
                  autoplay
                  loop
                  src={achievement.animation}
                  className="w-32 h-32 mx-auto"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white group-hover:text-neon-blue transition-colors duration-300">
                  {achievement.title}
                </h3>
                
                <p className="text-white/70 text-sm">
                  {achievement.description}
                </p>
                
                {achievement.metrics && (
                  <div className="pt-4 border-t border-white/10">
                    {achievement.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-2">
                        <span className="text-neon-purple">
                          {metric.icon === 'building' && <Building size={16} />}
                          {metric.icon === 'award' && <Award size={16} />}
                          {metric.icon === 'star' && <Star size={16} />}
                          {metric.icon === 'medal' && <Medal size={16} />}
                        </span>
                        <span className="text-white/80 text-sm">{metric.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Achievements;