import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Heart, Share2, MessageSquare } from 'lucide-react';
import DonateModal from '../components/DonateModal';
import CommentSection from '../components/CommentSection';
import { campaignApi, civicReportApi, donationApi, attachmentApi, commentApi } from '../api/client';

const CATEGORY_LABELS = {
  BLOOD: '🩸 Blood Donation',
  PET_CARE: '🐾 Pet Care',
  CHARITY: '❤️ Charity',
  DISASTER_RELIEF: '🌊 Disaster Relief',
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [isCivic, setIsCivic] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [donations, setDonations] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showDonateModal, setShowDonateModal] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    let cancelled = false;

    // Try as a Campaign first. If it 404s, fall back to CivicReport.
    // These are two separate tables on the backend with no shared ID space,
    // so this is the only reliable way to figure out which one a given
    // numeric id belongs to without changing the route structure.
    campaignApi.getById(id)
      .then((res) => {
        if (cancelled) return;
        setPost(res.data);
        setIsCivic(false);

        donationApi.getForCampaign(id).then((r) => !cancelled && setDonations(r.data)).catch(() => {});
        attachmentApi.getForCampaign(id).then((r) => !cancelled && setAttachments(r.data)).catch(() => {});
      })
      .catch(() => {
        civicReportApi.getActive()
          .then((res) => {
            if (cancelled) return;
            const found = res.data.find((r) => String(r.id) === String(id));
            if (found) {
              setPost(found);
              setIsCivic(true);
            } else {
              setNotFound(true);
            }
          })
          .catch(() => !cancelled && setNotFound(true));
      });

    return () => { cancelled = true; };
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Post not found</h2>
        <button onClick={() => navigate('/home')} className="text-blue-600 hover:underline">
          Go back Home
        </button>
      </div>
    );
  }

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  // --- Normalize field differences between Campaign and CivicReport shapes ---
  const title = isCivic ? 'Water-Clogging Report' : post.title;
  const description = post.description;
  const categoryLabel = isCivic ? '💧 Water Clogging' : (CATEGORY_LABELS[post.category] || post.category);
  const requesterName = isCivic ? post.reporterName : post.requesterName;
  const locationLabel = isCivic
    ? `${post.latitude.toFixed(4)}, ${post.longitude.toFixed(4)}`
    : post.location;
  const goalAmount = isCivic ? null : post.goalAmount;
  const raisedAmount = isCivic ? null : post.raisedAmount;
  const canDonate = !isCivic && post.status === 'VERIFIED';
  const isOwner = user && user.fullName === requesterName;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => navigate(isCivic ? '/civic-reports' : '/home')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mb-2">
              {categoryLabel}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
            <div className="text-sm text-slate-500 mt-2">
              {isCivic ? 'Reported by' : 'Posted by'}{' '}
              <span className="font-semibold text-slate-700">{requesterName}</span>
            </div>
          </div>
        </div>

        {locationLabel && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <MapPin size={16} className="text-blue-500" /> {locationLabel}
          </div>
        )}

        {/* Attachments — images shown inline, docs as download links. Campaigns only. */}
        {!isCivic && attachments.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {attachments.map((a) =>
              a.fileType.startsWith('image/') ? (
                <img
                  key={a.id}
                  src={`http://localhost:8080${a.url}`}
                  alt={a.fileName}
                  className="w-28 h-28 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <a
                  key={a.id}
                  href={`http://localhost:8080${a.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700"
                >
                  📄 {a.fileName}
                </a>
              )
            )}
          </div>
        )}

        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-8 border-l-4 border-slate-200 pl-4 py-1">
          {description}
        </div>

        {goalAmount != null && (
          <div className="mb-8 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
            <div className="flex justify-between items-end mb-2">
              <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                Fundraising Goal
              </div>
              <div className="text-emerald-700 font-bold">
                ৳{raisedAmount || 0}{' '}
                <span className="text-emerald-600/70 text-sm font-normal">
                  raised of ৳{goalAmount}
                </span>
              </div>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((raisedAmount || 0) / goalAmount) * 100)}%` }}
              />
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

          {canDonate ? (
            <button
              onClick={() => setShowDonateModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white transition-colors font-semibold shadow-sm ${
                post.category === 'BLOOD'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              <Heart size={18} /> {post.category === 'BLOOD' ? 'I can donate' : 'Donate'}
            </button>
          ) : (
            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium">
              <Share2 size={18} /> Share
            </button>
          )}
        </div>

        {!isCivic && donations.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Supporters ({donations.length})
            </h3>

            <div className="space-y-4">
              {donations.map((d) => (
                <div key={d.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <strong className="text-slate-800">{d.donorName}</strong>

                  {d.type === 'MONETARY' && (
                    <span className="text-slate-600"> donated {d.amount} BDT</span>
                  )}

                  {d.type === 'PLEDGE' && (
                    <span className="text-slate-600"> pledged to help</span>
                  )}

                  {d.message && (
                    <p className="text-sm text-slate-500 mt-1 italic">"{d.message}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <CommentSection
          postId={post.id}
          postType={isCivic ? 'civicReport' : 'campaign'}
          commentApi={commentApi}
        />
      </div>

      {showDonateModal && (
        <DonateModal
          campaign={post}
          onClose={() => setShowDonateModal(false)}
          onSuccess={(newDonation) => {
            setDonations((prev) => [newDonation, ...prev]);

            if (newDonation.type === 'MONETARY') {
              setPost((prev) => ({
                ...prev,
                raisedAmount: (prev.raisedAmount || 0) + newDonation.amount,
              }));
            }
          }}
        />
      )}
    </div>
  );
}