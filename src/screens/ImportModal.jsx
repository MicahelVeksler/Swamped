// Import a class schedule from Google Calendar or an .ics calendar file.
// Step 1: pick a source. Step 2: review the classes found, untick anything that isn't a class.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon.jsx';
import { useApp } from '../AppContext.js';
import { demoGoogleEvents } from '../data/demoCalendar.js';
import { fromGoogleEvents, parseIcs, schoolWeek } from '../utils/calendarImport.js';
import {
  GOOGLE_CLIENT_ID,
  fetchGoogleEvents,
  loadGoogleSignIn,
  requestGoogleToken,
  revokeGoogleToken,
} from '../utils/googleCalendar.js';
import { WEEKDAY_LETTER, fmtRange } from '../utils/time.js';

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
      <path d="M8 13.5h2M14 13.5h2M8 17h2" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
      <path d="M14 3v5h5M12 17v-6M9.5 13.5 12 11l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ImportModal({ onClose }) {
  const { schedule, toast, now } = useApp();
  const [step, setStep] = useState('choose'); // choose | review
  const [source, setSource] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) loadGoogleSignIn().catch(() => {});
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const review = (found, from) => {
    if (!found.length) {
      setError(`No weekday events with a start and end time were found in ${from}.`);
      return;
    }
    setSource(from);
    setCandidates(found);
    setPicked(new Set(found.filter((c) => c.likelyClass).map((c) => c.key)));
    setError('');
    setStep('review');
  };

  const connectGoogle = async () => {
    setBusy(true);
    setError('');
    // No Google client ID configured: simulate the sign-in with a sample calendar week.
    if (!GOOGLE_CLIENT_ID) {
      await new Promise((r) => setTimeout(r, 1200));
      review(fromGoogleEvents(demoGoogleEvents(schoolWeek(new Date()))), 'your Google Calendar this week');
      setBusy(false);
      return;
    }
    let token;
    try {
      token = await requestGoogleToken();
      const { from, to } = schoolWeek(new Date());
      const events = await fetchGoogleEvents(token, from, to);
      review(fromGoogleEvents(events), 'your Google Calendar this week');
    } catch (e) {
      setError(e.message);
    } finally {
      if (token) revokeGoogleToken(token);
      setBusy(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.ics$/i.test(file.name) && file.type !== 'text/calendar') {
      setError('Pick an .ics calendar file. In Google Calendar: Settings → Import & export → Export.');
      return;
    }
    try {
      const text = await file.text();
      if (!text.includes('BEGIN:VCALENDAR')) throw new Error();
      review(parseIcs(text, now), file.name);
    } catch {
      setError("That file couldn't be read as a calendar.");
    }
  };

  const toggle = (key) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const doImport = () => {
    const chosen = candidates.filter((c) => picked.has(c.key));
    schedule.importMany(
      chosen.map(({ name, days, start, end, location, buildingId }) => ({ name, days, start, end, location, buildingId })),
      { replace },
    );
    const unknown = chosen.filter((c) => !c.buildingId).length;
    toast(
      `Imported ${chosen.length} class${chosen.length === 1 ? '' : 'es'}` +
        (unknown ? `. Tap ${unknown === 1 ? 'the class' : 'classes'} marked ? to set the building.` : ''),
    );
    onClose();
  };

  return createPortal(
    <div className="modal-shade" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal import-modal" role="dialog" aria-modal="true" aria-label="Import schedule">
        <div className="modal-top">
          <h2 className="modal-title">{step === 'choose' ? 'Import your schedule' : 'Pick your classes'}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close16" />
          </button>
        </div>

        {step === 'choose' && (
          <>
            <button className="import-option" onClick={connectGoogle} disabled={busy}>
              <CalendarIcon />
              <span>
                <b>{busy ? 'Connecting…' : 'Connect Google Calendar'}</b>
                <small>Read-only. Finds this week’s classes.</small>
              </span>
            </button>
            <button className="import-option" onClick={() => fileRef.current?.click()} disabled={busy}>
              <FileIcon />
              <span>
                <b>Upload a calendar file (.ics)</b>
                <small>Export from Google Calendar, Outlook, or Canvas.</small>
              </span>
            </button>
            <input ref={fileRef} type="file" accept=".ics,text/calendar" hidden onChange={onFile} />
            <p className="import-privacy">
              Your calendar is read in this browser only. Swamped keeps just the classes you pick.
            </p>
          </>
        )}

        {step === 'review' && (
          <>
            <p className="import-sub">
              Found {candidates.length} event{candidates.length === 1 ? '' : 's'} in {source}.
            </p>
            <ul className="import-list">
              {candidates.map((c) => (
                <li key={c.key}>
                  <label className={picked.has(c.key) ? 'import-row on' : 'import-row'}>
                    <input type="checkbox" checked={picked.has(c.key)} onChange={() => toggle(c.key)} />
                    <span className="import-main">
                      <b>{c.name}</b>
                      <span className="import-meta">
                        {c.days.map((d) => WEEKDAY_LETTER[d]).join('')} · {fmtRange(c.start, c.end)}
                      </span>
                      <span className="import-loc">
                        {c.buildingId ? c.location : c.location ? `${c.location} · off campus` : 'No location'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <label className="pop-check">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              Replace my current schedule
            </label>
            <div className="modal-actions">
              <button type="button" className="text-btn" onClick={() => setStep('choose')}>
                Back
              </button>
              <button type="button" className="add-btn" disabled={!picked.size} onClick={doImport}>
                Import {picked.size || ''}
              </button>
            </div>
          </>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </div>,
    document.querySelector('.phone') ?? document.body,
  );
}
