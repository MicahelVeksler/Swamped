// Icons exported from the Figma file (src/assets/icons).
import walk from '../assets/icons/walk.svg';
import people from '../assets/icons/people.svg';
import location16 from '../assets/icons/location-16.svg';
import location24 from '../assets/icons/location-24.svg';
import close16 from '../assets/icons/close-16.svg';
import caret16 from '../assets/icons/caret-down-16.svg';
import caret24 from '../assets/icons/caret-down-24.svg';
import plus24 from '../assets/icons/plus-24.svg';
import edit from '../assets/icons/edit.svg';
import search from '../assets/icons/search.svg';
import zoomPlus from '../assets/icons/zoom-plus.svg';
import zoomMinus from '../assets/icons/zoom-minus.svg';
import sheetBookmark from '../assets/icons/sheet-bookmark.svg';
import sheetShare from '../assets/icons/sheet-share.svg';
import sheetClose from '../assets/icons/sheet-close.svg';
import navMap from '../assets/icons/nav-map.svg';
import navSchedule from '../assets/icons/nav-schedule.svg';
import navBookmark from '../assets/icons/nav-bookmark.svg';

const ICONS = {
  walk: [walk, 24, 24],
  people: [people, 16, 16],
  location16: [location16, 16, 16],
  location24: [location24, 24, 24],
  close16: [close16, 16, 16],
  caret16: [caret16, 16, 16],
  caret24: [caret24, 24, 24],
  plus24: [plus24, 24, 24],
  edit: [edit, 12.5332, 12.5332],
  search: [search, 16, 16],
  zoomPlus: [zoomPlus, 16, 16],
  zoomMinus: [zoomMinus, 16, 16],
  sheetBookmark: [sheetBookmark, 30, 30],
  sheetShare: [sheetShare, 30, 30],
  sheetClose: [sheetClose, 30, 30],
  navMap: [navMap, 20, 19.7831],
  navSchedule: [navSchedule, 24, 24],
  navBookmark: [navBookmark, 24, 24],
};

export default function Icon({ name, className = '' }) {
  const [src, width, height] = ICONS[name];
  return <img src={src} width={width} height={height} alt="" aria-hidden="true" className={`icon ${className}`} />;
}
