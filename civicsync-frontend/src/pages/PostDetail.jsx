import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoredReports, removeReport } from '../services/reportService';
import { ArrowLeft, MapPin, Heart, Share2, MessageSquare, Trash2 } from 'lucide-react';
import DonateModal from '../components/DonateModal';
import CommentSection from '../components/CommentSection';
import { donationApi, commentApi } from '../api/client';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donations, setDonations] = useState([]);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const reports = getStoredReports();
    const found = reports.find(r => String(r.id) === id);
    setPost(found);
    
    // Fetch donations
    donationApi.getForCampaign(id).then((res) => setDonations(res.data)).catch(() => {});
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Post not found</h2>
        <button onClick={() => navigate('/home')} className="text-blue-600 hover:underline">Go back Home</button>
      </div>
    );
  }

  const isOwner = user && user.fullName === post.requesterName;
  const needsDonation = ['BLOOD', 'CHARITY', 'DISASTER_RELIEF', 'PET_CARE'].includes(post.category);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      removeReport(post.id);
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <button onClick={() => navigate('/home')} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 mb-6 font-medium">
          <ArrowLeft size={16} /> Back to Feed
        </button>

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mb-2">
              {post.category.replace('_', ' ')}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{post.title}</h1>
            <div className="text-sm text-slate-500 mt-2">Posted by <span className="font-semibold text-slate-700">{post.requesterName}</span></div>
          </div>
          {isOwner && (
            <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Post">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {post.location && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <MapPin size={16} className="text-blue-500" /> {post.locationName || post.location}
          </div>
        )}

        {post.image && (
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-200">
            <img src={post.image} alt="Post Attachment" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}

        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-8 border-l-4 border-slate-200 pl-4 py-1">
          {post.description}
        </div>

        {post.goalAmount != null && (
          <div className="mb-8 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
            <div className="flex justify-between items-end mb-2">
              <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Fundraising Goal</div>
              <div className="text-emerald-700 font-bold">৳{post.raisedAmount || 0} <span className="text-emerald-600/70 text-sm font-normal">raised of ৳{post.goalAmount}</span></div>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, ((post.raisedAmount || 0) / post.goalAmount) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium">
            <Heart size={18} /> Like
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium">
            <MessageSquare size={18} /> Comment
          </button>
          {post.type === 'verified' && needsDonation ? (
            <button 
              onClick={() => setShowDonateModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white transition-colors font-semibold shadow-sm ${post.category === 'BLOOD' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              <Heart size={18} /> {post.category === 'BLOOD' ? 'I can donate' : 'Donate'}
            </button>
          ) : (
            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium">
              <Share2 size={18} /> Share
            </button>
          )}
        </div>

        {donations.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Supporters ({donations.length})</h3>
            <div className="space-y-4">
              {donations.map((d) => (
                <div key={d.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <strong className="text-slate-800">{d.donorName}</strong>
                  {d.type === "MONETARY" && <span className="text-slate-600"> donated {d.amount} BDT</span>}
                  {d.type === "PLEDGE" && <span className="text-slate-600"> pledged to help</span>}
                  {d.message && <p className="text-sm text-slate-500 mt-1 italic">"{d.message}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <CommentSection postId={post.id} postType={post.isCivic ? "civicReport" : "campaign"} commentApi={commentApi} />
      </div>

      {showDonateModal && (
        <DonateModal
          campaign={post}
          onClose={() => setShowDonateModal(false)}
          onSuccess={(newDonation) => {
            setDonations((prev) => [newDonation, ...prev]);
            // Refresh post logic could go here if we were using a real API for the post detail, but we use localStorage
            if (newDonation.type === "MONETARY") {
              setPost(prev => ({...prev, raisedAmount: (prev.raisedAmount || 0) + newDonation.amount}));
            }
          }}
        />
      )}
    </div>
  );
}
