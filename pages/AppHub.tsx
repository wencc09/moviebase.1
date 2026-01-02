
import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MBState, Mode } from '../types';

interface AppHubProps {
  state: MBState;
  logout: () => void;
  apiPOST: any;
  showLoading: (t?: string) => void;
  hideLoading: () => void;
}

const AppHub: React.FC<AppHubProps> = ({ state, logout, showLoading }) => {
  const navigate = useNavigate();

  const displayName = state.profile?.nickname || state.user?.name || "訪客";

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="bg-float fixed inset-0 z-[-1] pointer-events-none opacity-80"></div>
      
      <header className="sticky top-0 z-50 p-4 bg-[#0a0e1a]/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#84e3e8] to-[#e25f9e] shadow-xl flex items-center justify-center font-bold text-[#0a0e1a]">MB</div>
            <div className="flex flex-col leading-none">
              <b className="text-sm">MovieBase</b>
              <span className="text-[10px] text-white/60">主站（四分頁）</span>
            </div>
          </div>

          <nav className="hidden md:flex flex-1 justify-center gap-3 px-4 overflow-auto scrollbar-hide">
            {[
              { path: 'lobby', t: '影院大廳' },
              { path: 'hall', t: '漂浮影廳' },
              { path: 'records', t: '觀影紀錄' },
              { path: 'account', t: '我的帳戶' }
            ].map(x => (
              <NavLink 
                key={x.path} 
                to={x.path} 
                className={({isActive}) => `px-4 py-2 rounded-full text-xs font-medium border border-white/10 transition ${isActive ? 'bg-[#84e3e8]/20 border-[#84e3e8]/30 shadow-[0_0_12px_rgba(132,227,232,0.1)]' : 'bg-white/5 hover:bg-white/10'}`}
              >
                {x.t}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] opacity-60">{state.mode === Mode.USER ? '已登入' : '訪客模式'}</span>
              <span className="text-xs font-bold truncate max-w-[100px]">{displayName}</span>
            </div>
            {state.user?.picture && (
              <img src={state.user.picture} className="w-8 h-8 rounded-xl border border-white/20" alt="" />
            )}
            {state.mode === Mode.USER ? (
              <button onClick={() => { logout(); navigate("/"); }} className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20">登出</button>
            ) : (
              <button onClick={() => navigate("/")} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] hover:bg-white/10">立即登入</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass border border-white/10 rounded-[20px] p-2 flex justify-between gap-1 shadow-2xl">
        {[
          { path: 'lobby', t: '大廳' },
          { path: 'hall', t: '影廳' },
          { path: 'records', t: '紀錄' },
          { path: 'account', t: '帳戶' }
        ].map(x => (
          <NavLink 
            key={x.path} 
            to={x.path} 
            className={({isActive}) => `flex-1 py-3 text-center rounded-xl text-[10px] font-bold transition ${isActive ? 'bg-gradient-to-r from-[#84e3e8]/30 to-[#e25f9e]/30 text-white' : 'text-white/40'}`}
          >
            {x.t}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppHub;
