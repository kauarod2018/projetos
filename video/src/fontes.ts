import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Fonte de título das legendas e letreiros. Fica dentro do projeto para renderizar sem internet. */
export const FONTE_TITULO = "Anton";

loadFont({ family: FONTE_TITULO, url: staticFile("fonts/Anton-Regular.woff2"), weight: "400" });
