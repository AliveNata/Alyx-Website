import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Github, ExternalLink } from 'lucide-react';
import { PROJECTS } from '../constants/data';
import GlitchText from '../components/animations/GlitchText';
import MagneticButton from '../components/ui/MagneticButton';

const ProjectsPage: React.FC = () => {
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
              <GlitchText text="All Projects" glitchOnHover={false} disableAnimation={true} disableGlitchStyle={false} />
            </h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-neon-purple to-neon-pink"></div>
          <p className="text-white/70 mt-4 max-w-3xl text-lg">
            Explore my complete portfolio of projects showcasing various technologies and solutions.
            Each project represents a unique challenge and demonstrates different aspects of my technical expertise.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-space-navy/50 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300 h-full flex flex-col">
                {/* Project Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-space-black/80 to-transparent"></div>
                </div>

                {/* Project Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-neon-blue transition-colors duration-300">
                    {project.title}
                  </h3>
                  
                  <p className="text-white/70 mb-4 flex-1">
                    {project.description}
                  </p>
                  
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.technologies.map((tech, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-space-black text-neon-purple border border-neon-purple/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-auto">
                    {project.github && (
                      <MagneticButton 
                        onClick={() => window.open(project.github, '_blank')}
                        className="flex-1 text-sm py-2 px-4"
                      >
                        <Github size={16} />
                        <span>Code</span>
                      </MagneticButton>
                    )}
                    {project.link && (
                      <MagneticButton 
                        onClick={() => window.open(project.link, '_blank')}
                        className="flex-1 text-sm py-2 px-4 bg-transparent border border-neon-purple/30 hover:border-neon-purple/60"
                      >
                        <ExternalLink size={16} />
                        <span>Demo</span>
                      </MagneticButton>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-blue/20">
            <div className="text-3xl font-bold text-neon-blue mb-2">{PROJECTS.length}+</div>
            <div className="text-white/70">Total Projects</div>
          </div>
          <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-purple/20">
            <div className="text-3xl font-bold text-neon-purple mb-2">10+</div>
            <div className="text-white/70">Technologies Used</div>
          </div>
          <div className="text-center p-6 bg-space-navy/30 rounded-xl border border-neon-pink/20">
            <div className="text-3xl font-bold text-neon-pink mb-2">100%</div>
            <div className="text-white/70">Success Rate</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectsPage;