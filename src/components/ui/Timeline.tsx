import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Experience } from '../../types';
import { CalendarDays, Briefcase } from 'lucide-react';

interface TimelineProps {
  experiences: Experience[];
}

const Timeline: React.FC<TimelineProps> = ({ experiences }) => {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neon-blue via-neon-purple to-neon-pink transform md:translate-x-[-50%]"></div>
      
      {experiences.map((experience, index) => (
        <TimelineItem 
          key={experience.id} 
          experience={experience} 
          index={index}
        />
      ))}
    </div>
  );
};

interface TimelineItemProps {
  experience: Experience;
  index: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ experience, index }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(itemRef, { once: true, amount: 0.3 });
  
  const isEven = index % 2 === 0;
  
  return (
    <div 
      ref={itemRef}
      className={`relative flex flex-col md:flex-row items-start mb-16 last:mb-0 ${
        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Circle on timeline */}
      <motion.div 
        className="absolute left-0 md:left-1/2 w-6 h-6 rounded-full bg-space-navy border-2 border-neon-purple transform md:translate-x-[-50%] shadow-[0_0_10px_rgba(157,0,255,0.5)]"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Briefcase className="w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-neon-purple" />
      </motion.div>
      
      {/* Content */}
      <motion.div 
        className={`md:w-1/2 pl-10 md:pl-0 ${
          isEven ? 'md:pr-10 md:text-right' : 'md:pl-10'
        }`}
        initial={{ opacity: 0, x: isEven ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? 50 : -50 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className={`p-5 rounded-lg border border-neon-blue/20 bg-space-navy/50 backdrop-blur-sm relative overflow-hidden ${
          isEven ? 'md:mr-4' : 'md:ml-4'
        }`}>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 opacity-30"></div>
          
          <h3 className="text-xl font-bold mb-1 font-sans text-white relative z-10">{experience.role}</h3>
          <div className="flex items-center gap-2 mb-3 text-neon-blue relative z-10">
            <span className="font-medium">{experience.company}</span>
            <span className="text-white/60">•</span>
            <span className="flex items-center text-sm text-white/70">
              <CalendarDays size={14} className="mr-1" />
              {experience.duration}
            </span>
          </div>
          
          <ul className="list-disc ml-5 text-white/80 space-y-1 relative z-10">
            {experience.description.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          
          {experience.technologies && (
            <div className="mt-4 flex flex-wrap gap-2 relative z-10">
              {experience.technologies.map((tech, i) => (
                <span 
                  key={i} 
                  className="text-xs px-2 py-1 rounded-full bg-space-black/50 text-neon-purple border border-neon-purple/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Timeline;