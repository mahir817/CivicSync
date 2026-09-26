import { useState } from 'react';
import { Link } from 'react-router-dom';
import { healthApi } from '../api/client';
import { useLocale } from '../i18n';
import { Page, Card, Field, Button, Notice } from '../components/UI';

export default function ReportSymptom() {
  const { t } = useLocale();
  const [form, setForm] = useState({ area: '', symptom: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await healthApi.submitSymptom({ area: form.area.trim(), symptom: form.symptom.trim() }); setDone(true); }
    catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  return <Page title={t('reportSymptom')} subtitle={t('healthText')}>
    <Card className="mx-auto max-w-lg">{done ? <div><Notice tone="success">{t('thanks')}</Notice><Link to="/alerts" className="mt-4 inline-block font-bold text-blue-600">{t('alerts')}</Link></div>
      : <form onSubmit={submit} className="space-y-5">{error && <Notice>{error}</Notice>}
        <Field label={t('area')} required maxLength={100} value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
        <Field label={t('symptom')} required maxLength={255} value={form.symptom} onChange={e => setForm({ ...form, symptom: e.target.value })} />
        <Button type="submit" disabled={busy}>{t('anonymous')}</Button>
      </form>}</Card>
  </Page>;
}
