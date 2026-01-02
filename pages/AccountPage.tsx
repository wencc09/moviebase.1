
import React, { useState } from 'react';
import { MBState, Mode } from '../types';

interface AccountPageProps {
  state: MBState;
  apiPOST: any;
  showLoading: (t?: string) => void;
  hideLoading: () => void;
  setState: React.Dispatch<React.SetStateAction<MBState>>;
}

const AccountPage: React.FC<AccountPageProps> = ({ state, apiPOST, showLoading, hideLoading, setState }) => {
  const [nickname, setNickname] = useState(state.profile?.nickname || "");

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    showLoading("更新暱稱中...");
    try {
      // 對齊 Handoff：action=profileSetNickname
      const res = await apiPOST({ action: "profileSetNickname", idToken: state.idToken, nickname: nickname.trim() });
      if (res.ok) {
        setState(prev => ({ 
          ...prev, 
          profile: { ...(prev.profile || {}), nickname: nickname.trim() }
        }));
        alert("暱稱已更新！");
      }
    } catch (e) {
      alert("更新失敗");
    } finally {
      hideLoading();
    }
  };

  if (state.mode === Mode.GUEST) {
    return (
      <div className="glass rounded-[28px] p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-4xl mb-2">👀</div>
        <h2 className="text-xl font-bold">訪客模式</h2>
        <p className="text-white/60 text-sm max-w-xs">登入後才可管理個人暱稱、查看「我的貼文」與「已按讚項目」。</p>
        <button onClick={() => window.location.hash = "/"} className="px-8 py-3 rounded-full bg-white/5 border border-white/20 font-bold">前往登入</button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="glass rounded-[28px] p-6 space-y-6">
        <h2 className="text-lg font-bold">帳戶資訊</h2>
        <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          {state.user?.picture && <img src={state.user.picture} className="w-12 h-12 rounded-full border border-white/20 shadow-lg" alt="" />}
          <div className="flex flex-col">
            <span className="text-xs opacity-50">Google 帳號</span>
            <span className="text-sm font-bold">{state.user?.name}</span>
            <span className="text-[10px] opacity-40">{state.user?.email}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold opacity-60 px-1">暱稱設定</label>
          <div className="flex gap-2">
            <input 
              value={nickname} 
              onChange={e => setNickname(e.target.value)}
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#84e3e8]" 
              placeholder="輸入你的暱稱 (最多20字)" 
              maxLength={20}
            />
            <button onClick={handleSaveNickname} className="px-6 py-2 rounded-xl bg-[#84e3e8] text-[#0a0e1a] font-bold text-sm">儲存</button>
          </div>
          <p className="text-[10px] text-white/40 italic">※ 暱稱會用於貼文與留言的顯示名稱。</p>
        </div>
      </section>

      <section className="glass rounded-[28px] p-6 space-y-6">
        <h2 className="text-lg font-bold">社群互動</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { t: '我發過的貼文', mode: 'mine', icon: '📝' },
            { t: '我按讚的貼文', mode: 'liked', icon: '♥' },
            { t: '我留言過的貼文', mode: 'commented', icon: '💬' }
          ].map(x => (
            <button key={x.mode} onClick={() => {
              localStorage.setItem("mb_feed_mode", x.mode);
              window.location.hash = "/app/hall";
            }} className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition group text-left">
              <div className="flex items-center gap-3">
                <span className="text-xl">{x.icon}</span>
                <span className="text-sm font-medium">{x.t}</span>
              </div>
              <span className="opacity-30 group-hover:opacity-100 transition">→</span>
            </button>
          ))}
        </div>
        <div className="h-[1px] bg-white/5"></div>
        <div className="p-4 rounded-2xl border border-dashed border-white/20 bg-white/5">
          <p className="text-[11px] leading-relaxed text-white/40">
            你在此處的每一筆互動都與你的 Google 帳戶連結，只有你本人可以進行刪除與編輯。MovieBase 尊重用戶隱私，不會公開顯示你的真實姓名（優先使用暱稱）。
          </p>
        </div>
      </section>
    </div>
  );
};

export default AccountPage;
