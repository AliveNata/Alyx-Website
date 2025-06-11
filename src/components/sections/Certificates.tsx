import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import GlitchText from '../animations/GlitchText';
import MagneticButton from '../ui/MagneticButton';
import { CERTIFICATES } from '../../constants/data';

const Certificates: React.FC = () => {
  const navigate = useNavigate();
  
  // Show only first 6 certificates on homepage
  const displayedCertificates = CERTIFICATES.slice(0, 6);

  return (
    <section id="certificates" className="section-container scroll-mt-24 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-space-gradient opacity-50 -z-10"></div>
      <div className="absolute inset-0 bg-stars bg-cover bg-center opacity-20"></div>
      
      {/* Section header */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-2 font-sans">
          <GlitchText text="Certificates" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-neon-blue to-neon-purple mx-auto"></div>
      </motion.div>

      {/* Certificates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {displayedCertificates.map((cert, index) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
            className="group relative h-full"
          >
            <div className="bg-space-navy/50 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300 h-full flex flex-col justify-between min-h-[500px]">
              <div className="h-48 mb-4 relative overflow-hidden rounded-lg">
                <Player
                  autoplay
                  loop
                  src={cert.animation}
                  className="w-32 h-32 mx-auto"
                />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-neon-blue transition-colors duration-300">
                  {cert.title}
                </h3>
                <p className="text-white/70 mb-4 text-sm">
                  {cert.description}
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-neon-purple text-sm">{cert.issuer}</span>
                  <span className="text-white/50 text-sm">{cert.date}</span>
                </div>

                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-neon-blue hover:text-neon-purple transition-colors duration-300 text-sm"
                  >
                    View Certificate →
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show More Button */}
      {CERTIFICATES.length > 6 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center"
        >
          <MagneticButton
            onClick={() => navigate('/certificates')}
            className="text-base px-8 py-4 bg-transparent hover:border-neon-purple/60"
          >
            <span>Show More Certificates</span>
            <span className="ml-2">→</span>
          </MagneticButton>
        </motion.div>
      )}
    </section>
  );
};

export default Certificates;