const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        timetable: {
          primary: '#4f46e5',
          'primary-dark': '#4338ca',
          'primary-light': '#6366f1',
          'primary-bg': '#eef2ff',
          surface: '#ffffff',
          'surface-alt': '#fafcff',
          'surface-subtle': '#f8fafc',
          border: '#eef2f6',
          'border-medium': '#e2e8f0',
          'border-strong': '#cbd5e1',
          text: '#0b1120',
          'text-body': '#1e293b',
          'text-muted': '#475569',
          'text-faint': '#64748b',
          'text-subtle': '#94a3b8',
          bg: '#f4f6fb',
        },
      },
      boxShadow: {
        'timetable-card': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'timetable-elevated': '0 4px 6px rgba(0, 0, 0, 0.04), 0 10px 30px rgba(0, 0, 0, 0.08)',
        'timetable-nav': '0 4px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'timetable-primary': '0 4px 10px rgba(79, 70, 229, 0.25)',
        'timetable-primary-hover': '0 6px 16px rgba(79, 70, 229, 0.30)',
        'timetable-qa-hover': '0 6px 16px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'timetable-app': '28px',
        'timetable-card': '16px',
        'timetable-card-lg': '18px',
        'timetable-nav': '16px',
        'timetable-icon': '12px',
        'timetable-icon-sm': '14px',
        'timetable-pill': '40px',
      },
      fontFamily: {
        timetable: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
