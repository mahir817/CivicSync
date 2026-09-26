import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { healthApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Notice, Spinner } from '../components/UI';

export default function HealthAlerts() {
  const { t } = useLocale();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () => healthApi.getAlerts().then(r => { if (active) { setAlerts(r.data); setError(''); } })
      .catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    load(); const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [t]);
  return <Page title={t('alerts')} subtitle={t('healthText')} actions={<Link to="/report-symptom"><Button>{t('reportSymptom')}</Button></Link>}>
    {error && <Notice>{error}</Notice>}
    {loading ? <Spinner /> : alerts.length === 0 ? <Card>{t('noAlerts')}</Card> : <div className="space-y-4">{alerts.map(a => <Card key={a.area}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{a.area}</h2><span className={'rounded-full px-3 py-1 text-xs font-bold ' + (a.level === 'WATCH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>{t(a.level === 'WATCH' ? 'watch' : 'normal')}</span></div>
      <p className="mt-2 text-sm text-slate-600">{a.reportCount} {t('reportCount')} · {t('lastDays')}</p>
    </Card>)}</div>}
  </Page>;
}
