import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { civicReportApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Notice, Spinner, Empty, authUser, fmtDate } from '../components/UI';

export default function CivicReportsFeed() {
  const { t } = useLocale();
  const user = authUser();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = () => civicReportApi.getActive().then(r => { setReports(r.data); setError(''); }).catch(() => setError(t('error'))).finally(() => setLoading(false));
  useEffect(() => {
    let active = true;
    const load = () => civicReportApi.getActive().then(r => { if (active) { setReports(r.data); setError(''); } }).catch(() => { if (active) setError(t('error')); }).finally(() => { if (active) setLoading(false); });
    load(); const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [t]);
  const confirm = async (id) => { try { await civicReportApi.confirm(id); refresh(); } catch (err) { setError(err.response?.data?.message || t('error')); } };
  return <Page title={t('reports')} subtitle={t('reportsText')} actions={<Link to={user ? '/report-clogging' : '/login'}><Button>{t('reportWater')}</Button></Link>}>
    {error && <div className="mb-4"><Notice>{error}</Notice></div>}
    {loading ? <Spinner /> : reports.length === 0 ? <Empty /> : <div className="space-y-4">{reports.map(r => <Card key={r.id}>
      <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-500">{Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)} · {fmtDate(r.createdAt)}</p><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{t(r.status === 'CONFIRMED' ? 'confirmed' : 'unconfirmed')}</span></div>
      <Link to={'/civic-reports/' + r.id} className="mt-3 block text-lg font-bold hover:text-blue-600">{r.description}</Link>
      <p className="mt-2 text-sm text-slate-500">{r.reporterName} · {r.confirmationCount} {t('reportCount')}</p>
      {user && <Button variant="secondary" className="mt-4" onClick={() => confirm(r.id)}>{t('confirm')}</Button>}
    </Card>)}</div>}
  </Page>;
}
