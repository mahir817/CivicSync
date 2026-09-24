import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Heart, 
  Share2, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  Calendar,
  Droplet,
  CloudRain
} from 'lucide-react';
import DonateModal from '../components/DonateModal';
import CommentSection from '../components/CommentSection';
import { campaignApi, civicReportApi, donationApi, attachmentApi, commentApi, likeApi } from '../api/client';
import { getStoredReports, confirmReport, INITIAL_REPORTS } from '../services/reportService';

const CATEGORY_LABELS = {
  BLOOD: '🩸 Blood Donation',
  PET_CARE: '🐾 Pet Care',
  CHARITY: '❤️ Charity',
  DISASTER_RELIEF: '🌊 Disaster Relief',
  WATER_LOGGING: '💧 Water Clogging',
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [post, setPost] = useState(null);
  const [isCivic, setIsCivic] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const loadPost = async () => {
      // 1. If passed via navigation state, seed post immediately to prevent flash
      if (location.state?.post && String(location.state.post.id) === String(id)) {
        if (!cancelled) {
          const statePost = location.state.post;
          setPost(statePost);
          setIsCivic(statePost.isCivic || (statePost.category || '').toUpperCase().includes('WATER'));
          if (statePost.confirmations != null) {
            setConfirmedCount(statePost.confirmations);
          }
        }
      }

      const isLocalReportId = String(id).startsWith('report-') || isNaN(Number(id));

      // 2. If it's a local report ID format, search stored reports first
      if (isLocalReportId) {
        const storedReports = getStoredReports();
        let found = storedReports.find((r) => String(r.id) === String(id));
        if (!found) {
          found = INITIAL_REPORTS.find((r) => String(r.id) === String(id));
        }

        if (found) {
          if (!cancelled) {
            setPost(found);
            setIsCivic(found.isCivic || (found.category || '').toUpperCase().includes('WATER'));
            setConfirmedCount(found.confirmations || 0);
            setLoading(false);
          }
          return;
        }
      }

      // 3. For numeric IDs, try Campaign API first
      if (!isLocalReportId) {
        try {
          const res = await campaignApi.getById(id);
          if (!cancelled) {
            setPost(res.data);
            setIsCivic((res.data.category || '').toUpperCase().includes('WATER'));
            setLoading(false);

            donationApi.getForCampaign(id)
              .then((r) => !cancelled && setDonations(r.data))
              .catch(() => {});
            attachmentApi.getForCampaign(id)
              .then((r) => !cancelled && setAttachments(r.data))
              .catch(() => {});
              
            if (user) {
              likeApi.getForCampaign(id)
                .then((r) => {
                  if (!cancelled) {
                    setLikeCount(r.data.count);
                    setLiked(r.data.liked);
                  }
                }).catch(() => {});
            }
          }
          return;
        } catch (err) {
          // Not found as campaign, check Civic Reports
        }
      }

      // 4. Try backend Civic Reports
      try {
        const civicRes = await civicReportApi.getActive();
        const foundCivic = civicRes.data.find((r) => String(r.id) === String(id));
        if (foundCivic) {
          if (!cancelled) {
            setPost(foundCivic);
            setIsCivic(true);
            setConfirmedCount(foundCivic.confirmationCount || 0);
            setLoading(false);
            
            if (user) {
              likeApi.getForCivicReport(id).then(r => {
                if (!cancelled) {
                  setLikeCount(r.data.count);
                  setLiked(r.data.liked);
                }
              }).catch(() => {});
            }
          }
          return;
        }
      } catch (err) {
        // Backend civic report fetch failed
      }

      // 5. Fallback: check stored reports even if id was numeric
      const storedReports = getStoredReports();
      let found = storedReports.find((r) => String(r.id) === String(id));
      if (!found) {
        found = INITIAL_REPORTS.find((r) => String(r.id) === String(id));
      }

      if (found) {
        if (!cancelled) {
          setPost(found);
          setIsCivic(found.isCivic || (found.category || '').toUpperCase().includes('WATER'));
          setConfirmedCount(found.confirmations || 0);
          setLoading(false);
        }
        return;
      }

      // 6. Not found anywhere
      if (!cancelled) {
        setNotFound(true);
        setLoading(false);
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [id, location.state]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-['Inter']">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Post not found</h2>
        <p className="text-slate-500 max-w-sm mb-6 text-sm">
          The request or report you are looking for might have been removed, resolved, or is no longer available.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/home')} 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
          >
            Go to Feed
          </button>
          <button 
            onClick={() => navigate('/map')} 
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
          >
            Explore Live Map
          </button>
        </div>
      </div>
    );
  }

  if (loading && !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-['Inter']">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Loading post details...</p>
      </div>
    );
  }

  if (!post) return null;

  // --- Field Normalization ---
  const isWater = isCivic || (post.category || '').toUpperCase().includes('WATER');
  const title = post.title || (isWater ? 'Water-Clogging Hazard Report' : 'CivicSync Request');
  const description = post.description || '';
  const categoryLabel = CATEGORY_LABELS[post.category] || (isWater ? '💧 Water Clogging' : post.category || 'General');
  const requesterName = post.requesterName || post.reporterName || (isWater ? 'Citizen Reporter' : 'Anonymous');

  let locationLabel = post.location || post.locationName || '';
  if (!locationLabel) {
    if (typeof post.latitude === 'number' && typeof post.longitude === 'number') {
      locationLabel = `${post.latitude.toFixed(4)}, ${post.longitude.toFixed(4)}`;
    } else if (Array.isArray(post.position) && post.position.length >= 2) {
      locationLabel = `${post.position[0].toFixed(4)}, ${post.position[1].toFixed(4)}`;
    }
  }

  const goalAmount = isWater ? null : (post.goalAmount != null ? Number(post.goalAmount) : null);
  const raisedAmount = isWater ? null : (post.raisedAmount != null ? Number(post.raisedAmount) : 0);

  const displayConfirmations = confirmedCount != null ? confirmedCount : (post.confirmations || post.confirmationCount || 0);
  const isConfirmed = post.status === 'VERIFIED' || post.type === 'verified' || displayConfirmations >= 3;
  const canDonate = !isWater && (post.status === 'VERIFIED' || post.type === 'verified');

  const handleConfirmHazard = async () => {
    if (hasConfirmed) return;
    setHasConfirmed(true);
    setConfirmedCount((prev) => (prev || 0) + 1);

    if (String(post.id).startsWith('report-') || isNaN(Number(post.id))) {
      confirmReport(post.id);
    } else {
      try {
        await civicReportApi.confirm(post.id);
      } catch (e) {
        console.warn('Backend confirmation failed, counted locally', e);
      }
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const scrollToComments = () => {
    const commentInput = document.querySelector('input[placeholder="Write a comment..."]');
    if (commentInput) {
      commentInput.focus();
      commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Inter'] p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Navigation back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 mb-6 font-medium text-sm cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header Badges & Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {categoryLabel}
            </span>

            {isWater ? (
              <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isConfirmed ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {isConfirmed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {isConfirmed ? 'COMMUNITY CONFIRMED' : 'UNCONFIRMED HAZARD'}
              </span>
            ) : (
              <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                post.status === 'VERIFIED' || post.type === 'verified' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {post.status === 'VERIFIED' || post.type === 'verified' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {post.status === 'VERIFIED' || post.type === 'verified' ? 'VERIFIED' : 'PENDING REVIEW'}
              </span>
            )}
          </div>

          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar size={13} />
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'Recent'}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3">
          {title}
        </h1>

        {/* Author info */}
        <div className="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
          <span>{isWater ? 'Reported by' : 'Posted by'}</span>
          <span className="font-semibold text-slate-800">{requesterName}</span>
        </div>

        {/* Location banner */}
        {locationLabel && (
          <div className="flex items-center gap-2 text-sm text-slate-700 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <MapPin size={16} className="text-blue-500 shrink-0" />
            <span className="font-medium">{locationLabel}</span>
          </div>
        )}

        {/* Primary Image preview (for local posts or uploaded image) */}
        {(post.image || post.photoUrl) && (
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 max-h-96">
            <img
              src={post.image || post.photoUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Attachments for backend campaigns */}
        {!isWater && attachments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Attachments & Proof
            </h4>
            <div className="flex flex-wrap gap-3">
              {attachments.map((a) =>
                a.fileType && a.fileType.startsWith('image/') ? (
                  <img
                    key={a.id}
                    src={`http://localhost:8080${a.url}`}
                    alt={a.fileName}
                    className="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-xs"
                  />
                ) : (
                  <a
                    key={a.id}
                    href={`http://localhost:8080${a.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    📄 {a.fileName}
                  </a>
                )
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-6 border-l-4 border-blue-500 pl-4 py-1 text-base bg-blue-50/20 rounded-r-lg">
          {description}
        </div>

        {/* Water hazard severity / confirmation section */}
        {isWater && (
          <div className="mb-8 bg-sky-50 border border-sky-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-sky-900 flex items-center gap-2">
                <span>{displayConfirmations} Community Confirmation{displayConfirmations !== 1 ? 's' : ''}</span>
              </div>
              {post.severity && (
                <p className="text-xs text-sky-800 mt-1">
                  Severity level: <span className="font-semibold">{post.severity}</span>
                </p>
              )}
              <p className="text-xs text-sky-600 mt-0.5">
                {displayConfirmations >= 3
                  ? 'Confirmed by community members in this neighborhood.'
                  : 'Needs community verification to confirm active hazard.'}
              </p>
            </div>

            <button
              onClick={handleConfirmHazard}
              disabled={hasConfirmed}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                hasConfirmed 
                  ? 'bg-emerald-600 text-white cursor-default' 
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {hasConfirmed ? (
                <>
                  <CheckCircle2 size={14} /> Confirmed!
                </>
              ) : (
                <>
                  <ThumbsUp size={14} /> Confirm Hazard (+1)
                </>
              )}
            </button>
          </div>
        )}

        {/* Fundraising Goal Progress Bar */}
        {goalAmount != null && (
          <div className="mb-8 bg-emerald-50/70 border border-emerald-100 p-5 rounded-xl">
            <div className="flex justify-between items-end mb-2">
              <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                Fundraising Goal
              </div>
              <div className="text-emerald-700 font-bold text-base">
                ৳{raisedAmount}{' '}
                <span className="text-emerald-600/80 text-sm font-normal">
                  raised of ৳{goalAmount}
                </span>
              </div>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (raisedAmount / goalAmount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Interactive Action Bar */}
        <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
          <button 
            onClick={async () => {
              if (!user) {
                alert("Please log in to like this post.");
                return;
              }
              const isLocal = String(post.id).startsWith('report-') || isNaN(Number(post.id));
              
              const willBeLiked = !liked;
              setLiked(willBeLiked);
              setLikeCount(prev => willBeLiked ? prev + 1 : prev - 1);
              
              if (!isLocal) {
                try {
                  const apiCall = isWater 
                    ? likeApi.toggleForCivicReport(post.id) 
                    : likeApi.toggleForCampaign(post.id);
                  const res = await apiCall;
                  setLiked(res.data.liked);
                  setLikeCount(res.data.count);
                } catch (e) {
                  setLiked(!willBeLiked);
                  setLikeCount(prev => willBeLiked ? prev - 1 : prev + 1);
                }
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              liked 
                ? 'bg-rose-50 text-rose-600 border border-rose-200 font-semibold' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> 
            {liked ? 'Liked' : 'Like'} {likeCount > 0 && `(${likeCount})`}
          </button>

          <button 
            onClick={scrollToComments}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-sm cursor-pointer"
          >
            <MessageSquare size={18} /> Comment
          </button>

          <button 
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-sm cursor-pointer"
          >
            <Share2 size={18} /> {copied ? 'Link Copied!' : 'Share'}
          </button>

          {canDonate && (
            <button
              onClick={() => setShowDonateModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white transition-colors font-semibold text-sm shadow-sm cursor-pointer ${
                post.category === 'BLOOD'
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <Heart size={18} /> {post.category === 'BLOOD' ? 'I can donate' : 'Donate'}
            </button>
          )}
        </div>

        {/* Supporters / Donors list */}
        {!isWater && donations.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Supporters ({donations.length})
            </h3>

            <div className="space-y-3">
              {donations.map((d) => (
                <div key={d.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
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

        {/* Comment Section */}
        <CommentSection
          postId={post.id}
          postType={isWater ? 'civicReport' : 'campaign'}
          commentApi={commentApi}
        />
      </div>

      {showDonateModal && (
        <DonateModal
          campaign={post}
          onClose={() => setShowDonateModal(false)}
          onSuccess={(newDonation) => {
            setDonations((prev) => [newDonation, ...prev]);

            if (newDonation.type === 'MONETARY' && newDonation.amount) {
              setPost((prev) => ({
                ...prev,
                raisedAmount: (Number(prev.raisedAmount) || 0) + Number(newDonation.amount),
              }));
            }
          }}
        />
      )}
    </div>
  );
}