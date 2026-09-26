import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import { deleteFitProfile, updateFitPreference } from '../api/fitProfile.js';
import FitPreferenceToggle from '../components/fit/FitPreferenceToggle.jsx';
import FitResults from '../components/fit/FitResults.jsx';
import ScanForm from '../components/fit/ScanForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function FitProfilePage() {
  const { user, setUser } = useAuth();
  const fitProfile = user.fitProfile;
  const [scanning, setScanning] = useState(!fitProfile); // show the scan form first if there's no profile
  const [warnings, setWarnings] = useState([]); // warnings from the latest scan (not stored)
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your fit profile</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          One full-body photo and your height give us your measurements and the colors that suit you. Then every
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
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <FitResults fitProfile={fitProfile} warnings={warnings} />

          <aside className="h-fit space-y-5 rounded-2xl bg-cream p-5">
            <div>
              <h2 className="font-semibold text-gray-900">How do you like your clothes to fit?</h2>
              <p className="mt-1 text-sm text-gray-600">Size recommendations follow this.</p>
              <div className="mt-3">
                <FitPreferenceToggle value={user.fitPreference} onChange={handlePreference} disabled={busy} />
              </div>
            </div>

            <Link
              to="/shop"
              className="block rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-light"
            >
              See your size on every product
            </Link>
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Re-scan
            </button>

            <div className="border-t border-gray-300 pt-4">
              {confirmDelete ? (
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">Delete your measurements and colors? You can scan again any time.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={busy}
                      className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white disabled:opacity-60"
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
                  className="text-sm font-medium text-gray-500 hover:text-red-600"
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
