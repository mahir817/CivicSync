# CivicSync Frontend Guide — Picture Upload + Comments
### For: the New Post picture attachment feature and Facebook-style comments

This covers exactly what to build, where, and how to call the two new backend features.
Assumes the existing frontend structure (`src/api/client.js`, `src/pages/`, `src/components/`,
`src/context/AuthContext.jsx`) is already in place.

---

## Part 1 — Picture Upload on New Post

### The core idea
Posting a campaign and attaching pictures now happens in **one request**, not two. The backend
endpoint accepts a multipart form with two parts: `campaign` (a JSON blob) and `files` (one or more
actual files).

### 1. `src/api/client.js` — add this to `campaignApi`

```js
export const campaignApi = {
  getAll: (category) =>
    api.get("/campaigns", { params: category ? { category } : {} }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getPending: () => api.get("/campaigns/pending"),
  create: (data) => api.post("/campaigns", data),
  verify: (id, approve) => api.put(`/campaigns/${id}/verify`, null, { params: { approve } }),

  // NEW — creates a campaign AND uploads pictures/files in one request
  createWithImages: (campaignData, files) => {
    const formData = new FormData();

    // IMPORTANT: this JSON part needs an explicit Content-Type of application/json,
    // or Spring will fail to parse it. Passing a Blob (not a plain object) is what sets that.
    formData.append(
      "campaign",
      new Blob([JSON.stringify(campaignData)], { type: "application/json" })
    );

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    return api.post("/campaigns/with-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
```

**Do not manually set `Content-Type: multipart/form-data` with a boundary yourself elsewhere** —
axios/the browser sets the boundary automatically when it sees a `FormData` body. If you hardcode
the header without letting the browser add the boundary, the upload will fail silently on the backend.

### 2. `src/pages/NewPost.jsx` — what to change

Add file selection state and a file input, then branch on submit: use `createWithImages` if files
are attached, otherwise fall back to the plain `create` call (no need to force an empty multipart
request when there's nothing to upload).

```jsx
// Add to existing state:
const [files, setFiles] = useState([]);

// Add a file input somewhere in the form, e.g. after the "Goal amount" field:
<label>Attach pictures or documents (optional)</label>
<input
  type="file"
  multiple
  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
  onChange={(e) => setFiles(Array.from(e.target.files))}
/>
{files.length > 0 && (
  <p className="file-list-preview">
    {files.length} file{files.length > 1 ? "s" : ""} selected: {files.map(f => f.name).join(", ")}
  </p>
)}

// In handleSubmit, replace the existing campaignApi.create(payload) call with:
if (files.length > 0) {
  await campaignApi.createWithImages(payload, files);
} else {
  await campaignApi.create(payload);
}
```

**Validation to add client-side** (the backend enforces these too, but catching it before upload
saves the user a wasted round trip):
- Max 5 files
- Max 10MB per file
- Only these types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.doc`, `.docx`

```js
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateFiles(selectedFiles) {
  if (selectedFiles.length > MAX_FILES) return `Max ${MAX_FILES} files allowed.`;
  const tooLarge = selectedFiles.find((f) => f.size > MAX_SIZE);
  if (tooLarge) return `${tooLarge.name} is too large (max 10MB).`;
  return null;
}
```
Call this in the `onChange` handler and show the returned message in your existing `error` state
if it's non-null, instead of setting `files`.

### 3. `src/pages/CampaignDetail.jsx` — show the uploaded attachments

Fetch and render whatever was attached, using the existing attachment endpoints
(`GET /api/campaigns/{id}/attachments` — already covered by `campaignApi` if you add it, see below).

Add to `client.js`:
```js
export const attachmentApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/attachments`),
};
```

In `CampaignDetail.jsx`, fetch alongside the campaign itself:
```jsx
const [attachments, setAttachments] = useState([]);

useEffect(() => {
  attachmentApi.getForCampaign(id).then((res) => setAttachments(res.data)).catch(() => {});
}, [id]);
```

Render them — split images (show as thumbnails/gallery) from documents (show as download links):
```jsx
{attachments.length > 0 && (
  <div className="attachments-section">
    <h3>Attachments</h3>
    <div className="attachments-grid">
      {attachments.map((a) =>
        a.fileType.startsWith("image/") ? (
          <img
            key={a.id}
            src={`http://localhost:8080${a.url}`}
            alt={a.fileName}
            className="attachment-thumb"
          />
        ) : (
          <a
            key={a.id}
            href={`http://localhost:8080${a.url}`}
            target="_blank"
            rel="noreferrer"
            className="attachment-doc-link"
          >
            📄 {a.fileName}
          </a>
        )
      )}
    </div>
  </div>
)}
```

**Note the hardcoded `http://localhost:8080`** — same pattern the rest of the app already uses for
`baseURL`. If you ever centralize that into an env variable, update this too.

---

## Part 2 — Comments (Facebook-style, on both Campaigns and Civic Reports)

### The core idea
One `CommentSection` component, reused on both post types — pass it which endpoint to call, don't
duplicate the component. The backend has parallel routes for each:
- `/api/campaigns/{id}/comments`
- `/api/civic-reports/{id}/comments`

### 1. `src/api/client.js` — add this new export

```js
export const commentApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/comments`),
  addToCampaign: (campaignId, content) => api.post(`/campaigns/${campaignId}/comments`, { content }),

  getForCivicReport: (reportId) => api.get(`/civic-reports/${reportId}/comments`),
  addToCivicReport: (reportId, content) => api.post(`/civic-reports/${reportId}/comments`, { content }),
};
```

### 2. `src/components/CommentSection.jsx` — new reusable component

```jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

// postType: "campaign" or "civicReport" — determines which API calls to use
export default function CommentSection({ postId, postType, commentApi }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getComments = postType === "campaign" ? commentApi.getForCampaign : commentApi.getForCivicReport;
  const addComment = postType === "campaign" ? commentApi.addToCampaign : commentApi.addToCivicReport;

  useEffect(() => {
    getComments(postId)
      .then((res) => setComments(res.data))
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
      // keep it low-key — a failed comment shouldn't block the rest of the page
      alert("Couldn't post your comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-heading">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading && <p className="feed-status">Loading comments...</p>}

      <div className="comment-list">
        {comments.map((c) => (
          <div className="comment-item" key={c.id}>
            <span className="comment-author">{c.authorName}</span>
            <p className="comment-content">{c.content}</p>
            <span className="comment-time">
              {new Date(c.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        {!loading && comments.length === 0 && (
          <p className="feed-status">No comments yet. Be the first.</p>
        )}
      </div>

      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
          />
          <button type="submit" className="btn-primary-sm" disabled={submitting}>
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      ) : (
        <p className="feed-status">Log in to comment.</p>
      )}
    </div>
  );
}
```

### 3. Use it in `CampaignDetail.jsx`

```jsx
import CommentSection from "../components/CommentSection";
import { commentApi } from "../api/client";

// Add near the bottom of the returned JSX, after the Trust Trail / Donate button:
<CommentSection postId={campaign.id} postType="campaign" commentApi={commentApi} />
```

### 4. If/when you build a Civic Report detail view, same pattern

```jsx
<CommentSection postId={report.id} postType="civicReport" commentApi={commentApi} />
```

### 5. `src/styles.css` — append these

```css
/* Attachments */
.attachments-section { margin-top: 28px; }
.attachments-section h3 { color: var(--civic-blue); font-size: 15px; margin-bottom: 10px; }
.attachments-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.attachment-thumb {
  width: 110px; height: 110px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border);
}
.attachment-doc-link {
  display: flex; align-items: center; padding: 10px 14px; border: 1px solid var(--border);
  border-radius: 10px; font-size: 13px; text-decoration: none; color: var(--text);
}
.file-list-preview { font-size: 12px; color: var(--text-muted); margin: -8px 0 8px 0; }

/* Comments */
.comment-section { margin-top: 32px; border-top: 1px solid var(--border); padding-top: 20px; }
.comment-heading { color: var(--civic-blue); font-size: 15px; margin-bottom: 14px; }
.comment-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.comment-item { background: var(--bg); border-radius: 10px; padding: 10px 14px; }
.comment-author { font-size: 12.5px; font-weight: 700; color: var(--civic-blue); }
.comment-content { font-size: 13.5px; margin: 4px 0; color: var(--text); }
.comment-time { font-size: 11px; color: var(--text-muted); }
.comment-form { display: flex; gap: 8px; }
.comment-form input {
  flex: 1; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 13.5px;
}
```

---

## Quick reference — what talks to what

| Feature | Frontend file(s) to touch | Backend endpoint(s) |
|---|---|---|
| Picture upload on New Post | `NewPost.jsx`, `client.js` | `POST /api/campaigns/with-images` |
| Show attachments on detail page | `CampaignDetail.jsx`, `client.js` | `GET /api/campaigns/{id}/attachments` |
| Comments on a campaign | `CampaignDetail.jsx`, new `CommentSection.jsx`, `client.js` | `GET`/`POST /api/campaigns/{id}/comments` |
| Comments on a civic report | (wherever civic report detail lives), `CommentSection.jsx`, `client.js` | `GET`/`POST /api/civic-reports/{id}/comments` |

---

## Testing checklist before calling this done
- [ ] Submit New Post with 0 files — still works (falls back to plain `create`)
- [ ] Submit New Post with 1-2 images — appear on Campaign Detail as thumbnails
- [ ] Submit New Post with a PDF — appears as a download link, not a broken image
- [ ] Try uploading 6 files — should get a clear error, not a silent failure
- [ ] Post a comment while logged out — should see "Log in to comment," not a broken form
- [ ] Post a comment while logged in — appears immediately without needing a page refresh
- [ ] Two different users commenting on the same campaign — both comments visible to both
