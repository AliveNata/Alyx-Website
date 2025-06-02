import React, { useEffect } from 'react';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import TechStack from './components/sections/TechStack';
import Experience from './components/sections/Experience';
import Achievements from './components/sections/Achievements';
import Certificates from './components/sections/Certificates';
import Contact from './components/sections/Contact';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ParticleBackground from './components/animations/ParticleBackground';
import CustomCursor from './components/animations/CustomCursor';

function App() {
  useEffect(() => {
    document.title = "Alief Akbar | Portfolio";
  }, []);
  
  return (
    <div className="relative font-sans bg-space-black text-white overflow-x-hidden">
      <div className="noise-bg"></div>
      <ParticleBackground />
      <CustomCursor />
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <TechStack />
        <Experience />
        <Achievements />
        <Certificates />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;