import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AppNavbar({ role, username, activeSection, onSectionChange, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';
  const isAdmin = role === 'admin';
  const homePath = isDoctor ? '/doctor-dashboard' : isAdmin ? '/admin-dashboard' : '/patient-dashboard';
  const accountLabel = isDoctor ? 'Doctor account' : isAdmin ? 'Administrator account' : 'Patient account';
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
    onSectionChange?.(section);
    setIsOpen(false);
  }

  function sectionLink(section, label, icon) {
    const active = activeSection === section;
    return (
      <button
        key={section}
        className={`drawer-link ${active ? 'drawer-link-active' : ''}`}
        onClick={() => selectSection(section)}
        aria-current={active ? 'page' : undefined}
      >
        <span className="drawer-link-icon" aria-hidden="true">{icon}</span>
        {label}
      </button>
    );
  }

  function patientLink(id, label, icon) {
    return (
      <a key={id} className="drawer-link" href={`#${id}`} onClick={() => setIsOpen(false)}>
        <span className="drawer-link-icon" aria-hidden="true">{icon}</span>
        {label}
      </a>
    );
  }

  function navigationItems() {
    if (isDoctor) {
      return <>
        {sectionLink('dashboard', 'Overview', '⌂')}
        {sectionLink('scheduling', 'OS Scheduling', '◷')}
        {sectionLink('records', 'Medical Records', '▤')}
      </>;
    }
    if (isPatient) {
      return <>
        {patientLink('profile', 'My profile', '◎')}
        {patientLink('booking', 'Book visit', '＋')}
        {patientLink('appointments', 'Appointments', '▤')}
      </>;
    }
    if (isAdmin) {
      return <Link className="drawer-link" to="/admin-dashboard" onClick={() => setIsOpen(false)}>
        <span className="drawer-link-icon" aria-hidden="true">⌂</span>Overview
      </Link>;
    }
    return <>
      <Link className="drawer-link" to="/" onClick={() => setIsOpen(false)}>
        <span className="drawer-link-icon" aria-hidden="true">→</span>Sign in
      </Link>
      <Link className="drawer-link navbar-primary-link" to="/signup" onClick={() => setIsOpen(false)}>
        <span className="drawer-link-icon" aria-hidden="true">＋</span>Create patient account
      </Link>
    </>;
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

        <nav className="navbar-links navbar-desktop-links" aria-label="Main navigation">
          {navigationItems()}
        </nav>

        <div className="navbar-account">
          {role && <>
            <span className="account-avatar" aria-hidden="true">{initials}</span>
            <span className="account-details">
              <strong>{username || 'User'}</strong>
              <small>{accountLabel}</small>
            </span>
            <button className="btn btn-secondary navbar-logout" onClick={onLogout}>Sign out</button>
          </>}
          <button
            className={`menu-toggle ${isOpen ? 'menu-toggle-open' : ''}`}
            type="button"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            aria-controls="app-navigation-drawer"
            onClick={() => setIsOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {isOpen && <button className="drawer-backdrop" aria-label="Close navigation menu" onClick={() => setIsOpen(false)} />}
      <aside
        id="app-navigation-drawer"
        className={`navigation-drawer ${isOpen ? 'navigation-drawer-open' : ''}`}
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="drawer-heading">
          <span className="eyebrow">{role ? `${role} MENU` : 'WELCOME'}</span>
          <button className="drawer-close" type="button" aria-label="Close navigation menu" onClick={() => setIsOpen(false)}>&times;</button>
        </div>
        {role && (
          <div className="drawer-user">
            <span className="account-avatar" aria-hidden="true">{initials}</span>
            <span className="account-details">
              <strong>{username || 'User'}</strong>
              <small>{accountLabel}</small>
            </span>
          </div>
        )}
        <nav className="drawer-links" aria-label="Main navigation">{navigationItems()}</nav>
        <div className="drawer-footer">
          {role
            ? <button className="drawer-link drawer-signout" onClick={() => { setIsOpen(false); onLogout?.(); }}><span className="drawer-link-icon" aria-hidden="true">↪</span>Sign out</button>
            : <span className="drawer-note">Patient &amp; doctor portal</span>}
        </div>
      </aside>
    </header>
  );
}
