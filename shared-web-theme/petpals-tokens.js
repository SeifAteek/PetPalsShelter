/** Exact PetPals classic palette — keep in sync with iOS `PetPalsPalette.swift` */

export const PP = {
  honeydew: '#FAF8F2',    /* Milk cream — light theme base */
  powderBlush: '#F2A4A5',
  almondCream: '#E5D4C5',
  richCerulean: '#3078A4',
  navy: '#090087',
  navyDark: '#010A2E',
  orange: '#EC5E27',      /* Primary brand orange */
  orangeLight: '#F47A4A', /* Lighter orange for gradients */
  orangePale: '#FDE8DC',  /* Pale orange tint for orbs */
  graphite: '#403D39',      /* Dark theme base */
  graphiteDark: '#302E2B',  /* Darkest graphite */
  graphiteLight: '#4A4743', /* Card/panel graphite */
};

function blendHex(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar * (1 - t) + br * t);
  const g = Math.round(ag * (1 - t) + bg * t);
  const bVal = Math.round(ab * (1 - t) + bb * t);
  return `#${[r, g, bVal].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** iOS `darkBackgroundGradient` stops — deep graphite base with orange warmth */
export const darkBgGradient = `linear-gradient(180deg,
  #0E0D0C 0%,
  #1A1816 30%,
  #1F1D1A 60%,
  #2A2420 85%,
  #322418 100%)`;

/** iOS `meshGradientStops` for conic mesh */
export const meshConicStops = [
  blendHex(PP.powderBlush, PP.richCerulean, 0.35),
  'rgba(242, 164, 165, 0.9)',
  PP.honeydew,
  PP.almondCream,
  'rgba(9, 0, 135, 0.92)',
  'rgba(48, 120, 164, 0.75)',
  blendHex(PP.powderBlush, PP.honeydew, 0.5),
].join(', ');

/** iOS `meshOrbs` — size, blur, offset (from center), colors */
export const meshOrbs = [
  {
    color: PP.orange,
    size: 340,
    blur: 100,
    ox: -130,
    oy: -200,
    lightOpacity: 0.22,
    darkOpacity: 0.28,
  },
  {
    color: PP.orangeLight,
    size: 300,
    blur: 88,
    ox: 160,
    oy: -90,
    lightOpacity: 0.18,
    darkOpacity: 0.22,
  },
  {
    color: PP.orangePale,
    size: 420,
    blur: 110,
    ox: 20,
    oy: 60,
    lightOpacity: 0.45,
    darkOpacity: 0.15,
  },
  {
    color: blendHex(PP.almondCream, PP.orange, 0.3),
    size: 320,
    blur: 90,
    ox: -110,
    oy: 340,
    lightOpacity: 0.28,
    darkOpacity: 0.35,
  },
  {
    color: PP.orange,
    size: 260,
    blur: 72,
    ox: 130,
    oy: 310,
    lightOpacity: 0.15,
    darkOpacity: 0.3,
  },
];
