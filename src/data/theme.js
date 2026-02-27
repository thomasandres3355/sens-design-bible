// ─── Dark Theme (default) ───
const darkTheme = {
  bg0:"#1A1A1A",bg1:"#222222",bg2:"#2A2A2A",bg3:"#333333",bg4:"#3C3C3C",
  border:"#3A3A3A",borderLight:"#4A4A4A",
  text:"#F0EDE8",textMid:"#A89F94",textDim:"#6B635B",
  accent:"#C4753B",accentLight:"#D4945F",accentDim:"#C4753B20",accentBg:"#C4753B10",
  warn:"#D4945F",warnDim:"#D4945F20",
  danger:"#C44B3B",dangerDim:"#C44B3B20",
  blue:"#5B8FB9",blueDim:"#5B8FB920",
  green:"#6B9B6B",greenDim:"#6B9B6B20",
  purple:"#9B7EC8",purpleDim:"#9B7EC820",
  teal:"#5BA89F",tealDim:"#5BA89F20",
};

// ─── Light Theme (warm sand/tan — inspired by SystemicENVS.com) ───
const lightTheme = {
  bg0:"#E3DFD0",bg1:"#D9D4C4",bg2:"#EDE9DD",bg3:"#CCC7B7",bg4:"#C4BFB0",
  border:"#C8C1AE",borderLight:"#D4CEBC",
  text:"#2A2520",textMid:"#5C554C",textDim:"#8A8278",
  accent:"#B0652F",accentLight:"#C4753B",accentDim:"#B0652F20",accentBg:"#B0652F10",
  warn:"#B87F3A",warnDim:"#B87F3A20",
  danger:"#B53D2E",dangerDim:"#B53D2E20",
  blue:"#3D7AA6",blueDim:"#3D7AA620",
  green:"#4E8A4E",greenDim:"#4E8A4E20",
  purple:"#7A5FB0",purpleDim:"#7A5FB020",
  teal:"#3F8F86",tealDim:"#3F8F8620",
};

// ─── Mutable theme object — all components import this ───
export const T = { ...darkTheme };

// ─── Apply a theme by copying its values into T ───
export function applyTheme(mode) {
  const source = mode === "light" ? lightTheme : darkTheme;
  Object.assign(T, source);
}

export { darkTheme, lightTheme };
