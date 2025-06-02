import React, { useCallback } from 'react';
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";
import type { Engine, ISourceOptions } from "tsparticles-engine";

const particlesConfig: ISourceOptions = {
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: ["#00F0FF", "#9D00FF", "#FF00D6", "#ffffff"]
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: 0.7,
      random: true,
      anim: {
        enable: true,
        speed: 0.5,
        opacity_min: 0.1,
        sync: false
      }
    },
    size: {
      value: 1.5,
      random: true,
      anim: {
        enable: true,
        speed: 1,
        size_min: 0.1,
        sync: false
      }
    },
    move: {
      enable: true,
      speed: 0.3,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "grab"
      },
      onclick: {
        enable: true,
        mode: "push"
      },
      resize: true
    },
    modes: {
      grab: {
        distance: 100,
        line_linked: {
          opacity: 0.5
        }
      },
      push: {
        particles_nb: 4
      }
    }
  },
  retina_detect: true,
  background: {
    color: "#050505",
    image: "",
    position: "50% 50%",
    repeat: "no-repeat",
    size: "cover"
  }
};

const ParticleBackground: React.FC = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      options={particlesConfig}
      init={particlesInit}
      className="fixed inset-0 -z-10"
    />
  );
};

export default ParticleBackground;