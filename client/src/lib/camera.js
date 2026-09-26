// Shared camera helpers for the scan page camera and the live fitting room.

// A friendly message for getUserMedia errors
export function cameraErrorMessage(err) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Your browser can’t open the camera here (it needs HTTPS). Upload a photo instead.';
  }
  if (err?.name === 'NotAllowedError') return 'Camera access was blocked. Allow it in your browser settings and try again.';
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'No camera found on this device.';
  if (err?.name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again.';
  return 'Could not start the camera.';
}

export function openCamera(facingMode) {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
}

export function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop()); // turns the camera light off
}

// The current video frame as a JPEG File (not mirrored, exactly what the camera sees)
export function captureFrame(video, fileName = `camera-${Date.now()}.jpg`) {
  return new Promise((resolve, reject) => {
    if (!video?.videoWidth) return reject(new Error('The camera is not ready yet.'));
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], fileName, { type: 'image/jpeg' })) : reject(new Error('Capture failed'))),
      'image/jpeg',
      0.92,
    );
  });
}
