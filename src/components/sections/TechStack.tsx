import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon as Icon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TECH_STACK } from '../../constants/data';
import GlitchText from '../animations/GlitchText';
import GitHubCalendar from 'react-github-calendar';

const TechStack: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allTechItems = TECH_STACK[0].items;

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
  
    let animationFrameId: number;
    let isHovering = false;
  
    const scrollStep = () => {
      if (!isHovering) {
        scrollContainer.scrollLeft += 1; // scroll lebih halus, 1px per frame
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };
  
    const handleMouseEnter = () => {
      isHovering = true;
    };
    const handleMouseLeave = () => {
      isHovering = false;
    };
  
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
  
    animationFrameId = requestAnimationFrame(scrollStep);
  
    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section id="skills" className="section-container scroll-mt-24 relative overflow-visible">
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
            text="Tech Stack"
            glitchOnHover={false}
            disableAnimation={true}
            disableGlitchStyle={false}
          />
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-neon-green to-neon-blue mx-auto"></div>
        <p className="text-white/70 mt-4 max-w-2xl mx-auto">
          Technologies and tools I work with to bring ideas to life.
        </p>
      </motion.div>

      <div className="relative w-full overflow-visible">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-space-black to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-space-black to-transparent z-10 pointer-events-none"></div>

        <div
          ref={scrollRef}
          className="flex overflow-x-scroll scrollbar-hide pt-10 pb-10 -mb-4 tech-scroll"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex gap-4 px-32">
            {[...allTechItems, ...allTechItems].map((item, index) => {
              const IconComponent: Icon =
                (LucideIcons as any)[
                  item.icon.charAt(0).toUpperCase() + item.icon.slice(1)
                ] || LucideIcons.Code;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: [0, -2, 2, 0],
                      transition: { duration: 0.3 },
                    }}
                    className="z-20 w-28 h-28 flex flex-col items-center justify-center p-4 rounded-xl bg-space-navy/50 backdrop-blur-sm border border-white/10 hover:border-neon-blue/30 transition-all duration-300 group cursor-pointer"
                    style={{
                      boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300"
                      style={{
                        backgroundColor: `${item.color}15`,
                        boxShadow: `0 0 25px ${item.color}20`,
                      }}
                    >
                      <IconComponent
                        size={24}
                        className="transition-all duration-300 group-hover:rotate-12"
                        style={{ color: item.color }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-neon-blue transition-colors duration-300 text-center">
                      {item.name}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* GitHub Contribution Calendar, tempatkan di bawah tech cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-4xl mx-auto mt-12 px-4 py-8 bg-space-navy/70 rounded-xl border border-white/20 backdrop-blur-md overflow-x-hidden"
      >
        <h4 className="text-white/70 text-xl font-semibold mb-6 text-center">
          My GitHub Contributions
        </h4>
      
        <GitHubCalendar
          username="AliveNata"
          blockSize={12}      // kecilkan kotak
          blockMargin={3}     // kecilkan margin antar kotak
          color="#22c55e"
        />
      </motion.div>
    </section>
  );
};

export default TechStack