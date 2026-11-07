// Shared app state (clock, schedule, bookmarks, location, navigation) for all screens.
import { createContext, useContext } from 'react';

export const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}
