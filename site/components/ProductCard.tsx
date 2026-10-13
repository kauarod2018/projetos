import { fillText, type NicheView } from '../data.ts';
import { Icon } from './Icon.tsx';

interface Labels {
  cardFrom: string;
  cardCta: string;
  cardSpecs: string;
}

/** One product in the shop grid: the pack cover, what it is, the price and a link to the product page. */
export function ProductCard({ v, labels }: { v: NicheView; labels: Labels }) {
  const cover = v.gallery[0];
  return (
    <a className="product-card" href={`/${v.id}/`}>
      <div className="product-media">
        {cover ? <img src={cover.srcSmall} alt={cover.alt} width={600} height={848} loading="lazy" decoding="async" /> : null}
      </div>
      <div className="product-body">
        <p className="product-cat">{v.store.category}</p>
        <h3>{v.store.productName}</h3>
        <p className="product-text">{v.store.cardText}</p>
        <p className="product-specs">
          {fillText(labels.cardSpecs, { maps: v.counts.totalMaps, bonuses: v.counts.bonuses }, 'ui.home.cardSpecs')} · {v.store.format}
        </p>
        <div className="product-foot">
          <span className="product-price">{fillText(labels.cardFrom, { price: v.prices.basic }, 'ui.home.cardFrom')}</span>
          <span className="btn btn-primary btn-sm">
            {labels.cardCta} <Icon name="arrow-right" size={16} stroke={2.4} />
          </span>
        </div>
      </div>
    </a>
  );
}
