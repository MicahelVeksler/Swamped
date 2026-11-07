// Popup form for adding a class: name, start/end time with AM/PM, and building search.
// Also used to edit or delete an existing class.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon.jsx';
import { useApp } from '../AppContext.js';
import { CLASS_BUILDINGS, buildingFromLocation } from '../data/mockBuildings.js';
import { classesOn } from '../utils/gapFinder.js';
import { WEEKDAYS, WEEKDAY_LETTER, fmtClock, fmtRange, isPm, parseClock } from '../utils/time.js';

function TimeField({ label, text, pm, onText, onPm }) {
  return (
    <span className="time-field">
      <input
        className="pill-input time-input"
        aria-label={`${label} time`}
        inputMode="numeric"
        placeholder="9:35"
        value={text}
        onChange={(e) => onText(e.target.value)}
      />
      <button type="button" className="pill-input ampm" aria-label={`${label} AM or PM`} onClick={() => onPm(!pm)}>
        {pm ? 'PM' : 'AM'}
      </button>
    </span>
  );
}

export default function AddClassModal({ initial, onClose }) {
  const { schedule, toast } = useApp();
  const editing = Boolean(initial?.id);
  const start0 = initial?.start ?? 9 * 60 + 35;
  const end0 = initial?.end ?? start0 + 50;

  const [name, setName] = useState(initial?.name ?? '');
  const [startText, setStartText] = useState(fmtClock(start0));
  const [startPm, setStartPm] = useState(isPm(start0));
  const [endText, setEndText] = useState(fmtClock(end0));
  const [endPm, setEndPm] = useState(isPm(end0));
  const [days, setDays] = useState(initial?.days ?? (initial?.day ? [initial.day] : [1, 3, 5]));
  const [locText, setLocText] = useState(initial?.location ?? '');
  const [showSuggest, setShowSuggest] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef(null);
  const locRef = useRef(null);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!editing) nameRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing]);

  const building = buildingFromLocation(locText);
  const q = locText.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!q || (building && locText.includes(' '))) return [];
    return CLASS_BUILDINGS.filter(
      (b) =>
        b.code.toLowerCase().startsWith(q.split(/\s+/)[0]) ||
        b.name.toLowerCase().includes(q) ||
        b.aliases?.some((a) => a.toLowerCase().startsWith(q)),
    ).slice(0, 5);
  }, [q, building, locText]);

  const toggleDay = (d) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const submit = (e) => {
    e.preventDefault();
    const start = parseClock(startText, startPm);
    const end = parseClock(endText, endPm);
    if (!name.trim()) return setError('Give the class a name, like CEN4721.');
    if (start === null || end === null) return setError('Enter times like 9:35.');
    if (end <= start) return setError('The class has to end after it starts. Check AM/PM.');
    if (!days.length) return setError('Pick at least one day.');
    if (!building) return setError('Pick a building from the list, then add the room number.');

    const cls = {
      name: name.trim().toUpperCase(),
      days,
      start,
      end,
      location: locText.trim().toUpperCase(),
      buildingId: building.id,
    };
    const clash = days
      .flatMap((d) => classesOn(schedule.classes, d))
      .find((c) => c.id !== initial?.id && start < c.end && end > c.start);

    if (editing) schedule.update(initial.id, cls);
    else schedule.add(cls);
    toast(
      clash
        ? `Saved, but it overlaps ${clash.name} (${fmtRange(clash.start, clash.end)})`
        : `${cls.name} ${editing ? 'updated' : 'added'}`,
    );
    onClose();
  };

  const del = () => {
    const undo = schedule.remove(initial.id);
    toast(`${initial.name} deleted`, { label: 'Undo', onClick: undo });
    onClose();
  };

  // Rendered over the whole phone (like the Figma "Screen shade"), not inside the scrolling screen.
  return createPortal(
    <div className="modal-shade" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-label={editing ? 'Edit class' : 'Add class'} onSubmit={submit}>
        <div className="modal-top">
          <label className="name-field">
            <input
              ref={nameRef}
              value={name}
              placeholder="Class name"
              aria-label="Class name"
              maxLength={12}
              onChange={(e) => setName(e.target.value)}
            />
            <Icon name="edit" />
          </label>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close16" />
          </button>
        </div>

        <div className="class-time">
          <TimeField label="Start" text={startText} pm={startPm} onText={setStartText} onPm={setStartPm} />
          <span className="tilde">~</span>
          <TimeField label="End" text={endText} pm={endPm} onText={setEndText} onPm={setEndPm} />
        </div>

        <div className="day-toggles" role="group" aria-label="Days">
          {WEEKDAYS.map((d) => (
            <button
              type="button"
              key={d}
              aria-pressed={days.includes(d)}
              className={days.includes(d) ? 'pill-input day on' : 'pill-input day'}
              onClick={() => toggleDay(d)}
            >
              {WEEKDAY_LETTER[d]}
            </button>
          ))}
        </div>

        <div className="loc-field">
          <label className="pill-input search-loc">
            <input
              ref={locRef}
              value={locText}
              placeholder="Search location"
              aria-label="Building and room"
              onChange={(e) => {
                setLocText(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            />
            <Icon name="search" />
          </label>
          {showSuggest && suggestions.length > 0 && (
            <ul className="loc-suggest">
              {suggestions.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setLocText(`${b.code} `);
                      locRef.current?.focus();
                    }}
                  >
                    <b>{b.code}</b> {b.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {building && <p className="loc-hint">{building.name}</p>}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="modal-actions">
          {editing && (
            <button type="button" className="text-btn danger" onClick={del}>
              Delete
            </button>
          )}
          <button type="submit" className="add-btn">
            {editing ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>,
    document.querySelector('.phone') ?? document.body,
  );
}
