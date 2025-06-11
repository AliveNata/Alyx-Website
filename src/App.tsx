import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ProjectsPage from './pages/ProjectsPage';
import AchievementsPage from './pages/AchievementsPage';
import CertificatesPage from './pages/CertificatesPage';

function HomePage() {
  return (
    <>
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
    </>
  );
}

function App() {
  useEffect(() => {
    document.title = "Alief Akbar | Portfolio";
  }, []);
  
  return (
    <Router>
      <div className="relative font-sans bg-space-black text-white overflow-x-hidden">
        <div className="noise-bg"></div>
        <ParticleBackground />
        <CustomCursor />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;