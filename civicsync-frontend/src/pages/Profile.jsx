import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, MapPin, Mail, Phone, Calendar, Heart, Activity, TrendingUp, BarChart2 } from 'lucide-react';
import { campaignApi, donationApi } from '../api/client';
import Navbar from '../components/Navbar';

export default function Profile() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [activeTab, setActiveTab] = useState('analytics');
  const [userPosts, setUserPosts] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    Promise.all([campaignApi.getMine(), donationApi.getMine()])
      .then(([postsRes, donationsRes]) => {
        setUserPosts(postsRes.data || []);
        setUserDonations(donationsRes.data || []);
      })
      .catch((e) => {
        console.warn("Failed to fetch user data", e);
        setUserPosts([]);
        setUserDonations([]);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  const totalDonated = userDonations.filter(d => d.type === 'MONETARY').reduce((sum, d) => sum + (d.amount || 0), 0);
  
  // Dummy analytics data for the dashboard
  const activityData = [
    { label: 'Mon', value: 20 },
    { label: 'Tue', value: 45 },
    { label: 'Wed', value: 30 },
    { label: 'Thu', value: 80 },
    { label: 'Fri', value: 60 },
    { label: 'Sat', value: 90 },
    { label: 'Sun', value: 50 },
  ];
  const maxActivity = Math.max(...activityData.map(d => d.value));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Inter']">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <div className="px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-16 mb-6 relative z-10">
              <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 text-4xl font-bold border-4 border-white shadow-inner">
                  {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
              >
                <Edit2 size={16} /> {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{user.fullName}</h1>
                <p className="text-slate-500 mb-6 flex items-center gap-1.5 font-medium"><MapPin size={18} className="text-blue-500"/> Dhaka, Bangladesh</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Mail size={18} className="text-slate-400"/> 
                    <span className="font-medium">{user.email || 'user@example.com'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Phone size={18} className="text-slate-400"/> 
                    <span className="font-medium">+880 1712-345678</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={18} className="text-slate-400"/> 
                    <span className="font-medium">Joined September 2026</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Heart size={18} className="text-rose-400"/> 
                    <span className="font-medium">Top Contributor Badge</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-row lg:flex-col gap-4 justify-center min-w-[200px]">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 text-center flex-1 shadow-sm">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{userPosts.length}</div>
                  <div className="text-xs text-blue-600 uppercase tracking-widest font-bold">Total Posts</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 text-center flex-1 shadow-sm">
                  <div className="text-3xl font-bold text-emerald-700 mb-1">৳{totalDonated}</div>
                  <div className="text-xs text-emerald-600 uppercase tracking-widest font-bold">Donated</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart2 size={18} /> Analytics Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            className={`pb-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Activity size={18} /> My Posts & Reports
          </button>
          <button 
            onClick={() => setActiveTab('donations')}
            className={`pb-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'donations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Heart size={18} /> Donation History
          </button>
        </div>

        {/* Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat Cards */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Activity size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                    <TrendingUp size={12} /> +12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{userPosts.length + userDonations.length}</div>
                <div className="text-sm font-medium text-slate-500">Total Engagements</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
                    <Heart size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                    <TrendingUp size={12} /> +5%
                  </span>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{userDonations.length}</div>
                <div className="text-sm font-medium text-slate-500">Lives Impacted</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <MapPin size={20} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">4</div>
                <div className="text-sm font-medium text-slate-500">Regions Active In</div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart2 size={20} className="text-blue-500" /> Weekly Activity Overview
              </h3>
              
              <div className="flex items-end justify-between h-64 gap-2 pt-6 border-b border-slate-100 pb-2">
                {activityData.map((data, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded mb-2 font-medium">
                      {data.value} actions
                    </div>
                    {/* Bar */}
                    <div className="w-full max-w-[40px] bg-blue-100 rounded-t-md relative overflow-hidden" style={{ height: `${(data.value / maxActivity) * 100}%` }}>
                      <div className="absolute bottom-0 w-full bg-blue-500 transition-all duration-500" style={{ height: '100%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                {activityData.map((data, i) => (
                  <div key={i} className="flex-1 text-center text-xs font-semibold text-slate-400">
                    {data.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                <Activity size={40} className="mx-auto mb-4 text-slate-300" />
                <p className="font-medium text-lg">No posts yet</p>
                <p className="text-sm">Your civic reports and requests will appear here.</p>
              </div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full w-fit">
                      {post.category.replace('_', ' ')}
                    </div>
                    <span className="text-xs font-medium text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-slate-800">{post.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">{post.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="space-y-4">
            {userDonations.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                <Heart size={40} className="mx-auto mb-4 text-slate-300" />
                <p className="font-medium text-lg">No donations yet</p>
                <p className="text-sm">Your contributions to campaigns will appear here.</p>
              </div>
            ) : (
              userDonations.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/post/${d.campaignId}`)}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                      d.type === 'MONETARY' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                    }`}>
                      <Heart size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 mb-1">{d.campaignTitle}</h4>
                      <p className="text-sm font-medium text-slate-500">
                        {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {d.type === 'MONETARY' ? (
                    <div className="font-bold text-emerald-600 text-2xl">৳{d.amount}</div>
                  ) : (
                    <div className="font-bold text-slate-600 text-sm bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">Pledged</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
