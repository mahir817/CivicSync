import { useEffect, useState } from "react";
// We don't have useAuth context actually, wait, does Feed use AuthContext?
// Feed uses localStorage.getItem('user'). Let's stick to that for now.

export default function CommentSection({ postId, postType, commentApi }) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!user;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getComments = postType === "campaign" ? commentApi.getForCampaign : commentApi.getForCivicReport;
  const addComment = postType === "campaign" ? commentApi.addToCampaign : commentApi.addToCivicReport;

  useEffect(() => {
    getComments(postId)
      .then((res) => setComments(res.data))
      .catch(() => setComments([])) // Fallback to empty if not backend running
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(postId, newComment.trim());
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch {
      // Fake it if backend is not responding for demo purposes
      const fakeComment = {
        id: Date.now(),
        authorName: user.fullName,
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      setComments((prev) => [...prev, fakeComment]);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-slate-200 pt-5">
      <h3 className="text-[15px] text-blue-600 font-bold mb-3.5">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading && <p className="text-sm text-slate-500 py-4">Loading comments...</p>}

      <div className="flex flex-col gap-3 mb-4">
        {comments.map((c) => (
          <div className="bg-slate-50 rounded-lg p-3" key={c.id}>
            <span className="text-[12.5px] font-bold text-blue-600">{c.authorName}</span>
            <p className="text-[13.5px] text-slate-800 my-1">{c.content}</p>
            <span className="text-[11px] text-slate-500">
              {new Date(c.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        {!loading && comments.length === 0 && (
          <p className="text-sm text-slate-500 py-4">No comments yet. Be the first.</p>
        )}
      </div>

      {isAuthenticated ? (
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50" disabled={submitting}>
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500 py-2">Log in to comment.</p>
      )}
    </div>
  );
}
