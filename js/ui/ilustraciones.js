// ilustraciones.js
// Miniaturas ilustradas de cada mundo para el mapa y la portada. Son SVG propios
// con degradados, texturas de cuadrícula/circuito, iluminación neón y mayor detalle
// visual por mundo. Usan `currentColor` como acento principal del mundo.

const MARCO = 'viewBox="0 0 240 140" role="img" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"';
const L = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';

function robot(x, y, r = 13) {
  return `<g transform="translate(${x},${y})">
    <ellipse cx="0" cy="${r * 1.05}" rx="${r * 1.15}" ry="${r * 0.35}" fill="currentColor" opacity=".25"/>
    <rect x="${-r * 1.18}" y="${-r * 0.35}" width="${r * 0.25}" height="${r * 0.7}" rx="2" fill="currentColor" opacity=".75"/>
    <rect x="${r * 0.93}" y="${-r * 0.35}" width="${r * 0.25}" height="${r * 0.7}" rx="2" fill="currentColor" opacity=".75"/>
    <rect x="${-r}" y="${-r * 0.88}" width="${r * 2}" height="${r * 1.76}" rx="${r * 0.45}" fill="currentColor"/>
    <rect x="${-r * 0.78}" y="${-r * 0.58}" width="${r * 1.56}" height="${r * 0.96}" rx="${r * 0.28}" fill="#070b18"/>
    <circle cx="${-r * 0.36}" cy="${-r * 0.12}" r="${r * 0.2}" fill="#00f5d4"/>
    <circle cx="${r * 0.36}" cy="${-r * 0.12}" r="${r * 0.2}" fill="#00f5d4"/>
    <circle cx="${-r * 0.42}" cy="${-r * 0.18}" r="${r * 0.07}" fill="#ffffff"/>
    <circle cx="${r * 0.3}" cy="${-r * 0.18}" r="${r * 0.07}" fill="#ffffff"/>
    <path d="M${-r * 0.26} ${r * 0.18} Q0 ${r * 0.34} ${r * 0.26} ${r * 0.18}" fill="none" stroke="#00f5d4" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M0 ${-r * 0.88} v${-r * 0.42}" stroke="currentColor" stroke-width="2.5"/>
    <circle cy="${-r * 1.35}" r="${r * 0.28}" fill="#ffc83d" opacity=".35"/>
    <circle cy="${-r * 1.35}" r="${r * 0.16}" fill="#ffc83d"/>
  </g>`;
}

export const ILUSTRACIONES = {
  // Mundo 1 · laboratorio (Fundamentos y Datos): cuadrícula isométrica neón, obstáculos con textura, estrella dorada y Robot1
  1: `<svg ${MARCO} aria-label="Laboratorio con una cuadrícula y Robot1">
    <defs>
      <radialGradient id="g-m1" cx="50%" cy="60%" r="65%">
        <stop offset="0%" stop-color="currentColor" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
      </radialGradient>
      <pattern id="p-m1" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" opacity=".2"/>
      </pattern>
    </defs>
    <rect width="240" height="140" fill="url(#p-m1)"/>
    <rect width="240" height="140" fill="url(#g-m1)"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${20 + i * 40} 14 V126" ${L} opacity=".28"/>`).join("")}
    ${[0, 1, 2, 3].map((i) => `<path d="M20 ${14 + i * 37} H220" ${L} opacity=".28"/>`).join("")}
    <rect x="20" y="14" width="200" height="112" rx="8" ${L} opacity=".45"/>
    <rect x="102" y="53" width="36" height="33" rx="5" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="1.8"/>
    <path d="M106 82 L134 57 M118 84 L136 68" stroke="currentColor" stroke-width="1.5" opacity=".4"/>
    <rect x="142" y="90" width="36" height="34" rx="5" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="1.8"/>
    <path d="M60 70 H92 V32 H194" fill="none" stroke="#ffc83d" stroke-width="2.2" stroke-dasharray="4 4" opacity=".8"/>
    ${robot(60, 69)}
    <g transform="translate(200,33)">
      <circle r="15" fill="#ffc83d" opacity=".22"/>
      <polygon points="0,-11 3.2,-3.5 11.2,-2.6 5.2,2.8 6.9,10.7 0,6.6 -6.9,10.7 -5.2,2.8 -11.2,-2.6 -3.2,-3.5" fill="#ffc83d" stroke="#fff3b0" stroke-width="1"/>
    </g>
  </svg>`,

  // Mundo 2 · sala de estrategia: mesa holográfica con cartas en abanico y sellos de decisión
  2: `<svg ${MARCO} aria-label="Cartas holográficas sobre una mesa">
    <defs>
      <radialGradient id="g-m3" cx="50%" cy="75%" r="65%">
        <stop offset="0%" stop-color="#1f513a" stop-opacity=".65"/>
        <stop offset="100%" stop-color="#0d060a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="240" height="140" fill="url(#g-m3)"/>
    <ellipse cx="120" cy="116" rx="108" ry="22" fill="#10281e" stroke="#ffca3a" stroke-width="2" opacity=".75"/>
    <ellipse cx="120" cy="116" rx="96" ry="16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity=".55"/>
    ${[-20, 0, 20]
      .map(
        (a, i) => `<g transform="translate(120,98) rotate(${a}) translate(-25,-84)">
          <rect width="50" height="70" rx="8" fill="${i === 1 ? "#fff9eb" : "#161224"}" stroke="${i === 1 ? "#ffca3a" : "currentColor"}" stroke-width="2.6"/>
          <rect x="4" y="4" width="42" height="62" rx="5" fill="none" stroke="${i === 1 ? "#ff5c7c" : "currentColor"}" stroke-width="0.8" opacity=".45"/>
          <text x="8" y="18" font-size="13" font-weight="700" fill="${i === 1 ? "#e11d48" : "currentColor"}">${["10", "A", "K"][i]}</text>
          <text x="25" y="47" text-anchor="middle" font-size="27" fill="${i === 1 ? "#e11d48" : i === 2 ? "#ffca3a" : "currentColor"}">${["♠", "♥", "♦"][i]}</text>
        </g>`
      )
      .join("")}
    <g transform="translate(204,34)">
      <circle r="19" fill="#22f57a" opacity=".16" stroke="#22f57a" stroke-width="2.5"/>
      <path d="M-8 1 l6 6 l11 -13" fill="none" stroke="#22f57a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(36,34)">
      <circle r="19" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="2.2"/>
      <path d="M-6 -6 l12 12 M6 -6 l-12 12" ${L} stroke-width="2.8"/>
    </g>
  </svg>`,

  // Mundo 3 · complejo industrial: rascacielos iluminado con cabina de elevador y ciclo activo
  3: `<svg ${MARCO} aria-label="Edificio de cinco pisos con un elevador">
    <defs>
      <radialGradient id="g-m4" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="currentColor" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#0d0804" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="240" height="140" fill="url(#g-m4)"/>
    <rect x="14" y="54" width="28" height="86" rx="3" fill="currentColor" opacity=".1"/>
    <rect x="198" y="42" width="28" height="98" rx="3" fill="currentColor" opacity=".1"/>
    <rect x="50" y="8" width="140" height="124" rx="9" fill="#181009" stroke="currentColor" stroke-width="2.6"/>
    ${[1, 2, 3, 4].map((i) => `<path d="M52 ${8 + i * 24.8} H188" ${L} opacity=".4"/>`).join("")}
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="60" y="${14 + i * 24.8}" width="14" height="10" rx="2" fill="#ffd166" opacity="${i % 2 === 0 ? ".55" : ".2"}"/>
      <rect x="166" y="${14 + i * 24.8}" width="14" height="10" rx="2" fill="#ffd166" opacity="${i % 2 === 1 ? ".55" : ".2"}"/>`).join("")}
    <rect x="105" y="8" width="30" height="124" fill="#0b0704" stroke="currentColor" stroke-width="1.8" opacity=".8"/>
    <path d="M120 56 V10" stroke="#ffd166" stroke-width="2" stroke-dasharray="3 3"/>
    <rect x="109" y="56" width="22" height="24" rx="4" fill="currentColor" stroke="#ffd166" stroke-width="2"/>
    <circle cx="120" cy="65" r="4" fill="#0b0704"/>
    <circle cx="84" cy="24" r="4.5" fill="#38bdf8"/><rect x="80" y="30" width="8" height="11" rx="3" fill="#38bdf8"/>
    <circle cx="154" cy="99" r="4.5" fill="#f472b6"/><rect x="150" y="105" width="8" height="11" rx="3" fill="#f472b6"/>
    <g transform="translate(214,28)">
      <path d="M-9 -4 a11 11 0 1 1 -3 11" fill="none" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"/>
      <polygon points="-13,3 -14,-5 -6,1" fill="#ffd166"/>
    </g>
  </svg>`,

  // Mundo 4 · fábrica de robots: línea de ensamble cibernética con máquina, engrane y cajas brillantes
  4: `<svg ${MARCO} aria-label="Una máquina de la fábrica con su caja de entrada y su producto terminado">
    <defs>
      <radialGradient id="g-m5" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stop-color="currentColor" stop-opacity=".3"/>
        <stop offset="100%" stop-color="#050b14" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="240" height="140" fill="url(#g-m5)"/>
    <rect x="10" y="104" width="220" height="14" rx="5" fill="#112236" stroke="currentColor" stroke-width="2.2"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${20 + i * 24}" y="109" width="10" height="4" rx="1.5" fill="currentColor" opacity=".55"/>`).join("")}
    <rect x="16" y="72" width="38" height="28" rx="6" fill="#163256" stroke="#72efdd" stroke-width="2.4"/>
    <text x="35" y="90" text-anchor="middle" font-size="11" font-weight="700" font-family="monospace" fill="#e0f2fe">[5,3]</text>
    <rect x="82" y="18" width="76" height="84" rx="13" fill="#0d1e33" stroke="currentColor" stroke-width="2.8"/>
    <rect x="88" y="24" width="64" height="72" rx="9" fill="currentColor" opacity=".1"/>
    <circle cx="120" cy="54" r="17" ${L} stroke-dasharray="6 4"/>
    <circle cx="120" cy="54" r="7" fill="#72efdd"/>
    <text x="120" y="88" text-anchor="middle" font-size="11" font-weight="700" font-family="monospace" fill="#72efdd">def fn(x)</text>
    <rect x="186" y="72" width="38" height="28" rx="6" fill="#103f29" stroke="#22f57a" stroke-width="2.6"/>
    <text x="205" y="90" text-anchor="middle" font-size="13" font-weight="700" font-family="monospace" fill="#86efac">8</text>
    <path d="M58 86 h18 M70 80 l7 6 l-7 6 M164 86 h16 M174 80 l7 6 l-7 6" fill="none" stroke="#72efdd" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  // Mundo 5 · laboratorio de creación: mesa de diseño holográfica con trofeo, consola y cohete
  5: `<svg ${MARCO} aria-label="Plano holográfico con herramientas">
    <defs>
      <radialGradient id="g-m6" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="currentColor" stop-opacity=".32"/>
        <stop offset="100%" stop-color="#120612" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="240" height="140" fill="url(#g-m6)"/>
    <rect x="16" y="12" width="208" height="116" rx="10" fill="#18091a" stroke="currentColor" stroke-width="2" stroke-dasharray="7 5" opacity=".85"/>
    <path d="M16 40 H224 M16 70 H224 M16 100 H224 M65 12 V128 M120 12 V128 M175 12 V128" stroke="currentColor" stroke-width="0.7" opacity=".2"/>
    <rect x="30" y="28" width="84" height="58" rx="8" fill="#260e29" stroke="currentColor" stroke-width="2.4"/>
    <circle cx="42" cy="38" r="2.5" fill="#ff5c7c"/><circle cx="50" cy="38" r="2.5" fill="#ffca3a"/><circle cx="58" cy="38" r="2.5" fill="#22f57a"/>
    <text x="40" y="58" font-size="11" font-weight="700" font-family="monospace" fill="#ff9ebb">if ok:</text>
    <text x="48" y="74" font-size="11" font-weight="700" font-family="monospace" fill="#22f57a">ganar()</text>
    <circle cx="168" cy="58" r="28" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="2.5"/>
    <polygon points="168,38 174,50 187,52 177,61 180,74 168,67 156,74 159,61 149,52 162,50" fill="#ffca3a" stroke="#fff3b0" stroke-width="1.2"/>
    <path d="M114 57 H140" stroke="#ffca3a" stroke-width="2.5" stroke-dasharray="4 3"/>
    <rect x="30" y="96" width="180" height="20" rx="6" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="1.6"/>
    <text x="120" y="110" text-anchor="middle" font-size="10" font-weight="700" font-family="monospace" fill="#ffffff">★ PROYECTO FINAL · PYTHON ★</text>
  </svg>`,
};
