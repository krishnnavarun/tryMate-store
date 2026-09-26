import { useEffect, useMemo, useRef } from 'react';

// A temporary in-memory URL (blob:...) for previewing a File/Blob. The file never leaves
// the browser.
//
// The URL is released when the file changes or the component really unmounts. It is NOT
// released on React StrictMode's development-only "unmount + mount again" check: releasing
// then would leave the <img> pointing at a dead URL (net::ERR_FILE_NOT_FOUND). So the
// release waits one tick and is skipped if the same URL is still in use.
export function useObjectUrl(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const current = useRef(null);

  useEffect(() => {
    current.current = url;
    return () => {
      if (!url) return;
      current.current = null;
      setTimeout(() => {
        if (current.current !== url) URL.revokeObjectURL(url);
      }, 0);
    };
  }, [url]);

  return url;
}
