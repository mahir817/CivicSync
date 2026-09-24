import { Link } from 'react-router-dom';
import catVideo from '../assets/cat.mp4';
import { Shield, Users, Zap, Heart } from 'lucide-react';

export default function Index() {
  return (
    <div className="bg-slate-50 font-['Inter']">
      {/* Video Hero Section */}
      <div className="relative w-full h-screen overflow-hidden flex items-center">
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

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-md">
              Civic<span className="text-blue-600">Sync</span>
            </h1>
            <p className="text-base md:text-lg text-slate-800 drop-shadow-sm leading-relaxed">
              Your all-in-one verified community platform where blood, pet care, charity, and disaster relief requests get public attention.
            </p>
            <div className="flex gap-3 pt-2">
              <Link
                to="/register"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-all shadow-md hover:scale-105 border border-blue-500/50"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-white/70 hover:bg-white/90 backdrop-blur-md text-slate-800 border border-slate-300/50 rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-sm"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center text-white drop-shadow-md">
          <span className="text-xs uppercase tracking-widest mb-1.5 font-bold">Scroll to explore</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Features / About Section */}
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Empowering Communities</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
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