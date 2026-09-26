import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLocale } from '../i18n';
import { Button, Card, Field, Notice } from './UI';

export default function AuthForm({ mode }) {
  const { t, setLocale } = useLocale();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = register ? form : { email: form.email, password: form.password };
      const { data } = await api.post(register ? '/auth/register' : '/auth/login', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.userId, fullName: data.fullName, email: data.email, role: data.role }));
      if (data.language === 'en' || data.language === 'bn') setLocale(data.language);
      navigate(data.role === 'ADMIN' ? '/admin' : data.role === 'VERIFIER' ? '/review' : '/home');
    } catch (err) { setError(err.response?.data?.message || t('error')); }
    finally { setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center px-4 pb-12 pt-28">
    <Card className="w-full max-w-md p-8"><h1 className="text-center text-3xl font-extrabold">{t(register ? 'join' : 'welcome')}</h1>
      <form onSubmit={submit} className="mt-7 space-y-5">
        {error && <Notice>{error}</Notice>}
        {register && <Field label={t('fullName')} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required minLength={2} />}
        <Field label={t('email')} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <Field label={t('password')} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={register ? 6 : undefined} />
        <Button className="w-full" type="submit" disabled={busy}>{t(register ? 'createAccount' : 'signIn')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">{t(register ? 'haveAccount' : 'noAccount')} <Link className="font-bold text-blue-600" to={register ? '/login' : '/register'}>{t(register ? 'login' : 'register')}</Link></p>
    </Card>
  </main>;
}
