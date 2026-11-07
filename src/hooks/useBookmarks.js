// Hook for adding, removing, and reading the user's bookmarked buildings.
import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage.js';
import { MOCK_BOOKMARKS } from '../data/mockSchedule.js';

export default function useBookmarks() {
  const [ids, setIds] = useLocalStorage('swamped.bookmarks', MOCK_BOOKMARKS);

  const isBookmarked = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])),
    [setIds],
  );

  /** Removes a bookmark and returns a function that puts it back where it was. */
  const remove = useCallback(
    (id) => {
      let index = -1;
      setIds((cur) => {
        index = cur.indexOf(id);
        return cur.filter((x) => x !== id);
      });
      return () =>
        setIds((cur) => {
          if (cur.includes(id)) return cur;
          const next = [...cur];
          next.splice(index < 0 ? next.length : index, 0, id);
          return next;
        });
    },
    [setIds],
  );

  return { ids, isBookmarked, toggle, remove };
}
