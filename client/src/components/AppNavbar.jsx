import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AppNavbar({
  role,
  username,
  activeSection,
  onSectionChange,
  onLogout
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';
  const homePath = isDoctor ? '/doctor-dashboard' : '/patient-dashboard';
  const initials = username ? username.slice(0, 2).toUpperCase() : 'U';

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  function selectSection(section) {
    onSectionChange(section);
    setIsOpen(false);
  }

  return (
    <header className="app-navbar">
      <div className="navbar-inner">
        <Link className="brand" to={role ? homePath : '/'} aria-label="CarePoint home">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span className="brand-copy">
            <strong>CarePoint</strong>
            <small>Hospital Management</small>
          </span>
        </Link>

        <button
          className={`menu-toggle ${isOpen ? 'menu-toggle-open' : ''}`}
          type="button"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="app-navigation-drawer"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {isOpen && (
        <button
          className="drawer-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        id="app-navigation-drawer"
        className={`navigation-drawer ${isOpen ? 'navigation-drawer-open' : ''}`}
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="drawer-heading">
          <span className="eyebrow">{role ? `${role} MENU` : 'WELCOME'}</span>
          <button
            className="drawer-close"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
          >
            &times;
          </button>
        </div>

        {role && (
          <div className="drawer-user">
            <span className="account-avatar" aria-hidden="true">{initials}</span>
            <span className="account-details">
              <strong>{username || 'User'}</strong>
              <small>{role === 'doctor' ? 'Doctor account' : 'Patient account'}</small>
            </span>
          </div>
        )}

        <nav className="drawer-links" aria-label="Main navigation">
          {isDoctor && (
            <>
              <button
                className={`drawer-link ${activeSection === 'dashboard' ? 'drawer-link-active' : ''}`}
                onClick={() => selectSection('dashboard')}
                aria-current={activeSection === 'dashboard' ? 'page' : undefined}
              >
                <span className="drawer-link-icon" aria-hidden="true">⌂</span>
                Overview
              </button>
              <button
                className={`drawer-link ${activeSection === 'scheduling' ? 'drawer-link-active' : ''}`}
                onClick={() => selectSection('scheduling')}
                aria-current={activeSection === 'scheduling' ? 'page' : undefined}
              >
                <span className="drawer-link-icon" aria-hidden="true">◷</span>
                OS Scheduling
              </button>
            </>
          )}
          {isPatient && (
            <>
              <a className="drawer-link" href="#profile" onClick={() => setIsOpen(false)}>
                <span className="drawer-link-icon" aria-hidden="true">◎</span>
                My profile
              </a>
              <a className="drawer-link" href="#booking" onClick={() => setIsOpen(false)}>
                <span className="drawer-link-icon" aria-hidden="true">＋</span>
                Book visit
              </a>
              <a className="drawer-link" href="#appointments" onClick={() => setIsOpen(false)}>
                <span className="drawer-link-icon" aria-hidden="true">▤</span>
                Appointments
              </a>
            </>
          )}
          {!role && (
            <a className="drawer-link" href="#login" onClick={() => setIsOpen(false)}>
              <span className="drawer-link-icon" aria-hidden="true">→</span>
              Sign in
            </a>
          )}
        </nav>

        <div className="drawer-footer">
          {role ? (
            <button className="drawer-link drawer-signout" onClick={onLogout}>
              <span className="drawer-link-icon" aria-hidden="true">↪</span>
              Sign out
            </button>
          ) : (
            <span className="drawer-note">Patient &amp; doctor portal</span>
          )}
        </div>
      </aside>
    </header>
  );
}
