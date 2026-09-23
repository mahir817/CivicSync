import { useEffect, useState } from "react";

export default function CommentSection({ postId, postType, commentApi }) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!user;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLocalId = String(postId).startsWith('report-') || isNaN(Number(postId));
  const localKey = `civicsync_comments_${postId}`;

  const getComments = postType === "campaign" ? commentApi.getForCampaign : commentApi.getForCivicReport;
  const addComment = postType === "campaign" ? commentApi.addToCampaign : commentApi.addToCivicReport;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (isLocalId) {
      try {
        const raw = localStorage.getItem(localKey);
        if (!cancelled) {
          setComments(raw ? JSON.parse(raw) : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setComments([]);
          setLoading(false);
        }
      }
      return;
    }

    getComments(postId)
      .then((res) => {
        if (!cancelled) {
          setComments(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch comments from backend", err);
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, postType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      setError("Please log in to post a comment.");
      return;
    }

    setSubmitting(true);

    if (isLocalId) {
      const localComment = {
        id: 'c-' + Date.now(),
        authorName: user.fullName || "Citizen",
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      const updated = [...comments, localComment];
      setComments(updated);
      try {
        localStorage.setItem(localKey, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save comment locally", err);
      }
      setNewComment("");
      setSubmitting(false);
      return;
    }

    try {
      const res = await addComment(postId, newComment.trim());
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment to database", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Your session has expired. Please log in again to post comments.");
      } else {
        setError(err.response?.data?.message || "Failed to post comment. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-slate-200 pt-5 font-['Inter']">
      <h3 className="text-base font-bold text-slate-800 mb-3.5 flex items-center gap-2">
        <span>Comments</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
          {comments.length}
        </span>
      </h3>

      {loading && <p className="text-sm text-slate-500 py-3">Loading comments from database...</p>}

      <div className="flex flex-col gap-3 mb-4">
        {comments.map((c) => (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100" key={c.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-blue-600">{c.authorName}</span>
              <span className="text-[11px] text-slate-400">
                {c.createdAt ? new Date(c.createdAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                }) : 'Just now'}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
          </div>
        ))}
        {!loading && comments.length === 0 && (
          <p className="text-sm text-slate-400 py-3 italic">No comments yet. Be the first to share your thoughts.</p>
        )}
      </div>

      {error && (
        <div className="p-2.5 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      {isAuthenticated ? (
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs" 
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? "Posting..." : "Comment"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-slate-500 py-2">
          Please log in to leave a comment.
        </p>
      )}
    </div>
  );
}
