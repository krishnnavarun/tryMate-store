import { User } from '../models/User.js';
import { analyzeBody } from '../services/aiClient.js';
import { clearRecommendationCache } from '../services/recommendationCache.js';

function profileResponse(user) {
  return { fitProfile: user.fitProfile ?? null, fitPreference: user.fitPreference };
}

// GET /api/fit-profile
export function getFitProfile(req, res) {
  res.json(profileResponse(req.user));
}

// POST /api/fit-profile/scan  (multipart: image, heightCm, weightKg?)
// The photo goes from memory to the AI service and is then discarded. Only the results
// (measurements, skin tone, colours) are saved to the user's profile.
export async function scan(req, res) {
  const { heightCm, weightKg } = req.valid.body;
  const result = await analyzeBody({ file: req.file, heightCm, weightKg, requestId: req.id });

  const fitProfile = {
    heightCm,
    weightKg,
    measurements: result.measurements,
    skinTone: result.skin_tone ?? undefined, // null when the face wasn't visible
    colorSuggestions: result.color_suggestions ?? [],
    confidence: result.confidence,
    updatedAt: new Date(),
  };
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { fitProfile } }, { returnDocument: 'after' }).lean();
  clearRecommendationCache(req.user._id);

  // Warnings aren't stored: they describe this particular photo
  res.json({ ...profileResponse(user), warnings: result.warnings ?? [] });
}

// PUT /api/fit-profile/preference  { fitPreference }
export async function updatePreference(req, res) {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fitPreference: req.valid.body.fitPreference } },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  clearRecommendationCache(req.user._id);
  res.json(profileResponse(user));
}

// DELETE /api/fit-profile
export async function deleteFitProfile(req, res) {
  await User.updateOne({ _id: req.user._id }, { $unset: { fitProfile: 1 } });
  clearRecommendationCache(req.user._id);
  res.status(204).end();
}
