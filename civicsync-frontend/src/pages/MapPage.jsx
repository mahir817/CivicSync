import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { civicReportApi, campaignApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Spinner, Notice, Badge, Category } from '../components/UI';

const icon = L.divIcon({ className: '', html: '<span style="display:block;width:20px;height:20px;border-radius:50%;background:#e11d48;border:4px solid white;box-shadow:0 2px 8px #444"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });
const campaignIcon = L.divIcon({ className: '', html: '<span style="display:block;width:20px;height:20px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 2px 8px #444"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });

export default function MapPage() {
  const { t } = useLocale();
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () => Promise.all([civicReportApi.getActive(), campaignApi.getAll()])
      .then(([r, c]) => { if (active) { setReports(r.data); setCampaigns(c.data); setError(''); } })
      .catch(() => { if (active) setError(t('error')); })
      .finally(() => { if (active) setLoading(false); });
    refresh(); const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [t]);
  return <Page wide title={t('map')} subtitle={t('reportsText')} actions={<Link to="/report-clogging"><Button>{t('reportWater')}</Button></Link>}>
    {error && <Notice>{error}</Notice>}
    {loading ? <Spinner /> : <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="h-[65vh] min-h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <MapContainer center={[23.8103, 90.4125]} zoom={12} className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {reports.filter(r => Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude))).map(r => <Marker key={r.id} position={[r.latitude, r.longitude]} icon={icon}>
            <Popup><strong>{r.description}</strong><br/><Link className="text-blue-600" to={'/civic-reports/' + r.id}>{t('reports')}</Link></Popup>
          </Marker>)}
          {campaigns.filter(c => c.latitude != null && c.longitude != null).map(c => <Marker key={'campaign-' + c.id} position={[c.latitude, c.longitude]} icon={campaignIcon}>
            <Popup><strong>{c.title}</strong><br/><Link className="text-blue-600" to={'/post/' + c.id}>{t('verifiedRequests')}</Link></Popup>
          </Marker>)}
        </MapContainer>
      </div>
      <div className="space-y-4">
        <Card><h2 className="font-bold">{t('reports')} ({reports.length})</h2><div className="mt-3 max-h-60 space-y-2 overflow-y-auto">{reports.map(r => <Link key={r.id} to={'/civic-reports/' + r.id} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><Badge status={r.status}/><p className="mt-2 line-clamp-2 text-sm">{r.description}</p></Link>)}</div></Card>
        <Card><h2 className="font-bold">{t('verifiedRequests')}</h2><div className="mt-3 max-h-60 space-y-2 overflow-y-auto">{campaigns.map(c => <Link key={c.id} to={'/post/' + c.id} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><span className="text-xs text-blue-700"><Category value={c.category}/></span><p className="font-semibold">{c.title}</p><p className="text-xs text-slate-500">{c.location}</p></Link>)}</div></Card>
      </div>
    </div>}
  </Page>;
}
