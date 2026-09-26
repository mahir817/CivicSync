import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { civicReportApi, uploadApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Button, Field, Notice } from '../components/UI';

export default function ReportClogging() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [form, setForm] = useState({ latitude: '', longitude: '', description: '' });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
      <Field label={t('description')} as="textarea" rows={5} required maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <Field label={t('evidence') + ' (' + t('optional') + ')'} type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
      <Button type="submit" disabled={busy}>{t('submit')}</Button>
    </form></Card>
  </Page>;
}
