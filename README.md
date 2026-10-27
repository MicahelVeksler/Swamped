# Swamped

An app for UF students to make better use of the gaps between their classes.

Swamped shows how busy campus buildings are right now and suggests where to go based on your class schedule and location, so you don't walk to a library or restaurant only to find it packed.

## Team

- Brynn Kim
- Michael Veksler
- Gabriel Velazquez

CEN4721 Human-Computer Interaction, University of Florida.

## Planned features

- **Map:** interactive campus map with buildings colored from blue (empty) to red (full).
- **Building details:** capacity, walk time, hours, and a popular-times chart.
- **Schedule:** weekly class grid plus recommendations for the current gap.
- **Bookmarks:** quick access to favorite libraries, dining spots, and gyms, sortable by distance or occupancy.

## Project structure

```
design/initial-design/   Figma low-fidelity screens
src/screens/             Map, Schedule, Add class, Bookmarks
src/components/          Tab bar, building sheet, popular-times chart, legend
src/data/                Placeholder buildings and schedule
src/utils/               Occupancy color, gap finder, recommendations
src/hooks/               Bookmark state
src/styles/              Global styles
```

Every file currently contains a one-line description of its intended purpose. Implementation comes next.

## Risks

- The app depends on accurate, timely occupancy data, which may be hard to collect.
- Uploading schedules and using location raises privacy concerns, so users should be told what is collected and how it is used.
