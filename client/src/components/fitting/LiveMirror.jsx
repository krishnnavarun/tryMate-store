import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cameraErrorMessage, captureFrame, openCamera, stopStream } from '../../lib/camera.js';
import { drawGarment } from '../../lib/fitting/drawGarment.js';
import { loadPoseLandmarker, withTimeout } from '../../lib/fitting/poseTracker.js';

// Landmark smoothing: each frame moves 55 % of the way to the new position. Removes jitter
// while still following movement closely. (Exponential moving average.)
const SMOOTHING = 0.55;
// If the model misses the person for a moment (motion blur, a quick turn), keep the last
// pose this long before giving up, so the garment and hints don't flicker.
const LOST_GRACE_MS = 600;
// Camera + model must be ready within this time, otherwise show an error with "Try again"
const START_TIMEOUT_MS = 45_000;

const HINTS = {
  'no-person': 'Step into the frame so we can see you',
  'no-torso': 'Step back so your shoulders and hips are visible',
  'too-far': 'Come a little closer to the camera',
};

/**
 * The live camera "mirror". Tracks the body on-device and draws `garment` on it.
 *
 * Props:
 *   garment    { type, hex, overlayImageUrl? } or null
 *   scales     { width, length } for the chosen size (lib/fitting/fit.js)
 *   highlight  true while a garment is being dragged over the page (drop target glow)
 *   children   extra controls shown under the mirror
 * Ref: { capture(): Promise<File>, element: the drop-zone element }
 */
const LiveMirror = forwardRef(function LiveMirror({ garment, scales, highlight = false, children }, ref) {
  const zoneRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const latest = useRef({ garment, scales, image: null }); // read by the animation loop
  const [camera, setCamera] = useState('off'); // off | starting | on | error
  const [facing, setFacing] = useState('user');
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);

  useImperativeHandle(ref, () => ({
    capture: () => captureFrame(videoRef.current),
    get element() {
      return zoneRef.current;
    },
  }));

  // Keep the loop's view of the props current, and load a product cut-out image if there is one
  useEffect(() => {
    latest.current.garment = garment;
    latest.current.scales = scales;
  }, [garment, scales]);

  useEffect(() => {
    latest.current.image = null;
    if (!garment?.overlayImageUrl) return;
    const img = new Image();
    img.onload = () => {
      latest.current.image = img;
    };
    img.src = garment.overlayImageUrl;
  }, [garment?.overlayImageUrl]);

  // Start / restart the camera when asked (camera === 'starting'), stop it on exit
  useEffect(() => {
    if (camera !== 'starting') return;
    let cancelled = false;
    const cameraPromise = openCamera(facing);
    withTimeout(Promise.all([cameraPromise, loadPoseLandmarker()]), START_TIMEOUT_MS, 'start-timeout')
      .then(([stream]) => {
        if (cancelled) return stopStream(stream);
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setCamera('on');
      })
      .catch((err) => {
        cameraPromise.then(stopStream, () => {}); // release the camera if it did open
        if (cancelled) return;
        setError(
          err?.message === 'start-timeout'
            ? 'Starting took too long. Check your internet connection (the body-tracking model is about 5 MB) and try again.'
            : err?.name && err.name !== 'Error'
              ? cameraErrorMessage(err)
              : 'Could not load the body-tracking model. Check your connection and try again.',
        );
        setCamera('error');
      });
    return () => {
      cancelled = true;
    };
  }, [camera, facing]);

  useEffect(() => () => stopStream(streamRef.current), []);

  // The render loop: detect the pose on each new video frame, draw the garment
  useEffect(() => {
    if (camera !== 'on') return;
    let frameId;
    let stopped = false;
    let landmarker = null;
    let lastVideoTime = -1;
    let smoothed = null;
    let lastSeen = 0;
    let lastHint = null;

    const setHintIfChanged = (next) => {
      if (next !== lastHint) {
        lastHint = next;
        setHint(next);
      }
    };

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Only run the model when the camera has produced a new frame
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        const raw = result.landmarks?.[0];
        if (!raw) {
          if (performance.now() - lastSeen > LOST_GRACE_MS) smoothed = null;
        } else {
          lastSeen = performance.now();
          const pts = raw.map((lm) => ({ x: lm.x * canvas.width, y: lm.y * canvas.height, visibility: lm.visibility }));
          smoothed = smoothed
            ? pts.map((p, i) => ({
                x: smoothed[i].x + (p.x - smoothed[i].x) * SMOOTHING,
                y: smoothed[i].y + (p.y - smoothed[i].y) * SMOOTHING,
                visibility: p.visibility,
              }))
            : pts;
        }
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { garment: worn, scales: fit, image } = latest.current;
      if (!smoothed) return setHintIfChanged('no-person');
      if (!worn) return setHintIfChanged(null);
      const drawn = drawGarment(ctx, smoothed, { ...worn, image }, fit);
      setHintIfChanged(drawn.ok ? null : drawn.reason);
    };
    // The model is already loaded (the camera only turns "on" after it), so this is instant
    loadPoseLandmarker().then((lm) => {
      if (stopped) return;
      landmarker = lm;
      frameId = requestAnimationFrame(tick);
    });
    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
    };
  }, [camera]);

  function start() {
    setError(null);
    setCamera('starting');
  }

  function switchCamera() {
    stopStream(streamRef.current);
    setFacing((f) => (f === 'user' ? 'environment' : 'user'));
    setCamera('starting');
  }

  const mirrored = facing === 'user'; // selfie camera behaves like a mirror

  return (
    <div className="space-y-3">
      <div
        ref={zoneRef}
        className={`relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-900 transition sm:aspect-[4/3] ${
          highlight ? 'ring-4 ring-emerald-400 ring-offset-2' : ''
        }`}
      >
        {/* Video and drawing share one box, so the garment lines up with the body */}
        <div className={`absolute inset-0 ${mirrored ? '-scale-x-100' : ''}`}>
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        </div>

        {camera !== 'on' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            {camera === 'starting' ? (
              <>
                <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="text-sm">Starting the camera and body tracking…</p>
              </>
            ) : (
              <>
                <p className="max-w-sm text-lg font-semibold">Your live fitting room</p>
                <p className="max-w-sm text-sm text-white/75">
                  Stand 1.5–2 m from the camera, then drag a garment onto yourself. Everything runs on your
                  device; the video is never uploaded.
                </p>
                {error && <p className="max-w-sm rounded-lg bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
                <button
                  type="button"
                  onClick={start}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-cream"
                >
                  {camera === 'error' ? 'Try again' : 'Start camera'}
                </button>
              </>
            )}
          </div>
        )}

        {camera === 'on' && (hint || !garment) && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white" aria-live="polite">
              {hint ? HINTS[hint] : 'Drag a garment here, or tap one to wear it'}
            </span>
          </div>
        )}

        {highlight && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-500/15">
            <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Drop to try it on</span>
          </div>
        )}
      </div>

      {camera === 'on' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={switchCamera}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Switch camera
          </button>
          {children}
        </div>
      )}
    </div>
  );
});

export default LiveMirror;
