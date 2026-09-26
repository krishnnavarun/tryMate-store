import { useEffect, useRef, useState } from 'react';
import { tryOnProduct } from '../../api/products.js';
import { useObjectUrl } from '../../hooks/useObjectUrl.js';
import PhotoPicker from '../fit/PhotoPicker.jsx';
import PrivacyNotice from '../fit/PrivacyNotice.jsx';
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

function useElapsedSeconds(running) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => {
      clearInterval(id);
      setElapsed(0);
    };
  }, [running]);
  return elapsed;
}

export default function TryOnModal({ product, color, onClose }) {
  const [photo, setPhoto] = useState(null);
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

  const message = [...PROGRESS_MESSAGES].reverse().find(([at]) => elapsed >= at)?.[1];
  const progress = Math.min(95, Math.round((elapsed / EXPECTED_SECONDS) * 100));

  return (
    <Modal title={`Try on: ${product.name}${color ? ` (${color.name})` : ''}`} onClose={onClose} size="max-w-3xl">
      {status === 'done' && result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <figure>
              <img src={photoUrl} alt="Your photo" className="aspect-[3/4] w-full rounded-xl bg-gray-100 object-cover" />
              <figcaption className="mt-1 text-center text-xs text-gray-500">Your photo</figcaption>
            </figure>
            <figure>
              <img src={result.resultImage} alt={`You wearing ${product.name}`} className="aspect-[3/4] w-full rounded-xl bg-gray-100 object-cover" />
              <figcaption className="mt-1 text-center text-xs text-gray-500">With {product.name}</figcaption>
            </figure>
          </div>
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <strong>This shows the look, not the exact fit.</strong> Check the size recommendation for fit.
          </p>
          {result.provider === 'mock' && (
            <p className="text-xs text-gray-500">
              Demo mode: the try-on service is simulated, so the result is just your photo.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setStatus('idle');
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium"
            >
              Try another photo
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
              Done
            </button>
          </div>
        </div>
      ) : status === 'running' ? (
        <div className="space-y-5 py-6 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
          <p className="font-medium text-gray-900" aria-live="polite">
            {message}
          </p>
          <div className="mx-auto h-2 max-w-sm overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">This usually takes 10–60 seconds. You can close this window to cancel.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Use a clear photo of yourself from the front, standing straight, ideally with your upper body fully visible.
          </p>
          <PhotoPicker photo={photo} onChange={setPhoto} />
          <PrivacyNotice variant="tryon" />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600">
              Cancel
            </button>
            <button
              type="button"
              disabled={!photo}
              onClick={start}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {status === 'error' ? 'Try again' : 'Create try-on'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
