// The app's idea of "now". Normally the real time; for demos it can be pinned to a
// chosen weekday and time (e.g. Monday 11:40 AM, between two classes).
import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from './useLocalStorage.js';

export default function useClock() {
  const [demo, setDemo] = useLocalStorage('swamped.demoTime', null); // { day, minutes } | null
  const [examWeek, setExamWeek] = useLocalStorage('swamped.examWeek', false);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const now = useMemo(() => {
    const d = new Date(tick);
    if (!demo) return d;
    d.setDate(d.getDate() + (demo.day - d.getDay()));
    d.setHours(0, 0, 0, 0);
    d.setMinutes(demo.minutes);
    return d;
  }, [demo, tick]);

  return { now, demo, setDemo, examWeek, setExamWeek };
}
