import { useState } from 'react';
import { parsePlaceholder } from '../../lib/garmentStyle.js';
import GarmentArt from './GarmentArt.jsx';

/**
 * A product image. Real photos are shown as they are; the seed catalogue's placehold.co
 * placeholders (and any image that fails to load) become a drawn flat-lay illustration in
 * the right colour, so the shop looks finished before real photos are added.
 *
 *   src        image URL (photo or placeholder)
 *   alt        alt text
 *   name/type  product name and type, when known (placeholders carry the name themselves)
 *   hex        colour for the illustration when the photo fails and it isn't a placeholder
 */
export default function ProductImage({ src, alt, name, type, hex, className = '', loading = 'lazy' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const placeholder = parsePlaceholder(src);

  if (placeholder || !src || failedSrc === src) {
    return (
      <GarmentArt
        name={placeholder?.name || name || alt}
        type={type}
        hex={placeholder?.hex ?? hex ?? '#CFC7BB'}
        title={alt}
        className={className}
      />
    );
  }
  return <img src={src} alt={alt} loading={loading} onError={() => setFailedSrc(src)} className={`object-cover ${className}`} />;
}
