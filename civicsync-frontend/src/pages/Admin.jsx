import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useLocale, categoryKey } from '../i18n';
import { Page, Card, Button, Notice, Spinner, fmtDate } from '../components/UI';
import { ReviewQueue } from './Review';

const categories = ['BLOOD', 'PET_CARE', 'CHARITY', 'DISASTER_RELIEF'];
const tabs = ['dashboard', 'review', 'users', 'disputes'];
function UserRow({ user, onSave, t }) {
  const [role, setRole] = useState(user.role);
  const [selected, setSelected] = useState(user.verifierCategories || []);
  const toggle = value => setSelected(current => current.includes(value) ? current.filter(category => category !== value) : [...current, value]);
  return <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{user.fullName}</p><p className="text-sm text-slate-500">{user.email}</p>{user.legacyRoleNeedsReview && <p className="mt-1 text-xs font-bold text-amber-700">{t('legacyReview')}</p>}</div><div className="flex flex-wrap gap-2"><label className="text-sm">{t('role')}<select className="ml-2 rounded-lg border border-slate-300 p-2" value={role} onChange={event => setRole(event.target.value)}><option value="USER">{t('userRole')}</option><option value="VERIFIER">{t('verifierRole')}</option><option value="ADMIN">{t('adminRole')}</option></select></label><Button onClick={() => onSave(user.id, { role, verifierCategories: role === 'VERIFIER' ? selected : [], reviewed: true })}>{t('update')}</Button></div></div>{role === 'VERIFIER' && <fieldset className="mt-4"><legend className="text-sm font-semibold">{t('qualifiedCategories')}</legend><div className="mt-2 flex flex-wrap gap-4">{categories.map(category => <label key={category} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={selected.includes(category)} onChange={() => toggle(category)}/>{t(categoryKey[category])}</label>)}</div></fieldset>}</Card>;
}
export default function Admin() {
  const { t } = useLocale();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      const [userResult, disputeResult, dashboardResult] = await Promise.all([adminApi.users(), adminApi.disputes(), adminApi.dashboard()]);
      setUsers(userResult.data); setDisputes(disputeResult.data); setStats(dashboardResult.data); setError('');
    } catch { setError(t('error')); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([adminApi.users(), adminApi.disputes(), adminApi.dashboard()])
      .then(([u,d,s]) => { if (active) { setUsers(u.data); setDisputes(d.data); setStats(s.data); } })
      .catch(() => { if (active) setError(t('error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  const save = async (id, data) => { try { await adminApi.updateUser(id, data); await load(); } catch (err) { setError(err.response?.data?.message || t('error')); } };
  const review = async (id, status, action = 'KEEP') => { try { await adminApi.reviewDispute(id, status, action); await load(); } catch (err) { setError(err.response?.data?.message || t('error')); } };
  const tiles = stats && [['users',stats.users],['pendingReviews',stats.pendingCampaigns],['liveCampaigns',stats.liveCampaigns],['activeReports',stats.activeCivicReports],['pendingReceipts',stats.pendingReceipts],['openDisputes',stats.openDisputes]];
  return <Page wide title={t('admin')} subtitle={t('dashboard')}>
    <div className="mb-7 flex flex-wrap gap-2">{tabs.map(key => <button key={key} onClick={() => setTab(key)} className={'rounded-full px-4 py-2 text-sm font-bold ' + (tab === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-700')}>{t(key)}</button>)}</div>
    {error && <div className="mb-4"><Notice>{error}</Notice></div>}
    {loading ? <Spinner/> : <>
      {tab === 'dashboard' && <div className="space-y-7"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tiles.map(([label,value]) => <Card key={label}><p className="text-sm text-slate-500">{t(label)}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></Card>)}</div><div className="flex flex-wrap gap-3"><Button onClick={() => setTab('review')}>{t('pendingReviews')}</Button><Button variant="secondary" onClick={() => setTab('users')}>{t('users')}</Button><Button variant="secondary" onClick={() => setTab('disputes')}>{t('disputes')}</Button></div></div>}
      {tab === 'review' && <ReviewQueue/>}
      {tab === 'users' && <section><h2 className="mb-4 text-2xl font-bold">{t('users')} ({users.length})</h2><div className="space-y-3">{users.length === 0 ? <Card>{t('empty')}</Card> : users.map(user => <UserRow key={user.id} user={user} onSave={save} t={t}/>)}</div></section>}
      {tab === 'disputes' && <section><h2 className="mb-4 text-2xl font-bold">{t('disputes')} ({disputes.filter(item => item.status === 'OPEN').length})</h2><div className="space-y-3">{disputes.length === 0 ? <Card>{t('empty')}</Card> : disputes.map(item => <Card key={item.id}><div className="flex flex-wrap justify-between gap-3"><Link to={item.postType === 'CAMPAIGN' ? '/post/' + item.postId : '/civic-reports/' + item.postId} className="font-bold text-blue-700">{t(item.postType === 'CAMPAIGN' ? 'campaignType' : 'civicType')} #{item.postId}</Link><span className="text-xs font-bold text-slate-500">{t(item.status === 'OPEN' ? 'openDispute' : item.status === 'RESOLVED' ? 'resolvedDispute' : 'dismissedDispute')}</span></div><p className="mt-2 text-sm">{item.reason}</p><p className="mt-2 text-xs text-slate-500">{item.createdBy} · {fmtDate(item.createdAt)}</p>{item.status === 'OPEN' && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => review(item.id, 'RESOLVED')}>{t('resolveDispute')}</Button><Button variant="danger" onClick={() => review(item.id, 'RESOLVED', 'HIDE')}>{t('hideContent')}</Button><Button variant="secondary" onClick={() => review(item.id, 'DISMISSED')}>{t('dismiss')}</Button></div>}</Card>)}</div></section>}
    </>}
  </Page>;
}
