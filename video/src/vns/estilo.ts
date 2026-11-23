import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Fontes do modelo v3 (todas locais, licença OFL). */
export const F = {
  titulo: "Anton", // legendas, números, pílulas
  cartela: "Cinzel", // cartela de abertura com extrusão
  bilhete: "Caveat", // bilhete de papel escrito à mão
} as const;

loadFont({ family: F.titulo, url: staticFile("fonts/Anton-Regular.woff2"), weight: "400" });
loadFont({ family: F.cartela, url: staticFile("fonts/Cinzel.woff2"), weight: "900" });
loadFont({ family: F.bilhete, url: staticFile("fonts/Caveat.woff2"), weight: "700" });

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const COR = {
  creme: "#F3E6C8",
  escuro: "#16131C",
  vermelho: "#E0312B",
  amarelo: "#FFD23F",
  pele: "#1E1B26", // boneco: silhueta escura
} as const;

/** Mistura duas cores hex (t = 0 → a, t = 1 → b). */
export const misturar = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const canal = (shift: number) => {
    const ca = (pa >> shift) & 255;
    const cb = (pb >> shift) & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  return `#${((canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).padStart(6, "0")}`;
};

/** Roteiro de cor: uma paleta por momento do dia/emoção. */
export type Paleta = {
  ceuTopo: string;
  ceuMeio: string;
  horizonte: string;
  sol: string;
  longe: string; // morros distantes
  meio: string; // linha de árvores
  perto: string; // folhagem da frente
  chao: string;
  nevoa: string;
  luz: string; // luz de recorte no boneco
};

export const PALETAS: Record<string, Paleta> = {
  porDoSol: {
    ceuTopo: "#2B1846", ceuMeio: "#B8436A", horizonte: "#FFB25B", sol: "#FFE2A0",
    longe: "#7A3A5E", meio: "#3A1C34", perto: "#170C18", chao: "#3A2117", nevoa: "#FF9E6B", luz: "#FFC27A",
  },
  amanhecer: {
    ceuTopo: "#3C4A7A", ceuMeio: "#C98A8A", horizonte: "#FFD7A0", sol: "#FFF1C9",
    longe: "#8C7F9C", meio: "#2F3B3A", perto: "#121A17", chao: "#4A3524", nevoa: "#F4D9C4", luz: "#FFD9A0",
  },
  meioDia: {
    ceuTopo: "#3E8FC4", ceuMeio: "#9FD3E0", horizonte: "#FFF2C2", sol: "#FFFFFF",
    longe: "#7FA88A", meio: "#2E5A33", perto: "#132A16", chao: "#7A5232", nevoa: "#FFF6D6", luz: "#FFF3C4",
  },
  mata: {
    ceuTopo: "#16302A", ceuMeio: "#2F5B44", horizonte: "#A8C98A", sol: "#E8F5C0",
    longe: "#3E6B52", meio: "#1C3A2A", perto: "#0B1A12", chao: "#2C2418", nevoa: "#9FC7A0", luz: "#D8F0A8",
  },
  noite: {
    ceuTopo: "#070B1E", ceuMeio: "#14224A", horizonte: "#2F4A7A", sol: "#DCE6FF",
    longe: "#1C2A4E", meio: "#0E1630", perto: "#060A16", chao: "#141A2A", nevoa: "#5A74A8", luz: "#9DB8FF",
  },
  doenca: {
    ceuTopo: "#2A2E22", ceuMeio: "#6B6A4A", horizonte: "#C9C08A", sol: "#F1EBC4",
    longe: "#6E6E54", meio: "#34372A", perto: "#17190F", chao: "#4A4230", nevoa: "#D9D2A8", luz: "#EDE3B0",
  },
};
