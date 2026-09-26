import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useObjectUrl } from '../../hooks/useObjectUrl.js';
import CameraCapture from './CameraCapture.jsx';

const MAX_MB = 10;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Choose a photo by upload or camera, with a preview. The photo stays in the browser's
// memory until the parent sends it; nothing is uploaded here.
export default function PhotoPicker({ photo, onChange, disabled = false }) {
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
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative mx-auto w-fit">
          <img src={previewUrl} alt="Your photo" className="max-h-80 rounded-xl object-contain" />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500">
          No photo chosen yet
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {photo ? 'Choose another photo' : 'Upload a photo'}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCameraOpen(true)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
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
