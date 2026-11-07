// Bottom navigation bar for switching between the Map, Schedule, and Bookmarks screens.
import Icon from './Icon.jsx';

const TABS = [
  { id: 'map', label: 'Map', icon: 'navMap' },
  { id: 'schedule', label: 'Schedule', icon: 'navSchedule' },
  { id: 'bookmarks', label: 'Bookmark', icon: 'navBookmark' },
];

function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'tab active' : 'tab'}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="tab-icon">
            <Icon name={t.icon} />
          </span>
          <span className="tab-label">{t.label}</span>
          <span className="tab-indicator" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

export default TabBar;
