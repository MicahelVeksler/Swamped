// Read-only Google Calendar access in the browser using Google Identity Services.
//
// Uses a Google Cloud OAuth "Web application" client ID from VITE_GOOGLE_CLIENT_ID (.env.local).
// Without one, the import screen falls back to a sample calendar (src/data/demoCalendar.js).
// The access token is only kept in memory for the import and never stored.

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const API = 'https://www.googleapis.com/calendar/v3';

let gisPromise = null;

/** Loads the Google sign-in script once. Call early so the sign-in popup opens right away on click. */
export function loadGoogleSignIn() {
  gisPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve(window.google);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      gisPromise = null;
      reject(new Error('Could not reach Google sign-in. Check your connection.'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** Opens Google's consent popup and resolves with an access token. */
export async function requestGoogleToken() {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google Calendar is not set up for this app yet.');
  const google = await loadGoogleSignIn();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp) =>
        resp.error ? reject(new Error(resp.error_description || resp.error)) : resolve(resp.access_token),
      error_callback: (err) =>
        reject(new Error(err?.type === 'popup_closed' ? 'Google sign-in was closed.' : 'Google sign-in failed.')),
    });
    client.requestAccessToken();
  });
}

async function api(token, path, params = {}) {
  const url = new URL(API + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google Calendar returned ${res.status}.`);
  return res.json();
}

/** All events between two dates on every calendar the user has turned on in Google Calendar. */
export async function fetchGoogleEvents(token, from, to) {
  const { items: calendars = [] } = await api(token, '/users/me/calendarList', { minAccessRole: 'reader' });
  const visible = calendars.filter((c) => c.selected || c.primary);
  const lists = await Promise.all(
    visible.map((c) =>
      api(token, `/calendars/${encodeURIComponent(c.id)}/events`, {
        singleEvents: 'true',
        orderBy: 'startTime',
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        maxResults: '250',
      }).then((r) => r.items ?? []),
    ),
  );
  return lists.flat();
}

/** Lets Google know we're done with the token. */
export function revokeGoogleToken(token) {
  window.google?.accounts?.oauth2?.revoke?.(token, () => {});
}
