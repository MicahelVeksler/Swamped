// Bottom navigation bar for switching between the Map, Schedule, and Bookmarks screens.

const TABS = [
  {id: 'map', label: 'Map'},
  {id: 'schedule', label: 'Schedule'},
  {id: 'bookmarks', label: 'Bookmark'},
];

function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'tab active' : 'tab'}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export default TabBar;
