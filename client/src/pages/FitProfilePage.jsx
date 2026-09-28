import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import { deleteFitProfile, updateFitPreference } from '../api/fitProfile.js';
import FitPreferenceToggle from '../components/fit/FitPreferenceToggle.jsx';
import FitResults from '../components/fit/FitResults.jsx';
import ScanForm from '../components/fit/ScanForm.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function FitProfilePage() {
  const { user, setUser } = useAuth();
  const fitProfile = user.fitProfile;
  const [scanning, setScanning] = useState(!fitProfile); // show the scan form first if there's no profile
  const [warnings, setWarnings] = useState([]); // warnings from the latest scan (not stored)
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  usePageTitle('Your fit profile');

  function handleScanned(result) {
    setUser({ ...user, fitProfile: result.fitProfile, fitPreference: result.fitPreference });
    setWarnings(result.warnings);
    setScanning(false);
    toast.success('Your fit profile is ready!');
    window.scrollTo(0, 0);
  }

  async function handlePreference(fitPreference) {
    setBusy(true);
    try {
      const result = await updateFitPreference(fitPreference);
      setUser({ ...user, fitPreference: result.fitPreference });
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteFitProfile();
      setUser({ ...user, fitProfile: null });
      setWarnings([]);
      setConfirmDelete(false);
      setScanning(true);
      toast.success('Your fit profile was deleted.');
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-10 animate-rise">
        <p className="eyebrow">Your fit</p>
        <h1 className="heading-display mt-3 text-5xl sm:text-6xl">Your fit profile</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          One full-body photo and your height give us your measurements and the colours that suit you. Then every
          product shows the size that fits you.
        </p>
      </div>

      {scanning || !fitProfile ? (
        <ScanForm
          defaultHeight={fitProfile?.heightCm}
          defaultWeight={fitProfile?.weightKg}
          onScanned={handleScanned}
          onCancel={fitProfile ? () => setScanning(false) : undefined}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <FitResults fitProfile={fitProfile} warnings={warnings} />

          <aside className="h-fit animate-rise space-y-6 rounded-[28px] bg-onyx p-7 lg:sticky lg:top-32" style={{ animationDelay: '200ms' }}>
            <div>
              <h2 className="heading-display text-2xl leading-tight">How do you like your clothes to fit?</h2>
              <p className="mt-1 text-sm text-gray-600">Size recommendations follow this.</p>
              <div className="mt-3">
                <FitPreferenceToggle value={user.fitPreference} onChange={handlePreference} disabled={busy} />
              </div>
            </div>

            <Link
              to="/shop"
              className="btn-primary w-full"
            >
              See your size on every product
            </Link>
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="btn-secondary w-full"
            >
              Re-scan
            </button>

            <div className="border-t border-smoke pt-5">
              {confirmDelete ? (
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">Delete your measurements and colours? You can scan again any time.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={busy}
                      className="rounded-full bg-red-500 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
                    >
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 font-medium">
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="link-underline text-[11px] font-semibold tracking-[0.14em] text-gray-500 uppercase hover:text-red-600"
                >
                  Delete my fit profile
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
