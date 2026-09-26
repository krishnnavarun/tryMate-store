import { api } from './client.js';

// → { fitProfile, fitPreference }
export async function fetchFitProfile() {
  const { data } = await api.get('/fit-profile');
  return data;
}

// photo: a File/Blob. The photo is sent to our server, forwarded to the AI and discarded.
// → { fitProfile, fitPreference, warnings }
export async function scanBody({ photo, heightCm, weightKg, signal }) {
  const form = new FormData();
  form.append('image', photo, photo.name || 'photo.jpg');
  form.append('heightCm', String(heightCm));
  if (weightKg) form.append('weightKg', String(weightKg));
  const { data } = await api.post('/fit-profile/scan', form, { timeout: 90_000, signal });
  return data;
}

export async function updateFitPreference(fitPreference) {
  const { data } = await api.put('/fit-profile/preference', { fitPreference });
  return data;
}

export async function deleteFitProfile() {
  await api.delete('/fit-profile');
}
