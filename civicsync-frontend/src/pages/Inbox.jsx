import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { profileApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Notice, Spinner, fmtDate } from '../components/UI';

const messageKeys = { MATCHING_CAMPAIGN: 'matchingCampaign', REMINDER_ACTIVITY: 'activityReminder',
  NEW_PLEDGE: 'newPledge', CAMPAIGN_APPROVED: 'campaignApproved', CAMPAIGN_REJECTED: 'campaignRejected',
  INFO_REQUESTED: 'infoRequested', PROOF_OF_IMPACT: 'proofImpact' };

export default function Inbox() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    profileApi.notifications().then(r => { if (active) setItems(r.data); })
      .catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  const mark = async id => {
    try { const { data } = await profileApi.markRead(id); setItems(items.map(i => i.id === id ? data : i)); }
    catch { setError(t('error')); }
  };
  return <Page title={t('inbox')} subtitle={t('reminders')}>
    {error && <Notice>{error}</Notice>}
    {loading ? <Spinner /> : items.length === 0 ? <Card>{t('noNotifications')}</Card> : <div className="space-y-3">{items.map(i => <Card key={i.id} className={i.read ? 'opacity-70' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{t(messageKeys[i.messageKey] || 'matchingCampaign')}</p>{i.message && <p className="mt-1 text-sm text-slate-700">{i.message}</p>}<p className="mt-1 text-xs text-slate-500">{fmtDate(i.createdAt)}</p></div><div className="flex gap-2">{i.campaignId && <Link className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white" to={'/post/' + i.campaignId}>{t('viewDetails')}</Link>}{!i.read && <Button variant="secondary" onClick={() => mark(i.id)}>{t('markRead')}</Button>}</div></div>
    </Card>)}</div>}
  </Page>;
}
