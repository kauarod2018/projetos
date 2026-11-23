import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  readonly legendas: Caption[];
  /** Junta palavras numa mesma "página" de legenda enquanto couberem nesse tempo. */
  readonly msPorPagina?: number;
  readonly fundo?: number;
  readonly tamanho?: number;
};

type Pagina = { startMs: number; tokens: { text: string; fromMs: number; toMs: number }[] };

/**
 * Agrupa as palavras em "páginas" curtas. Sempre quebra no fim de uma frase (. ? !),
 * quebra na vírgula se a página já estiver longa, e nunca passa de `msPorPagina`.
 */
export const paginar = (legendas: Caption[], msPorPagina: number): Pagina[] => {
  const paginas: Pagina[] = [];
  let atual: Pagina | null = null;
  for (const c of legendas) {
    if (!atual || c.endMs - atual.startMs > msPorPagina) {
      // Não deixa palavra curta ("a", "de", "um") sozinha no fim da página: ela desce junto.
      const tokensAnteriores: Pagina["tokens"] = atual ? atual.tokens : [];
      const ultima = tokensAnteriores[tokensAnteriores.length - 1];
      const levar = ultima && tokensAnteriores.length > 1 && ultima.text.trim().length <= 3 ? tokensAnteriores.pop() : undefined;
      const nova: Pagina = levar
        ? { startMs: levar.fromMs, tokens: [{ ...levar, text: levar.text.trimStart() }] }
        : { startMs: c.startMs, tokens: [] };
      atual = nova;
      paginas.push(nova);
    }
    atual.tokens.push({ text: atual.tokens.length ? c.text : c.text.trimStart(), fromMs: c.startMs, toMs: c.endMs });
    const fim = c.text.trimEnd();
    const longa = c.endMs - atual.startMs > msPorPagina * 0.6;
    if (/[.?!]$/.test(fim) || (longa && /,$/.test(fim))) atual = null;
  }
  return paginas;
};

/** Legenda palavra por palavra: a palavra falada no momento fica amarela e cresce. */
export const Legendas: React.FC<Props> = ({ legendas, msPorPagina = 1600, fundo = 360, tamanho = 96 }) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(() => paginar(legendas, msPorPagina), [legendas, msPorPagina]);

  return (
    <AbsoluteFill>
      {pages.map((pagina, i) => {
        const ultimaPalavra = pagina.tokens[pagina.tokens.length - 1].toMs;
        // Fica na tela até a próxima página, mas some se houver um silêncio longo depois.
        const proxima = Math.min(pages[i + 1]?.startMs ?? Infinity, ultimaPalavra + 700);
        const de = Math.round((pagina.startMs / 1000) * fps);
        const ate = Math.round((proxima / 1000) * fps);
        if (ate <= de) return null;
        return (
          <Sequence key={pagina.startMs} name={`Legenda ${i + 1}`} from={de} durationInFrames={ate - de}>
            <PaginaLegenda tokens={pagina.tokens} inicioMs={pagina.startMs} fundo={fundo} tamanho={tamanho} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const PaginaLegenda: React.FC<{
  tokens: { text: string; fromMs: number; toMs: number }[];
  inicioMs: number;
  fundo: number;
  tamanho: number;
}> = ({ tokens, inicioMs, fundo, tamanho }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const agoraMs = inicioMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: fundo }}>
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: tamanho,
          lineHeight: 1.1,
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "14px black",
          paintOrder: "stroke fill",
          textShadow: "0 10px 0 rgba(0,0,0,0.55)",
        }}
      >
        {tokens.map((t) => {
          const ativa = agoraMs >= t.fromMs && agoraMs < t.toMs;
          return (
            <span
              key={t.fromMs}
              style={{
                color: ativa ? "#FFD60A" : "white",
                display: "inline-block",
                whiteSpace: "pre",
                scale: ativa ? "1.12" : "1",
              }}
            >
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
