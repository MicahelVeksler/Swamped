// Root component: tracks the active tab and renders the matching screen.
import { useState } from 'react';
import TabBar from './components/TabBar.jsx';
import MapScreen from './screens/MapScreen.jsx';
import ScheduleScreen from './screens/ScheduleScreen.jsx';
import BookmarksScreen from './screens/BookmarksScreen.jsx';

export default function App() {
  const [tab, setTab] = useState('map');

  return (
    <div className="phone">
      <main className="screen">
        {tab === 'map' && <MapScreen />}
        {tab === 'schedule' && <ScheduleScreen />}
        {tab === 'bookmarks' && <BookmarksScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
