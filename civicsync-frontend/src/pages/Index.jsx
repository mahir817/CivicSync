import { Link } from 'react-router-dom';
import { ShieldCheck, MapPinned, HeartPulse, ArrowRight } from 'lucide-react';
import video from '../assets/cat.mp4';
import heroArt from '../assets/bg.jpeg';
import { useLocale } from '../i18n';

export default function Index() {
  const { t } = useLocale();
  const features = [
    [ShieldCheck, 'verifiedRequests', 'verifiedText'],
    [MapPinned, 'communityReports', 'reportsText'],
    [HeartPulse, 'healthSignals', 'healthText'],
  ];
  return <main className="bg-slate-50">
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-slate-900 pt-28">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(' + heroArt + ')' }} />
      <video autoPlay loop muted playsInline poster={heroArt} className="absolute inset-0 h-full w-full object-cover opacity-40"><source src={video} type="video/mp4" /></video>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-transparent" />
      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-6 pb-20 text-white">
        <div className="max-w-2xl">
          <span className="mb-5 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">CivicSync · Dhaka</span>
          <h1 className="break-words text-4xl font-black leading-tight sm:text-7xl">{t('landingTitle')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-100">{t('landingLead')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-blue-700">{t('getStarted')} <ArrowRight size={18}/></Link>
            <Link to="/home" className="rounded-full border border-white/50 bg-white/15 px-6 py-3 font-bold text-white backdrop-blur hover:bg-white/25">{t('explore')}</Link>
          </div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="mb-10 text-3xl font-extrabold text-slate-900">{t('howItWorks')}</h2>
      <div className="grid gap-5 md:grid-cols-3">{features.map(([Icon, title, body]) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon size={28}/></div><h3 className="text-xl font-bold">{t(title)}</h3><p className="mt-3 leading-relaxed text-slate-600">{t(body)}</p></div>)}</div>
      <p className="mt-8 rounded-2xl bg-slate-900 p-6 text-slate-100">{t('helpText')}</p>
    </section>
  </main>;
}
