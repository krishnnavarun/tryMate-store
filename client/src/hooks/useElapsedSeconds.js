import { useEffect, useState } from 'react';

// Seconds since `running` became true (0 while not running). For progress messages.
export function useElapsedSeconds(running) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => {
      clearInterval(id);
      setElapsed(0);
    };
  }, [running]);
  return elapsed;
}

// The last message whose start time has passed: [[0, 'Uploading…'], [3, 'Finding your pose…'], …]
export function messageAt(messages, elapsed) {
  return [...messages].reverse().find(([at]) => elapsed >= at)?.[1];
}
