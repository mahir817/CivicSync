import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Notice, Spinner, Category, fmtDate } from '../components/UI';

export default function Review() {
  const { t } = useLocale();
  const [pending, setPending] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => Promise.all([campaignApi.getPending(), campaignApi.getPendingOutcomes()])
    .then(([a, b]) => { setPending(a.data); setOutcomes(b.data); setError(''); })
    .catch(() => setError(t('error'))).finally(() => setLoading(false));
  useEffect(() => {
    let active = true;
    Promise.all([campaignApi.getPending(), campaignApi.getPendingOutcomes()])
      .then(([a, b]) => { if (active) { setPending(a.data); setOutcomes(b.data); } })
      .catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  const act = async call => { try { await call(); load(); } catch (err) { setError(err.response?.data?.message || t('error')); } };
  return <Page title={t('review')} subtitle={t('verifiedText')}>
    {error && <div className="mb-4"><Notice>{error}</Notice></div>}
    {loading ? <Spinner /> : <div className="space-y-9"><section><h2 className="mb-4 text-2xl font-bold">{t('pendingReviews')} ({pending.length})</h2>
      {pending.length === 0 ? <Card>{t('empty')}</Card> : <div className="space-y-4">{pending.map(c => <Card key={c.id}><div className="flex flex-wrap justify-between gap-3"><div><span className="text-xs font-bold text-blue-600"><Category value={c.category}/></span><Link to={'/post/' + c.id} className="mt-1 block text-lg font-bold hover:text-blue-600">{c.title}</Link><p className="text-sm text-slate-500">{c.requesterName} · {c.location} · {fmtDate(c.createdAt)}</p><p className="mt-3 max-w-2xl text-sm">{c.description}</p></div><div className="flex items-start gap-2"><Button onClick={() => act(() => campaignApi.verify(c.id, true))}>{t('approve')}</Button><Button variant="danger" onClick={() => act(() => campaignApi.verify(c.id, false))}>{t('reject')}</Button></div></div></Card>)}</div>}
    </section><section><h2 className="mb-4 text-2xl font-bold">{t('pendingOutcomes')} ({outcomes.length})</h2>
      {outcomes.length === 0 ? <Card>{t('empty')}</Card> : <div className="space-y-4">{outcomes.map(o => <Card key={o.campaign.id}><Link className="font-bold text-blue-700" to={'/post/' + o.campaign.id}>{o.campaign.title}</Link><p className="my-3 text-sm">{o.summary}</p>{o.proofUrl && <a href={o.proofUrl} target="_blank" rel="noreferrer" className="mr-3 text-sm font-bold text-blue-600">{t('evidence')}</a>}<Button onClick={() => act(() => campaignApi.approveOutcome(o.campaign.id))}>{t('approveOutcome')}</Button></Card>)}</div>}
    </section></div>}
  </Page>;
}
