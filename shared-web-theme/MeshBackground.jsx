import React from 'react';
import { useTheme } from './ThemeProvider.jsx';
import { darkBgGradient, meshConicStops, meshOrbs, PP } from './petpals-tokens.js';

/**
 * Pixel-match of iOS `PetPalsAmbientBackground`:
 * - Dark: ONLY `darkBackgroundGradient` (no orbs, no mesh sweep)
 * - Light: honeydew base + meshGradient + overlay + 5 orbs + bottom vignette
 */
export default function MeshBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (isDark) {
    return (
      <div
        className="pp-mesh pp-mesh--dark"
        aria-hidden
        style={{ background: darkBgGradient }}
      />
    );
  }

  return (
    <div className="pp-mesh pp-mesh--light" aria-hidden>
      <div className="pp-mesh-base" style={{ backgroundColor: PP.honeydew }} />
      <div
        className="pp-mesh-conic"
        style={{
          background: `conic-gradient(from -45deg at 50% 45%, ${meshConicStops})`,
        }}
      />
      <div
        className="pp-mesh-wash"
        style={{
          background: `linear-gradient(135deg,
            rgba(236, 94, 39, 0.12) 0%,
            rgba(250, 248, 242, 0.60) 45%,
            rgba(244, 122, 74, 0.08) 100%)`,
        }}
      />
      {meshOrbs.map((orb, i) => (
        <div
          key={i}
          className="pp-mesh-orb"
          style={{
            width: orb.size,
            height: orb.size,
            left: `calc(50% + ${orb.ox}px)`,
            top: `calc(50% + ${orb.oy}px)`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: orb.color,
            opacity: orb.lightOpacity,
            filter: `blur(${orb.blur}px)`,
          }}
        />
      ))}
      <div
        className="pp-mesh-vignette"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(236, 94, 39, 0.04) 100%)`,
        }}
      />
    </div>
  );
}
