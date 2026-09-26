import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLocale } from '../i18n';
import { Button, Card, Field, Notice } from './UI';

export default function AuthForm({ mode }) {
  const { t, setLocale } = useLocale();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', area: '', identityDocumentType: 'NID', dateOfBirth: '', bloodGroup: '', donorOptIn: false, emailAlertsEnabled: true });
  const [identityDocument, setIdentityDocument] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = register ? new FormData() : { email: form.email, password: form.password };
      if (register) {
        payload.append('registration', new Blob([JSON.stringify(form)], { type: 'application/json' }));
        payload.append('identityDocument', identityDocument);
      }
      const { data } = await api.post(register ? '/auth/register' : '/auth/login', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.userId, fullName: data.fullName, email: data.email, role: data.role }));
      if (data.language === 'en' || data.language === 'bn') setLocale(data.language);
      navigate(data.role === 'ADMIN' ? '/admin' : data.role === 'VERIFIER' ? '/review' : '/home');
    } catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center px-4 pb-12 pt-28">
    <Card className={'w-full p-8 ' + (register ? 'max-w-2xl' : 'max-w-md')}><h1 className="text-center text-3xl font-extrabold">{t(register ? 'join' : 'welcome')}</h1>
      <form onSubmit={submit} className="mt-7 space-y-5">
        {error && <Notice>{error}</Notice>}
        {register && <Field label={t('fullName')} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required minLength={2} />}
        <Field label={t('email')} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <Field label={t('password')} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={register ? 6 : undefined} />
        {register && <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('phone')} type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/>
          <Field label={t('area')} required value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}/>
          <Field label={t('dateOfBirth')} type="date" required max={new Date().toISOString().slice(0,10)} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}/>
          <Field label={t('bloodGroup')} as="select" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}><option value="">{t('optional')}</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(group => <option key={group} value={group}>{group}</option>)}</Field>
          <Field label={t('identityType')} as="select" value={form.identityDocumentType} onChange={e => setForm({ ...form, identityDocumentType: e.target.value })}><option value="NID">{t('nid')}</option><option value="BIRTH_CERTIFICATE">{t('birthCertificate')}</option></Field>
          <Field label={t('identityDocument')} type="file" accept=".pdf,image/jpeg,image/png" required onChange={e => setIdentityDocument(e.target.files?.[0] || null)}/>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.donorOptIn} onChange={e => setForm({ ...form, donorOptIn: e.target.checked })}/>{t('donorOptIn')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.emailAlertsEnabled} onChange={e => setForm({ ...form, emailAlertsEnabled: e.target.checked })}/>{t('emailAlerts')}</label>
        </div>}
        <Button className="w-full" type="submit" disabled={busy}>{t(register ? 'createAccount' : 'signIn')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">{t(register ? 'haveAccount' : 'noAccount')} <Link className="font-bold text-blue-600" to={register ? '/login' : '/register'}>{t(register ? 'login' : 'register')}</Link></p>
    </Card>
  </main>;
}
