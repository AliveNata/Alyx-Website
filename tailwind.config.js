/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'space-black': '#050505',
        'space-dark': '#0A0A14',
        'space-navy': '#0F1A30',
        'neon-blue': '#00F0FF',
        'neon-purple': '#9D00FF',
        'neon-pink': '#FF00D6',
        'neon-green': '#00FF9D',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
        sans: ['Exo', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'scroll-down': 'scrollDown 2.5s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'neon-glow': 'neonGlow 2s infinite ease-in-out',  // <== Tambahan neon glow
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        scrollDown: {
          '0%': { transform: 'translateY(0)', opacity: 0 },
          '30%': { opacity: 1 },
          '60%': { opacity: 0.6 },
          '100%': { transform: 'translateY(20px)', opacity: 0 },
        },
      },
      backgroundImage: {
        stars: 'url("https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg?auto=compress&cs=tinysrgb&w=1600")',
        'space-gradient': 'linear-gradient(to bottom, #050505, #0A0A14, #0F1A30)',
      },
    },
  },
  plugins: [],
};
