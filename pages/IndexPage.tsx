
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MBState, Mode } from '../types';
import { CONFIG } from '../constants';

interface IndexPageProps {
  state: MBState;
  setModeUser: (user: any, token: string, profile: any) => void;
  setModeGuest: () => void;
}

const IndexPage: React.FC<IndexPageProps> = ({ state, setModeUser, setModeGuest }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: async (resp: any) => {
          const idToken = resp.credential;
          try {
            // 使用 profileGet 作為登入後的驗證與資料獲取
            const res = await fetch(CONFIG.GAS_WEBAPP_URL, {
              method: "POST",
              body: JSON.stringify({ action: "profileGet", idToken })
            });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch(e) { console.error("Parse error", text); return; }

            if (data && data.ok) {
              // 從 profileGet 的回傳中提取用戶基本資訊與 Profile
              const userObj = data.user || { 
                name: data.authorName || "User", 
                picture: data.authorPic || "", 
                email: "", 
                sub: data.sub || "" 
              };
              setModeUser(userObj, idToken, data.profile || data.row || data);
              navigate("/app/lobby");
            } else {
              alert("登入驗證失敗，請稍後再試");
            }
          } catch (e) {
            console.error("Login verify failed", e);
            alert("網路錯誤，無法連接至試算表服務");
          }
        }
      });
      const btn = document.getElementById("gsiBtn");
      if (btn) window.google.accounts.id.renderButton(btn, { theme: "outline", size: "large" });
    }
  }, [showSplash, setModeUser, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Splash */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] bg-[#070A12] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%22.22%22/%3E%3C/svg%3E')] rotate-6 scale-150"></div>
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 shadow-2xl flex items-center justify-center text-2xl font-bold mx-auto">MB</div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white relative">
              MOVIEBASE
            </h1>
            <p className="text-white/80 max-w-md mx-auto leading-relaxed text-sm md:text-base">
              Float your stories in a cinema of memories.<br/>
              <span className="opacity-70">把每一次觀影，收進漂浮影廳。</span>
            </p>
            <div className="animate-pulse text-xs text-white/50 pt-4">點一下畫面繼續</div>
          </div>
          <button onClick={() => setShowSplash(false)} className="absolute top-6 right-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold">SKIP</button>
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent to-[#070A12]"></div>
        </div>
      )}

      {/* Main UI */}
      {!showSplash && (
        <>
          <header className="sticky top-0 z-50 p-4 bg-gradient-to-b from-[#070a12] to-transparent backdrop-blur-md border-b border-white/10">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c4dff] to-[#00d5ff] shadow-xl flex items-center justify-center font-bold">MB</div>
                <div className="flex flex-col leading-none">
                  <b className="text-sm md:text-base">MovieBase</b>
                  <span className="text-[11px] text-white/60">漂浮影廳｜觀影日記</span>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="px-6 py-2 rounded-full bg-gradient-to-r from-[#84e3e8] via-[#e25f9e] to-[#f58e5f] text-[#0a0e1a] font-bold text-sm shadow-xl">立即登入</button>
            </div>
          </header>

          <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <div className="glass rounded-[28px] p-8 wiggle grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest">入口導覽牆</span>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">一座漂浮影廳<br/>心得 | 交流 | 紀錄</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                  右上角「立即登入」後選擇身分：<br/>
                  ・Google 用戶：可紀錄 / 發文 / 互動<br/>
                  ・訪客：只可瀏覽（不能寫入）
                </p>
                <div className="flex flex-wrap gap-2">
                  {['影集：季集時間碼', '電影：觀後感', '票根：照片備份', '貼文牆：公開分享'].map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">{t}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-2xl bg-white/5 border border-white/10 flex items-end p-4 text-[10px] font-bold">Poster Layout</div>
                <div className="h-32 rounded-2xl bg-white/5 border border-white/10 flex items-end p-4 text-[10px] font-bold">Feed Wall</div>
                <div className="h-32 col-span-2 rounded-2xl bg-gradient-to-br from-[#7c4dff]/20 to-[#00d5ff]/20 border border-white/10 flex items-end p-4 text-[10px] font-bold">Glassmorphism UI</div>
              </div>
            </div>

            <section className="glass rounded-[28px] p-8 space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px]">主站分頁導覽</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { t: '影院大廳', d: '整站入口與熱門精選公告。' },
                  { t: '漂浮影廳', d: '社交貼文牆，登入即可互動。' },
                  { t: '觀影紀錄', d: '私人進度追蹤，影集/電影進度管理。' },
                  { t: '我的帳戶', d: '個人化設定、暱稱與貼文管理。' }
                ].map((x, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                    <h3 className="font-bold text-sm mb-2">{x.t}</h3>
                    <p className="text-white/60 text-xs leading-relaxed">{x.d}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </>
      )}

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative glass w-full max-w-lg p-8 rounded-[32px] shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <b className="text-lg">登入 MovieBase</b>
                <p className="text-xs text-white/60 mt-1">選擇一扇門進入主站。</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">✕</button>
            </div>

            {authStep === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setAuthStep(2)} className="text-left p-4 rounded-2xl border border-[#00d5ff]/30 bg-white/5 shadow-[0_0_20px_rgba(0,213,255,0.1)] hover:bg-white/10 transition group">
                  <b className="block text-sm mb-1 group-hover:text-[#00d5ff]">Google 登入</b>
                  <span className="text-[11px] text-white/60">可新增紀錄、發文、按讚留言與修改暱稱</span>
                </button>
                <button onClick={() => { setModeGuest(); navigate("/app/lobby"); }} className="text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                  <b className="block text-sm mb-1">訪客進入</b>
                  <span className="text-[11px] text-white/60">僅限瀏覽，功能受限（不可發文按讚）</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div id="gsiBtn" className="flex justify-center scale-110"></div>
                <button onClick={() => setAuthStep(1)} className="text-xs text-white/40 hover:text-white/80 transition underline decoration-dotted underline-offset-4">返回身分選擇</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexPage;
