// GENERATED from tokens.json — ne pas éditer à la main (npm run tokens)
export const tokens = {
  "color": {
    "abysses": "#0B0F22",
    "abyssesDeep": "#080B1A",
    "ink": "#14161F",
    "os": "#F3EFE7",
    "paper": "#F5F2EC",
    "opale": "#7DA2FF",
    "opaleDeep": "#5570D6",
    "jade": "#2FCC92",
    "ambre": "#F0A02E",
    "corail": "#FF6B57",
    "cyan": "#4FD8FF",
    "violet": "#8A7CFF",
    "magenta": "#FF5FA2",
    "orange": "#FF9F4A",
    "white": "#FFFFFF",
    "textOnDark": "#F4F5FA",
    "textOnDarkDim": "rgba(244,245,250,0.62)",
    "textOnLight": "#14161F",
    "textOnLightDim": "rgba(20,22,31,0.6)"
  },
  "glass": {
    "thin": {
      "tintDark": 0.18,
      "tintLight": 0.55,
      "blur": 24,
      "saturate": 1.7
    },
    "regular": {
      "tintDark": 0.38,
      "tintLight": 0.62,
      "blur": 32,
      "saturate": 1.6
    },
    "thick": {
      "tintDark": 0.6,
      "tintLight": 0.78,
      "blur": 48,
      "saturate": 1.4
    }
  },
  "radius": {
    "icon": 16,
    "widget": 26,
    "notification": 28,
    "dock": 34,
    "ccModule": 22,
    "ccCard": 30,
    "button": 18,
    "sheet": 40,
    "squircleN": 4.6
  },
  "space": {
    "unit": 4,
    "pageInset": 22,
    "cardGap": 10,
    "gridGap": 22
  },
  "spring": {
    "snappy": {
      "k": 170,
      "d": 18
    },
    "soft": {
      "k": 120,
      "d": 14
    },
    "bounce": {
      "k": 140,
      "d": 8
    },
    "sheet": {
      "k": 150,
      "d": 19
    }
  },
  "duration": {
    "micro": 0.15,
    "transition": 0.34,
    "sheet": 0.38,
    "max": 0.6,
    "cascadeStep": 0.035,
    "rubber": 0.55
  },
  "type": {
    "clock": 104,
    "title": 34,
    "cardTitle": 20,
    "body": 17,
    "bodySmall": 15,
    "caption": 13,
    "label": 11,
    "minScale": 0.85,
    "maxScale": 1.6
  },
  "screen": {
    "w": 393,
    "h": 852,
    "edgeTop": 62,
    "edgeBottom": 34,
    "homebarW": 140,
    "homebarH": 5
  }
} as const;
export type Tokens = typeof tokens;
