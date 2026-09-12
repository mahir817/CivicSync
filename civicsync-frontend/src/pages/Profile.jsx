import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, MapPin, Mail, Phone, Calendar, Heart, Award } from 'lucide-react';
import { getStoredReports } from '../services/reportService';

export default function Profile() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const reports = getStoredReports();
    // Filter posts created by this user
    const posts = reports.filter(r => r.requesterName === user.fullName);
    setUserPosts(posts);
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Inter']">
      {/* Simple Nav */}
      <nav className="flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-pink-100 h-16 sticky top-0 z-50 shadow-sm">
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xl font-bold text-blue-600 cursor-pointer"
        >
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">C</div>
          Civic<span className="text-slate-800">Sync</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-red-600 cursor-pointer">Logout</button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 mb-6">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-3xl font-bold border-2 border-blue-200">
                  {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Edit2 size={16} /> {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{user.fullName}</h1>
                <p className="text-slate-500 mb-4 flex items-center gap-1.5"><MapPin size={16}/> Dhaka, Bangladesh</p>
                
                <div className="flex flex-col gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400"/> {user.email || 'user@example.com'}</div>
                  <div className="flex items-center gap-2"><Phone size={16} className="text-slate-400"/> +880 1712-345678</div>
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> Joined September 2026</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 md:flex-col justify-center">
                <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-100 text-center flex-1">
                  <div className="text-xl font-bold text-blue-700">{userPosts.length}</div>
                  <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">Posts</div>
                </div>
                <div className="bg-emerald-50 px-4 py-3 rounded-lg border border-emerald-100 text-center flex-1">
                  <div className="text-xl font-bold text-emerald-700">12</div>
                  <div className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Contributions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200 mb-6">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Posts & Reports
          </button>
          <button 
            onClick={() => setActiveTab('donations')}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'donations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Donations
          </button>
        </div>

        {/* Content */}
        {activeTab === 'posts' ? (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                You haven't made any posts or reports yet.
              </div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                      {post.category.replace('_', ' ')}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2">{post.description}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dummy donations data */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Heart size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Flood Relief Fund</h4>
                  <p className="text-xs text-slate-500">Aug 20, 2026</p>
                </div>
              </div>
              <div className="font-bold text-emerald-600 text-lg">৳500</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Heart size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">O+ Blood Needed</h4>
                  <p className="text-xs text-slate-500">Jul 12, 2026</p>
                </div>
              </div>
              <div className="font-bold text-slate-600 text-sm bg-slate-100 px-3 py-1 rounded-full">Pledged</div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
