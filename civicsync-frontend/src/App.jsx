import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import MapPage from './pages/MapPage';
import PostDetail from './pages/PostDetail';
import ReportClogging from './pages/ReportClogging';
import CivicReportsFeed from './pages/CivicReportsFeed';
import ReportSymptom from './pages/ReportSymptom';
import Profile from './pages/Profile';
import HealthAlerts from './pages/HealthAlerts';
import Inbox from './pages/Inbox';
import Review from './pages/Review';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import { authUser } from './components/UI';
import { LocaleProvider, useLocale } from './i18n';
import bgImage from './assets/bg.jpg';

function Guard({ children, roles }) {
  const user = authUser();
  if (!user || !localStorage.getItem('token')) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

function Shell() {
  const location = useLocation();
  const { t } = useLocale();
  return <div className="min-h-screen bg-slate-50 text-slate-800" style={location.pathname === '/' ? {} : { backgroundImage: 'url(' + bgImage + ')', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
    <Navbar />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Feed />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/civic-reports" element={<CivicReportsFeed />} />
      <Route path="/civic-reports/:id" element={<PostDetail />} />
      <Route path="/report-clogging" element={<Guard><ReportClogging /></Guard>} />
      <Route path="/report-symptom" element={<ReportSymptom />} />
      <Route path="/alerts" element={<HealthAlerts />} />
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
      <Route path="/inbox" element={<Guard><Inbox /></Guard>} />
      <Route path="/review" element={<Guard roles={['VERIFIER','ADMIN']}><Review /></Guard>} />
      <Route path="/admin" element={<Guard roles={['ADMIN']}><Admin /></Guard>} />
      <Route path="*" element={<main className="mx-auto max-w-4xl px-5 pt-32"><h1 className="text-3xl font-bold">404</h1><p>{t('noResults')}</p></main>} />
    </Routes>
  </div>;
}

export default function App() { return <LocaleProvider><BrowserRouter><Shell /></BrowserRouter></LocaleProvider>; }
