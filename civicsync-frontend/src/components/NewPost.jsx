/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignApi } from '../api/client';
import { useLocale, categoryKey } from '../i18n';
import { authUser, Button, Card, Field, Notice } from './UI';

const NewPostContext = createContext(null);
const categories = ['BLOOD', 'PET_CARE', 'CHARITY', 'DISASTER_RELIEF'];
const initial = { title: '', description: '', category: 'BLOOD', location: '', latitude: '', longitude: '', goalAmount: '', patientName: '', bloodType: 'O+', unitsNeeded: 1, hospital: '', urgency: 'URGENT', verifierCode: '' };

export function NewPostProvider({ children }) {
  const [open, setOpen] = useState(false);
  return <NewPostContext.Provider value={() => setOpen(true)}>{children}{open && <NewPostDialog close={() => setOpen(false)} />}</NewPostContext.Provider>;
}
export function useNewPost() { return useContext(NewPostContext); }

function NewPostDialog({ close }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  const choose = choice => {
    if (choice === 'request') {
      if (!authUser()) { close(); navigate('/login'); return; }
      setMode('request');
    } else {
      close();
      navigate(choice === 'water' ? '/report-clogging' : '/report-symptom');
    }
  };
  const submit = async event => {
    event.preventDefault();
    if (step === 1) { setStep(2); return; }
    setBusy(true); setError('');
    try {
      if (Boolean(form.latitude) !== Boolean(form.longitude)) throw new Error(t('coordinatePair'));
      const data = {
        ...form,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        goalAmount: form.category === 'BLOOD' || form.goalAmount === '' ? null : Number(form.goalAmount),
        patientName: form.category === 'BLOOD' ? form.patientName : null,
        bloodType: form.category === 'BLOOD' ? form.bloodType : null,
        unitsNeeded: form.category === 'BLOOD' ? Number(form.unitsNeeded) : null,
        hospital: form.category === 'BLOOD' ? form.hospital : null,
      };
      if (files.length) await campaignApi.createWithImages(data, files);
      else await campaignApi.create(data);
      close(); navigate('/profile');
    } catch (err) { setError(err.response?.data?.message || err.message || t('error')); }
    finally { setBusy(false); }
  };
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const locate = () => navigator.geolocation?.getCurrentPosition(
    position => setForm(current => ({ ...current, latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) })),
    () => setError(t('error')),
  );
  return <div className="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto bg-slate-950/65 p-3 pt-16 sm:p-8" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <Card className="w-full max-w-2xl shadow-2xl"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-extrabold">{t(mode ? 'requestHelp' : 'newPost')}</h2><button className="text-2xl text-slate-500" onClick={close} aria-label={t('cancel')}>×</button></div>
      {error && <div className="mt-4"><Notice>{error}</Notice></div>}
      {!mode ? <div className="mt-6"><p className="text-slate-600">{t('choosePostType')}</p><div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button onClick={() => choose('request')} className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left font-bold text-blue-900 hover:bg-blue-100">{t('requestHelp')}</button>
        <button onClick={() => choose('water')} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left font-bold text-amber-900 hover:bg-amber-100">{t('reportWater')}</button>
        <button onClick={() => choose('symptom')} className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-left font-bold text-rose-900 hover:bg-rose-100">{t('reportSymptom')}</button>
      </div></div> : <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="flex gap-2" aria-label={t('requestHelp')}><span className={'h-1.5 flex-1 rounded-full ' + (step >= 1 ? 'bg-blue-600' : 'bg-slate-200')}/><span className={'h-1.5 flex-1 rounded-full ' + (step >= 2 ? 'bg-blue-600' : 'bg-slate-200')}/></div>
        {step === 1 ? <div className="grid gap-4 sm:grid-cols-2">
          <Field as="select" label={t('category')} value={form.category} onChange={event => set('category', event.target.value)}>{categories.map(category => <option key={category} value={category}>{t(categoryKey[category])}</option>)}</Field>
          <Field as="select" label={t('urgency')} value={form.urgency} onChange={event => set('urgency', event.target.value)}>{['ROUTINE', 'SOON', 'URGENT', 'CRITICAL'].map(value => <option key={value} value={value}>{t(value.toLowerCase())}</option>)}</Field>
          {form.category === 'BLOOD' && <>
            <Field label={t('patientName')} required value={form.patientName} onChange={event => set('patientName', event.target.value)}/>
            <Field as="select" label={t('bloodType')} value={form.bloodType} onChange={event => set('bloodType', event.target.value)}>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <option key={type}>{type}</option>)}</Field>
            <Field label={t('unitsNeeded')} type="number" min="1" required value={form.unitsNeeded} onChange={event => set('unitsNeeded', event.target.value)}/>
            <Field label={t('hospital')} required value={form.hospital} onChange={event => set('hospital', event.target.value)}/>
          </>}
          <Field label={t('location')} required value={form.location} onChange={event => set('location', event.target.value)}/>
          {form.category !== 'BLOOD' && <Field label={t('goalAmount')} type="number" min="1" step="0.01" value={form.goalAmount} onChange={event => set('goalAmount', event.target.value)}/>}
          <Field label={t('latitude')} type="number" step="any" value={form.latitude} onChange={event => set('latitude', event.target.value)}/>
          <Field label={t('longitude')} type="number" step="any" value={form.longitude} onChange={event => set('longitude', event.target.value)}/>
          <Button type="button" variant="secondary" onClick={locate}>{t('useLocation')}</Button>
        </div> : <div className="space-y-4">
          <Field label={t('title')} required value={form.title} onChange={event => set('title', event.target.value)}/>
          <Field label={t('description')} as="textarea" rows={5} required value={form.description} onChange={event => set('description', event.target.value)}/>
          <Field label={t('verifierCode')} required value={form.verifierCode} onChange={event => set('verifierCode', event.target.value.toUpperCase())}/>
          <p className="text-sm text-slate-600">{t('verifierCodeHint')}</p>
          <Field label={t('evidence')} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={event => setFiles(Array.from(event.target.files || []))}/>
          <p className="text-xs text-slate-500">{t('helpText')}</p>
        </div>}
        <div className="flex flex-wrap justify-end gap-2">{step === 2 && <Button type="button" variant="secondary" onClick={() => setStep(1)}>{t('previous')}</Button>}<Button type="submit" disabled={busy}>{t(step === 1 ? 'next' : 'submit')}</Button></div>
      </form>}
    </Card>
  </div>;
}
