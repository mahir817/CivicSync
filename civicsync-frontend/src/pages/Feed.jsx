import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campaignApi, profileApi } from '../api/client';
import { useLocale, categoryKey } from '../i18n';
import { Page, Card, Button, Field, Notice, Badge, Category, Spinner, Empty, authUser, fmtDate } from '../components/UI';

const categories = ['BLOOD', 'PET_CARE', 'CHARITY', 'DISASTER_RELIEF'];

export default function Feed() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const user = authUser();
  const userId = user?.id;
  const [campaigns, setCampaigns] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'BLOOD', location: '', latitude: '', longitude: '', goalAmount: '' });
  const [files, setFiles] = useState([]);
  const refresh = () => campaignApi.getAll().then(r => { setCampaigns(r.data); setError(''); }).catch(() => setError(t('error'))).finally(() => setLoading(false));
  useEffect(() => {
    let active = true;
    const load = () => campaignApi.getAll().then(r => { if (active) { setCampaigns(r.data); setError(''); } }).catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    load();
    const timer = setInterval(load, 30000);
    if (userId) profileApi.recommendations().then(r => { if (active) setRecommended(r.data); }).catch(() => {});
    return () => { active = false; clearInterval(timer); };
  }, [userId, t]);
  const create = async (event) => {
    event.preventDefault();
    if (!user) { navigate('/login'); return; }
    setBusy(true); setError('');
    try {
      const data = { ...form, latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        goalAmount: form.goalAmount ? Number(form.goalAmount) : null };
      if (files.length) await campaignApi.createWithImages(data, files);
      else await campaignApi.create(data);
      setShowForm(false); setForm({ title: '', description: '', category: 'BLOOD', location: '', latitude: '', longitude: '', goalAmount: '' }); setFiles([]);
      if (user) navigate('/profile');
      else refresh();
    } catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const visible = campaigns.filter(c => (filter === 'ALL' || c.category === filter) &&
    (c.title + ' ' + c.description + ' ' + (c.location || '')).toLowerCase().includes(query.toLowerCase()));
  return <Page title={t('verifiedRequests')} subtitle={t('verifiedText')} wide actions={<Button onClick={() => user ? setShowForm(!showForm) : navigate('/login')}>{t('createRequest')}</Button>}>
    {error && <div className="mb-5"><Notice>{error}</Notice><Button variant="secondary" onClick={refresh} className="mt-2">{t('retry')}</Button></div>}
    {showForm && <Card className="mb-7"><h2 className="mb-5 text-xl font-bold">{t('createRequest')}</h2><form onSubmit={create} className="grid gap-4 md:grid-cols-2">
      <Field label={t('title')} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <Field label={t('category')} as="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{t(categoryKey[c])}</option>)}</Field>
      <Field label={t('location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      <div className="flex items-end gap-2"><Field label={t('latitude')} type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })}/><Field label={t('longitude')} type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })}/></div>
      {form.category !== 'BLOOD' && <Field label={t('goalAmount')} type="number" min="1" value={form.goalAmount} onChange={e => setForm({ ...form, goalAmount: e.target.value })} />}
      <Field label={t('description')} as="textarea" rows={4} required className="md:col-span-2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <Field label={t('evidence') + ' (' + t('optional') + ')'} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={e => setFiles(Array.from(e.target.files || []))} />
      <div className="flex items-end gap-2"><Button type="submit" disabled={busy}>{t('submit')}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>{t('cancel')}</Button></div>
    </form></Card>}
    {recommended.length > 0 && <section className="mb-8"><h2 className="mb-3 text-xl font-bold">{t('recommendations')}</h2><div className="flex gap-3 overflow-x-auto pb-2">{recommended.slice(0, 4).map(item => <Link to={'/post/' + item.campaign.id} key={item.campaign.id} className="min-w-56 max-w-64 rounded-2xl border border-blue-100 bg-blue-50 p-4 hover:bg-blue-100"><p className="text-xs font-semibold uppercase text-blue-700">{t(item.reason === 'NEAR_YOU' ? 'nearYou' : item.reason === 'YOUR_INTEREST' ? 'yourInterest' : 'recentVerified')}</p><h3 className="mt-2 font-bold">{item.campaign.title}</h3></Link>)}</div></section>}
    <div className="mb-6 flex flex-wrap gap-2"><Field label={t('search')} value={query} onChange={e => setQuery(e.target.value)} className="w-full sm:w-72" /><label className="text-sm font-medium text-slate-700">{t('category')}<select className="mt-1.5 block rounded-xl border border-slate-300 bg-white px-3 py-2.5" value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">{t('all')}</option>{categories.map(c => <option key={c} value={c}>{t(categoryKey[c])}</option>)}</select></label></div>
    {loading ? <Spinner /> : visible.length === 0 ? <Empty /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(c => <Link to={'/post/' + c.id} key={c.id} className="block"><Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase text-blue-700"><Category value={c.category}/></span><Badge status={c.status}/></div><h2 className="mt-4 text-xl font-bold text-slate-900">{c.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{c.description}</p><div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{c.location || 'Dhaka'}</span><span>{fmtDate(c.createdAt)}</span></div>{c.goalAmount && <p className="mt-2 text-sm font-semibold text-emerald-700">{t('received')}: ৳{Number(c.raisedAmount || 0).toLocaleString()} / ৳{Number(c.goalAmount).toLocaleString()}</p>}</Card></Link>)}</div>}
  </Page>;
}
