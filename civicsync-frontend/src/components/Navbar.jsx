import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Menu, Plus, Search, UserRound, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { profileApi } from '../api/client';
import { useLocale } from '../i18n';
import { authUser } from './UI';
import { useNewPost } from './NewPost';

export default function Navbar() {
  const { t, locale, setLocale } = useLocale();
  const newPost = useNewPost();
  const navigate = useNavigate();
  const user = authUser();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    profileApi.notifications().then(({ data }) => { if (active) setUnread(data.filter(item => !item.read).length); }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);
  const links = [['/home', 'home'], ['/map', 'map'], ['/civic-reports', 'reports'], ['/alerts', 'alerts']];
  const roleLinks = [
    ...(user?.role === 'VERIFIER' || user?.role === 'ADMIN' ? [['/review', 'review']] : []),
    ...(user?.role === 'ADMIN' ? [['/admin', 'admin']] : []),
  ];
  const linkClass = ({ isActive }) => 'rounded-full px-3 py-2 text-sm font-medium transition ' + (isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-800');
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setOpen(false); setProfileOpen(false); navigate('/login'); };
  const search = event => { event.preventDefault(); setOpen(false); navigate('/home?q=' + encodeURIComponent(query)); };
  const compose = () => { setOpen(false); newPost(); };
  return <header className="fixed left-0 top-0 z-[1000] w-full px-3 pt-3 sm:pt-5">
    <nav aria-label={t('menu')} className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white/95 px-3 py-2 text-slate-900 shadow-xl backdrop-blur-md sm:rounded-full">
      <div className="flex items-center justify-between gap-2">
        <Link to={user ? '/home' : '/'} onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2 rounded-full pl-1 pr-2 font-bold" aria-label="CivicSync">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50"><img src={logo} alt="" className="h-6 w-6 object-contain"/></span><span className="hidden sm:inline">CivicSync</span>
        </Link>
        <div className="hidden items-center gap-1 xl:flex">{links.map(([to, key]) => <NavLink key={to} to={to} className={linkClass}>{t(key)}</NavLink>)}</div>
        <form onSubmit={search} className="hidden min-w-0 flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-3 lg:flex xl:max-w-44"><Search size={16} className="shrink-0 text-slate-400"/><input className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('search')} aria-label={t('search')}/></form>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={compose} className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 sm:px-4 sm:text-sm"><Plus size={17}/><span className="hidden sm:inline">{t('newPost')}</span></button>
          {user && <Link to="/inbox" className="relative rounded-full p-2 text-slate-700 hover:bg-slate-100" aria-label={t('inbox')}><Bell size={20}/>{unread > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] text-white">{unread}</span>}</Link>}
          <label className="sr-only" htmlFor="locale-select">{t('language')}</label>
          <select id="locale-select" value={locale} onChange={event => setLocale(event.target.value)} className="max-w-20 rounded-full bg-slate-100 px-2 py-2 text-xs text-slate-900" aria-label={t('language')}><option value="en">EN</option><option value="bn">বাংলা</option></select>
          {user ? <div className="relative hidden sm:block"><button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-2 text-sm" aria-label={t('profile')} aria-expanded={profileOpen}><UserRound size={18}/><span className="hidden max-w-20 truncate lg:inline">{user.fullName?.split(' ')[0]}</span></button>
            {profileOpen && <div className="absolute right-0 top-12 min-w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><Link onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-100" to="/profile">{t('profile')}</Link>{roleLinks.map(([to, key]) => <Link key={to} onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-100" to={to}>{t(key)}</Link>)}<button onClick={logout} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100">{t('logout')}</button></div>}</div>
            : <Link to="/login" className="hidden rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 sm:block">{t('login')}</Link>}
          <button onClick={() => setOpen(!open)} className="rounded-full p-2 xl:hidden" aria-label={t('menu')} aria-expanded={open}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
        </div>
      </div>
      {open && <div className="mt-3 border-t border-slate-200 pt-3 xl:hidden">
        <form onSubmit={search} className="mb-3 flex rounded-full bg-slate-100 px-3"><Search size={16} className="my-auto text-slate-400"/><input className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('search')} aria-label={t('search')}/></form>
        <div className="grid grid-cols-2 gap-2">{[...links, ...(user ? [['/inbox','inbox'], ['/profile','profile']] : []), ...roleLinks].map(([to, key]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={linkClass}>{t(key)}</NavLink>)}{user ? <button onClick={logout} className="rounded-full bg-blue-50 px-3 py-2 text-left text-sm text-blue-800 sm:hidden">{t('logout')}</button> : <Link to="/login" onClick={() => setOpen(false)} className="rounded-full bg-blue-50 px-3 py-2 text-sm text-blue-800 sm:hidden">{t('login')}</Link>}</div>
      </div>}
    </nav>
  </header>;
}
