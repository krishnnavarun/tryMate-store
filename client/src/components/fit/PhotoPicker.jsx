import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useObjectUrl } from '../../hooks/useObjectUrl.js';
import CameraCapture from './CameraCapture.jsx';
import ScanOverlay from './ScanOverlay.jsx';

const MAX_MB = 10;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Choose a photo by upload or camera, with a preview. The photo stays in the browser's
// memory until the parent sends it; nothing is uploaded here.
// scanning: show the scan animation (with `scanMessage`) over the preview.
export default function PhotoPicker({ photo, onChange, disabled = false, scanning = false, scanMessage }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef(null);
  const previewUrl = useObjectUrl(photo);

  function accept(file) {
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error('Please choose a JPEG, PNG or WEBP photo.');
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`The photo must be smaller than ${MAX_MB} MB.`);
    onChange(file);
  }

  if (cameraOpen) {
    return (
      <CameraCapture
        onCancel={() => setCameraOpen(false)}
        onCapture={(file) => {
          setCameraOpen(false);
          accept(file);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative mx-auto w-fit animate-pop overflow-hidden rounded-2xl">
          <img src={previewUrl} alt="Your photo" className="block max-h-96 object-contain" />
          {scanning && <ScanOverlay message={scanMessage} />}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="group flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-noir text-sm text-gray-500 transition-colors hover:border-alabaster hover:text-alabaster"
        >
          <svg className="h-9 w-9 text-ember transition-transform duration-500 ease-out-expo group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.1} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
          </svg>
          <span className="heading-display text-xl text-alabaster">Add a full-body photo</span>
          <span className="text-xs">JPEG, PNG or WEBP, up to {MAX_MB} MB</span>
        </button>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="btn-secondary btn-sm">
          {photo ? 'Choose another photo' : 'Upload a photo'}
        </button>
        <button type="button" disabled={disabled} onClick={() => setCameraOpen(true)} className="btn-secondary btn-sm">
          Take a photo
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = ''; // allow choosing the same file again
        }}
      />
    </div>
  );
}
