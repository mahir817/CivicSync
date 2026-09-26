import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignApi, donationApi, profileApi } from '../api/client';
import { useLocale, categoryKey } from '../i18n';
import { Page, Card, Button, Field, Notice, Spinner, Badge, fmtDate } from '../components/UI';

const categories = ['BLOOD', 'PET_CARE', 'CHARITY', 'DISASTER_RELIEF'];
export default function Profile() {
  const { t, setLocale } = useLocale();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [posts, setPosts] = useState([]);
  const [support, setSupport] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = () => Promise.all([profileApi.get(), campaignApi.getMine(), donationApi.getMine(), donationApi.getPendingReceipts()])
    .then(([p, c, d, r]) => { setProfile(p.data); setForm(p.data); setPosts(c.data); setSupport(d.data); setReceipts(r.data); setError(''); })
    .catch(() => setError(t('error'))).finally(() => setLoading(false));
  useEffect(() => {
    let active = true;
    Promise.all([profileApi.get(), campaignApi.getMine(), donationApi.getMine(), donationApi.getPendingReceipts()])
      .then(([p, c, d, r]) => { if (active) { setProfile(p.data); setForm(p.data); setPosts(c.data); setSupport(d.data); setReceipts(r.data); } })
      .catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  const save = async e => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await profileApi.update({
        fullName: form.fullName, area: form.area, phone: form.phone, language: form.language,
        remindersEnabled: form.remindersEnabled, interests: form.interests,
      });
      setProfile(data); setForm(data); setLocale(data.language);
      localStorage.setItem('user', JSON.stringify({ id: data.id, fullName: data.fullName, email: data.email, role: data.role }));
      setNotice(t('save'));
    } catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const confirm = async d => {
    setBusy(true); setError('');
    try { await donationApi.confirmReceipt(d.campaignId, d.id); refresh(); }
    catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const toggleInterest = c => setForm({ ...form, interests: form.interests.includes(c) ? form.interests.filter(i => i !== c) : [...form.interests, c] });
  const received = support.filter(d => d.status === 'CONFIRMED' && d.type === 'MONETARY').reduce((sum, d) => sum + Number(d.amount || 0), 0);
  return <Page title={t('profile')} subtitle={profile?.email}>
    {error && <div className="mb-4"><Notice>{error}</Notice></div>}{notice && <div className="mb-4"><Notice tone="success">{notice}</Notice></div>}
    {loading ? <Spinner /> : profile && <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-slate-500">{t('myPosts')}</p><p className="mt-2 text-3xl font-extrabold">{posts.length}</p></Card>
        <Card><p className="text-sm text-slate-500">{t('mySupport')}</p><p className="mt-2 text-3xl font-extrabold">{support.length}</p></Card>
        <Card><p className="text-sm text-slate-500">{t('received')}</p><p className="mt-2 text-3xl font-extrabold">৳{received.toLocaleString()}</p></Card>
      </div>
      {receipts.length > 0 && <Card><h2 className="text-xl font-bold">{t('awaitingReceipt')}</h2><div className="mt-4 space-y-3">{receipts.map(d => <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="font-semibold">{d.campaignTitle}</p><p className="text-sm text-slate-600">{d.donorName} · ৳{Number(d.amount).toLocaleString()}</p></div><Button disabled={busy} onClick={() => confirm(d)}>{t('confirmReceipt')}</Button></div>)}</div></Card>}
      <Card><h2 className="text-xl font-bold">{t('settings')}</h2><form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={t('fullName')} required value={form.fullName || ''} onChange={e => setForm({ ...form, fullName: e.target.value })} />
        <Field label={t('area')} value={form.area || ''} onChange={e => setForm({ ...form, area: e.target.value })} />
        <Field label={t('phone')} type="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <Field label={t('language')} as="select" value={form.language || 'en'} onChange={e => setForm({ ...form, language: e.target.value })}><option value="en">English</option><option value="bn">বাংলা</option></Field>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold">{t('interests')}</legend><div className="mt-2 flex flex-wrap gap-4">{categories.map(c => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.interests?.includes(c) || false} onChange={() => toggleInterest(c)} />{t(categoryKey[c])}</label>)}</div></fieldset>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.remindersEnabled} onChange={e => setForm({ ...form, remindersEnabled: e.target.checked })} />{t('reminders')}</label>
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{t('save')}</Button></div>
      </form></Card>
      <section><h2 className="mb-4 text-2xl font-bold">{t('myPosts')}</h2>{posts.length === 0 ? <Card>{t('empty')}</Card> : <div className="space-y-3">{posts.map(c => <Link to={'/post/' + c.id} key={c.id}><Card className="mb-3 flex items-center justify-between gap-3 hover:shadow-md"><div><p className="font-bold">{c.title}</p><p className="text-xs text-slate-500">{fmtDate(c.createdAt)}</p></div><Badge status={c.status}/></Card></Link>)}</div>}</section>
      <section><h2 className="mb-4 text-2xl font-bold">{t('mySupport')}</h2>{support.length === 0 ? <Card>{t('empty')}</Card> : <div className="space-y-3">{support.map(d => <Link to={'/post/' + d.campaignId} key={d.id}><Card className="mb-3 flex items-center justify-between gap-3 hover:shadow-md"><div><p className="font-bold">{d.campaignTitle}</p><p className="text-xs text-slate-500">{fmtDate(d.createdAt)} · {d.type === 'PLEDGE' ? t('pledge') : '৳' + Number(d.amount).toLocaleString()}</p></div><span className="text-xs font-bold text-blue-700">{d.type === 'PLEDGE' ? t('pledged') : t(d.status === 'PENDING_RECEIPT' ? 'awaitingReceipt' : 'received')}</span></Card></Link>)}</div>}</section>
    </div>}
  </Page>;
}
