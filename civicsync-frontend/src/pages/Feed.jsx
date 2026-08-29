import { useState } from 'react';
import { Home, MapPin, Bell, User, Plus, Search, HelpCircle, AlertTriangle, ShieldQuestion, Heart, MessageSquare, Share2, Droplet, CloudRain, CheckCircle2 } from 'lucide-react';

export default function Feed() {
  const [activeFilter, setActiveFilter] = useState('[All]');

  return (
    <div className="min-h-screen text-slate-800 font-['Inter']">

      {/* 1. Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-pink-100 h-16 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">C</div>
            Civic<span className="text-slate-800">Sync</span>
          </div>

          {/* Nav Links */}
          <div className="flex h-full text-sm font-medium text-slate-500">
            <button className="flex items-center gap-2 px-4 h-full border-b-2 border-blue-600 text-blue-600 bg-blue-50/50">
              <Home size={18} /> Home
            </button>
            <button className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors">
              <MapPin size={18} /> Map
            </button>
            <button className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors">
              <Bell size={18} /> Alerts
            </button>
            <button className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors">
              <User size={18} /> Profile
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20">
            <Plus size={18} /> NEW POST
          </button>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests, reports, campaigns"
              className="bg-white border border-pink-200 shadow-sm rounded-md py-1.5 pl-9 pr-4 text-sm w-72 focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          <div className="relative cursor-pointer">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">49</span>
          </div>

          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200">MA</div>
            <span className="text-sm font-medium">Mahir Ahmed</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex gap-8">
        
        {/* Left Column (Feed) */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold mb-6 text-slate-800">CivicSync Feed</h1>

        {/* 2. Composer Bar */}
        <div className="bg-white border border-pink-100 shadow-sm rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="What do you need help with, Mahir?"
              className="flex-1 bg-transparent text-base focus:outline-none placeholder-slate-400 text-slate-800"
            />
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium transition-colors text-slate-700">
                <HelpCircle size={16} className="text-slate-500" /> Request Help
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium transition-colors text-slate-700">
                <AlertTriangle size={16} className="text-slate-500" /> Report Issue
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium transition-colors text-slate-700">
                <ShieldQuestion size={16} className="text-slate-500" /> Anonymous Symptom
              </button>
              <button className="px-6 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-500/20">
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {['[All]', '[Blood Donation]', '[Pet Care]', '[Charity]', '[Disaster Relief]', '[Water-Clogging]', '[Disease Alerts]'].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border ${filter === activeFilter ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 transition-colors'}`}>
              {filter}
            </button>
          ))}
        </div>

        {/* 3. Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">

          {/* Card 1: Blood Donation */}
          {(activeFilter === '[All]' || activeFilter === '[Blood Donation]') && (
          <div className="bg-white border border-pink-100 shadow-sm rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Droplet className="text-red-500" size={20} fill="currentColor" />
                </div>
                <div>
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1">
                    <CheckCircle2 size={12} /> VERIFIED
                  </div>
                  <div className="text-xs text-slate-500">by City Hospital</div>
                </div>
              </div>
              <span className="text-xs text-slate-400">1h ago</span>
            </div>

            <h3 className="text-xl font-bold mb-3 text-slate-800">URGENT: B+ Blood Needed</h3>
            <div className="text-sm text-slate-600 mb-6 flex-1 space-y-2">
              <p className="font-semibold text-slate-800">Patient info</p>
              <p>Aisha Khan (23), Dhaka Medical College Hospital. Needs 2 units immediately for surgery.</p>
              <p>Type: B+.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">2/2 units required</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>
              <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-semibold text-sm transition-colors mb-4">
                View Details
              </button>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-4 text-slate-500 text-sm">
              <button className="flex items-center gap-2 hover:text-slate-800"><Heart size={16} /> Like</button>
              <button className="flex items-center gap-2 hover:text-slate-800"><MessageSquare size={16} /> Comment 1</button>
              <button className="flex items-center gap-2 hover:text-slate-800"><Share2 size={16} /> Share</button>
            </div>
          </div>
          )}

          {/* Card 2: Water-Clogging */}
          {(activeFilter === '[All]' || activeFilter === '[Water-Clogging]') && (
          <div className="bg-white border border-pink-100 shadow-sm rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <CloudRain className="text-slate-500" size={20} fill="currentColor" />
                </div>
                <div>
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1">
                    <AlertTriangle size={12} /> UNCONFIRMED
                  </div>
                  <div className="text-xs text-slate-500">18 confirmations</div>
                </div>
              </div>
              <span className="text-xs text-slate-400">35m ago</span>
            </div>

            <h3 className="text-xl font-bold mb-1 text-slate-800">Waterlogging at Mirpur 10 Circle</h3>
            <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
              <MapPin size={14} /> Mirpur, Dhaka
            </div>

            <img
              src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=400"
              alt="Flooded street"
              className="w-full h-40 object-cover rounded-md mb-3"
            />

            <p className="text-sm text-slate-600 mb-4">Severe flooding. Junction impassable. Avoid area.</p>

            <button className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-md font-semibold text-sm transition-colors mb-4 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> CONFIRM REPORT
            </button>

            <div className="flex justify-between border-t border-slate-100 pt-4 text-slate-500 text-sm mt-auto">
              <button className="flex items-center gap-2 hover:text-slate-800"><Heart size={16} /> Like</button>
              <button className="flex items-center gap-2 hover:text-slate-800"><MessageSquare size={16} /> Comment</button>
              <button className="flex items-center gap-2 hover:text-slate-800"><Share2 size={16} /> Share</button>
            </div>
          </div>
          )}

          {/* Card 3: Pet Care */}
          {(activeFilter === '[All]' || activeFilter === '[Pet Care]') && (
          <div className="bg-white border border-pink-100 shadow-sm rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl">
                  🐶
                </div>
                <div>
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1">
                    <CheckCircle2 size={12} /> VERIFIED
                  </div>
                  <div className="text-xs text-slate-500">by VetCare Clinic</div>
                </div>
              </div>
              <span className="text-xs text-slate-400">2h ago</span>
            </div>

            <h3 className="text-xl font-bold mb-1 text-slate-800">Fundraiser for Injured Stray Dog</h3>
            <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
              <MapPin size={14} /> Gulshan 1, Dhaka
            </div>

            <img
              src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=400"
              alt="Injured puppy"
              className="w-full h-40 object-cover rounded-md mb-3"
            />

            <p className="text-sm text-slate-600 mb-4">Needs surgery for broken leg. Vet: Dr. Khan.</p>

            <div className="flex items-end justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg font-bold text-slate-800">৳18,500</span>
                  <span className="text-xs text-slate-500">/ ৳25,000 Raised</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                  <div className="bg-emerald-500 h-1.5 rounded-full w-[74%]"></div>
                </div>
                <div className="text-[10px] text-slate-500">74% funded</div>
              </div>
              <button className="py-2 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20">
                DONATE
              </button>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-4 text-slate-500 text-sm mt-auto">
              <button className="flex items-center gap-2 hover:text-slate-800"><Heart size={16} /> Like</button>
              <button className="flex items-center gap-2 hover:text-slate-800"><MessageSquare size={16} /> Comment</button>
              <button className="flex items-center gap-2 hover:text-slate-800"><Share2 size={16} /> Share</button>
            </div>
          </div>
          )}

          {/* Empty state when no posts match */}
          {activeFilter !== '[All]' && activeFilter !== '[Blood Donation]' && activeFilter !== '[Water-Clogging]' && activeFilter !== '[Pet Care]' && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white/50 border border-slate-200 rounded-xl border-dashed">
              <span className="text-5xl mb-4 opacity-50">📭</span>
              <p className="text-xl font-semibold text-slate-700 mb-2">No posts yet</p>
              <p className="text-sm">Be the first to post a request for {activeFilter.replace('[', '').replace(']', '')}.</p>
            </div>
          )}

        </div>
        </div>

        {/* Right Column (Map) */}
        <div className="w-[400px] hidden lg:flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Map</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View Full Map
            </button>
          </div>
          <div className="flex-1 bg-white shadow-sm border border-pink-100 rounded-xl overflow-hidden relative min-h-[600px]">
            {/* Map Placeholder Image */}
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
              alt="Map View" 
              className="w-full h-full object-cover opacity-80" 
            />
            {/* Gradient Overlay for style */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"></div>
            
            {/* Map Pins */}
            <div className="absolute top-1/3 left-1/3 group cursor-pointer">
              <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse relative z-10"></div>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-white text-slate-800 text-xs px-2 py-1 rounded shadow-md border border-slate-200 z-20 font-medium">Urgent Blood Needed</div>
            </div>

            <div className="absolute top-1/2 left-2/3 group cursor-pointer">
              <div className="w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse relative z-10"></div>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-white text-slate-800 text-xs px-2 py-1 rounded shadow-md border border-slate-200 z-20 font-medium">Waterlogging</div>
            </div>

            <div className="absolute bottom-1/3 left-1/2 group cursor-pointer">
              <div className="w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.8)] relative z-10"></div>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-white text-slate-800 text-xs px-2 py-1 rounded shadow-md border border-slate-200 z-20 font-medium">Fundraiser Verified</div>
            </div>
            
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-md border border-slate-200 rounded-lg p-2 flex flex-col gap-2">
               <button className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded transition-colors text-slate-700 font-bold text-lg">+</button>
               <button className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded transition-colors text-slate-700 font-bold text-lg">-</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
