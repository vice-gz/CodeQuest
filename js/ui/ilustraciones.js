// ilustraciones.js
// Miniaturas de cada mundo para el mapa. Son SVG propios (sin imágenes
// externas) con composiciones distintas por mundo —no solo otro color— y el
// mismo estilo de línea que los escenarios del juego. Usan `currentColor`
// como acento del mundo.

const MARCO = 'viewBox="0 0 240 140" role="img" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"';
const L = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

function robot(x, y, r = 11) {
  return `<g transform="translate(${x},${y})"><rect x="${-r}" y="${-r * 0.85}" width="${r * 2}" height="${r * 1.7}" rx="${r * 0.4}" fill="currentColor"/>
    <circle cx="${-r * 0.38}" cy="${-r * 0.1}" r="${r * 0.2}" fill="#0f1424"/><circle cx="${r * 0.38}" cy="${-r * 0.1}" r="${r * 0.2}" fill="#0f1424"/>
    <path d="M0 ${-r * 0.85} v${-r * 0.35}" stroke="currentColor" stroke-width="2.5"/><circle cy="${-r * 1.25}" r="${r * 0.14}" fill="#ffb84d"/></g>`;
}

export const ILUSTRACIONES = {
  // Mundo 1 · laboratorio: cuadrícula, obstáculos, meta y Robot1
  1: `<svg ${MARCO} aria-label="Laboratorio con una cuadrícula y Robot1">
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${20 + i * 40} 14 V126" ${L} opacity=".25"/>`).join("")}
    ${[0, 1, 2, 3].map((i) => `<path d="M20 ${14 + i * 37} H220" ${L} opacity=".25"/>`).join("")}
    <rect x="100" y="51" width="40" height="37" fill="currentColor" opacity=".25"/><rect x="140" y="88" width="40" height="38" fill="currentColor" opacity=".25"/>
    ${robot(60, 70)}
    <path d="M196 30 v34 M196 30 l22 9 l-22 9" ${L}/>
  </svg>`,
  // Mundo 2 · archivo digital: chips y conexiones
  2: `<svg ${MARCO} aria-label="Módulos de memoria conectados">
    ${[[24, 22], [96, 22], [168, 22], [24, 82], [96, 82], [168, 82]]
      .map(
        ([x, y], i) => `<rect x="${x}" y="${y}" width="48" height="36" rx="7" ${L} ${i === 4 ? "" : 'opacity=".55"'}/>
        <path d="M${x + 10} ${y - 5} v5 M${x + 24} ${y - 5} v5 M${x + 38} ${y - 5} v5" ${L} stroke-width="2" opacity=".6"/>
        <text x="${x + 24}" y="${y + 23}" text-anchor="middle" font-size="14" font-weight="700" font-family="monospace" fill="currentColor">${["x", "y", "z", "5", "10", "Ana"][i]}</text>`
      )
      .join("")}
    <path d="M72 40 H96 M144 40 H168 M48 58 V82 M120 58 V82" ${L} stroke-dasharray="4 6"/>
  </svg>`,
  // Mundo 3 · sala de estrategia: cartas en abanico y símbolo lógico
  3: `<svg ${MARCO} aria-label="Cartas holográficas sobre una mesa">
    <ellipse cx="120" cy="112" rx="104" ry="20" ${L} opacity=".35"/>
    ${[-18, 0, 18]
      .map(
        (a, i) => `<g transform="translate(120,96) rotate(${a}) translate(-24,-82)"><rect width="48" height="68" rx="7" fill="#0b0b12" ${L}/>
        <text x="9" y="18" font-size="14" font-weight="700" fill="currentColor">${["10", "A", "K"][i]}</text>
        <text x="24" y="46" text-anchor="middle" font-size="26" fill="currentColor">${["♥", "♠", "♦"][i]}</text></g>`
      )
      .join("")}
    <g transform="translate(206,30)"><circle r="18" ${L}/><path d="M-8 1 l6 6 l11 -13" ${L}/></g>
    <g transform="translate(34,30)"><circle r="18" ${L} opacity=".6"/><path d="M-7 -7 l14 14 M7 -7 l-14 14" ${L} opacity=".6"/></g>
  </svg>`,
  // Mundo 4 · complejo industrial: edificio de pisos con elevador
  4: `<svg ${MARCO} aria-label="Edificio de cinco pisos con un elevador">
    <rect x="52" y="10" width="136" height="122" rx="8" ${L}/>
    ${[1, 2, 3, 4].map((i) => `<path d="M52 ${10 + i * 24.4} H188" ${L} opacity=".4"/>`).join("")}
    <rect x="108" y="10" width="24" height="122" ${L} opacity=".35"/>
    <rect x="111" y="60" width="18" height="21" rx="3" fill="currentColor"/>
    <path d="M120 60 V10" ${L} stroke-width="1.5" opacity=".5"/>
    <circle cx="76" cy="31" r="5" fill="currentColor"/><path d="M76 38 v12" ${L} stroke-width="3"/>
    <circle cx="160" cy="105" r="5" fill="currentColor"/><path d="M160 112 v12" ${L} stroke-width="3"/>
    <path d="M214 90 v36 M205 118 l9 9 l9 -9" ${L}/>
  </svg>`,
  // Mundo 5 · taller de diagnóstico: terminal con un bicho y llave
  5: `<svg ${MARCO} aria-label="Terminal con un error y una herramienta">
    <rect x="22" y="14" width="150" height="104" rx="9" ${L}/><path d="M22 36 H172" ${L}/>
    <circle cx="36" cy="25" r="3" fill="currentColor"/><circle cx="48" cy="25" r="3" fill="currentColor"/>
    <path d="M38 56 l12 8 l-12 8 M58 74 h26" ${L}/>
    <path d="M38 94 h40" ${L} opacity=".45"/>
    <g transform="translate(128,88)"><ellipse rx="12" ry="9" ${L}/><path d="M-12 -2 l-8 -6 M12 -2 l8 -6 M-12 5 l-8 5 M12 5 l8 5 M-5 -9 l-4 -7 M5 -9 l4 -7" ${L} stroke-width="2.5"/></g>
    <g transform="translate(198,86) rotate(-35)"><path d="M0 -42 v70" ${L} stroke-width="5"/><circle cy="-46" r="11" ${L}/></g>
  </svg>`,
  // Mundo 6 · laboratorio de creación: plano con regla y compás
  6: `<svg ${MARCO} aria-label="Plano holográfico con herramientas">
    <rect x="18" y="14" width="204" height="112" rx="6" ${L} stroke-dasharray="6 5" opacity=".6"/>
    <rect x="46" y="38" width="62" height="46" rx="4" ${L}/><circle cx="160" cy="62" r="26" ${L}/>
    <path d="M108 61 H134 M46 98 H108 M160 88 V108 M148 108 H172" ${L} opacity=".6"/>
    <path d="M30 118 L50 118 M36 112 v12 M44 114 v8" ${L} stroke-width="2"/>
    <path d="M196 30 l14 22 l-14 -6 l-14 6 z" ${L}/>
  </svg>`,
};
