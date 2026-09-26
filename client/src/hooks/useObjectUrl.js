import { useEffect, useMemo } from 'react';

// A temporary in-memory URL (blob:...) for previewing a File/Blob, released when the
// file changes or the component goes away. The file never leaves the browser.
export function useObjectUrl(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return url;
}
