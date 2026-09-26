// MediaPipe pose landmark numbers we use (same numbering as the Python AI service).
// Kept apart from poseTracker.js so the drawing code (and its tests) don't load MediaPipe.
// "L" = the person's left.
export const P = {
  NOSE: 0,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
};
