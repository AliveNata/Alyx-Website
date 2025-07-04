import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PROJECTS } from '../../constants/data';
import ProjectCard from '../ui/ProjectCard';
import GlitchText from '../animations/GlitchText';
import MagneticButton from '../ui/MagneticButton';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  
  // Show only first 4 projects on homepage
  const displayedProjects = PROJECTS.slice(0, 4);

  return (
    <section id="projects" className="section-container scroll-mt-24 relative">
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
          <GlitchText text="My Projects" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-neon-purple to-neon-pink mx-auto"></div>
        <p className="text-white/70 mt-4 max-w-2xl mx-auto">
          A collection of my recent work showcasing my skills and experience.
          Each project is unique and demonstrates different aspects of my technical abilities.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {displayedProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 1, y: 0 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0, delay: 0 }} 
            viewport={{ once: true, amount: 0.3 }} 
            className="flip-card"  
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </div>

      {/* Show More Button */}
      {PROJECTS.length > 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center"
        >
          <MagneticButton
            onClick={() => navigate('/projects')}
            className="text-base px-8 py-4 bg-transparent hover:border-neon-purple/60"
          >
            <span>Show More Projects</span>
            <span className="ml-2">→</span>
          </MagneticButton>
        </motion.div>
      )}
    </section>
  );
};

export default Projects;