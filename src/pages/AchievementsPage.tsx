import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Award, Star, Medal, Building } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { ACHIEVEMENTS } from '../constants/data';
import GlitchText from '../components/animations/GlitchText';
import MagneticButton from '../components/ui/MagneticButton';

const AchievementsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-space-black text-white relative overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <MagneticButton
              onClick={() => window.history.back()}
              className="p-3 bg-space-navy/50 rounded-full border border-neon-blue/30"
            >
              <ArrowLeft size={20} className="text-neon-blue" />
            </MagneticButton>
            <h1 className="text-4xl md:text-5xl font-bold font-sans">
              <GlitchText text="All Achievements" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
            </h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-neon-blue to-neon-purple"></div>
          <p className="text-white/70 mt-4 max-w-3xl text-lg">
            A comprehensive overview of my professional milestones, recognitions, and key accomplishments 
            throughout my career journey in data analysis and business intelligence.
          </p>
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ACHIEVEMENTS.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-space-navy/50 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300 h-full flex flex-col">
                {/* Achievement Animation */}
                <div className="mb-6 relative">
                  <Player
                    autoplay
                    loop
                    src={achievement.animation}
                    className="w-32 h-32 mx-auto"
                  />
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white group-hover:text-neon-blue transition-colors duration-300">
                    {achievement.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm flex-1">
                    {achievement.description}
                  </p>
                  
                  {achievement.metrics && (
                    <div className="pt-4 border-t border-white/10 mt-auto">
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

        {/* Achievement Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">
            <GlitchText text="Achievement Categories" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-blue/20">
              <Trophy className="w-8 h-8 text-neon-blue mx-auto mb-3" />
              <div className="text-lg font-bold text-white mb-2">Professional</div>
              <div className="text-white/70 text-sm">Career milestones and work achievements</div>
            </div>
            
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-purple/20">
              <Award className="w-8 h-8 text-neon-purple mx-auto mb-3" />
              <div className="text-lg font-bold text-white mb-2">Recognition</div>
              <div className="text-white/70 text-sm">Awards and industry recognition</div>
            </div>
            
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-pink/20">
              <Star className="w-8 h-8 text-neon-pink mx-auto mb-3" />
              <div className="text-lg font-bold text-white mb-2">Excellence</div>
              <div className="text-white/70 text-sm">Outstanding performance metrics</div>
            </div>
            
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-green/20">
              <Medal className="w-8 h-8 text-neon-green mx-auto mb-3" />
              <div className="text-lg font-bold text-white mb-2">Leadership</div>
              <div className="text-white/70 text-sm">Team leadership and mentoring</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AchievementsPage;