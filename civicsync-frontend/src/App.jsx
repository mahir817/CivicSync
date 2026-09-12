import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import MapPage from './pages/MapPage';
import './App.css';

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

export default function App() {
  return (
    <Router>
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
    </Router>
  );
}
