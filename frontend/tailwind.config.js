/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#0B0E14',
          surface: '#111622',
          card: '#161C2A',
          cardElevated: '#1D2436',
          border: '#20293C',
          borderLight: '#2D374D',
          hover: '#1F293D',
        },
        brand: {
          red: '#F85149',
          redDim: 'rgba(248, 81, 73, 0.15)',
          amber: '#D29922',
          amberDim: 'rgba(210, 153, 34, 0.15)',
          blue: '#58A6FF',
          blueDim: 'rgba(88, 166, 255, 0.15)',
          green: '#3FB950',
          greenDim: 'rgba(63, 185, 80, 0.15)',
          purple: '#BC8CFF',
          purpleDim: 'rgba(188, 140, 255, 0.15)',
          muted: '#8B949E',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        radarSweep: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
