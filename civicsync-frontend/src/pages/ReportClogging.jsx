import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { civicReportApi, uploadApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Field, Notice } from '../components/UI';

const markerIcon = L.divIcon({ className: '', html: '<span style="display:block;width:22px;height:22px;border-radius:50%;background:#f59e0b;border:4px solid white;box-shadow:0 2px 8px #33415588"></span>', iconSize: [22,22], iconAnchor: [11,11] });
function PickLocation({ point, onPick }) {
  const map = useMap();
  useMapEvents({ click: event => onPick(event.latlng.lat, event.latlng.lng) });
  const latitude = point?.[0], longitude = point?.[1];
  useEffect(() => { if (latitude != null && longitude != null && !map.getBounds().contains([latitude, longitude])) map.panTo([latitude, longitude]); }, [latitude, longitude, map]);
  return point && <Marker position={point} icon={markerIcon} draggable eventHandlers={{ dragend: event => { const next = event.target.getLatLng(); onPick(next.lat, next.lng); } }}/>;
}

export default function ReportClogging() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [form, setForm] = useState({ latitude: '', longitude: '', description: '' });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const point = form.latitude !== '' && form.longitude !== '' ? [Number(form.latitude), Number(form.longitude)] : null;
  const pick = (lat, lng) => setForm(current => ({ ...current, latitude: String(lat.toFixed(6)), longitude: String(lng.toFixed(6)) }));
  const locate = () => {
    if (!navigator.geolocation) { setError(t('error')); return; }
    navigator.geolocation.getCurrentPosition(
      p => setForm(f => ({ ...f, latitude: String(p.coords.latitude), longitude: String(p.coords.longitude) })),
      () => setError(t('error'))
    );
  };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const lat = Number(form.latitude), lng = Number(form.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error(t('error'));
      const photoUrl = photo ? (await uploadApi.image(photo)).data.url : null;
      await civicReportApi.create({ latitude: lat, longitude: lng, description: form.description.trim(), photoUrl });
      navigate('/civic-reports');
    } catch (err) { setError(err.response?.data?.message || err.message || t('error')); }
    finally { setBusy(false); }
  };
  return <Page title={t('reportWater')} subtitle={t('reportsText')}>
    <Card className="mx-auto max-w-xl"><form onSubmit={submit} className="space-y-5">
      {error && <Notice>{error}</Notice>}
      <Button type="button" variant="secondary" onClick={locate}>{t('useLocation')}</Button>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('latitude')} type="number" step="any" required value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
        <Field label={t('longitude')} type="number" step="any" required value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
      </div>
      <div className="h-64 overflow-hidden rounded-2xl border border-slate-200"><MapContainer center={[23.8103,90.4125]} zoom={12} className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><PickLocation point={point} onPick={pick}/></MapContainer></div>
      <Field label={t('description')} as="textarea" rows={5} required maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <Field label={t('evidence') + ' (' + t('optional') + ')'} type="file" accept="image/*" capture="environment" onChange={e => setPhoto(e.target.files?.[0] || null)} />
      <Button type="submit" disabled={busy}>{t('submit')}</Button>
    </form></Card>
  </Page>;
}
