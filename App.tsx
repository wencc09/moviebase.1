
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MBState, Mode, User, Profile } from './types';
import { GlobalStyles, CONFIG } from './constants';
import IndexPage from './pages/IndexPage';
import AppHub from './pages/AppHub';
import AboutPage from './pages/AboutPage';
import RecordsPage from './pages/RecordsPage';
import AccountPage from './pages/AccountPage';
import HallPage from './pages/HallPage';

// Advanced utility to find the data array regardless of the GAS response structure
const findFirstArray = (obj: any): any[] | null => {
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== 'object' || obj === null) return null;
  
  // Look for common wrapper keys
  const priorityKeys = ['rows', 'items', 'records', 'data', 'posts', 'values', 'list', 'contents'];
  for (const key of priorityKeys) {
    if (Array.isArray(obj[key])) return obj[key];
  }

  // Deep recursive search for any array if priority keys fail
  for (const key in obj) {
    if (Array.isArray(obj[key])) return obj[key];
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nested = findFirstArray(obj[key]);
      if (nested) return nested;
    }
  }
  return null;
};

const App: React.FC = () => {
  const [state, setState] = useState<MBState>({
    mode: Mode.UNKNOWN,
    user: null,
    profile: null,
    idToken: localStorage.getItem("id_token") || ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("讀取中…");

  const showLoading = (text = "讀取中…") => {
    setLoadingText(text);
    setIsLoading(true);
  };
  const hideLoading = () => setIsLoading(false);

  const apiCall = useCallback(async (payload: any) => {
    try {
      if (!payload.action) return null;
      console.log(`[MovieBase API] Requesting: ${payload.action}`, payload);
      
      const res = await fetch(CONFIG.GAS_WEBAPP_URL, {
        method: "POST",
        mode: "cors",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log(`[MovieBase API] Success: ${payload.action}`, json);
        return json;
      } catch (e) {
        console.error("[MovieBase API] Parse Error:", text.slice(0, 500));
        return null;
      }
    } catch (e) {
      console.error("[MovieBase API] Fetch Error:", e);
      return null;
    }
  }, []);

  const verifyMe = useCallback(async (token?: string) => {
    const activeToken = token || state.idToken;
    if (!activeToken) return null;
    const data = await apiCall({ action: "profileGet", idToken: activeToken });
    if (data && data.ok) return data.user || { name: data.authorName, picture: data.authorPic, sub: data.sub };
    return null;
  }, [state.idToken, apiCall]);

  const loadProfile = useCallback(async (token: string) => {
    const data = await apiCall({ action: "profileGet", idToken: token });
    if (data && data.ok) {
      return data.profile || data.row || data.data || { nickname: data.nickname };
    }
    return null;
  }, [apiCall]);

  useEffect(() => {
    const boot = async () => {
      const storedMode = localStorage.getItem("mode");
      const storedToken = localStorage.getItem("id_token");

      if (storedToken) {
        const user = await verifyMe(storedToken);
        if (user) {
          const profile = await loadProfile(storedToken);
          setState({ mode: Mode.USER, user, profile, idToken: storedToken });
        } else {
          localStorage.removeItem("id_token");
          setState({ mode: Mode.GUEST, user: null, profile: null, idToken: "" });
        }
      } else {
        const targetMode = storedMode === "guest" ? Mode.GUEST : Mode.UNKNOWN;
        setState(prev => ({ ...prev, mode: targetMode }));
      }
    };
    boot();
  }, [verifyMe, loadProfile]);

  const setModeUser = (user: User, token: string, profile: Profile | null) => {
    localStorage.setItem("id_token", token);
    localStorage.setItem("mode", "user");
    setState({ mode: Mode.USER, user, idToken: token, profile });
  };

  const setModeGuest = () => {
    localStorage.removeItem("id_token");
    localStorage.setItem("mode", "guest");
    setState({ mode: Mode.GUEST, user: null, idToken: "", profile: null });
  };

  const logout = () => {
    setModeGuest();
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  };

  return (
    <Router>
      <GlobalStyles />
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3 p-4 bg-[#101a33]/65 border border-white/20 rounded-2xl shadow-2xl glass animate-fadeIn">
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white/95 animate-spin-custom"></div>
            <div className="text-white font-medium">{loadingText}</div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<IndexPage state={state} apiCall={apiCall} setModeUser={setModeUser} setModeGuest={setModeGuest} />} />
        <Route path="/app" element={<AppHub state={state} logout={logout} apiPOST={apiCall} showLoading={showLoading} hideLoading={hideLoading} />}>
          <Route path="lobby" element={<LobbyView state={state} apiPOST={apiCall} />} />
          <Route path="hall" element={<HallPage state={state} apiPOST={apiCall} showLoading={showLoading} hideLoading={hideLoading} />} />
          <Route path="records" element={<RecordsPage state={state} apiPOST={apiCall} showLoading={showLoading} hideLoading={hideLoading} />} />
          <Route path="account" element={<AccountPage state={state} apiPOST={apiCall} showLoading={showLoading} hideLoading={hideLoading} setState={setState} />} />
          <Route index element={<Navigate to="lobby" replace />} />
        </Route>
        <Route path="/about" element={<AboutPage state={state} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const LobbyView: React.FC<{ state: MBState, apiPOST: any }> = ({ state, apiPOST }) => {
  const [recs, setRecs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGlobalRecs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiPOST({ action: "records.recommendGlobal", limit: 6 });
      if (res) {
        const rows = findFirstArray(res);
        if (rows) setRecs(rows);
      }
    } catch (e) {
      console.error("Lobby Load Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [apiPOST]);

  useEffect(() => {
    loadGlobalRecs();
  }, [loadGlobalRecs]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <section className="glass rounded-[18px] p-6 relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] text-green-400 font-bold uppercase tracking-tighter">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Cloud Sync Active
        </div>
        <h2 className="text-lg font-bold mb-2">🎬 影院大廳</h2>
        <p className="text-[#eaf0ffb8] text-sm leading-relaxed">
          歡迎來到 MovieBase。在這裡管理你的私人觀影清單，或在漂浮影廳與全球影迷交流。
        </p>
        <div className="h-[1px] bg-white/10 my-4"></div>
        <div className="flex gap-2 flex-wrap">
          <a href="#/app/hall" className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition text-xs font-bold">去漂浮影廳</a>
          <a href="#/app/records" className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition text-xs font-bold">去觀影紀錄</a>
        </div>
      </section>

      <section className="glass rounded-[18px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">✨ 站內熱門推薦</h2>
          <button onClick={loadGlobalRecs} className="text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-white/5 transition active:scale-95">重新整理</button>
        </div>
        {isLoading ? (
          <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-xs">同步試算表資料中...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recs.map((it, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all hover:translate-y-[-2px] group">
                <div className="flex justify-between text-[10px] opacity-60 mb-2 group-hover:opacity-100 transition">
                  <span className="font-bold">TOP {idx + 1}</span>
                  <span className="text-yellow-400 font-bold">⭐ {Number(it.avgRating || it.rating || 0).toFixed(1)}</span>
                </div>
                <div className="font-bold text-sm truncate mb-1">{it.title || it.標題 || "未命名作品"}</div>
                <div className="text-[10px] opacity-40 mb-3 truncate">{it.genre || it.分類 || "電影"}</div>
                {it.posterUrl || it.圖片 ? (
                  <img src={it.posterUrl || it.圖片} className="w-full h-36 object-cover rounded-xl mt-2 border border-white/5" alt={it.title} />
                ) : (
                  <div className="w-full h-36 bg-black/40 rounded-xl mt-2 flex items-center justify-center border border-dashed border-white/10 italic text-[10px] opacity-30">No Image</div>
                )}
              </div>
            ))}
            {recs.length === 0 && (
              <div className="col-span-full text-center py-20 opacity-30 border border-dashed border-white/10 rounded-2xl">
                <div className="text-2xl mb-2">🎞️</div>
                <div className="text-xs">尚無熱門資料，開始記錄你的第一部作品吧！</div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
