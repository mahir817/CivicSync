/* eslint-disable react-refresh/only-export-components */
import { useLocale, categoryKey, statusKey } from '../i18n';

export function Page({ title, subtitle, children, wide = false, actions }) {
  return <main className={'mx-auto min-h-screen px-4 pb-16 pt-32 sm:px-6 ' + (wide ? 'max-w-7xl' : 'max-w-4xl')}>
    {(title || subtitle || actions) && <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>{title && <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{title}</h1>}{subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}</div>{actions}
    </div>}{children}
  </main>;
}
export function Card({ children, className = '' }) { return <div className={'rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6 ' + className}>{children}</div>; }
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = { primary: 'bg-blue-600 text-white hover:bg-blue-700', secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50', danger: 'bg-rose-600 text-white hover:bg-rose-700' };
  return <button className={'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ' + variants[variant] + ' ' + className} {...props}>{children}</button>;
}
export function Field({ label, as: As = 'input', className = '', ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<As className={'mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ' + className} {...props} /></label>;
}
export function Notice({ children, tone = 'error' }) { return <div role="alert" className={'rounded-xl border px-4 py-3 text-sm ' + (tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>{children}</div>; }
export function Badge({ status }) {
  const { t } = useLocale();
  const key = statusKey[status] || (status || '').toLowerCase();
  return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{t(key)}</span>;
}
export function Category({ value }) { const { t } = useLocale(); return <>{t(categoryKey[value] || value)}</>; }
export function Spinner() { const { t } = useLocale(); return <p className="py-12 text-center text-slate-600">{t('loading')}</p>; }
export function Empty() { const { t } = useLocale(); return <Card className="text-center text-slate-500">{t('empty')}</Card>; }
export function apiError(error, fallback) { return error?.response?.data?.message || fallback; }
export function authUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
export function fmtDate(value) { return value ? new Date(value).toLocaleDateString() : '—'; }
