// Bottom sheet shown when a building is tapped: name, capacity, walk time, hours, bookmark and share buttons.
import { useState } from 'react';

function BuildingSheet() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={expanded ? 'sheet expanded' : 'sheet'}>
      <button className="sheet-handle" onClick={() => setExpanded(!expanded)}></button>
      <h2>Building name</h2>
      <p>Details go here.</p>
    </div>
  );
}

export default BuildingSheet;
