import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useLocale, categoryKey } from '../i18n';
import { Page, Card, Button, Notice, Spinner, fmtDate } from '../components/UI';

const categories = ['BLOOD', 'PET_CARE', 'CHARITY', 'DISASTER_RELIEF'];
function UserRow({ user, onSave, t }) {
  const [role, setRole] = useState(user.role);
  const [selected, setSelected] = useState(user.verifierCategories || []);
  const toggle = c => setSelected(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);
  return <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{user.fullName}</p><p className="text-sm text-slate-500">{user.email}</p>{user.legacyRoleNeedsReview && <p className="mt-1 text-xs font-bold text-amber-700">{t('legacyReview')}</p>}</div>
    <div className="flex flex-wrap gap-2"><label className="text-sm">{t('role')}<select className="ml-2 rounded-lg border border-slate-300 p-2" value={role} onChange={e => setRole(e.target.value)}><option value="USER">{t('userRole')}</option><option value="VERIFIER">{t('verifierRole')}</option><option value="ADMIN">{t('adminRole')}</option></select></label><Button onClick={() => onSave(user.id, { role, verifierCategories: role === 'VERIFIER' ? selected : [], reviewed: true })}>{t('update')}</Button></div></div>
    {role === 'VERIFIER' && <fieldset className="mt-4"><legend className="text-sm font-semibold">{t('qualifiedCategories')}</legend><div className="mt-2 flex flex-wrap gap-4">{categories.map(c => <label key={c} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} />{t(categoryKey[c])}</label>)}</div></fieldset>}
  </Card>;
}

export default function Admin() {
  const { t } = useLocale();
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => Promise.all([adminApi.users(), adminApi.disputes()])
    .then(([u, d]) => { setUsers(u.data); setDisputes(d.data); setError(''); })
    .catch(() => setError(t('error'))).finally(() => setLoading(false));
  useEffect(() => {
    let active = true;
    Promise.all([adminApi.users(), adminApi.disputes()]).then(([u, d]) => { if (active) { setUsers(u.data); setDisputes(d.data); } })
      .catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  const save = async (id, data) => { try { await adminApi.updateUser(id, data); load(); } catch (err) { setError(err.response?.data?.message || t('error')); } };
  const review = async (id, status, action = 'KEEP') => { try { await adminApi.reviewDispute(id, status, action); load(); } catch (err) { setError(err.response?.data?.message || t('error')); } };
  return <Page title={t('admin')} subtitle={t('users')} wide>
    {error && <div className="mb-4"><Notice>{error}</Notice></div>}
    {loading ? <Spinner /> : <div className="grid gap-8 lg:grid-cols-2"><section><h2 className="mb-4 text-2xl font-bold">{t('users')} ({users.length})</h2><div className="space-y-3">{users.map(u => <UserRow key={u.id} user={u} onSave={save} t={t} />)}</div></section>
      <section><h2 className="mb-4 text-2xl font-bold">{t('disputes')} ({disputes.filter(d => d.status === 'OPEN').length})</h2><div className="space-y-3">{disputes.length === 0 ? <Card>{t('empty')}</Card> : disputes.map(d => <Card key={d.id}><div className="flex justify-between gap-3"><Link to={d.postType === 'CAMPAIGN' ? '/post/' + d.postId : '/civic-reports/' + d.postId} className="font-bold text-blue-700">{t(d.postType === 'CAMPAIGN' ? 'campaignType' : 'civicType')} #{d.postId}</Link><span className="text-xs font-semibold text-slate-500">{t(d.status === 'OPEN' ? 'openDispute' : d.status === 'RESOLVED' ? 'resolvedDispute' : 'dismissedDispute')}</span></div><p className="mt-2 text-sm">{d.reason}</p><p className="mt-2 text-xs text-slate-500">{d.createdBy} · {fmtDate(d.createdAt)}</p>{d.status === 'OPEN' && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => review(d.id, 'RESOLVED')}>{t('resolveDispute')}</Button><Button variant="danger" onClick={() => review(d.id, 'RESOLVED', 'HIDE')}>{t('hideContent')}</Button><Button variant="secondary" onClick={() => review(d.id, 'DISMISSED')}>{t('dismiss')}</Button></div>}</Card>)}</div></section></div>}
  </Page>;
}
