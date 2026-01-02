
import React, { useState, useEffect, useCallback } from 'react';
import { MBState, Mode, Post } from '../types';

interface Comment {
  id: string;
  authorName: string;
  authorPic?: string;
  text: string;
  ts: string;
}

interface HallPageProps {
  state: MBState;
  apiPOST: any;
  showLoading: (t?: string) => void;
  hideLoading: () => void;
}

const HallPage: React.FC<HallPageProps> = ({ state, apiPOST, showLoading, hideLoading }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [form, setForm] = useState({ title: '', kind: 'movie', content: '', tags: '', mood: 5, photos: [] as string[] });
  
  const [commentModalPost, setCommentModalPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      console.log("MB Debug: 正在請求貼文列表 (postList)...");
      const payload: any = { action: "postList" };
      if (state.idToken) payload.idToken = state.idToken;
      
      const data = await apiPOST(payload);
      
      if (data) {
        // GAS 可能的回傳結構：rows, items, records, data, posts, values
        const rows = data.rows || data.items || data.records || data.data || data.posts || data.values || (Array.isArray(data) ? data : []);
        
        if (!Array.isArray(rows)) {
          console.error("MB Error: 無法找到有效的貼文陣列", data);
          return;
        }

        const mapped = rows.map((row: any, index: number) => {
          return {
            id: String(row.id || row.postId || row.rowId || `post-${index}`),
            author: row.authorNickname || row.nickname || row.authorName || row.author || "User",
            title: row.title || row.workTitle || "",
            kind: row.category || row.kind || row.type || "movie",
            mood: Number(row.rating || row.mood || row.stars || row.score || 3),
            content: row.review || row.content || row.note || row.text || row.summary || "",
            tags: (() => {
              const t = row.hashtags || row.tags || "";
              if (Array.isArray(t)) return t;
              if (typeof t === 'string') return t.split(/[\s,]+/).filter(Boolean).map(x => x.startsWith("#") ? x : `#${x}`);
              return [];
            })(),
            ts: row.ts || row.createdAt || row.updatedAt || row.timestamp || "",
            photos: (() => {
              const p = row.photoUrls || row.photos || row.images || [];
              if (Array.isArray(p)) return p;
              if (typeof p === 'string') {
                try { return JSON.parse(p); } catch(e) { return p.split(',').filter(Boolean); }
              }
              return [];
            })(),
            likeCount: Number(row.likeCount || row.likes || 0),
            liked: !!row.liked,
            commentCount: Number(row.commentCount || row.comments || 0),
          };
        });

        setPosts(mapped);
      }
    } catch (e) {
      console.error("MB Error: 載入貼文發生例外", e);
    }
  }, [state.idToken, apiPOST]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) return alert("最多只能選 4 張圖片");
    const readers = files.map(f => new Promise<string>(res => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(f);
    }));
    const results = await Promise.all(readers);
    setForm(prev => ({ ...prev, photos: results }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.mode !== Mode.USER) return alert("登入後才可發文");
    if (!form.content.trim()) return;

    showLoading("發布貼文中...");
    try {
      const res = await apiPOST({
        action: "postCreate",
        idToken: state.idToken,
        title: form.title,
        category: form.kind,
        rating: form.mood,
        review: form.content,
        hashtags: form.tags,
        photos: form.photos
      });
      if (res.ok) {
        setForm({ title: '', kind: 'movie', content: '', tags: '', mood: 5, photos: [] });
        setIsComposerOpen(false);
        loadPosts();
      } else {
        alert("發佈失敗：" + (res.message || "未知錯誤"));
      }
    } catch (e) {
      alert("發佈失敗，請檢查網路");
    } finally {
      hideLoading();
    }
  };

  const toggleLike = async (postId: string) => {
    if (state.mode !== Mode.USER) return alert("登入後才可按讚");
    try {
      const data = await apiPOST({ action: "likeToggle", idToken: state.idToken, postId });
      if (data && data.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: data.liked, likeCount: data.likeCount } : p));
      }
    } catch (e) {}
  };

  const openCommentModal = async (post: Post) => {
    setCommentModalPost(post);
    setComments([]);
    setNewComment("");
    setIsLoadingComments(true);
    try {
      const data = await apiPOST({ action: "commentList", postId: post.id });
      if (data) {
        const rows = data.rows || data.items || data.records || data.data || (Array.isArray(data) ? data : []);
        setComments(rows.map((c: any, i: number) => ({
          id: String(c.id || c.commentId || `c-${i}`),
          authorName: c.authorNickname || c.authorName || c.nickname || "匿名",
          text: c.text || c.content || "",
          ts: c.ts || c.createdAt || ""
        })));
      }
    } catch (e) {} finally {
      setIsLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !commentModalPost) return;
    if (state.mode !== Mode.USER) return alert("請先登入");
    showLoading("留言中...");
    try {
      const res = await apiPOST({ action: "commentCreate", idToken: state.idToken, postId: commentModalPost.id, text: newComment.trim() });
      if (res.ok) {
        setNewComment("");
        openCommentModal(commentModalPost);
        setPosts(prev => prev.map(p => p.id === commentModalPost.id ? { ...p, commentCount: p.commentCount + 1 } : p));
      }
    } catch (e) {} finally {
      hideLoading();
    }
  };

  const filteredPosts = posts.filter(p => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (p.content || "").toLowerCase().includes(s) || (p.title || "").toLowerCase().includes(s) || (p.author || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="cinema-screen rounded-[28px] p-4 border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl">🍿</div>
              <div>
                <h1 className="text-xl font-bold">漂浮影廳</h1>
                <p className="text-[11px] text-white/50">把回憶投射在牆上，讓影評在空中漂浮。</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 md:w-64 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs outline-none" placeholder="搜尋內容…" />
              <button onClick={loadPosts} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10">更新</button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <details className="group" open={isComposerOpen} onToggle={(e:any) => setIsComposerOpen(e.target.open)}>
              <summary className="p-4 cursor-pointer flex justify-between items-center list-none font-bold text-sm">
                <span>＋ 新增貼文</span>
                <span className="text-[10px] opacity-40 font-normal">{state.mode === Mode.GUEST ? '（訪客僅限瀏覽）' : '（已登入，可發文）'}</span>
              </summary>
              <div className="p-4 border-t border-white/10 bg-white/5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" placeholder="標題" />
                    <select value={form.kind} onChange={e => setForm({...form, kind: e.target.value})} className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none">
                      <option value="movie">電影</option><option value="series">影集</option><option value="anime">動畫</option><option value="other">其他</option>
                    </select>
                  </div>
                  <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none min-h-[100px]" placeholder="分享你的影評..." rows={4} />
                  <div className="flex justify-end gap-3">
                    <button type="submit" disabled={state.mode !== Mode.USER} className="px-8 py-2 rounded-xl bg-gradient-to-r from-[#e25f9e] to-[#f58e5f] text-white font-bold text-sm disabled:opacity-30">發佈</button>
                  </div>
                </form>
              </div>
            </details>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredPosts.map(post => (
              <article key={post.id} className="bg-black/20 border border-white/10 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs">{(post.author || "U").slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="text-xs font-bold">{post.author}</div>
                      <div className="text-[9px] opacity-40">{post.ts}</div>
                    </div>
                  </div>
                  <div className="text-[9px] opacity-60">{'★'.repeat(post.mood)}</div>
                </div>
                <div className="text-sm font-bold mb-2">{post.title}</div>
                <p className="text-xs leading-relaxed text-white/90 whitespace-pre-wrap">{post.content}</p>
                {post.photos.length > 0 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                    {post.photos.map((url, i) => (
                      <img key={i} src={url} className="h-48 rounded-xl border border-white/10" alt="" loading="lazy" />
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/5">
                  <button onClick={() => toggleLike(post.id)} className={`px-3 py-1.5 rounded-full border border-white/10 ${post.liked ? 'bg-pink-500/20' : ''}`}>♥ {post.likeCount}</button>
                  <button onClick={() => openCommentModal(post)} className="px-3 py-1.5 rounded-full border border-white/10">💬 {post.commentCount}</button>
                </div>
              </article>
            ))}
            {filteredPosts.length === 0 && <div className="text-center py-20 opacity-30 text-sm">目前沒有貼文</div>}
          </div>
        </div>
      </div>

      {commentModalPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setCommentModalPost(null)}></div>
          <div className="relative glass w-full max-w-lg p-6 rounded-[32px] flex flex-col max-h-[85vh] animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <b className="text-lg">貼文留言</b>
              <button onClick={() => setCommentModalPost(null)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {isLoadingComments ? <div className="text-center py-10 opacity-50">讀取中...</div> : comments.map(c => (
                <div key={c.id} className="bg-white/5 p-3 rounded-2xl">
                  <div className="flex justify-between text-[10px] mb-1"><span className="font-bold text-[#84e3e8]">{c.authorName}</span><span className="opacity-30">{c.ts}</span></div>
                  <p className="text-xs">{c.text}</p>
                </div>
              ))}
            </div>
            {state.mode === Mode.USER && (
              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" placeholder="寫下感想…" />
                <button onClick={submitComment} className="px-4 py-2 rounded-xl bg-[#84e3e8] text-[#0a0e1a] font-bold">送出</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HallPage;
