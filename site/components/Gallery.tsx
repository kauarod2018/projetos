'use client';

import { useCallback, useEffect, useState } from 'react';

export interface GalleryImage {
  src: string;
  srcSmall: string;
  alt: string;
  label: string;
}

interface Props {
  images: GalleryImage[];
  sampleLabel: string;
  zoomHint: string;
  labels: { close: string; prev: string; next: string };
  /** lucide SVG markup rendered on the server (client components can't read the icon files) */
  icons: { zoom: string; prev: string; next: string; close: string };
}

const Svg = ({ html }: { html: string }) => <span className="icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;

/** Product gallery: big page, thumbnails underneath, full-screen viewer with arrows and Esc. */
export function Gallery({ images, sampleLabel, zoomHint, labels, icons }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const go = useCallback((step: number) => setActive((i) => (i + step + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, go]);

  const current = images[active];
  if (!current) return null;
  return (
    <div className="gallery">
      <button type="button" className="gallery-main" onClick={() => setOpen(true)} aria-label={`${current.alt}. ${zoomHint}`}>
        <img src={current.src} srcSet={`${current.srcSmall} 600w, ${current.src} 1200w`} sizes="(max-width: 900px) 92vw, 560px" alt={current.alt} width={794} height={1123} />
        <span className="gallery-tag">{current.label}</span>
        <span className="gallery-zoom">
          <Svg html={icons.zoom} />
          {zoomHint}
        </span>
      </button>
      <ul className="gallery-thumbs" aria-label={sampleLabel}>
        {images.map((im, i) => (
          <li key={im.src}>
            <button type="button" className={i === active ? 'is-active' : undefined} onClick={() => setActive(i)} aria-label={im.alt} aria-current={i === active}>
              <img src={im.srcSmall} alt="" width={120} height={170} loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      {open ? (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={current.alt} onClick={() => setOpen(false)}>
          <img src={current.src} alt={current.alt} onClick={(e) => e.stopPropagation()} />
          <p className="viewer-caption" onClick={(e) => e.stopPropagation()}>
            {current.label} · {sampleLabel} · {active + 1}/{images.length}
          </p>
          <button type="button" className="viewer-btn viewer-close" onClick={() => setOpen(false)} aria-label={labels.close}>
            <Svg html={icons.close} />
          </button>
          <button type="button" className="viewer-btn viewer-prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label={labels.prev}>
            <Svg html={icons.prev} />
          </button>
          <button type="button" className="viewer-btn viewer-next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label={labels.next}>
            <Svg html={icons.next} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
