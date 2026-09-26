import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, MapPin, MessageCircle, Share2, ShieldCheck } from 'lucide-react';
import { campaignApi, civicReportApi, healthApi, likeApi, profileApi } from '../api/client';
import { useLocale } from '../i18n';
import { useNewPost } from '../components/NewPost';
import { Page, Card, Button, Notice, Badge, Category, Spinner, Empty, authUser, fmtDate } from '../components/UI';

const filters = ['ALL', 'BLOOD', 'PET_CARE', 'CHARITY', 'DISASTER_RELIEF', 'CIVIC', 'ALERT', 'UPDATE'];
const filterKey = { ALL: 'all', BLOOD: 'blood', PET_CARE: 'petCare', CHARITY: 'charity', DISASTER_RELIEF: 'disasterRelief', CIVIC: 'civicFilter', ALERT: 'alertFilter', UPDATE: 'updatesFilter' };

function SocialActions({ type, id, onConfirm, t }) {
  const user = authUser();
  const navigate = useNavigate();
  const [likes, setLikes] = useState({ count: 0, liked: false });
  useEffect(() => {
    let active = true;
    const request = type === 'campaign' ? likeApi.getForCampaign(id) : likeApi.getForCivicReport(id);
    request.then(({ data }) => { if (active) setLikes(data); }).catch(() => {});
    return () => { active = false; };
  }, [type, id]);
  const toggle = async () => {
    if (!user) { navigate('/login'); return; }
    try { const { data } = await (type === 'campaign' ? likeApi.toggleForCampaign(id) : likeApi.toggleForCivicReport(id)); setLikes(data); } catch { /* Details page shows API errors. */ }
  };
  const share = () => navigator.clipboard?.writeText(window.location.origin + (type === 'campaign' ? '/post/' : '/civic-reports/') + id);
  return <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs sm:text-sm">
    <button onClick={toggle} className="flex items-center gap-1 rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100"><Heart size={17} className={likes.liked ? 'fill-rose-500 text-rose-500' : ''}/>{t('like')} {likes.count || ''}</button>
    <Link className="flex items-center gap-1 rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100" to={type === 'campaign' ? '/post/' + id : '/civic-reports/' + id}><MessageCircle size={17}/>{t('comments')}</Link>
    <button onClick={share} className="flex items-center gap-1 rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100"><Share2 size={17}/>{t('share')}</button>
    {type === 'civic' && <button onClick={onConfirm} className="ml-auto rounded-full bg-amber-100 px-3 py-2 font-bold text-amber-900 hover:bg-amber-200">{t('confirm')}</button>}
    {type === 'campaign' && <Link to={'/post/' + id} className="ml-auto rounded-full bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">{t('support')}</Link>}
  </div>;
}

export default function Feed() {
  const { t } = useLocale();
  const newPost = useNewPost();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [filter, setFilter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(10);
  const [campaigns, setCampaigns] = useState([]);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sentinel = useRef(null);
  const user = authUser();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const results = await Promise.allSettled([campaignApi.getAll(), civicReportApi.getActive(), healthApi.getAlerts()]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setCampaigns(results[0].value.data);
      if (results[1].status === 'fulfilled') setReports(results[1].value.data);
      if (results[2].status === 'fulfilled') setAlerts(results[2].value.data);
      setError(results.some(result => result.status === 'rejected') ? t('error') : '');
      setLoading(false);
    };
    load(); const timer = setInterval(load, 30000);
    if (user?.id) profileApi.recommendations().then(({ data }) => { if (active) setRecommended(data); }).catch(() => {});
    return () => { active = false; clearInterval(timer); };
  }, [t, user?.id]);
  const items = useMemo(() => {
    const mixed = [
      ...campaigns.map(c => ({ kind: 'campaign', id: c.id, at: c.createdAt, data: c, category: c.category })),
      ...reports.map(r => ({ kind: 'civic', id: r.id, at: r.createdAt, data: r, category: 'CIVIC' })),
      ...alerts.filter(a => a.level === 'WATCH').map(a => ({ kind: 'alert', id: a.area, at: new Date().toISOString(), data: a, category: 'ALERT' })),
      ...campaigns.filter(c => c.outcomeApproved).map(c => ({ kind: 'update', id: c.id, at: c.completedAt, data: c, category: 'UPDATE' })),
    ];
    return mixed.filter(item => (filter === 'ALL' || item.category === filter)
      && JSON.stringify([item.data.title, item.data.description, item.data.location, item.data.area, item.data.outcomeSummary]).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  }, [campaigns, reports, alerts, filter, query]);
  useEffect(() => {
    if (!sentinel.current || visibleCount >= items.length) return;
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) setVisibleCount(count => Math.min(count + 10, items.length)); }, { rootMargin: '400px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [visibleCount, items.length]);
  const confirm = async id => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await civicReportApi.confirm(id);
      setReports(current => current.map(report => report.id === id ? data : report));
    } catch (err) { setError(err.response?.data?.message || t('error')); }
  };
  const compose = () => newPost();
  return <Page wide title={t('home')} subtitle={t('landingLead')} actions={<Button onClick={compose}>{t('newPost')}</Button>}>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <Card className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{user?.fullName?.[0] || 'C'}</div><button onClick={compose} className="flex-1 rounded-full bg-slate-100 px-5 py-3 text-left text-sm text-slate-500 hover:bg-slate-200">{t('composerPrompt')}</button></Card>
        <div className="flex gap-2 overflow-x-auto pb-2">{filters.map(value => <button key={value} onClick={() => { setFilter(value); setVisibleCount(10); }} className={'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ' + (filter === value ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-blue-50')}>{t(filterKey[value])}</button>)}</div>
        {query && <p className="text-sm text-slate-600">{t('search')}: <strong>{query}</strong></p>}
        {error && <Notice>{error}</Notice>}
        {loading ? <Spinner/> : items.length === 0 ? <Empty/> : items.slice(0, visibleCount).map(item => {
          const data = item.data;
          if (item.kind === 'campaign') {
            const progress = data.goalAmount ? Math.min(100, Math.round(100 * Number(data.raisedAmount || 0) / Number(data.goalAmount))) : 0;
            return <Card key={'campaign-' + item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-blue-700"><Category value={data.category}/>{data.urgency === 'CRITICAL' && <span className="ml-2 text-rose-600">{t('critical')}</span>}</p><p className="text-xs text-slate-500">{data.requesterName} · {fmtDate(data.createdAt)} · {data.location}</p></div><Badge status={data.status}/></div>
              <Link to={'/post/' + data.id} className="mt-4 block"><h2 className="text-xl font-extrabold text-slate-900 hover:text-blue-700">{data.title}</h2><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{data.description}</p></Link>
              {data.category === 'BLOOD' ? <div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{data.bloodType || t('blood')}</span><span className="rounded-xl bg-slate-50 px-3 py-2">{data.unitsNeeded || '—'} {t('unitsNeeded')}</span><span className="rounded-xl bg-slate-50 px-3 py-2">{data.hospital || data.location}</span></div>
                : data.goalAmount && <div className="mt-4"><div className="mb-2 flex justify-between text-xs font-semibold"><span>{t('received')}: ৳{Number(data.raisedAmount || 0).toLocaleString()}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: progress + '%' }}/></div></div>}
              <SocialActions type="campaign" id={data.id} t={t}/></Card>;
          }
          if (item.kind === 'civic') return <Card key={'civic-' + item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-amber-700">{t('civicFilter')}</p><p className="text-xs text-slate-500">{data.reporterName} · {fmtDate(data.createdAt)}</p></div><Badge status={data.status}/></div><Link to={'/civic-reports/' + data.id} className="mt-4 block"><h2 className="text-lg font-bold">{data.description}</h2>{data.photoUrl && <img className="mt-4 max-h-80 w-full rounded-2xl object-cover" src={data.photoUrl} alt=""/>}</Link><p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><MapPin size={14}/>{data.latitude}, {data.longitude} · {data.confirmationCount} {t('reportCount')}</p><SocialActions type="civic" id={data.id} t={t} onConfirm={() => confirm(data.id)}/></Card>;
          if (item.kind === 'alert') return <Card key={'alert-' + item.id} className="border-rose-200"><div className="flex items-center justify-between"><p className="font-bold text-rose-700">{t('alerts')}</p><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">{t('watch')}</span></div><h2 className="mt-4 text-xl font-extrabold">{data.area}</h2><p className="mt-2 text-sm text-slate-600">{data.reportCount} {t('reportCount')} · {t('lastDays')}</p><Link className="mt-5 inline-flex items-center gap-1 rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white" to="/map?layer=health"><MapPin size={16}/>{t('viewMap')}</Link></Card>;
          return <Card key={'update-' + item.id} className="border-emerald-200"><div className="flex items-center gap-2 text-sm font-bold text-emerald-700"><ShieldCheck size={18}/>{t('proofImpact')}</div><Link to={'/post/' + data.id} className="mt-4 block text-xl font-extrabold hover:text-emerald-700">{data.title}</Link><p className="mt-2 text-sm text-slate-600">{data.outcomeSummary}</p><p className="mt-3 text-xs text-slate-500">{fmtDate(data.completedAt)}</p></Card>;
        })}
        <div ref={sentinel} className="h-2"/>
      </div>
      <aside className="space-y-5">
        <Card><h2 className="text-lg font-bold">{t('recommendations')}</h2>{recommended.length === 0 ? <p className="mt-3 text-sm text-slate-500">{t('empty')}</p> : <div className="mt-3 space-y-3">{recommended.slice(0, 5).map(item => <Link to={'/post/' + item.campaign.id} key={item.campaign.id} className="block border-t border-slate-100 pt-3"><p className="text-xs font-bold text-blue-700">{t(item.reason === 'NEAR_YOU' ? 'nearYou' : item.reason === 'YOUR_INTEREST' ? 'yourInterest' : 'recentVerified')}</p><p className="mt-1 font-semibold">{item.campaign.title}</p></Link>)}</div>}</Card>
        <Card><h2 className="text-lg font-bold">{t('howItWorks')}</h2><p className="mt-3 text-sm text-slate-600">{t('verifiedText')}</p><p className="mt-3 text-sm text-slate-600">{t('helpText')}</p></Card>
      </aside>
    </div>
  </Page>;
}
