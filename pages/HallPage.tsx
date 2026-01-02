
import React, { useState, useEffect, useCallback } from 'react';
import { MBState, Mode, Post } from '../types';

// Enhanced array search with priority mapping
const findFirstArray = (obj: any): any[] | null => {
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== 'object' || obj === null) return null;
  const priorityKeys = ['rows', 'items', 'records', 'data', 'posts', 'values', 'list', 'contents'];
  for (const key of priorityKeys) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  for (const key in obj) {
    if (Array.isArray(obj[key])) return obj[key];
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nested = findFirstArray(obj[key]);
      if (nested) return nested;
    }
  }
  return null;
};

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
      console.log("[HallPage] Fetching postList from Spreadsheet...");
      const payload: any = { action: "postList" };
      if (state.idToken) payload.idToken = state.idToken;
      
      const data = await apiPOST(payload);
      
      if (data) {
        const rows = findFirstArray(data);
        
        if (!Array.isArray(rows)) {
          console.error("[HallPage] API returned no array data", data);
          setPosts([]);
          return;
        }

        // Mapping Logic supporting English AND Chinese spreadsheet headers
        const mapped: Post[] = rows.map((row: any, index: number) => {
          return {
            id: String(row.id || row.postId || row.rowId || row.ID || index),
            author: row.authorNickname || row.nickname || row.authorName || row.author || row.作者 || row.發文者 || "匿名用戶",
            title: row.title || row.workTitle || row.標題 || row.作品 || "",
            kind: row.category || row.kind || row.type || row.分類 || "movie",
            mood: Number(row.rating || row.mood || row.stars || row.score || row.評分 || 3),
            content: row.review || row.content || row.note || row.text || row.summary || row.心得 || row.內容 || row.評論 || "",
            tags: (() => {
              const t = row.hashtags || row.tags || row.標籤 || "";
              if (Array.isArray(t)) return t;
              if (typeof t === 'string') return t.split(/[\s,]+/).filter(Boolean).map(x => x.startsWith("#") ? x : `#${x}`);
              return [];
            })(),
            ts: row.ts || row.createdAt || row.updatedAt || row.timestamp || row.時間戳記 || row.日期 || "",
            photos: (() => {
              const p = row.photoUrls || row.photos || row.images || row.圖片 || row.照片 || [];
              if (Array.isArray(p)) return p;
              if (typeof p === 'string') {
                try { return JSON.parse(p); } catch(e) { return p.split(',').filter(Boolean); }
              }
              return [];
            })(),
            likeCount: Number(row.likeCount || row.likes || row.按讚 || 0),
            liked: !!(row.liked || row.isLiked),
            commentCount: Number(row.commentCount || row.comments || row.留言數 || 0),
          };
        });

        console.log(`[HallPage] Successfully mapped ${mapped.length} posts.`);
        setPosts(mapped);
      }
    } catch (e) {
      console.error("[HallPage] Load Posts Exception:", e);
    }
  }, [state.idToken, apiPOST]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.mode !== Mode.USER) return alert("登入後才可發文");
    if (!form.content.trim()) return;

    showLoading("同步至試算表中...");
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
      if (res && (res.ok || res.id || res.status === 'success')) {
        setForm({ title: '', kind: 'movie', content: '', tags: '', mood: 5, photos: [] });
        setIsComposerOpen(false);
        loadPosts();
      } else {
        alert("發佈失敗：" + (res?.message || "後端拒絕了請求"));
      }
    } catch (e) {
      alert("發佈失敗，請檢查網路或 API 設定");
    } finally {
      hideLoading();
    }
  };

  const toggleLike = async (postId: string) => {
    if (state.mode !== Mode.USER) return alert("登入後才可按讚");
    try {
      const data = await apiPOST({ action: "likeToggle", idToken: state.idToken, postId });
      if (data && (data.ok || data.status === 'success')) {
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
        const rows = findFirstArray(data);
        if (rows) {
          setComments(rows.map((c: any, i: number) => ({
            id: String(c.id || c.commentId || i),
            authorName: c.authorNickname || c.authorName || c.nickname || c.作者 || "匿名",
            text: c.text || c.content || c.內容 || "",
            ts: c.ts || c.createdAt || c.日期 || ""
          })));
        }
      }
    } catch (e) {} finally {
      setIsLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !commentModalPost) return;
    if (state.mode !== Mode.USER) return alert("請先登入");
    showLoading("正在留言...");
    try {
      const res = await apiPOST({ action: "commentCreate", idToken: state.idToken, postId: commentModalPost.id, text: newComment.trim() });
      if (res && (res.ok || res.id || res.status === 'success')) {
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
    return (p.content || "").toLowerCase().includes(s) || 
           (p.title || "").toLowerCase().includes(s) || 
           (p.author || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="cinema-screen rounded-[28px] p-6 border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
        
        {/* Connection Status Header */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🍿</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">漂浮影廳</h1>
              <div className="flex items-center gap-1.5 opacity-50 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#84e3e8]"></span>
                同步自試算表內容
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="flex-1 md:w-64 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs outline-none focus:border-[#84e3e8] transition-colors" 
              placeholder="搜尋影評、作者或標籤…" 
            />
            <button onClick={loadPosts} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 active:scale-95 transition">🔄 整理</button>
          </div>
        </div>

        {/* Composer Section */}
        <div className="relative z-10 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden glass">
            <details className="group" open={isComposerOpen} onToggle={(e:any) => setIsComposerOpen(e.target.open)}>
              <summary className="p-4 cursor-pointer flex justify-between items-center list-none font-bold text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎞️</span>
                  <span>新增你的觀影分享</span>
                </div>
                <span className="text-[10px] opacity-40 font-normal group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase opacity-50 px-1">作品標題</label>
                      <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#84e3e8]" placeholder="片名 / 劇名" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase opacity-50 px-1">分類</label>
                      <select value={form.kind} onChange={e => setForm({...form, kind: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#84e3e8]">
                        <option value="movie">電影 Movie</option>
                        <option value="series">影集 Series</option>
                        <option value="anime">動畫 Anime</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 px-1">你的心得</label>
                    <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none min-h-[120px] focus:border-[#84e3e8]" placeholder="寫下你的評價、推薦原因或吐槽..." rows={4} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(v => (
                        <button key={v} type="button" onClick={() => setForm({...form, mood: v})} className={`text-xl transition ${v <= form.mood ? 'opacity-100 scale-110' : 'opacity-20'}`}>⭐</button>
                      ))}
                    </div>
                    <button type="submit" disabled={state.mode !== Mode.USER} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#e25f9e] to-[#f58e5f] text-white font-bold text-sm disabled:opacity-30 shadow-lg hover:shadow-xl active:scale-95 transition">立即發佈</button>
                  </div>
                </form>
              </div>
            </details>
          </div>
        </div>

        {/* Post List */}
        <div className="relative z-10 space-y-6 max-h-[75vh] overflow-y-auto pr-3 custom-scrollbar">
          {posts.length > 0 ? filteredPosts.map(post => (
            <article key={post.id} className="bg-white/5 border border-white/10 rounded-[24px] p-5 shadow-lg hover:border-white/20 transition-all hover:bg-white/[0.07] group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-xs border border-white/5 text-[#84e3e8]">
                    {(post.author || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold group-hover:text-[#84e3e8] transition">{post.author}</div>
                    <div className="text-[9px] opacity-40">{post.ts}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] text-yellow-400">{'★'.repeat(post.mood)}</div>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[8px] uppercase tracking-widest opacity-60">{post.kind}</span>
                </div>
              </div>
              
              {post.title && <div className="text-sm font-bold mb-2 text-white/95">{post.title}</div>}
              <p className="text-xs leading-relaxed text-white/80 whitespace-pre-wrap mb-4">{post.content}</p>
              
              {post.photos.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-4 scrollbar-hide">
                  {post.photos.map((url, i) => (
                    <img key={i} src={url} className="h-52 rounded-2xl border border-white/10 object-cover shadow-md hover:scale-[1.02] transition" alt="" loading="lazy" />
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-4 mt-2 pt-4 border-t border-white/5">
                <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 transition active:scale-90 ${post.liked ? 'bg-pink-500/20 border-pink-500/40 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'hover:bg-white/5'}`}>
                  <span className="text-xs">♥</span>
                  <span className="text-[11px] font-bold">{post.likeCount}</span>
                </button>
                <button onClick={() => openCommentModal(post)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition active:scale-90">
                  <span className="text-xs">💬</span>
                  <span className="text-[11px] font-bold">{post.commentCount}</span>
                </button>
              </div>
            </article>
          )) : (
            <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center">
              <div className="text-5xl mb-4">🛸</div>
              <div className="text-sm italic font-medium">目前的影廳空蕩蕩的...<br/>試算表中還沒有任何貼文。</div>
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {commentModalPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setCommentModalPost(null)}></div>
          <div className="relative glass w-full max-w-lg p-6 rounded-[32px] flex flex-col max-h-[85vh] animate-slideUp border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <b className="text-lg">貼文留言</b>
                <p className="text-[10px] opacity-40">討論作品：{commentModalPost.title}</p>
              </div>
              <button onClick={() => setCommentModalPost(null)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-[150px]">
              {isLoadingComments ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#84e3e8]/30 border-t-[#84e3e8] rounded-full animate-spin"></div>
                  <span className="text-[10px] opacity-40 uppercase tracking-widest">正在載入留言...</span>
                </div>
              ) : comments.length > 0 ? (
                comments.map(c => (
                  <div key={c.id} className="bg-white/5 p-4 rounded-[20px] border border-white/5 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] mb-2">
                      <span className="font-bold text-[#84e3e8] bg-[#84e3e8]/10 px-2 py-0.5 rounded-full">{c.authorName}</span>
                      <span className="opacity-30 italic">{c.ts}</span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 opacity-20 text-[10px] italic">尚未有留言，搶個頭香吧！</div>
              )}
            </div>
            
            {state.mode === Mode.USER ? (
              <div className="mt-6 pt-5 border-t border-white/10 flex gap-2">
                <input 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#84e3e8] transition-colors" 
                  placeholder="寫下你的感想…" 
                  onKeyPress={e => e.key === 'Enter' && submitComment()}
                />
                <button onClick={submitComment} className="px-5 py-3 rounded-2xl bg-[#84e3e8] text-[#0a0e1a] font-black text-xs shadow-lg hover:shadow-[#84e3e8]/20 transition-all active:scale-95">送出</button>
              </div>
            ) : (
              <div className="mt-6 pt-4 text-center text-[10px] opacity-40 italic">登入後即可參與討論</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HallPage;
