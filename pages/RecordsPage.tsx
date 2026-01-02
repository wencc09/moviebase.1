
import React, { useState, useEffect, useCallback } from 'react';
import { MBState, Mode, WorkRecord } from '../types';

interface RecordsPageProps {
  state: MBState;
  apiPOST: any;
  showLoading: (t?: string) => void;
  hideLoading: () => void;
}

const RecordsPage: React.FC<RecordsPageProps> = ({ state, apiPOST, showLoading, hideLoading }) => {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<WorkRecord> | null>(null);

  const loadRecords = useCallback(async () => {
    if (state.mode !== Mode.USER) return;
    try {
      // 對齊 Handoff：action=workListMine
      const data = await apiPOST({ action: "workListMine", idToken: state.idToken });
      if (data.ok) {
        setRecords((data.items || data.rows || []).sort((a:any, b:any) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      }
    } catch (e) {
      console.error("Load records failed", e);
    }
  }, [state.idToken, state.mode, apiPOST]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const openNew = (type: 'movie' | 'series') => {
    setEditingRecord({
      type,
      title: '',
      genre: '劇情片',
      watchDate: new Date().toISOString().slice(0, 10),
      status: 'watching',
      rating: 0,
      note: ''
    });
    setShowTypeModal(false);
    setShowFormModal(true);
  };

  const saveRecord = async () => {
    if (!editingRecord?.title) return alert("請輸入作品名稱");
    showLoading("儲存雲端紀錄中...");
    try {
      // 對齊 Handoff：action=workCreate 或 workUpdate
      const action = editingRecord.entryId ? "workUpdate" : "workCreate";
      const res = await apiPOST({ action, idToken: state.idToken, record: editingRecord });
      if (res.ok) {
        setShowFormModal(false);
        loadRecords();
      }
    } catch (e) {
      alert("儲存失敗");
    } finally {
      hideLoading();
    }
  };

  const deleteRecord = async () => {
    if (!editingRecord?.entryId) return;
    if (!confirm("確定刪除？")) return;
    showLoading("刪除中...");
    try {
      // 對齊 Handoff：action=workDelete
      const res = await apiPOST({ action: "workDelete", idToken: state.idToken, entryId: editingRecord.entryId });
      if (res.ok) {
        setShowFormModal(false);
        loadRecords();
      }
    } catch (e) {
      alert("刪除失敗");
    } finally {
      hideLoading();
    }
  };

  if (state.mode === Mode.GUEST) {
    return (
      <div className="glass rounded-[28px] p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-4xl mb-2">🔒</div>
        <h2 className="text-xl font-bold">觀影紀錄需要登入</h2>
        <p className="text-white/60 text-sm max-w-xs">紀錄屬於個人私人隱私空間。請先登入 Google 以存取你的紀錄清單。</p>
        <button onClick={() => window.location.hash = "/"} className="px-8 py-3 rounded-full bg-[#84e3e8] text-[#0a0e1a] font-bold">前往登入</button>
      </div>
    );
  }

  const sections = [
    { id: 'watching', t: '👀 觀看中' },
    { id: 'not', t: '🕒 未觀看' },
    { id: 'done', t: '✅ 已觀看' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4 items-center">
          <div className="text-3xl">🎬</div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold">觀影紀錄</h2>
            <span className="text-[10px] opacity-40">雲端同步：私人筆記與進度管理</span>
          </div>
        </div>
        <button onClick={() => setShowTypeModal(true)} className="px-6 py-2 rounded-full bg-[#84e3e8] text-[#0a0e1a] font-bold text-sm shadow-xl">+ 新增</button>
      </div>

      <div className="space-y-8">
        {sections.map(sec => (
          <div key={sec.id} className="space-y-4">
            <h3 className="font-bold text-sm px-2 border-l-4 border-[#84e3e8]">{sec.t}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {records.filter(r => r.status === sec.id).map(r => (
                <div key={r.entryId} onClick={() => { setEditingRecord(r); setShowFormModal(true); }} className="glass p-4 rounded-2xl cursor-pointer hover:bg-white/10 transition group">
                  <div className="flex justify-between text-[10px] opacity-50 mb-2">
                    <span>{r.watchDate}</span>
                    <span>{r.type === 'series' ? '📺' : '🎬'}</span>
                  </div>
                  <div className="font-bold text-sm mb-1 group-hover:text-[#84e3e8] transition">{r.title}</div>
                  <div className="text-xs text-yellow-400">{'★'.repeat(r.rating)}</div>
                  {r.note && <p className="text-[10px] opacity-60 line-clamp-2 mt-2 leading-relaxed">{r.note}</p>}
                </div>
              ))}
              {records.filter(r => r.status === sec.id).length === 0 && (
                <div className="col-span-full py-10 text-center glass border-dashed border-white/10 opacity-30 text-xs">尚無項目</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showTypeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTypeModal(false)}></div>
          <div className="relative glass w-full max-w-sm p-8 rounded-[32px] text-center space-y-6">
            <h3 className="text-lg font-bold">新增紀錄</h3>
            <p className="text-xs opacity-60">請先選擇作品類型</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => openNew('series')} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center gap-2">
                <span className="text-2xl">📺</span>
                <span className="text-xs font-bold">影集 / 動漫</span>
              </button>
              <button onClick={() => openNew('movie')} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center gap-2">
                <span className="text-2xl">🎬</span>
                <span className="text-xs font-bold">電影</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormModal && editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFormModal(false)}></div>
          <div className="relative glass w-full max-w-2xl p-6 md:p-8 rounded-[32px] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">紀錄表單</h3>
              <button onClick={() => setShowFormModal(false)} className="text-xs opacity-50">關閉</button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase opacity-50 px-1">作品名稱</span>
                <input value={editingRecord.title} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none mt-1 focus:border-[#84e3e8]" placeholder="例如：進擊的巨人 / Inception" />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] uppercase opacity-50 px-1">類別</span>
                  <select value={editingRecord.genre} onChange={e => setEditingRecord({...editingRecord, genre: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none mt-1">
                    {['劇情片','喜劇片','動作片','科幻片','恐怖片','愛情片','動畫','紀錄片','綜藝','旅遊','醫療','律政','其他'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase opacity-50 px-1">觀看日期</span>
                  <input type="date" value={editingRecord.watchDate} onChange={e => setEditingRecord({...editingRecord, watchDate: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none mt-1" />
                </label>
              </div>

              {editingRecord.type === 'series' && (
                <label className="block">
                  <span className="text-[10px] uppercase opacity-50 px-1">集數</span>
                  <input type="number" value={editingRecord.episodes} onChange={e => setEditingRecord({...editingRecord, episodes: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none mt-1" placeholder="例如：12" />
                </label>
              )}

              <div className="space-y-2">
                <span className="text-[10px] uppercase opacity-50 px-1">評分</span>
                <div className="flex gap-2 text-2xl">
                  {[1,2,3,4,5].map(v => (
                    <span key={v} onClick={() => setEditingRecord({...editingRecord, rating: v})} className={`cursor-pointer transition ${v <= (editingRecord.rating || 0) ? 'text-yellow-400 opacity-100 scale-110' : 'opacity-20 hover:opacity-40'}`}>★</span>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-[10px] uppercase opacity-50 px-1">備註</span>
                <textarea value={editingRecord.note} onChange={e => setEditingRecord({...editingRecord, note: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none mt-1 min-h-[100px]" placeholder="心得 / 吐槽 / 想記的事" />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase opacity-50 px-1">狀態</span>
                <select value={editingRecord.status} onChange={e => setEditingRecord({...editingRecord, status: e.target.value as any})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none mt-1">
                  <option value="watching">觀看中</option>
                  <option value="not">未觀看</option>
                  <option value="done">已觀看</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {editingRecord.entryId && (
                <button onClick={deleteRecord} className="px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm">刪除</button>
              )}
              <button onClick={saveRecord} className="px-8 py-3 rounded-xl bg-[#84e3e8] text-[#0a0e1a] font-bold text-sm shadow-xl">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsPage;
