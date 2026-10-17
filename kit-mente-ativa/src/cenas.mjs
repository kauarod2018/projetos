// Ilustrações dos quebra-cabeças, desenhadas em SVG (viewBox 300 x 400).

export const casaNoCampo = `
<defs>
  <linearGradient id="ceuA" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7EC8F2"/><stop offset="1" stop-color="#D6F0FF"/>
  </linearGradient>
</defs>
<rect width="300" height="400" fill="url(#ceuA)"/>
<circle cx="245" cy="62" r="34" fill="#FFD23F"/>
<g stroke="#FFD23F" stroke-width="5" stroke-linecap="round">
  <line x1="245" y1="10" x2="245" y2="20"/><line x1="290" y1="62" x2="300" y2="62"/>
  <line x1="200" y1="62" x2="190" y2="62"/><line x1="245" y1="104" x2="245" y2="114"/>
  <line x1="214" y1="31" x2="207" y2="24"/><line x1="276" y1="93" x2="283" y2="100"/>
  <line x1="276" y1="31" x2="283" y2="24"/><line x1="214" y1="93" x2="207" y2="100"/>
</g>
<g fill="#fff">
  <ellipse cx="62" cy="58" rx="36" ry="16"/><ellipse cx="88" cy="48" rx="24" ry="18"/><ellipse cx="40" cy="50" rx="18" ry="13"/>
  <ellipse cx="150" cy="105" rx="26" ry="11"/><ellipse cx="168" cy="98" rx="18" ry="12"/>
</g>
<ellipse cx="60" cy="250" rx="140" ry="60" fill="#8CCB5E"/>
<ellipse cx="250" cy="245" rx="130" ry="55" fill="#79BD4F"/>
<rect y="240" width="300" height="160" fill="#6DB33F"/>
<!-- casa -->
<rect x="100" y="98" width="20" height="46" fill="#8B4A3B"/>
<rect x="55" y="160" width="150" height="110" fill="#F7E1A0"/>
<polygon points="40,165 130,95 220,165" fill="#D64933"/>
<polygon points="40,165 130,95 220,165" fill="none" stroke="#A8321F" stroke-width="4"/>
<rect x="115" y="205" width="32" height="65" rx="3" fill="#8B5A2B"/>
<circle cx="140" cy="240" r="3" fill="#F2C14E"/>
<g fill="#9FD8F5" stroke="#fff" stroke-width="4">
  <rect x="70" y="185" width="32" height="32"/><rect x="160" y="185" width="32" height="32"/>
</g>
<g stroke="#fff" stroke-width="3">
  <line x1="86" y1="185" x2="86" y2="217"/><line x1="70" y1="201" x2="102" y2="201"/>
  <line x1="176" y1="185" x2="176" y2="217"/><line x1="160" y1="201" x2="192" y2="201"/>
</g>
<circle cx="130" cy="140" r="11" fill="#9FD8F5" stroke="#fff" stroke-width="3"/>
<!-- caminho -->
<polygon points="118,270 144,270 175,400 85,400" fill="#E3C38B"/>
<!-- árvore -->
<rect x="243" y="200" width="18" height="80" fill="#7A4B27"/>
<circle cx="252" cy="185" r="42" fill="#3E8E41"/>
<circle cx="228" cy="200" r="26" fill="#3E8E41"/><circle cx="276" cy="202" r="26" fill="#3E8E41"/>
<g fill="#E63946">
  <circle cx="238" cy="175" r="6"/><circle cx="265" cy="168" r="6"/><circle cx="252" cy="200" r="6"/>
  <circle cx="276" cy="195" r="6"/><circle cx="228" cy="205" r="6"/>
</g>
<!-- cerca -->
<g fill="#FFFFFF" stroke="#C9B48A" stroke-width="2">
  <rect x="5" y="285" width="10" height="40"/><rect x="25" y="285" width="10" height="40"/>
  <rect x="45" y="285" width="10" height="40"/><rect x="65" y="285" width="10" height="40"/>
  <rect y="295" width="80" height="7"/><rect y="312" width="80" height="7"/>
  <rect x="190" y="290" width="10" height="40"/><rect x="210" y="290" width="10" height="40"/>
  <rect x="230" y="290" width="10" height="40"/><rect x="250" y="290" width="10" height="40"/>
  <rect x="270" y="290" width="10" height="40"/><rect x="290" y="290" width="10" height="40"/>
  <rect x="185" y="300" width="115" height="7"/><rect x="185" y="317" width="115" height="7"/>
</g>
<!-- flores -->
<g>
  ${flor(25, 360, '#FF6FA5')}${flor(60, 375, '#FFD23F')}${flor(40, 390, '#9B5DE5')}
  ${flor(215, 360, '#FFD23F')}${flor(250, 378, '#FF6FA5')}${flor(280, 355, '#F15BB5')}${flor(270, 392, '#9B5DE5')}
</g>
<!-- gato -->
<text x="70" y="262" font-size="30">🐈</text>
`;

function flor(x, y, cor) {
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 18}" stroke="#2D6A2F" stroke-width="3"/>
  <g fill="${cor}"><circle cx="${x - 6}" cy="${y}" r="6"/><circle cx="${x + 6}" cy="${y}" r="6"/>
  <circle cx="${x}" cy="${y - 6}" r="6"/><circle cx="${x}" cy="${y + 6}" r="6"/></g>
  <circle cx="${x}" cy="${y}" r="4" fill="#FFF3B0"/>`;
}

export const praia = `
<defs>
  <linearGradient id="ceuB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FF9E6D"/><stop offset=".55" stop-color="#FFD39A"/><stop offset="1" stop-color="#FFEFD1"/>
  </linearGradient>
  <linearGradient id="marB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1F7FBF"/><stop offset="1" stop-color="#4FC3E8"/>
  </linearGradient>
</defs>
<rect width="300" height="400" fill="url(#ceuB)"/>
<circle cx="90" cy="150" r="48" fill="#FF6B35"/>
<circle cx="90" cy="150" r="38" fill="#FF8C42"/>
<g fill="none" stroke="#5B3A29" stroke-width="3" stroke-linecap="round">
  <path d="M190 60 q8 -8 16 0 q8 -8 16 0"/><path d="M230 90 q6 -6 12 0 q6 -6 12 0"/><path d="M160 95 q5 -5 10 0 q5 -5 10 0"/>
</g>
<rect y="170" width="300" height="120" fill="url(#marB)"/>
<g fill="none" stroke="#E6F7FF" stroke-width="3" stroke-linecap="round" opacity=".9">
  <path d="M10 200 q15 -8 30 0 t30 0"/><path d="M150 215 q15 -8 30 0 t30 0"/>
  <path d="M60 245 q15 -8 30 0 t30 0"/><path d="M200 262 q15 -8 30 0 t30 0"/>
</g>
<!-- barco -->
<polygon points="175,195 255,195 240,212 190,212" fill="#8B4A3B"/>
<line x1="215" y1="120" x2="215" y2="195" stroke="#5B3A29" stroke-width="4"/>
<polygon points="219,124 219,188 262,188" fill="#FFFFFF"/>
<polygon points="211,132 211,188 178,188" fill="#E63946"/>
<!-- areia -->
<path d="M0 285 Q150 262 300 285 L300 400 L0 400 Z" fill="#F4D58D"/>
<path d="M0 285 Q150 262 300 285" fill="none" stroke="#FFFFFF" stroke-width="5" opacity=".8"/>
<!-- coqueiro -->
<path d="M262 400 Q250 320 268 240" stroke="#8B5A2B" stroke-width="14" fill="none"/>
<g fill="#2E8B57">
  <path d="M268 240 Q230 225 200 250 Q235 235 268 244 Z"/>
  <path d="M268 240 Q300 220 300 258 Q290 240 268 244 Z"/>
  <path d="M268 240 Q250 200 220 205 Q252 215 266 246 Z"/>
  <path d="M268 240 Q290 205 300 210 Q285 222 270 246 Z"/>
</g>
<circle cx="262" cy="248" r="7" fill="#7A4B27"/><circle cx="273" cy="250" r="7" fill="#7A4B27"/>
<!-- guarda-sol -->
<line x1="95" y1="300" x2="110" y2="385" stroke="#5B3A29" stroke-width="5"/>
<path d="M30 315 Q90 240 160 290 Z" fill="#FFD23F"/>
<path d="M30 315 Q55 275 75 268 L95 300 Z" fill="#E63946"/>
<path d="M112 262 Q140 268 160 290 L95 300 Z" fill="#E63946"/>
<!-- toalha e objetos -->
<rect x="140" y="345" width="90" height="40" rx="4" fill="#3D6FB6" transform="rotate(-6 185 365)"/>
<rect x="140" y="355" width="90" height="8" fill="#FFFFFF" transform="rotate(-6 185 365)"/>
<text x="20" y="390" font-size="30">🐚</text>
<text x="235" y="330" font-size="26">⭐</text>
<text x="40" y="350" font-size="26">🦀</text>
<text x="160" y="320" font-size="28">🏐</text>
`;
