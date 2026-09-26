import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { campaignApi, civicReportApi, donationApi, attachmentApi, commentApi, likeApi, disputeApi, uploadApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Field, Notice, Badge, Category, Spinner, authUser, fmtDate } from '../components/UI';

export default function PostDetail() {
  const { id } = useParams();
  const civic = useLocation().pathname.startsWith('/civic-reports/');
  const { t } = useLocale();
  const navigate = useNavigate();
  const user = authUser();
  const [post, setPost] = useState(null);
  const [donations, setDonations] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState({ count: 0, liked: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [comment, setComment] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [outcome, setOutcome] = useState('');
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try {
      const response = civic ? await civicReportApi.getById(id) : await campaignApi.getById(id);
      setPost(response.data); setError('');
      const commentsRequest = civic ? commentApi.getForCivicReport(id) : commentApi.getForCampaign(id);
      const likesRequest = civic ? likeApi.getForCivicReport(id) : likeApi.getForCampaign(id);
      commentsRequest.then(r => setComments(r.data)).catch(() => {});
      likesRequest.then(r => setLikes(r.data)).catch(() => {});
      if (!civic) {
        donationApi.getForCampaign(id).then(r => setDonations(r.data)).catch(() => {});
        attachmentApi.getForCampaign(id).then(r => setAttachments(r.data)).catch(() => {});
      }
    } catch { setError(t('noResults')); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = civic ? await civicReportApi.getById(id) : await campaignApi.getById(id);
        if (!active) return;
        setPost(response.data);
        const commentsRequest = civic ? commentApi.getForCivicReport(id) : commentApi.getForCampaign(id);
        const likesRequest = civic ? likeApi.getForCivicReport(id) : likeApi.getForCampaign(id);
        commentsRequest.then(r => { if (active) setComments(r.data); }).catch(() => {});
        likesRequest.then(r => { if (active) setLikes(r.data); }).catch(() => {});
        if (!civic) {
          donationApi.getForCampaign(id).then(r => { if (active) setDonations(r.data); }).catch(() => {});
          attachmentApi.getForCampaign(id).then(r => { if (active) setAttachments(r.data); }).catch(() => {});
        }
      } catch { if (active) setError(t('noResults')); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [id, civic, t]);
  const run = async (action, success) => {
    if (!user) { navigate('/login'); return; }
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success || t('thanks')); await refresh(); }
    catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const pledgeOnly = post && (post.category === 'BLOOD' || !post.goalAmount);
  const contribute = event => {
    event.preventDefault();
    run(() => donationApi.create(id, pledgeOnly ? { type: 'PLEDGE', message } : { type: 'MONETARY', amount: Number(amount), message }),
      pledgeOnly ? t('pledge') : t('awaitingReceipt'));
    setAmount(''); setMessage('');
  };
  const addComment = event => { event.preventDefault(); run(() => civic ? commentApi.addToCivicReport(id, comment) : commentApi.addToCampaign(id, comment)); setComment(''); };
  const flag = event => { event.preventDefault(); run(() => disputeApi.create({ postType: civic ? 'CIVIC_REPORT' : 'CAMPAIGN', postId: Number(id), reason: flagReason })); setFlagReason(''); };
  const submitOutcome = event => {
    event.preventDefault();
    run(async () => { const proofUrl = proof ? (await uploadApi.image(proof)).data.url : null; await campaignApi.submitOutcome(id, { summary: outcome, proofUrl }); });
    setOutcome(''); setProof(null);
  };
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); setNotice(t('copied')); } catch { setError(t('error')); } };
  return <Page title={loading ? t('loading') : civic ? t('reports') : post?.title} actions={<Button variant="secondary" onClick={() => navigate(-1)}>{t('back')}</Button>}>
    {loading ? <Spinner /> : error && !post ? <Notice>{error}</Notice> : post && <div className="space-y-5">
      {error && <Notice>{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">{civic
          ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{t(post.status === 'CONFIRMED' ? 'confirmed' : 'unconfirmed')}</span>
          : <div className="flex items-center gap-2"><Category value={post.category}/><Badge status={post.status}/></div>}
          <span className="text-xs text-slate-500">{fmtDate(post.createdAt)}</span>
        </div>
        {civic ? <h1 className="mt-5 text-2xl font-bold">{post.description}</h1> : <p className="mt-5 whitespace-pre-wrap leading-relaxed text-slate-700">{post.description}</p>}
        {post.photoUrl && <img src={post.photoUrl} alt="" className="mt-5 max-h-96 w-full rounded-xl object-cover" />}
        <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <p>{civic ? post.reporterName : post.requesterName}</p>
          {civic ? <p>{post.latitude}, {post.longitude} · {post.confirmationCount} {t('reportCount')}</p>
            : <><p>{post.location}</p>{post.goalAmount && <p className="font-semibold text-emerald-700">{t('received')}: ৳{Number(post.raisedAmount || 0).toLocaleString()} / ৳{Number(post.goalAmount).toLocaleString()}</p>}</>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => run(() => civic ? likeApi.toggleForCivicReport(id) : likeApi.toggleForCampaign(id))}>{likes.liked ? '♥' : '♡'} {likes.count}</Button>
          <Button variant="secondary" onClick={share}>{t('share')}</Button>
          {civic && user && <Button disabled={busy} onClick={() => run(() => civicReportApi.confirm(id))}>{t('confirm')}</Button>}
          {civic && user?.id === post.reporterId && <Button variant="secondary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await civicReportApi.resolve(id); navigate('/civic-reports'); } catch (err) { setError(err.response?.data?.message || t('error')); } finally { setBusy(false); } }}>{t('resolve')}</Button>}
        </div>
      </Card>
      {!civic && <Card><h2 className="text-xl font-bold">{t('trustTrail')}</h2><div className="mt-4 space-y-2 text-sm text-slate-600"><p>{t('submitted')}: {fmtDate(post.createdAt)}</p><p>{t('reviewed')}: {post.verifiedByName || t('pending')} {post.verifiedAt && '· ' + fmtDate(post.verifiedAt)}</p>{post.outcomeApproved && <p>{t('completed')}: {fmtDate(post.completedAt)}</p>}</div>
        {post.outcomeApproved && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><h3 className="font-bold">{t('evidence')}</h3><p>{post.outcomeSummary}</p>{post.outcomeProofUrl && <a className="font-bold text-blue-600" href={post.outcomeProofUrl} target="_blank" rel="noreferrer">{t('evidence')}</a>}</div>}
        {attachments.length > 0 && <div className="mt-4 space-y-1">{attachments.map(a => <a key={a.id} href={a.url || '/api/files/' + a.storedFileName} target="_blank" rel="noreferrer" className="block text-sm font-medium text-blue-600">{a.fileName}</a>)}</div>}
      </Card>}
      {!civic && post.status === 'VERIFIED' && <Card><h2 className="text-xl font-bold">{t(pledgeOnly ? 'pledge' : 'donate')}</h2><form onSubmit={contribute} className="mt-4 space-y-4">
        {!pledgeOnly && <Field label={t('amount')} type="number" min="1" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />}
        <Field label={t('note') + ' (' + t('optional') + ')'} as="textarea" rows={2} value={message} onChange={e => setMessage(e.target.value)} />
        <Button type="submit" disabled={busy}>{t(pledgeOnly ? 'pledge' : 'donate')}</Button></form>
        {donations.length > 0 && <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="font-bold">{t('supporters')}</h3>{donations.map(d => <p key={d.id} className="mt-2 text-sm text-slate-600">{d.donorName} · {d.type === 'PLEDGE' ? t('pledge') : '৳' + Number(d.amount).toLocaleString()}</p>)}</div>}
      </Card>}
      {!civic && user?.id === post.requesterId && post.status === 'VERIFIED' && <Card><h2 className="font-bold">{t('submitOutcome')}</h2><form onSubmit={submitOutcome} className="mt-4 space-y-3"><Field label={t('description')} as="textarea" rows={3} required value={outcome} onChange={e => setOutcome(e.target.value)}/><Field label={t('evidence')} type="file" accept="image/*" onChange={e => setProof(e.target.files?.[0] || null)}/><Button disabled={busy} type="submit">{t('submitOutcome')}</Button></form></Card>}
      <Card><h2 className="text-xl font-bold">{t('comments')}</h2><div className="mt-4 space-y-3">{comments.map(c => <div key={c.id} className="border-b border-slate-100 pb-3"><strong>{c.authorName}</strong><p className="text-sm text-slate-600">{c.content}</p></div>)}</div><form onSubmit={addComment} className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2" placeholder={t('writeComment')} required value={comment} onChange={e => setComment(e.target.value)} /><Button type="submit" disabled={busy}>{t('postComment')}</Button></form></Card>
      {user && <Card><h2 className="font-bold">{t('flag')}</h2><form onSubmit={flag} className="mt-3 flex flex-wrap gap-2"><input className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2" placeholder={t('reason')} required value={flagReason} onChange={e => setFlagReason(e.target.value)}/><Button variant="secondary" type="submit" disabled={busy}>{t('submit')}</Button></form></Card>}
      {civic && <Link to="/map" className="font-bold text-blue-600">{t('map')}</Link>}
    </div>}
  </Page>;
}
