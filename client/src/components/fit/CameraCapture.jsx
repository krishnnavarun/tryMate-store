import { useCallback, useEffect, useRef, useState } from 'react';
import { cameraErrorMessage } from '../../lib/camera.js';

const SELF_TIMER_SECONDS = 10;

// Why getUserMedia (a live camera view) instead of only <input capture>?
// A full-body photo needs the phone propped up and the person standing 2–3 m away, so a
// self-timer is essential; <input capture> opens the phone's camera app, where we can't
// add one. PhotoPicker still offers a normal file upload (which on phones also lets
// people pick "Camera"), so this is an extra, not the only way.

// Live camera preview with a 10-second self-timer. Calls onCapture(file) with a JPEG File.
export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const [facing, setFacing] = useState('environment'); // back camera: better for full-body shots
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Start (or restart, when switching cameras) the video stream; always stop it on exit
  useEffect(() => {
    let stream;
    let active = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      Promise.resolve().then(() => active && setError(cameraErrorMessage()));
      return () => {
        active = false;
      };
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false })
      .then((s) => {
        if (!active) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        videoRef.current.srcObject = s;
        setError(null);
        // "ready" is set by the video's onLoadedMetadata below: only then does the video
        // have a size, and a photo can actually be taken
      })
      .catch((err) => active && setError(cameraErrorMessage(err)));
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop()); // turns the camera light off
    };
  }, [facing]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => blob && onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.92,
    );
  }, [onCapture]);

  // Self-timer: tick once a second, take the photo at zero
  useEffect(() => {
    if (countdown === null) return;
    const id = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        capture();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown, capture]);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{error}</p>
        <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setReady(true)}
          // Mirror the front camera preview so it behaves like a mirror (the photo itself isn't mirrored)
          className={`max-h-[60vh] w-full object-contain ${facing === 'user' ? '-scale-x-100' : ''}`}
        />
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-7xl font-bold text-white drop-shadow">{countdown}</span>
          </div>
        )}
        {!ready && <p className="absolute inset-0 flex items-center justify-center text-sm text-white">Starting camera…</p>}
      </div>

      <p className="text-center text-xs text-gray-500">
        Prop your phone at chest height, start the timer, and step back until your whole body is in view.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {countdown === null ? (
          <>
            <button
              type="button"
              disabled={!ready}
              onClick={() => setCountdown(SELF_TIMER_SECONDS)}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Start {SELF_TIMER_SECONDS}s timer
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={capture}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Take now
            </button>
            <button
              type="button"
              onClick={() => {
                setReady(false);
                setFacing((f) => (f === 'user' ? 'environment' : 'user'));
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium"
            >
              Switch camera
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setCountdown(null)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium"
          >
            Cancel timer
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600">
          Back
        </button>
      </div>
    </div>
  );
}
