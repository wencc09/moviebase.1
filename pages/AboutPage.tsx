
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MBState } from '../types';

const AboutPage: React.FC<{ state: MBState }> = ({ state }) => {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="bg-float fixed inset-0 z-[-1] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <header className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#84e3e8] to-[#e25f9e] shadow-2xl flex items-center justify-center text-3xl font-black text-[#0a0e1a]">MB</div>
          <div>
            <h1 className="text-3xl font-bold">關於 MovieBase</h1>
            <p className="text-white/60">漂浮影廳 × 觀影日記</p>
          </div>
        </header>

        <section className="glass rounded-[32px] p-8 space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-[#84e3e8] pl-4">這是什麼？</h2>
          <div className="text-white/70 text-sm leading-relaxed space-y-4">
            <p>MovieBase 是專為影迷設計的社群化觀影管理平台。我們將「紀錄」＋「分享」完美結合：</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><b>私人區：我的紀錄</b> - 管理影集進度、電影時間碼與私人心情筆記。</li>
              <li><b>社群區：漂浮影廳</b> - 像在電影院大螢幕一樣滑動貼文，用 #hashtag 找到你的同好。</li>
            </ul>
            <p>視覺設計採用 <b>Cyber Neon</b> 與 <b>Glassmorphism</b> 風格，希望能帶給你更有沉浸感的觀影延伸體驗。</p>
          </div>
          
          <div className="h-[1px] bg-white/10"></div>
          
          <h2 className="text-xl font-bold border-l-4 border-[#e25f9e] pl-4">權限規則</h2>
          <div className="text-white/70 text-sm leading-relaxed space-y-4">
            <p>為了維護資料安全與社群品質，我們設有嚴格的權限規範：</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <b className="block text-[#84e3e8] mb-1">👀 訪客模式</b>
                <p className="text-[11px]">可以瀏覽漂浮影廳，不可發文、不可按讚留言、不可使用觀影紀錄功能。</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <b className="block text-[#e25f9e] mb-1">👤 登入用戶</b>
                <p className="text-[11px]">完整權限：雲端同步觀影紀錄、發佈圖文、按讚留言、自訂暱稱。</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center gap-4">
          <NavLink to="/app/lobby" className="px-8 py-3 rounded-full bg-[#84e3e8] text-[#0a0e1a] font-bold shadow-xl">進入主站</NavLink>
          <NavLink to="/" className="px-8 py-3 rounded-full border border-white/20 bg-white/5 text-sm">返回首頁</NavLink>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
