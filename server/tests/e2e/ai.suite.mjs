// Fit profile, size recommendation, "colors that suit you" and try-on (Phases 3–7).
//
// AI_MODE=mock: everything runs, including every AI error (triggered by photo file names).
// AI_MODE=real: needs E2E_PHOTO (a real full-body photo). Try-on only runs with E2E_TRYON=1,
// because with the real provider each try-on costs money.

import { check, client, hasRealPhoto, PASSWORD, photoForm, uniqueEmail } from './lib.mjs';

export async function runAiSuite({ product, aiMode }) {
  const mock = aiMode === 'mock';
  if (!mock && !hasRealPhoto) {
    console.log('\nAI features: SKIPPED (AI_MODE=real needs E2E_PHOTO=path/to/full-body-photo.jpg)');
    return;
  }
  const a = client();
  await a('POST', '/auth/register', { json: { name: 'Scan Tester', email: uniqueEmail('scan'), password: PASSWORD } });

  console.log(`\nFit profile (AI_MODE=${aiMode})`);
  let r = await a('GET', '/fit-profile');
  check('no profile yet', r.status === 200 && r.body.fitProfile === null && r.body.fitPreference === 'regular', r.body);
  r = await a('GET', `/products/${product._id}/size-recommendation`);
  check('recommendation without a profile → 409 NO_FIT_PROFILE', r.status === 409 && r.body.error_code === 'NO_FIT_PROFILE', r);
  r = await a('GET', '/products?suitsMe=true');
  check('suitsMe without a profile → 409', r.status === 409, r);
  r = await a('POST', '/fit-profile/scan', { form: photoForm('me.jpg', { heightCm: 999 }) });
  check('height 999 → 400', r.status === 400 && r.body.error_code === 'VALIDATION_ERROR', r);
  const noPhoto = new FormData();
  noPhoto.append('heightCm', '180');
  r = await a('POST', '/fit-profile/scan', { form: noPhoto });
  check('no photo → 400', r.status === 400, r);

  if (mock) {
    const cases = [
      ['no-person.jpg', 422, 'NO_PERSON_DETECTED'],
      ['multiple.jpg', 422, 'MULTIPLE_PEOPLE'],
      ['partial.jpg', 422, 'PARTIAL_BODY'],
      ['face-error.jpg', 422, 'FACE_NOT_FOUND'],
      ['server-error.jpg', 502, 'INTERNAL_ERROR'],
    ];
    for (const [file, status, code] of cases) {
      r = await a('POST', '/fit-profile/scan', { form: photoForm(file, { heightCm: 180 }) });
      check(`${file} → ${status} ${code}`, r.status === status && r.body.error_code === code, r);
    }
    r = await a('POST', '/fit-profile/scan', { form: photoForm('no-face.jpg', { heightCm: 180 }) });
    check('no-face → 200 without skin tone or colours', r.status === 200 && !r.body.fitProfile.skinTone && r.body.fitProfile.colorSuggestions.length === 0, r.body);
  }

  r = await a('POST', '/fit-profile/scan', { form: photoForm('me.jpg', { heightCm: 180, weightKg: 78 }) });
  check('scan → 200 with measurements', r.status === 200 && r.body.fitProfile?.measurements?.chest_cm > 0, r);
  check('skin tone + 8 colours saved', Boolean(r.body.fitProfile?.skinTone?.hex) && r.body.fitProfile.colorSuggestions.length === 8, r.body);
  check('warnings returned (not stored)', Array.isArray(r.body.warnings), r.body);
  r = await a('GET', '/auth/me');
  check('profile is on the user', r.body.user.fitProfile?.heightCm === 180 && r.body.user.fitProfile.weightKg === 78, r.body);

  console.log('\nSize recommendation');
  const bySize = {};
  for (const fit of ['slim', 'regular', 'loose']) {
    await a('PUT', '/fit-profile/preference', { json: { fitPreference: fit } });
    r = await a('GET', `/products/${product._id}/size-recommendation`);
    bySize[fit] = r.body.perSize;
    check(`${fit} → recommends ${r.body.recommendedSize}`, r.status === 200 && Boolean(r.body.perSize?.[r.body.recommendedSize]) && r.body.fitPreference === fit, r);
  }
  check('fit preference changes the scores', JSON.stringify(bySize.slim) !== JSON.stringify(bySize.loose));
  const VERDICTS = ['good', 'slightly_tight', 'tight', 'slightly_loose', 'loose', 'slightly_short', 'short', 'slightly_long', 'long'];
  const fields = r.body.perSize?.[r.body.recommendedSize]?.fields ?? [];
  check(
    'each size explains its fit in numbers (chest, waist, shoulders, length, sleeves)',
    ['chest', 'waist', 'shoulder', 'length', 'sleeve'].every((name) => fields.some((f) => f.field === name)) &&
      fields.every((f) => typeof f.bodyCm === 'number' && f.sizeMin <= f.sizeMax && VERDICTS.includes(f.verdict)),
    fields,
  );
  check(
    'the answer says whether you are between sizes',
    'alternativeSize' in r.body && (r.body.alternativeSize === null || Boolean(r.body.perSize[r.body.alternativeSize])),
    r.body,
  );
  r = await a('PUT', '/fit-profile/preference', { json: { fitPreference: 'baggy' } });
  check('invalid preference → 400', r.status === 400, r);
  await a('PUT', '/fit-profile/preference', { json: { fitPreference: 'regular' } });

  console.log('\nColors that suit you');
  r = await a('GET', '/products?limit=48');
  const listed = r.body.items.find((p) => p._id === product._id);
  const tagged = r.body.items.filter((p) => p.suitsYou);
  check('shop list carries suitsYou tags', r.status === 200 && r.body.items.every((p) => 'suitsYou' in p), r.body);
  if (mock) check('test product (Olive) suits the mock palette', listed?.suitsYou?.color === 'Olive', listed);
  r = await a('GET', '/products?suitsMe=true&limit=48');
  check('suitsMe=true returns exactly the tagged products', r.status === 200 && r.body.items.length === tagged.length && r.body.items.every((p) => p.suitsYou), r.body);
  check('closest matches first', r.body.items.every((p, i, all) => i === 0 || all[i - 1].suitsYou.deltaE <= p.suitsYou.deltaE));
  r = await a('GET', `/products/${product.slug}`);
  check('product page lists its suiting colours', Array.isArray(r.body.suitingColors), r.body);
  r = await client()('GET', '/products?limit=3');
  check('no tags for logged-out visitors', r.body.items.every((p) => p.suitsYou === null), r.body);

  if (mock || process.env.E2E_TRYON === '1') {
    console.log('\nTry-on');
    const started = Date.now();
    r = await a('POST', `/products/${product._id}/try-on`, { form: photoForm('me.jpg', { color: 'Olive' }) });
    check(`try-on → 200 with an image (${Date.now() - started} ms)`, r.status === 200 && /^(data:image\/|https?:)/.test(r.body.resultImage ?? ''), r.status);
    if (mock) {
      r = await a('POST', `/products/${product._id}/try-on`, { form: photoForm('tryon-fail.jpg') });
      check('tryon-fail → 502 TRYON_FAILED', r.status === 502 && r.body.error_code === 'TRYON_FAILED', r);
      r = await a('POST', `/products/${product._id}/try-on`, { form: photoForm('tryon-timeout.jpg') });
      check('tryon-timeout → 504 TRYON_TIMEOUT', r.status === 504 && r.body.error_code === 'TRYON_TIMEOUT', r);
    }
  } else {
    console.log('\nTry-on: SKIPPED with the real AI (set E2E_TRYON=1 to run one; it may cost money)');
  }
  r = await client()('POST', `/products/${product._id}/try-on`, { form: photoForm('me.jpg') });
  check('try-on when logged out → 401', r.status === 401, r);

  r = await a('DELETE', '/fit-profile');
  check('delete profile → 204', r.status === 204, r);
  r = await a('GET', `/products/${product._id}/size-recommendation`);
  check('after delete → 409 again (cache cleared)', r.status === 409, r);
}
