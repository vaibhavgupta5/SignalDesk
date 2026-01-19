import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  accentColor: string;

  setAccentColor: (color: string) => void;
  applyAccentColor: (color: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      accentColor: "#7C3AED",

      setAccentColor: (color) => {
        set({ accentColor: color });
        applyTheme(color);
      },

      applyAccentColor: (color) => {
        set({ accentColor: color });
        applyTheme(color);
      },
    }),
    {
      name: "ui-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.accentColor);
        }
      },
    },
  ),
);

function applyTheme(color: string) {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--accent-color", color);

    const hsl = hexToHSL(color);
    const darkerHSL = `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 10, 0)}%)`;
    const lighterHSL = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.1)`;

    document.documentElement.style.setProperty("--accent-hover", darkerHSL);
    document.documentElement.style.setProperty("--accent-light", lighterHSL);
  }
}

function hexToHSL(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
