import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { attachmentApi, campaignApi } from '../api/client';
import { useLocale, categoryKey } from '../i18n';
import { Page, Card, Button, Notice, Spinner, Category, fmtDate } from '../components/UI';

export function ReviewQueue() {
  const { t } = useLocale();
  const [pending, setPending] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      const [requests, updates] = await Promise.all([campaignApi.getPending(), campaignApi.getPendingOutcomes()]);
      setPending(requests.data); setOutcomes(updates.data); setError('');
    } catch { setError(t('error')); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([campaignApi.getPending(), campaignApi.getPendingOutcomes()])
      .then(([requests, updates]) => { if (active) { setPending(requests.data); setOutcomes(updates.data); } })
      .catch(() => { if (active) setError(t('error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    attachmentApi.getForCampaign(selected.id).then(({ data }) => { if (active) setAttachments(data); }).catch(() => { if (active) setAttachments([]); });
    return () => { active = false; };
  }, [selected]);
  const act = async (id, action, note = '') => {
    setBusy(true); setError('');
    try {
      await campaignApi.review(id, action, note);
      setSelected(null); setReason(''); await load();
    } catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const approveOutcome = async id => {
    setBusy(true); setError('');
    try { await campaignApi.approveOutcome(id); await load(); }
    catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const categories = [...new Set(pending.map(request => request.category))];
  const shown = pending.filter(request => filter === 'ALL' || request.category === filter);
  return <div className="space-y-8">
    {error && <Notice>{error}</Notice>}
    {loading ? <Spinner/> : <>
      <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">{t('pendingReviews')} ({pending.length})</h2><label className="text-sm">{t('category')} <select value={filter} onChange={event => setFilter(event.target.value)} className="ml-1 rounded-lg border border-slate-300 bg-white p-2"><option value="ALL">{t('all')}</option>{categories.map(category => <option key={category} value={category}>{t(categoryKey[category])}</option>)}</select></label></div>
        <div className="grid gap-4 lg:grid-cols-[minmax(250px,1fr)_minmax(0,1.4fr)]">
          <div className="space-y-2">{shown.length === 0 ? <Card>{t('empty')}</Card> : shown.map(request => <button key={request.id} onClick={() => { setSelected(request); setReason(''); }} className={'w-full rounded-2xl border bg-white p-4 text-left shadow-sm hover:border-blue-300 ' + (selected?.id === request.id ? 'border-blue-500' : 'border-slate-200')}><span className="text-xs font-bold text-blue-700"><Category value={request.category}/></span><p className="mt-1 font-bold">{request.title}</p><p className="mt-1 text-xs text-slate-500">{request.requesterName} · {request.location} · {fmtDate(request.createdAt)}</p></button>)}</div>
          <Card>{!selected ? <p className="text-sm text-slate-500">{t('reviewDetails')}</p> : <div className="space-y-4"><div><p className="text-xs font-bold text-blue-700"><Category value={selected.category}/></p><h3 className="mt-1 text-xl font-extrabold">{selected.title}</h3><p className="mt-1 text-xs text-slate-500">{selected.requesterName} · {selected.location}</p></div><p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.description}</p>
            {selected.category === 'BLOOD' && <div className="grid gap-2 rounded-xl bg-rose-50 p-3 text-sm sm:grid-cols-2"><p>{t('patientName')}: {selected.patientName}</p><p>{t('bloodType')}: {selected.bloodType}</p><p>{t('unitsNeeded')}: {selected.unitsNeeded}</p><p>{t('hospital')}: {selected.hospital}</p></div>}
            {attachments.length > 0 && <div><h4 className="font-bold">{t('evidence')}</h4>{attachments.map(file => <a key={file.id} className="mt-2 block text-sm font-semibold text-blue-700 underline" target="_blank" rel="noreferrer" href={file.url || '/api/files/' + file.storedFileName}>{file.fileName}</a>)}</div>}
            <textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} maxLength={1000} className="w-full rounded-xl border border-slate-300 p-3 text-sm" placeholder={t('reviewReason')} aria-label={t('reviewReason')}/>
            <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => act(selected.id, 'APPROVE')}>{t('approve')}</Button><Button disabled={busy || !reason.trim()} variant="secondary" onClick={() => act(selected.id, 'REQUEST_INFO', reason)}>{t('requestInfo')}</Button><Button disabled={busy || !reason.trim()} variant="danger" onClick={() => act(selected.id, 'REJECT', reason)}>{t('reject')}</Button></div>
          </div>}</Card>
        </div>
      </section>
      <section><h2 className="mb-4 text-2xl font-bold">{t('pendingOutcomes')} ({outcomes.length})</h2><div className="grid gap-4 md:grid-cols-2">{outcomes.length === 0 ? <Card>{t('empty')}</Card> : outcomes.map(outcome => <Card key={outcome.campaign.id}><Link className="font-bold text-blue-700" to={'/post/' + outcome.campaign.id}>{outcome.campaign.title}</Link><p className="my-3 whitespace-pre-wrap text-sm">{outcome.summary}</p>{outcome.proofUrl && <a href={outcome.proofUrl} target="_blank" rel="noreferrer" className="mb-3 block text-sm font-bold text-blue-600">{t('evidence')}</a>}<Button disabled={busy} onClick={() => approveOutcome(outcome.campaign.id)}>{t('approveOutcome')}</Button></Card>)}</div></section>
    </>}
  </div>;
}
export default function Review() { const { t } = useLocale(); return <Page wide title={t('review')} subtitle={t('verifiedText')}><ReviewQueue/></Page>; }
