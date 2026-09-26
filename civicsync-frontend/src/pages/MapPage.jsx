import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { campaignApi, civicReportApi, healthApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Spinner, Notice, Badge, Category, authUser } from '../components/UI';

const center = [23.8103, 90.4125];
const centers = [['mirpur', [23.8069,90.3687]], ['dhanmondi',[23.7461,90.3742]], ['uttara',[23.8759,90.3795]], ['gulshan',[23.7925,90.4078]], ['banani',[23.7937,90.4066]], ['motijheel',[23.7330,90.4172]], ['mohammadpur',[23.7674,90.3588]], ['badda',[23.7809,90.4250]], ['old dhaka',[23.7104,90.4074]], ['sylhet',[24.8949,91.8687]]];
const approximate = location => centers.find(([name]) => location?.toLowerCase().includes(name))?.[1] || null;
const pin = color => L.divIcon({ className: '', html: '<span style="display:block;width:22px;height:22px;border-radius:50%;background:' + color + ';border:4px solid white;box-shadow:0 2px 10px #33415588"></span>', iconSize: [22,22], iconAnchor: [11,11] });
const civicPin = pin('#f59e0b');
const confirmedPin = pin('#e11d48');
const campaignPin = pin('#2563eb');

function LocateControl({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;
    navigator.geolocation?.getCurrentPosition(position => map.flyTo([position.coords.latitude, position.coords.longitude], 14));
  }, [trigger, map]);
  return null;
}

export default function MapPage() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const [layers, setLayers] = useState({ civic: true, campaign: params.get('layer') !== 'health', health: true });
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const results = await Promise.allSettled([civicReportApi.getActive(), campaignApi.getAll(), healthApi.getAlerts()]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setReports(results[0].value.data);
      if (results[1].status === 'fulfilled') setCampaigns(results[1].value.data);
      if (results[2].status === 'fulfilled') setAlerts(results[2].value.data);
      setNow(Date.now());
      setError(results.some(result => result.status === 'rejected') ? t('error') : '');
      setLoading(false);
    };
    refresh(); const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [t]);
  const matches = item => JSON.stringify([item.title, item.description, item.location, item.area]).toLowerCase().includes(query.toLowerCase());
  const shownReports = reports.filter(matches);
  const shownCampaigns = campaigns.filter(matches);
  const shownAlerts = alerts.filter(alert => alert.level === 'WATCH' && matches(alert));
  const toggle = key => setLayers(current => ({ ...current, [key]: !current[key] }));
  const confirm = async id => {
    if (!authUser()) { window.location.href = '/login'; return; }
    try {
      const { data } = await civicReportApi.confirm(id);
      setReports(current => current.map(report => report.id === id ? data : report));
      setSelected({ type: 'civic', data });
    } catch (err) { setError(err.response?.data?.message || t('error')); }
  };
  return <Page wide title={t('map')} subtitle={t('reportsText')} actions={<Link to="/report-clogging"><Button>{t('reportWater')}</Button></Link>}>
    {error && <div className="mb-4"><Notice>{error}</Notice></div>}
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className="text-sm font-medium">{t('search')}<input className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {[[ 'civic','civicLayer','bg-amber-500' ],['campaign','campaignLayer','bg-blue-600'],['health','healthLayer','bg-rose-600']].map(([key,label,color]) => <label key={key} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold"><input type="checkbox" checked={layers[key]} onChange={() => toggle(key)}/><span className={'h-2.5 w-2.5 rounded-full ' + color}/>{t(label)}</label>)}
      <Button variant="secondary" onClick={() => setLocateTrigger(value => value + 1)}>{t('locateMe')}</Button>
    </div>
    {loading ? <Spinner/> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-[65vh] min-h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <MapContainer center={center} zoom={12} className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          <LocateControl trigger={locateTrigger}/>
          {layers.civic && shownReports.filter(report => Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude))).map(report => {
            const stale = now - new Date(report.lastConfirmedAt || report.createdAt).getTime() > 12 * 60 * 60 * 1000;
            return <Marker key={'civic-' + report.id} position={[report.latitude,report.longitude]} icon={report.status === 'CONFIRMED' ? confirmedPin : civicPin} opacity={stale ? 0.45 : 1} eventHandlers={{ click: () => setSelected({ type: 'civic', data: report }) }}/>;
          })}
          {layers.campaign && shownCampaigns.map(campaign => ({ campaign, position: campaign.latitude != null && campaign.longitude != null ? [campaign.latitude,campaign.longitude] : approximate(campaign.location) })).filter(item => item.position).map(({ campaign, position }) => <Marker key={'campaign-' + campaign.id} position={position} icon={campaignPin} eventHandlers={{ click: () => setSelected({ type: 'campaign', data: campaign }) }}/>)}
          {layers.health && shownAlerts.filter(alert => alert.latitude != null && alert.longitude != null).map(alert => <Circle key={'health-' + alert.area} center={[alert.latitude,alert.longitude]} radius={Math.min(1800, 500 + alert.reportCount * 100)} pathOptions={{ color:'#e11d48',fillColor:'#fb7185',fillOpacity:0.22,weight:2 }} eventHandlers={{ click: () => setSelected({ type: 'alert', data: alert }) }}/>)}
        </MapContainer>
      </div>
      <aside className="space-y-4">
        {selected ? <Card><button className="float-right text-slate-500" onClick={() => setSelected(null)} aria-label={t('cancel')}>×</button>
          {selected.type === 'campaign' ? <><p className="text-xs font-bold text-blue-700"><Category value={selected.data.category}/></p><h2 className="mt-2 text-xl font-bold">{selected.data.title}</h2><p className="mt-2 text-sm text-slate-600">{selected.data.location}</p><div className="mt-3"><Badge status={selected.data.status}/></div><Link className="mt-4 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white" to={'/post/' + selected.data.id}>{t('viewDetails')}</Link></>
            : selected.type === 'civic' ? <><h2 className="text-lg font-bold">{selected.data.description}</h2>{selected.data.photoUrl && <img className="mt-3 max-h-48 w-full rounded-xl object-cover" src={selected.data.photoUrl} alt=""/>}<div className="mt-3"><Badge status={selected.data.status}/></div><p className="mt-2 text-sm">{selected.data.confirmationCount} {t('reportCount')}</p><div className="mt-4 flex gap-2"><Button onClick={() => confirm(selected.data.id)}>{t('confirm')}</Button><Link className="rounded-xl border border-slate-300 px-4 py-2 text-sm" to={'/civic-reports/' + selected.data.id}>{t('viewDetails')}</Link></div></>
              : <><p className="text-sm font-bold text-rose-700">{t('alerts')}</p><h2 className="mt-2 text-xl font-bold">{selected.data.area}</h2><p className="mt-2 text-sm">{selected.data.reportCount} {t('reportCount')} · {t('lastDays')}</p><p className="mt-2 text-xs text-slate-500">{t('approximateArea')}</p></>}
        </Card> : <Card><h2 className="text-lg font-bold">{t('viewDetails')}</h2><p className="mt-3 text-sm text-slate-500">{t('noMapItems')}</p></Card>}
        <Card><h2 className="font-bold">{t('civicLayer')} ({shownReports.length})</h2><h2 className="mt-3 font-bold">{t('campaignLayer')} ({shownCampaigns.length})</h2><h2 className="mt-3 font-bold">{t('healthLayer')} ({shownAlerts.length})</h2></Card>
      </aside>
    </div>}
  </Page>;
}
