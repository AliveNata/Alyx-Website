import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Github, Linkedin, Twitter } from 'lucide-react';
import MagneticButton from '../ui/MagneticButton';
import GlitchText from '../animations/GlitchText';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, we would send the form data to a server
    console.log('Form submitted:', formData);
    alert('Thank you for your message! This is a demo, so no actual message was sent.');
    
    // Clear the form
    setFormData({
      name: '',
      email: '',
      message: ''
    });
  };
  
  return (
    <section id="contact" className="section-container relative scroll-mt-24 scroll-smooth">
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
          <GlitchText text="Get In Touch"  glitchOnHover={false}  disableAnimation={true}  disableGlitchStyle={false} />
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-neon-green to-neon-blue mx-auto"></div>
        <p className="text-white/70 mt-4 max-w-2xl mx-auto">
          Have a project in mind or want to say hello? Feel free to reach out!
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-white/80 mb-2 font-mono">
                Your Name
              </label>
              <input 
                type="text" 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-space-navy/50 border border-neon-blue/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 transition-all duration-300"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-white/80 mb-2 font-mono">
                Your Email
              </label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-space-navy/50 border border-neon-blue/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 transition-all duration-300"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-white/80 mb-2 font-mono">
                Your Message
              </label>
              <textarea 
                id="message" 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full bg-space-navy/50 border border-neon-blue/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 transition-all duration-300 resize-none"
              ></textarea>
            </div>
            
            <div>
              <MagneticButton 
                className="w-full flex justify-center items-center gap-2"
                onClick={() => {}}
              >
                <Send size={18} />
                <span>Send Message</span>
              </MagneticButton>
            </div>
          </form>
        </motion.div>
        
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="bg-space-navy/30 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-2xl font-bold mb-6 font-sans text-gradient">Contact Information</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-neon-blue/10 rounded-full">
                <Mail className="w-5 h-5 text-neon-blue" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Email</h4>
                <p className="text-white/70">alivenata@gmail.com</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-white font-medium mb-4">Find me on</h4>
              <div className="flex gap-4">
                <motion.a
                  href="https://github.com/AliveNata" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-space-navy rounded-full border border-neon-blue/20 hover:border-neon-blue/60 transition-all duration-300"
                  whileHover={{ y: -5, boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
                >
                  <Github className="w-6 h-6 text-neon-blue" />
                </motion.a>
                
                <motion.a
                  href="https://www.linkedin.com/in/alvnts/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-space-navy rounded-full border border-neon-purple/20 hover:border-neon-purple/60 transition-all duration-300"
                  whileHover={{ y: -5, boxShadow: '0 0 15px rgba(157, 0, 255, 0.3)' }}
                >
                  <Linkedin className="w-6 h-6 text-neon-purple" />
                </motion.a>
                
                {/* <motion.a
                  href="https://twitter.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-space-navy rounded-full border border-neon-pink/20 hover:border-neon-pink/60 transition-all duration-300"
                  whileHover={{ y: -5, boxShadow: '0 0 15px rgba(255, 0, 214, 0.3)' }}
                >
                  <Twitter className="w-6 h-6 text-neon-pink" />
                </motion.a> */}
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-white font-medium mb-4">Available for</h4>
              <div className="flex flex-wrap gap-3">
                {["Freelance", "Full-time", "Collaboration", "Remote Work"].map((item, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full bg-space-black text-neon-green border border-neon-green/30 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;