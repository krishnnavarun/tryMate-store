// Small helpers shared by the end-to-end suites: an HTTP client that keeps its own login
// cookie (like one browser), pass/fail reporting, and test photos.

import { readFileSync } from 'node:fs';

export const API = (process.env.E2E_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');

// Every account the tests create uses this domain, so cleanup can find them all
export const TEST_EMAIL_DOMAIN = '@example.test';
export const TEST_PRODUCT_PREFIX = 'E2E Test';

// A tiny valid JPEG. Enough for the mock AI, which never decodes the photo.
// The real AI service needs a real full-body photo: set E2E_PHOTO=path/to/photo.jpg
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);
const PHOTO = process.env.E2E_PHOTO ? readFileSync(process.env.E2E_PHOTO) : TINY_JPEG;
export const hasRealPhoto = Boolean(process.env.E2E_PHOTO);

// FormData with a photo. The FILE NAME can trigger mock AI errors (e.g. "partial.jpg").
export function photoForm(fileName, fields = {}, field = 'image') {
  const form = new FormData();
  form.append(field, new Blob([PHOTO], { type: 'image/jpeg' }), fileName);
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  return form;
}

// A logged-in (or not) user: remembers the auth cookie between calls
export function client() {
  let cookie = '';
  return async function call(method, path, { json, form } = {}) {
    const headers = cookie ? { Cookie: cookie } : {};
    let body;
    if (json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }
    const res = await fetch(API + path, { method, headers, body });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed, setCookie };
  };
}

export const uniqueEmail = (name) => `${name}${Date.now()}${Math.floor(Math.random() * 1000)}${TEST_EMAIL_DOMAIN}`;
export const PASSWORD = 'correct-horse-1';

const results = { passed: 0, failed: [] };

export function check(label, condition, details = '') {
  if (condition) {
    results.passed++;
    console.log(`  ✓ ${label}`);
  } else {
    results.failed.push(label);
    const shown = typeof details === 'string' ? details : JSON.stringify(details);
    console.log(`  ✗ ${label}\n      ${shown.slice(0, 400)}`);
  }
}

export function summary() {
  return results;
}
