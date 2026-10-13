/* TAILWIND THEME — brand colours + fonts live here. Rebuilt automatically on deploy (npm run build).
   Spacing: only even Tailwind steps are used (2=8px, 4=16px, 6=24px, 8=32px, 12=48px, 24=96px) = 8px system. */
module.exports = {
  content: ['./src/**/*.njk', './build.js', './public/js/*.js', './public/*.html'],
  theme: { extend: {
    colors: { ink:'#02040a', navy:'#06165c', royal:'#0b35c4', volt:'#1f6bff', aqua:'#38c6ff', sky:'#9cc4ff', ice:'#eef5ff' },
    fontFamily: { display:['Unbounded','system-ui','sans-serif'], body:['Figtree','system-ui','sans-serif'] }
  } }
};
