import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useLocale } from '../i18n';
import { authUser } from './UI';

export default function Navbar() {
  const { t, locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = authUser();
  const links = [
    ['/home', 'home'], ['/map', 'map'], ['/civic-reports', 'reports'], ['/alerts', 'alerts'],
    ...(user ? [['/inbox', 'inbox'], ['/profile', 'profile']] : []),
    ...(user?.role === 'VERIFIER' || user?.role === 'ADMIN' ? [['/review', 'review']] : []),
    ...(user?.role === 'ADMIN' ? [['/admin', 'admin']] : []),
  ];
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setOpen(false); navigate('/login'); };
  const linkClass = ({ isActive }) => 'rounded-full px-3 py-2 text-sm transition ' + (isActive ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:text-white hover:bg-zinc-800');
  return <header className="fixed z-[1000] left-0 top-0 w-full px-3 pt-3 sm:pt-5">
    <nav className="mx-auto w-full max-w-7xl rounded-3xl sm:rounded-full border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-white shadow-2xl backdrop-blur-md" aria-label="Main navigation">
      <div className="flex items-center justify-between gap-3">
        <Link to={user ? '/home' : '/'} onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2 rounded-full pl-1 pr-2 font-bold" aria-label="CivicSync">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><img src={logo} alt="" className="h-6 w-6 object-contain" /></span>
          <span className="hidden sm:inline">CivicSync</span>
        </Link>
        <div className="hidden lg:flex items-center gap-1">{links.map(([to, key]) => <NavLink key={to} to={to} className={linkClass}>{t(key)}</NavLink>)}</div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="locale-select">{t('language')}</label>
          <select id="locale-select" value={locale} onChange={e => setLocale(e.target.value)} className="max-w-24 rounded-full bg-zinc-800 px-2 py-2 text-xs text-white" aria-label={t('language')}>
            <option value="en">English</option><option value="bn">বাংলা</option>
          </select>
          {user ? <button onClick={logout} className="hidden sm:block rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950">{t('logout')}</button>
            : <Link to="/login" className="hidden sm:block rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950">{t('login')}</Link>}
          <button onClick={() => setOpen(!open)} className="rounded-full p-2 lg:hidden" aria-label={t('menu')} aria-expanded={open}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
        </div>
      </div>
      {open && <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-700 pt-3 lg:hidden">
        {links.map(([to, key]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={linkClass}>{t(key)}</NavLink>)}
        {user ? <button onClick={logout} className="rounded-full bg-white px-3 py-2 text-left text-sm text-zinc-950 sm:hidden">{t('logout')}</button>
          : <Link to="/login" onClick={() => setOpen(false)} className="rounded-full bg-white px-3 py-2 text-sm text-zinc-950 sm:hidden">{t('login')}</Link>}
      </div>}
    </nav>
  </header>;
}
