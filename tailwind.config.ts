import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './apps/shell/src/**/*.{html,ts}',
    './apps/portalAdmin/src/**/*.{html,ts}',
    './apps/portalTeacher/src/**/*.{html,ts}',
    './apps/portalStudent/src/**/*.{html,ts}',
    './apps/portalParent/src/**/*.{html,ts}',
    './apps/portalTransport/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        mnara: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#f093fb',
          dark: '#1a1a2e',
          light: '#f9fafb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
