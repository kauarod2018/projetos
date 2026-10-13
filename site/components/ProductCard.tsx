import { fillText, type NicheView } from '../data.ts';
import { Icon } from './Icon.tsx';

interface Labels {
  cardSpecs: string;
  cardPacks: string;
  cardDelivery: string;
  cardCta: string;
}

/** One product on a shop shelf: cover, country, name, what's inside and the price range. */
export function ProductCard({ v, labels }: { v: NicheView; labels: Labels }) {
  const cover = v.gallery.find((g) => g.kind === 'product') ?? v.gallery[0];
  return (
    <a className="pcard" href={`/${v.id}/`}>
      <div className="pcard-media">
        {cover ? <img src={cover.srcSmall} alt={cover.alt} width={600} height={750} loading="lazy" decoding="async" /> : null}
        {v.store.badge ? <span className="pcard-badge">{v.store.badge}</span> : null}
      </div>
      <div className="pcard-body">
        <p className="pcard-meta">
          <img src={v.country.flag} alt="" width={18} height={13} />
          {v.country.name} · {v.store.category}
        </p>
        <h3>{v.store.productName}</h3>
        <p className="pcard-specs">{fillText(labels.cardSpecs, { maps: v.counts.totalMaps, bonuses: v.counts.bonuses }, 'ui.home.cardSpecs')}</p>
        <p className="pcard-price">
          <strong>{v.prices.basic}</strong>
          <span>–</span>
          <strong>{v.prices.complete}</strong>
          <small>{fillText(labels.cardPacks, { n: 2 }, 'ui.home.cardPacks')}</small>
        </p>
        <p className="pcard-foot">
          <span className="pcard-delivery">
            <Icon name="download" size={15} stroke={2.4} />
            {labels.cardDelivery}
          </span>
          <span className="pcard-cta">
            {labels.cardCta}
            <Icon name="arrow-right" size={15} stroke={2.4} />
          </span>
        </p>
      </div>
    </a>
  );
}
