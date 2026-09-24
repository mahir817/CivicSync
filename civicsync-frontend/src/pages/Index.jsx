import { Link } from 'react-router-dom';
import catVideo from '../assets/cat.mp4';
import { Shield, Users, Zap, Heart } from 'lucide-react';

export default function Index() {
  return (
    <div className="bg-slate-50 font-['Inter']">
      {/* Video Hero Section */}
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={catVideo} type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 flex flex-col items-center text-center text-white">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-xl">
            Civic<span className="text-blue-400">Sync</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mb-10 text-slate-200 drop-shadow-md">
            Your all-in-one verified community platform where blood, pet care, charity, and disaster relief requests get public attention.
          </p>
          <div className="flex gap-6">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-blue-900/50 hover:scale-105 border border-blue-500/50"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-2 border-white/30 rounded-full font-bold text-lg transition-all hover:scale-105"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center text-white/70">
          <span className="text-sm uppercase tracking-widest mb-2 font-medium">Scroll to explore</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </div>

      {/* Features / About Section */}
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Empowering Communities</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            CivicSync brings neighbors together to solve local problems, coordinate relief, and build a stronger society.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Verified Reports</h3>
            <p className="text-slate-600">All civic issues are community-verified to ensure authenticity and rapid response from authorities.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Community Action</h3>
            <p className="text-slate-600">Crowdsource help for disaster relief, animal rescue, or local neighborhood cleanups instantly.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6">
              <Heart size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Blood & Charity</h3>
            <p className="text-slate-600">Connect directly with donors for urgent blood requests or coordinate charity drives transparently.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Real-time Map</h3>
            <p className="text-slate-600">View live interactive maps showing hazards, donation campaigns, and verified reports near you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
