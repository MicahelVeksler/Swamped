// Light-blue pill dropdown from the Figma "Day dropdown" / "Day selection" components.
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function Dropdown({ label, options, value, onChange, size = 'small', ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`dropdown ${size}`} ref={ref}>
      <button
        className="dropdown-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <Icon name={size === 'large' ? 'caret24' : 'caret16'} />
      </button>
      {open && (
        <ul className="dropdown-menu" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                role="option"
                aria-selected={o.value === value}
                className={o.value === value ? 'selected' : ''}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
