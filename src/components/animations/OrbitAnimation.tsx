import React from 'react';
import { motion } from 'framer-motion';

const OrbitAnimation: React.FC = () => {
  return (
    <div className="relative w-full aspect-square">
      {/* Main circle */}
      <div className="absolute inset-0 rounded-full border-2 border-neon-blue/30 flex items-center justify-center">
        {/* Center sphere */}
        <div className="w-24 h-24 rounded-full bg-space-navy border border-neon-purple/30">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 blur-sm"></div>
        </div>
        
        {/* Orbiting elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          {/* Orbit path */}
          <div className="absolute inset-0 rounded-full border border-neon-blue/10 border-dashed"></div>
          
          {/* Orbiting sphere */}
          <motion.div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6"
            animate={{ rotate: -360 }} // Counter-rotation to keep sphere upright
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full bg-neon-blue/80 blur-sm"></div>
          </motion.div>
        </motion.div>
        
        {/* Second orbit */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[15%]"
        >
          <div className="absolute inset-0 rounded-full border border-neon-purple/10 border-dashed"></div>
          <motion.div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full bg-neon-purple/80 blur-sm"></div>
          </motion.div>
        </motion.div>
        
        {/* Third orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[30%]"
        >
          <div className="absolute inset-0 rounded-full border border-neon-pink/10 border-dashed"></div>
          <motion.div 
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3"
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full bg-neon-pink/80 blur-sm"></div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: `linear-gradient(to right, #9D00FF 1px, transparent 1px), 
                           linear-gradient(to bottom, #9D00FF 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      ></div>
    </div>
  );
};

export default OrbitAnimation;