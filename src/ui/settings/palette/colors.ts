export interface IColorSwatch {
  name: string;
  value?: string;
}

const colors = {
  Gruvbox: [
    [
      { value: "#282828", name: "dark0" },
      { value: "#32302f", name: "dark0-soft" },
      { value: "#3c3836", name: "dark1" },
      { value: "#504945", name: "dark2" },
      { value: "#665c54", name: "dark3" },
      { value: "#7c6f64", name: "dark4" },
      { value: "#928374", name: "gray" },
      { value: "#f9f5d7", name: "light0-hard" },
      { value: "#fbf1c7", name: "light0" },
      { value: "#f2e5bc", name: "light0-soft" },
      { value: "#ebdbb2", name: "light1" },
      { value: "#d5c4a1", name: "light2" },
      { value: "#bdae93", name: "light3" },
      { value: "#a89984", name: "light4" },
    ],
    [
      { name: "bright-red", value: "#fb4934" },
      { name: "bright-green", value: "#b8bb26" },
      { name: "bright-yellow", value: "#fabd2f" },
      { name: "bright-blue", value: "#83a598" },
      { name: "bright-purple", value: "#d3869b" },
      { name: "bright-aqua", value: "#8ec07c" },
      { name: "bright-orange", value: "#fe8019" },
    ],
    [
      { name: "neutral-red", value: "#cc241d" },
      { name: "neutral-green", value: "#98971a" },
      { name: "neutral-yellow", value: "#d79921" },
      { name: "neutral-blue", value: "#458588" },
      { name: "neutral-purple", value: "#b16286" },
      { name: "neutral-aqua", value: "#689d6a" },
      { name: "neutral-orange", value: "#d65d0e" },
    ],
    [
      { name: "faded-red", value: "#9d0006" },
      { name: "faded-green", value: "#79740e" },
      { name: "faded-yellow", value: "#b57614" },
      { name: "faded-blue", value: "#076678" },
      { name: "faded-purple", value: "#8f3f71" },
      { name: "faded-aqua", value: "#427b58" },
      { name: "faded-orange", value: "#af3a03" },
    ],
  ],
  Nord: [
    [
      { value: "#2e3440", name: "Gunmetal" },
      { value: "#3b4252", name: "Bright Gray" },
      { value: "#434c5e", name: "River Bed" },
      { value: "#4c566a", name: "Easy Bay" },
      { value: "#d8dee9", name: "Hawkes Blue" },
      { value: "#e5e9f0", name: "Mystic" },
      { value: "#eceff4", name: "Athens Gray" },
    ],
    [
      { value: "#bf616a", name: "Contessa" },
      { value: "#d08770", name: "Feldspar" },
      { value: "#ebcb8b", name: "Putty" },
      { value: "#a3be8c", name: "Norway" },
      { value: "#b48ead", name: "London Hue" },
    ],
    [
      { value: "#8fbcbb", name: "Shadow Green" },
      { value: "#88c0d0", name: "Half Baked" },
      { value: "#81a1c1", name: "Dark Pastel Blue" },
      { value: "#5e81ac", name: "Air Force Blue" },
    ],
    [
      { value: "#292e39", name: "Black Rock" },
      { value: "#abb9cf", name: "Casper" },
    ],
  ],
  Default: [
    [
      { value: "#197300", name: "Japanese Laurel" },
      { value: "#483699", name: "Blue Gem" },
      { value: "#7f6df2", name: "Medium Slate Blue" },
      { value: "#990000", name: "Ou Crimson Red" },
      { value: "#2a2a2a", name: "Jaguar" },
      { value: "#303030", name: "Code Gray" },
      { value: "#333333", name: "Mineshaft" },
      { value: "#4d3ca6", name: "Gigas" },
      { value: "#666666", name: "Steel" },
      { value: "#999999", name: "Aluminium" },
      { value: "#DCDDDE", name: "Athens Gray" },
      { value: "#FF3333", name: "Red Orange" },
      { value: "#FF999040", name: "Mona Lisa 40%" },
      { value: "#FFFF0040", name: "Yellow 40%" },
    ],
  ],
  Minimal: [
    [
      { value: "#ffffff", name: "White" },
      { value: "#d4d4d4", name: "Light Gray" },
      { value: "#556b77", name: "Dark Electric Blue" },
      { value: "#5c5c5c", name: "Chicago" },
      { value: "#414141", name: "Charcoal" },
      { value: "#1d1d1d", name: "Dark Jungle Green" },
    ],
    [{ value: "#fc3233", name: "Red Orange" }],
  ],
  "Clair de Lune": [
    [
      { name: "background-secondary", value: "#1e2030" },
      { name: "background-tag", value: "#131421" },
      { name: "background-quick", value: "#191a2a" },
    ],
    [
      { name: "interactive-hover", value: "#2f334d" },
      { name: "interactive-accent", value: "#444a73" },
      { name: "interactive-accent-hover", value: "#828bb8" },
      { name: "text-accent", value: "#50c4fa" },
      { name: "text-muted", value: "#a9b8e8" },
      { name: "text-normal", value: "#c8d3f5" },
      { name: "text-on-accent", value: "#e2e8fa" },
      { name: "text-tag", value: "#7a88cf" },
      { name: "text-error", value: "#ff98a4" },
    ],
  ],
};

export function getPaletteNames(): string[] {
  return Object.keys(colors);
}

export function getPaletteName(themeName: string): string {
  const palette = colors[themeName];
  // Exact match
  if (palette) {
    return themeName;
  }

  // Partial matches
  if (themeName.toLowerCase().contains("gruvbox")) {
    return "Gruvbox";
  }
  if (
    themeName.toLowerCase().contains("nord") ||
    themeName.toLowerCase().contains("stormcloak")
  ) {
    return "Nord";
  }
  return "Default";
}

export default function getColors(paletteName: string): IColorSwatch[][] {
  return colors[paletteName];
}
