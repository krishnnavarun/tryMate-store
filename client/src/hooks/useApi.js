import { useCallback, useEffect, useState } from 'react';

// Runs an async API call whenever `deps` change, and tracks loading/error state.
//
//   const { data, error, loading, reload } = useApi((signal) => fetchProduct(slug, { signal }), [slug]);
//
// - `deps` should be simple values (strings/numbers), like a useEffect dependency list.
// - The previous `data` is kept while a new request loads (so filters don't flicker).
// - The AbortController cancels the old request when deps change or the component
//   unmounts, so a slow old response can never overwrite a newer one.
// - reload() runs the same request again (for "Try again" buttons).
export function useApi(request, deps) {
  const [attempt, setAttempt] = useState(0);
  // Identifies the request we currently want. When it differs from the key of the
  // last finished request, we're loading. (Deriving `loading` this way means we never
  // have to set state synchronously inside the effect.)
  const key = JSON.stringify([...deps, attempt]);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    request(controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return; // cancelled on purpose: ignore
        setResult({ key, data: null, error });
      });

    return () => controller.abort();
    // `request` is a new function every render; `key` decides when to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const loading = result.key !== key;

  return { data: result.data, error: loading ? null : result.error, loading, reload };
}
