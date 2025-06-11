import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Calendar, Award } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { CERTIFICATES } from '../constants/data';
import GlitchText from '../components/animations/GlitchText';
import MagneticButton from '../components/ui/MagneticButton';

const CertificatesPage: React.FC = () => {
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
              <GlitchText text="All Certificates" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
            </h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-neon-blue to-neon-purple"></div>
          <p className="text-white/70 mt-4 max-w-3xl text-lg">
            My professional certifications and continuous learning journey in data analysis, 
            business intelligence, and emerging technologies.
          </p>
        </motion.div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CERTIFICATES.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-space-navy/50 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300 h-full flex flex-col">
                {/* Certificate Animation */}
                <div className="h-48 mb-6 relative overflow-hidden rounded-lg bg-space-black/30 flex items-center justify-center">
                  <Player
                    autoplay
                    loop
                    src={cert.animation}
                    className="w-32 h-32"
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-neon-blue transition-colors duration-300">
                    {cert.title}
                  </h3>
                  
                  <p className="text-white/70 mb-4 text-sm flex-1">
                    {cert.description}
                  </p>

                  {/* Certificate Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-neon-purple" />
                      <span className="text-neon-purple text-sm font-medium">{cert.issuer}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className="text-white/50 text-sm">{cert.date}</span>
                    </div>
                  </div>

                  {/* View Certificate Button */}
                  {cert.link && (
                    <div className="mt-auto">
                      <MagneticButton
                        onClick={() => window.open(cert.link, '_blank')}
                        className="w-full text-sm py-2 px-4"
                      >
                        <ExternalLink size={16} />
                        <span>View Certificate</span>
                      </MagneticButton>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certificate Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">
            <GlitchText text="Certification Overview" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-blue/20">
              <div className="text-3xl font-bold text-neon-blue mb-2">{CERTIFICATES.length}+</div>
              <div className="text-white/70">Total Certificates</div>
            </div>
            
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-purple/20">
              <div className="text-3xl font-bold text-neon-purple mb-2">5+</div>
              <div className="text-white/70">Different Platforms</div>
            </div>
            
            <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-pink/20">
              <div className="text-3xl font-bold text-neon-pink mb-2">100%</div>
              <div className="text-white/70">Completion Rate</div>
            </div>
          </div>
        </motion.div>

        {/* Learning Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 text-center"
        >
          <h2 className="text-2xl font-bold mb-6">
            <GlitchText text="Continuous Learning" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            I believe in continuous learning and staying updated with the latest technologies and industry best practices. 
            These certifications represent my commitment to professional growth and excellence.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CertificatesPage;