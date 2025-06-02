import React from 'react';
import { Github, ExternalLink } from 'lucide-react';
import { Project } from '../../types';
import MagneticButton from './MagneticButton';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="card-container w-full h-[400px] md:h-[450px] relative">
      <div className="card w-full h-full">
        {/* Front side of card */}
        <div className="card-front w-full h-full rounded-xl overflow-hidden relative bg-space-navy border border-neon-blue/20">
          <img 
            src={project.image} 
            alt={project.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-black via-space-dark/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-6">
            <h3 className="text-2xl font-bold mb-2 font-sans text-white">
              {project.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies.map((tech, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 rounded-full bg-space-navy/80 text-neon-blue border border-neon-blue/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Back side of card */}
        <div className="card-back w-full h-full rounded-xl overflow-hidden bg-space-navy border border-neon-purple/20 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-4 font-sans text-gradient">
              {project.title}
            </h3>
            <p className="text-white/80 mb-6">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies.map((tech, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 rounded-full bg-space-black text-neon-purple border border-neon-purple/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 mt-4">
            {project.github && (
              <MagneticButton 
                href={project.github} 
                className="text-sm"
              >
                <Github size={16} />
                <span>Repository</span>
              </MagneticButton>
            )}
            {project.link && (
              <MagneticButton 
                href={project.link} 
                className="text-sm"
              >
                <ExternalLink size={16} />
                <span>Live Demo</span>
              </MagneticButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;