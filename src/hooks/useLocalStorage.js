// useState that survives page reloads by mirroring the value into localStorage.
import { useEffect, useState } from 'react';

export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      // Storage blocked or bad JSON: fall back to the initial value.
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore: the app still works for this session.
    }
  }, [key, value]);

  return [value, setValue];
}
