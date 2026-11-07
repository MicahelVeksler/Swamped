// Hook for the user's class schedule (saved in the browser).
import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage.js';
import { CLASS_COLORS, MOCK_SCHEDULE } from '../data/mockSchedule.js';

export default function useSchedule() {
  const [classes, setClasses] = useLocalStorage('swamped.schedule', MOCK_SCHEDULE);

  // Same course name keeps the same color; new courses take the next unused color.
  const colorFor = useCallback(
    (name, excludeId) => {
      const others = classes.filter((c) => c.id !== excludeId);
      const same = others.find((c) => c.name.toUpperCase() === name.toUpperCase());
      if (same) return same.color;
      const used = new Set(others.map((c) => c.color));
      return CLASS_COLORS.find((c) => !used.has(c)) ?? CLASS_COLORS[others.length % CLASS_COLORS.length];
    },
    [classes],
  );

  const add = useCallback(
    (cls) => {
      const id = `c${Date.now().toString(36)}`;
      setClasses((cur) => [...cur, { ...cls, id, color: colorFor(cls.name) }]);
    },
    [setClasses, colorFor],
  );

  const update = useCallback(
    (id, cls) =>
      setClasses((cur) =>
        cur.map((c) => (c.id === id ? { ...c, ...cls, color: c.name === cls.name ? c.color : colorFor(cls.name, id) } : c)),
      ),
    [setClasses, colorFor],
  );

  /** Deletes a class and returns a function that restores it. */
  const remove = useCallback(
    (id) => {
      const removed = classes.find((c) => c.id === id);
      setClasses((cur) => cur.filter((c) => c.id !== id));
      return () => removed && setClasses((cur) => [...cur, removed]);
    },
    [classes, setClasses],
  );

  /** Adds many classes at once (from a calendar import), optionally replacing everything. */
  const importMany = useCallback(
    (list, { replace = false } = {}) =>
      setClasses((cur) => {
        const next = replace ? [] : [...cur];
        const stamp = Date.now().toString(36);
        list.forEach((cls, i) => {
          const same = next.find((c) => c.name.toUpperCase() === cls.name.toUpperCase());
          const used = new Set(next.map((c) => c.color));
          const color = same?.color ?? CLASS_COLORS.find((c) => !used.has(c)) ?? CLASS_COLORS[next.length % CLASS_COLORS.length];
          next.push({ ...cls, id: `c${stamp}${i}`, color });
        });
        return next;
      }),
    [setClasses],
  );

  return { classes, add, update, remove, importMany };
}
