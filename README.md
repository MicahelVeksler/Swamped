# Swamped

An app for UF students to make better use of the gaps between their classes.

Swamped shows how busy campus buildings are right now and suggests where to go based on your class schedule and location, so you don't walk to a library or restaurant only to find it packed.

## Team

- Brynn Kim
- Michael Veksler
- Gabriel Velazquez

CEN4721 Human-Computer Interaction, University of Florida.

## Running the demo

### What you need

- [Node.js](https://nodejs.org) 18 or newer (the LTS download is fine). Check with `node -v`.
- [Git](https://git-scm.com/downloads).
- An internet connection (the map loads from OpenFreeMap).

### Start it

```
git clone https://github.com/gabrieltvelazquez/Swamped.git
cd Swamped
npm install
npm run dev
```

Open the URL it prints, usually **http://localhost:5173**. On a computer the app appears inside an iPhone frame that scales to fit your window. Press `Ctrl + C` in the terminal to stop it.

**On your phone:** run `npm run dev -- --host` instead, then open the "Network" URL it prints (for example `http://192.168.1.23:5173`) on a phone connected to the same Wi-Fi.

**Production build (optional):** `npm run build`, then `npm run preview`.

### Suggested demo walkthrough

1. **Map:** the campus buildings are colored by how full they are (blue is empty, red is full). Tap **Marston** to open its details, then swipe the sheet up to see popular times. Try the bookmark and share buttons.
2. **Search:** type "cfa" or "gym" in the search bar.
3. **Set the time:** go to **Schedule** and tap the **Live** chip at the top left. Pick **"Mon 11:40 AM · between classes"** so the demo looks the same any time of day.
4. **Suggestions:** the dashed block in each free gap shows the best place to go during that gap. **Close by** below the grid lists more options with walk time and occupancy. Back on the **Map** tab, the "Suggested now" card and the ★ pill point to the top pick.
5. **Import a schedule:** tap the calendar icon next to **+** and choose **Connect Google Calendar**. Review the classes found (non-class events are left unticked) and tap **Import**.
6. **Add or edit a class:** tap **+**, or tap any class card to edit or delete it.
7. **Exam week:** in the time chip, tick **Exam week** to see the libraries fill up and the suggestions change.
8. **Bookmarks:** sort by distance or least busy, and remove one with undo.

**Note:** if the app has no Google Cloud client ID set (`VITE_GOOGLE_CLIENT_ID` in `.env.local`, see `.env.example`), "Connect Google Calendar" loads a sample week (`src/data/demoCalendar.js`) instead of a real account. **Upload a calendar file (.ics)** always reads a real exported calendar.

To reset the demo, clear the site's storage in your browser (DevTools → Application → Local storage). That brings back the sample schedule and bookmarks.

## Features

- **Map:** campus map (OpenFreeMap vector style) with every place shown as a pill colored from blue (empty) to red (full); closed places are gray. Search by name or keyword (e.g. "cfa", "gym", "quiet"), zoom buttons, and a location button that turns your location on or off.
- **Building details:** tap a building to open the bottom sheet. It shows people/capacity, walk time and distance (tap for Google Maps walking directions), open/closed hours, bookmark and share buttons. Swipe up or tap the handle to see the popular-times chart (any day of the week, with a live line like "Live 2PM: A little busy") and the color legend.
- **Schedule:** M–F class grid with a red "now" line. Tap + (or an empty spot) to add a class; tap a class to edit or delete it. Locations are picked from a building list (e.g. `MALA 1000`).
- **Close by:** under the schedule, suggestions for your current gap, or a forecast for your next one. They are ranked by walking detour (from the class you just left to the class you're going to), how crowded the place is, and how much time you'd actually get there. Filter by Study, Food, Gym, or Outside.
- **Suggestions from your schedule and crowds:** every free gap on the schedule grid shows the best place for that gap, using the crowd forecast for when it starts. The map shows a "Suggested now" card, and that place gets a ★ and a blue ring.
- **Import your schedule:** the calendar button on the Schedule tab imports classes from **Google Calendar** or an **.ics file** (exported from Google Calendar, Outlook, or Canvas). You review what was found before anything is added. Weekly events and course codes (e.g. `COP 3530`) are pre-selected; locations like "Turlington Hall, Room L005" become `TUR L005`. Old semesters, all-day events, and cancelled events are skipped.
- **Bookmarks:** saved places with distance, occupancy, and hours. Sort by distance, least busy, or name; remove with undo.

Your schedule and bookmarks are saved in the browser (localStorage). Location is only used while the locate button is on, and it never leaves the device.

### Demo time

Click the **Live / Demo** chip at the top of the Schedule tab to pretend it's a different day and time, for example "Mon 11:40 AM · between classes". You can also turn on **Exam week**, which makes the libraries much busier. Choose "Use real time" to go back.

### About the data

There's no live occupancy feed yet. `src/utils/occupancy.js` builds a typical popular-times curve for each kind of place (library, dining, gym, …), scales it by day of week, and adds a small repeatable "live" variation. Building locations, hours, and capacities in `src/data/mockBuildings.js` are approximate. Replace `liveOccupancy()` with a real source (UF library and RecSports counts) when one is available.

## Project structure

```
design/initial-design/   Figma designs (link + screenshot)
src/screens/             Map, Schedule, Add class modal, Bookmarks
src/components/          Tab bar, building sheet, popular-times chart, legend, close-by list, dropdown, icons
src/data/                Placeholder buildings, sample schedule, and the sample Google Calendar week
src/utils/               Occupancy model and colors, hours, walking distance, gap finder, recommendations, calendar import
src/hooks/               Schedule, bookmarks, clock (demo time), user location
src/assets/icons/        Icons exported from the Figma file
src/styles/              Global styles (colors and sizes from the hi-fi Figma)
```

## Risks

- The app depends on accurate, timely occupancy data, which may be hard to collect.
- Uploading schedules and using location raises privacy concerns, so users should be told what is collected and how it is used.
