import { useEffect, useRef, useState } from 'react';
import { tryOnProduct } from '../../api/products.js';
import { messageAt, useElapsedSeconds } from '../../hooks/useElapsedSeconds.js';
import { useObjectUrl } from '../../hooks/useObjectUrl.js';
import PhotoPicker from '../fit/PhotoPicker.jsx';
import PrivacyNotice from '../fit/PrivacyNotice.jsx';
import ScanOverlay from '../fit/ScanOverlay.jsx';
import Modal from '../ui/Modal.jsx';

// Friendly messages while the try-on runs (it can take up to a minute)
const PROGRESS_MESSAGES = [
  [0, 'Uploading your photo…'],
  [3, 'Finding your pose…'],
  [8, 'Laying out the fabric…'],
  [16, 'Fitting the garment to your body…'],
  [26, 'Matching the lighting…'],
  [38, 'Adding the finishing touches…'],
  [50, 'Almost there, thanks for waiting…'],
  [75, 'This one is taking a little longer than usual…'],
];
const EXPECTED_SECONDS = 45; // for the progress bar; the real time varies

// initialPhoto: optional File to start with (e.g. a snapshot from the live fitting room)
export default function TryOnModal({ product, color, onClose, initialPhoto = null }) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);
  const photoUrl = useObjectUrl(photo);
  const elapsed = useElapsedSeconds(status === 'running');

  // Closing the modal cancels a running request (the photo is dropped either way)
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function start() {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('running');
    setError(null);
    try {
      const data = await tryOnProduct(product._id, { photo, color: color?.name, signal: controller.signal });
      setResult(data);
      setStatus('done');
    } catch (err) {
      if (err.errorCode === 'CANCELED') return;
      setError(err.userMessage);
      setStatus('error');
    }
  }

  const message = messageAt(PROGRESS_MESSAGES, elapsed);
  const progress = Math.min(95, Math.round((elapsed / EXPECTED_SECONDS) * 100));

  return (
    <Modal title={`Try on: ${product.name}${color ? ` (${color.name})` : ''}`} onClose={onClose} size="max-w-3xl">
      {status === 'done' && result ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <figure className="animate-rise">
              <img src={photoUrl} alt="Your photo" className="aspect-[3/4] w-full rounded-2xl bg-bone object-cover" />
              <figcaption className="mt-2 text-center text-[11px] font-semibold tracking-[0.16em] text-gray-500 uppercase">
                Your photo
              </figcaption>
            </figure>
            <figure className="animate-rise" style={{ animationDelay: '180ms' }}>
              <img
                src={result.resultImage}
                alt={`You wearing ${product.name}`}
                className="aspect-[3/4] w-full rounded-2xl bg-bone object-cover"
              />
              <figcaption className="mt-2 text-center text-[11px] font-semibold tracking-[0.16em] text-gray-500 uppercase">
                With {product.name}
              </figcaption>
            </figure>
          </div>
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="font-semibold">This shows the look, not the exact fit.</strong> Check the size recommendation
            for fit.
          </p>
          {result.provider === 'mock' && (
            <p className="text-xs text-gray-500">Demo mode: the try-on service is simulated, so the result is just your photo.</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setStatus('idle');
              }}
              className="btn-secondary btn-sm"
            >
              Try another photo
            </button>
            <button type="button" onClick={onClose} className="btn-primary btn-sm">
              Done
            </button>
          </div>
        </div>
      ) : status === 'running' ? (
        <div className="space-y-6 py-2 text-center">
          <div className="relative mx-auto w-fit overflow-hidden rounded-2xl">
            <img src={photoUrl} alt="Your photo" className="block max-h-80 object-contain" />
            <ScanOverlay message={message} />
          </div>
          <p className="sr-only" aria-live="polite">
            {message}
          </p>
          <div className="mx-auto h-px max-w-sm overflow-hidden bg-sand">
            <div className="h-full bg-brass transition-[width] duration-700 ease-out-expo" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">This usually takes 10–60 seconds. You can close this window to cancel.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-gray-600">
            Use a clear photo of yourself from the front, standing straight, ideally with your upper body fully visible.
          </p>
          <PhotoPicker photo={photo} onChange={setPhoto} />
          <PrivacyNotice variant="tryon" />
          {error && <p className="animate-rise rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="link-underline px-2 text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase"
            >
              Cancel
            </button>
            <button type="button" disabled={!photo} onClick={start} className="btn-primary">
              {status === 'error' ? 'Try again' : 'Create try-on'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
