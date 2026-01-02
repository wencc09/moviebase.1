
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MBState, Mode, User, Profile } from './types';
import { GlobalStyles, CONFIG } from './constants';
import IndexPage from './pages/IndexPage';
import AppHub from './pages/AppHub';
import AboutPage from './pages/AboutPage';
import RecordsPage from './pages/RecordsPage';
import AccountPage from './pages/AccountPage';
import HallPage from './pages/HallPage';

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

  // 核心 API 呼叫函數：根據 Handoff 規範自動切換 GET/POST
  const apiCall = useCallback(async (payload: any) => {
    try {
      if (!payload.action) return null;

      // 判斷是否為讀取類 Action (根據 Handoff 第 8 點)
      const isReadAction = ["postList", "postSearch", "records.recommendGlobal"].includes(payload.action);
      
      let url = CONFIG.GAS_WEBAPP_URL;
      let options: RequestInit = {
        mode: "cors",
        redirect: "follow",
      };

      if (isReadAction) {
        // 使用 GET 請求，將參數轉化為 Query String
        const params = new URLSearchParams();
        Object.keys(payload).forEach(key => params.append(key, payload[key]));
        url += (url.includes("?") ? "&" : "?") + params.toString();
        options.method = "GET";
      } else {
        // 使用 POST 請求
        options.method = "POST";
        options.headers = { "Content-Type": "text/plain;charset=utf-8" };
        options.body = JSON.stringify(payload);
      }

      console.log(`MB API Request [${options.method}]:`, url);
      const res = await fetch(url, options);
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log(`MB API Response [${payload.action}]:`, json);
        return json;
      } catch (e) {
        console.error("API Parse error", text);
        return { ok: false, message: "資料格式解析失敗" };
      }
    } catch (e) {
      console.error("API Fetch error:", e);
      return { ok: false, message: "無法連接至後端服務" };
    }
  }, []);

  const verifyMe = useCallback(async (token?: string) => {
    const activeToken = token || state.idToken;
    if (!activeToken) return null;
    try {
      // 驗證身份通常用 POST
      const data = await apiCall({ action: "profileGet", idToken: activeToken });
      if (data && data.ok) return data.user || { name: data.authorName, picture: data.authorPic, sub: data.sub };
      return null;
    } catch (e) {
      return null;
    }
  }, [state.idToken, apiCall]);

  const loadProfile = useCallback(async (token: string) => {
    try {
      const data = await apiCall({ action: "profileGet", idToken: token });
      if (data && data.ok) {
        return data.profile || data.row || data.data || { nickname: data.nickname };
      }
      return null;
    } catch (e) {
      return null;
    }
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
          <div className="flex items-center gap-3 p-4 bg-[#101a33]/65 border border-white/20 rounded-2xl shadow-2xl glass">
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white/95 animate-spin-custom"></div>
            <div className="text-white font-medium">{loadingText}</div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<IndexPage state={state} setModeUser={setModeUser} setModeGuest={setModeGuest} />} />
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
      if (res && res.ok) setRecs(res.items || res.rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [apiPOST]);

  useEffect(() => {
    loadGlobalRecs();
  }, [loadGlobalRecs]);

  return (
    <div className="space-y-4">
      <section className="glass rounded-[18px] p-6 relative overflow-hidden">
        <h2 className="text-lg font-bold mb-2">🎬 影院大廳</h2>
        <p className="text-[#eaf0ffb8] text-sm leading-relaxed">
          這裡是你的入口導覽、站內公告與最新推薦。
        </p>
        <div className="h-[1px] bg-white/10 my-4"></div>
        <div className="flex gap-2 flex-wrap">
          <a href="#/app/hall" className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition">去漂浮影廳</a>
          <a href="#/app/records" className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition">去觀影紀錄</a>
        </div>
      </section>

      <section className="glass rounded-[18px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">✨ 站內熱門推薦</h2>
          <button onClick={loadGlobalRecs} className="text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-white/5">重新整理</button>
        </div>
        {isLoading ? (
          <div className="text-center py-10 opacity-50">讀取中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recs.map((it, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition">
                <div className="flex justify-between text-[10px] opacity-60 mb-2">
                  <span>TOP {idx + 1}</span>
                  <span>⭐ {it.avgRating?.toFixed(1) || it.rating}</span>
                </div>
                <div className="font-bold text-sm truncate">{it.title}</div>
                {it.posterUrl && (
                  <img src={it.posterUrl} className="w-full h-32 object-cover rounded-lg mt-2" alt={it.title} />
                )}
              </div>
            ))}
            {recs.length === 0 && <div className="col-span-full text-center py-10 opacity-50">尚無推薦資料</div>}
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
