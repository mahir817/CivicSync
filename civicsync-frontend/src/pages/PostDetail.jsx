import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { campaignApi, civicReportApi, donationApi, attachmentApi, commentApi, likeApi, disputeApi, uploadApi, bloodDonorApi } from '../api/client';
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
  const [donors, setDonors] = useState([]);
  const [donorSearch, setDonorSearch] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState({ count: 0, liked: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [editFiles, setEditFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [outcome, setOutcome] = useState('');
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try {
      const response = civic ? await civicReportApi.getById(id) : await campaignApi.getById(id);
      setPost(response.data); setEdit(response.data); setError('');
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
        setPost(response.data); setEdit(response.data);
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
    setConfirming(true);
  };
  const confirmSupport = async () => {
    setConfirming(false);
    await run(() => donationApi.create(id, pledgeOnly ? { type: 'PLEDGE', message, contactPhone } : { type: 'MONETARY', amount: Number(amount), message }),
      pledgeOnly ? t('pledged') : t('awaitingReceipt'));
    setAmount(''); setMessage(''); setContactPhone('');
  };
  const resubmit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { title: edit.title, description: edit.description, category: edit.category,
        location: edit.location, latitude: edit.latitude, longitude: edit.longitude,
        goalAmount: edit.category === 'BLOOD' ? null : edit.goalAmount,
        patientName: edit.category === 'BLOOD' ? edit.patientName : null,
        bloodType: edit.category === 'BLOOD' ? edit.bloodType : null,
        unitsNeeded: edit.category === 'BLOOD' ? Number(edit.unitsNeeded) : null,
        hospital: edit.category === 'BLOOD' ? edit.hospital : null, urgency: edit.urgency,
        verifierCode: edit.verifierCode };
      await campaignApi.resubmit(id, payload);
      if (editFiles.length) await attachmentApi.upload(id, editFiles);
      setEditOpen(false); setEditFiles([]); await refresh(); setNotice(t('resubmit'));
    } catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  const addComment = event => { event.preventDefault(); run(() => civic ? commentApi.addToCivicReport(id, comment) : commentApi.addToCampaign(id, comment)); setComment(''); };
  const flag = event => { event.preventDefault(); run(() => disputeApi.create({ postType: civic ? 'CIVIC_REPORT' : 'CAMPAIGN', postId: Number(id), reason: flagReason })); setFlagReason(''); };
  const submitOutcome = event => {
    event.preventDefault();
    run(async () => { const proofUrl = proof ? (await uploadApi.image(proof)).data.url : null; await campaignApi.submitOutcome(id, { summary: outcome, proofUrl }); });
    setOutcome(''); setProof(null);
  };
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); setNotice(t('copied')); } catch { setError(t('error')); } };
  const findDonors = async () => {
    if (!user) { navigate('/login'); return; }
    setDonorSearch(true); setError('');
    try { const { data } = await bloodDonorApi.find(post.bloodType, post.location); setDonors(data); }
    catch (err) { setError(err.response?.data?.message || t('error')); }
  };
  return <Page title={loading ? t('loading') : civic ? t('reports') : post?.title} actions={<Button variant="secondary" onClick={() => navigate(-1)}>{t('back')}</Button>}>
    {loading ? <Spinner /> : error && !post ? <Notice>{error}</Notice> : post && <div className="space-y-5">
      {error && <Notice>{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">{civic
          ? <Badge status={post.status}/>
          : <div className="flex items-center gap-2"><Category value={post.category}/><Badge status={post.status}/></div>}
          <span className="text-xs text-slate-500">{fmtDate(post.createdAt)}</span>
        </div>
        {civic ? <h1 className="mt-5 text-2xl font-bold">{post.description}</h1> : <p className="mt-5 whitespace-pre-wrap leading-relaxed text-slate-700">{post.description}</p>}
        {post.photoUrl && <img src={post.photoUrl} alt="" className="mt-5 max-h-96 w-full rounded-xl object-cover" />}
        <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <p>{civic ? post.reporterName : post.requesterName}</p>
          {civic ? <p>{post.latitude}, {post.longitude} · {post.confirmationCount} {t('reportCount')}</p>
            : <><p>{post.location}</p>{post.category === 'BLOOD' && <div className="flex flex-wrap gap-3 rounded-xl bg-rose-50 p-3 text-rose-900"><span>{t('patientName')}: <strong>{post.patientName || '—'}</strong></span><span>{t('bloodType')}: <strong>{post.bloodType || '—'}</strong></span><span>{t('unitsNeeded')}: <strong>{post.unitsNeeded || '—'}</strong></span><span>{t('hospital')}: <strong>{post.hospital || post.location}</strong></span></div>}{post.goalAmount && <div><p className="font-semibold text-emerald-700">{t('received')}: ৳{Number(post.raisedAmount || 0).toLocaleString()} / ৳{Number(post.goalAmount).toLocaleString()}</p><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: Math.min(100, 100 * Number(post.raisedAmount || 0) / Number(post.goalAmount)) + '%' }}/></div></div>}</>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => run(() => civic ? likeApi.toggleForCivicReport(id) : likeApi.toggleForCampaign(id))}>{likes.liked ? '♥' : '♡'} {likes.count}</Button>
          <Button variant="secondary" onClick={share}>{t('share')}</Button>
          {civic && user && post.status !== 'RESOLVED' && <Button disabled={busy || user.id === post.reporterId} onClick={() => run(() => civicReportApi.confirm(id))}>{t('confirm')}</Button>}
          {civic && user?.id === post.reporterId && post.status !== 'RESOLVED' && <Button variant="secondary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await civicReportApi.resolve(id); navigate('/civic-reports'); } catch (err) { setError(err.response?.data?.message || t('error')); } finally { setBusy(false); } }}>{t('resolve')}</Button>}
        </div>
      </Card>
      {!civic && <Card><h2 className="text-xl font-bold">{t('trustTrail')}</h2>{post.requestedVerifierName && <p className="mt-2 text-sm text-slate-600">{t('assignedVerifier')}: <strong>{post.requestedVerifierName}</strong></p>}<div className="mt-5 space-y-0">{[
        [t('submitted'), fmtDate(post.createdAt), true],
        [t('reviewed'), post.verifiedByName ? post.verifiedByName + ' · ' + fmtDate(post.verifiedAt) : t('pending'), !!post.verifiedByName],
        [t('live'), post.status === 'VERIFIED' || post.status === 'COMPLETED' ? t('verified') : t('pending'), post.status === 'VERIFIED' || post.status === 'COMPLETED'],
        ...(post.goalAmount ? [[t('goalReached'), Number(post.raisedAmount || 0) >= Number(post.goalAmount) ? t('completed') : t('pending'), Number(post.raisedAmount || 0) >= Number(post.goalAmount)]] : []),
        [t('proofImpact'), post.outcomeApproved ? fmtDate(post.completedAt) : t('awaitingProof'), post.outcomeApproved],
      ].map(([label, detail, done], index) => <div key={label} className="flex gap-3"><div className="flex flex-col items-center"><span className={'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ' + (done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-500')}>{done ? '✓' : index + 1}</span>{index < (post.goalAmount ? 4 : 3) && <span className="h-10 w-0.5 bg-slate-200"/>}</div><div className="pb-5"><p className="font-bold">{label}</p><p className="text-sm text-slate-500">{detail}</p></div></div>)}</div>
        {post.verificationNote && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><strong>{t('reviewReason')}:</strong> {post.verificationNote}</div>}
        {post.outcomeApproved && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><h3 className="font-bold">{t('evidence')}</h3><p>{post.outcomeSummary}</p>{post.outcomeProofUrl && <a className="font-bold text-blue-600" href={post.outcomeProofUrl} target="_blank" rel="noreferrer">{t('evidence')}</a>}</div>}
        {attachments.length > 0 && <div className="mt-4 space-y-1">{attachments.map(a => <a key={a.id} href={a.url || '/api/files/' + a.storedFileName} target="_blank" rel="noreferrer" className="block text-sm font-medium text-blue-600">{a.fileName}</a>)}</div>}
      </Card>}
      {!civic && user?.id === post.requesterId && (post.status === 'INFO_REQUESTED' || post.status === 'PENDING') && <Card><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{t('updateRequest')}</h2><Button variant="secondary" onClick={() => setEditOpen(!editOpen)}>{t('updateRequest')}</Button></div>{editOpen && edit && <form onSubmit={resubmit} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label={t('title')} required value={edit.title || ''} onChange={event => setEdit({ ...edit, title: event.target.value })}/><Field label={t('location')} value={edit.location || ''} onChange={event => setEdit({ ...edit, location: event.target.value })}/>{edit.category === 'BLOOD' && <><Field label={t('patientName')} required value={edit.patientName || ''} onChange={event => setEdit({ ...edit, patientName: event.target.value })}/><Field label={t('bloodType')} as="select" value={edit.bloodType || 'O+'} onChange={event => setEdit({ ...edit, bloodType: event.target.value })}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(type => <option key={type}>{type}</option>)}</Field><Field label={t('unitsNeeded')} type="number" min="1" required value={edit.unitsNeeded || 1} onChange={event => setEdit({ ...edit, unitsNeeded: event.target.value })}/><Field label={t('hospital')} required value={edit.hospital || ''} onChange={event => setEdit({ ...edit, hospital: event.target.value })}/></>}<Field label={t('verifierCode')} required value={edit.verifierCode || ''} onChange={event => setEdit({ ...edit, verifierCode: event.target.value.toUpperCase() })}/><Field label={t('description')} as="textarea" rows={4} required className="sm:col-span-2" value={edit.description || ''} onChange={event => setEdit({ ...edit, description: event.target.value })}/><Field label={t('evidence')} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={event => setEditFiles(Array.from(event.target.files || []))}/><div className="flex items-end"><Button disabled={busy} type="submit">{t('resubmit')}</Button></div></form>}</Card>}
      {!civic && post.category === 'BLOOD' && post.status === 'VERIFIED' && <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{t('findDonors')}</h2><p className="text-sm text-slate-600">{t('nearestDonors')}</p></div><Button variant="secondary" onClick={findDonors}>{t('findDonors')}</Button></div>{donorSearch && <div className="mt-4 space-y-3">{donors.length ? donors.map(donor => <div key={donor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="font-semibold">{donor.fullName} · {donor.bloodGroup}</p><p className="text-sm text-slate-600">{donor.area}{donor.distanceKm != null && ` · ${donor.distanceKm.toFixed(1)} km`}</p><p className="text-xs text-slate-500">{donor.nextEligibleAt && new Date(donor.nextEligibleAt) > new Date() ? t('donorUnavailable') + ': ' + fmtDate(donor.nextEligibleAt) : t('bloodReady')}</p></div>{(!donor.nextEligibleAt || new Date(donor.nextEligibleAt) <= new Date()) && <a className="font-bold text-blue-700" href={'tel:' + donor.phone}>{donor.phone}</a>}</div>) : <p className="text-sm text-slate-500">{t('empty')}</p>}</div>}</Card>}
      {!civic && post.status === 'VERIFIED' && <Card><div id="contribute"><h2 className="text-xl font-bold">{t(pledgeOnly ? 'pledge' : 'donate')}</h2><form onSubmit={contribute} className="mt-4 space-y-4">
        {!pledgeOnly && <Field label={t('amount')} type="number" min="1" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />}
        {pledgeOnly && <Field label={t('contactPhone')} type="tel" required value={contactPhone} onChange={e => setContactPhone(e.target.value)}/>}
        <Field label={t('note') + ' (' + t('optional') + ')'} as="textarea" rows={2} value={message} onChange={e => setMessage(e.target.value)} />
        <Button type="submit" disabled={busy}>{t(pledgeOnly ? 'pledge' : 'donate')}</Button></form></div>
        {donations.length > 0 && <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="font-bold">{t('supporters')}</h3>{donations.map(d => <p key={d.id} className="mt-2 text-sm text-slate-600">{d.donorName} · {d.type === 'PLEDGE' ? t('pledge') : '৳' + Number(d.amount).toLocaleString()}</p>)}</div>}
      </Card>}
      {!civic && user?.id === post.requesterId && post.status === 'VERIFIED' && <Card><h2 className="font-bold">{t('submitOutcome')}</h2><form onSubmit={submitOutcome} className="mt-4 space-y-3"><Field label={t('description')} as="textarea" rows={3} required value={outcome} onChange={e => setOutcome(e.target.value)}/><Field label={t('evidence')} type="file" accept="image/*" onChange={e => setProof(e.target.files?.[0] || null)}/><Button disabled={busy} type="submit">{t('submitOutcome')}</Button></form></Card>}
      <Card><h2 className="text-xl font-bold">{t('comments')}</h2><div className="mt-4 space-y-3">{comments.map(c => <div key={c.id} className="border-b border-slate-100 pb-3"><strong>{c.authorName}</strong><p className="text-sm text-slate-600">{c.content}</p></div>)}</div><form onSubmit={addComment} className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2" placeholder={t('writeComment')} required value={comment} onChange={e => setComment(e.target.value)} /><Button type="submit" disabled={busy}>{t('postComment')}</Button></form></Card>
      {user && <Card><h2 className="font-bold">{t('flag')}</h2><form onSubmit={flag} className="mt-3 flex flex-wrap gap-2"><input className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2" placeholder={t('reason')} required value={flagReason} onChange={e => setFlagReason(e.target.value)}/><Button variant="secondary" type="submit" disabled={busy}>{t('submit')}</Button></form></Card>}
      {civic && <Link to="/map" className="font-bold text-blue-600">{t('map')}</Link>}
      {!civic && post.status === 'VERIFIED' && <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{post.title}</p><Button onClick={() => document.getElementById('contribute')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{t(pledgeOnly ? 'pledge' : 'donate')}</Button></div></div>}
      {confirming && <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 p-4"><Card className="w-full max-w-md"><h2 className="text-xl font-bold">{t(pledgeOnly ? 'pledge' : 'donate')}</h2><p className="mt-3 text-sm text-slate-600">{pledgeOnly ? t('pledge') : '৳' + Number(amount).toLocaleString() + ' · ' + t('awaitingReceipt')}</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirming(false)}>{t('cancel')}</Button><Button onClick={confirmSupport}>{t('confirm')}</Button></div></Card></div>}
    </div>}
  </Page>;
}
