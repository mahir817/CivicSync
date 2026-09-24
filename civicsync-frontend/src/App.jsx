import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import MapPage from './pages/MapPage';
import './App.css';
import bgImage from './assets/bg.jpg';

import PostDetail from './pages/PostDetail';
import ReportClogging from './pages/ReportClogging';
import CivicReportsFeed from './pages/CivicReportsFeed';
import ReportSymptom from './pages/ReportSymptom';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" />;
  return children;
};

const GlobalLayout = ({ children }) => {
  const location = useLocation();
  const isIndex = location.pathname === '/';

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: !isIndex ? `url(${bgImage})` : 'none',
        backgroundColor: isIndex ? '#F8FAFC' : 'transparent',
      }}
    >
      {/* Index specific radial grid background */}
      {isIndex && (
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] -z-20 pointer-events-none" />
      )}
      
      {/* Ambient Gradient Blobs (apply universally or only on index if you prefer, leaving for all for now) */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      {children}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <GlobalLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Feed />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/civic-reports" element={<CivicReportsFeed />} />
          <Route path="/report-symptom" element={<ReportSymptom />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/report-clogging" element={<ProtectedRoute><ReportClogging /></ProtectedRoute>} />
        </Routes>
      </GlobalLayout>
    </Router>
  );
}
