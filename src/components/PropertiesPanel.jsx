
import React from 'react';
import { Save, X, PenTool, Square, Circle, Minus, CornerUpRight } from 'lucide-react';

export function PropertiesPanel({
    editingIcon, setEditingIcon, selectedElementIds, setSelectedElementIds,
    updateElement, deleteElement, convertToPath,    saveLibrary, library, showNotification, categories
}) {
    // Reverse elements for layer list (top layer first)
    const reversedElements = [...editingIcon.elements].reverse();

    return (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col z-10">
           <div className="flex-1 flex flex-col min-h-0 border-b border-slate-200">
              <div className="p-3 bg-slate-50 border-b flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase">レイヤー</span></div>
              <div className="flex-1 overflow-y-auto">
                 {reversedElements.map((el, idx) => {
                    // Logic to get real index from reversed list
                    const realIdx = editingIcon.elements.length - 1 - idx;
                    const isSelected = selectedElementIds.includes(el.id);
                    return (
                       <div key={el.id}
                            onClick={(e) => {
                               e.stopPropagation();
                               if (e.shiftKey) {
                                  setSelectedElementIds(prev => prev.includes(el.id) ? prev.filter(i => i !== el.id) : [...prev, el.id]);
                               } else {
                                  setSelectedElementIds([el.id]);
                               }
                            }}
                            className={`flex items-center gap-2 p-2 border-b border-slate-50 cursor-pointer ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                       >
                          <div className="w-4 h-4 text-slate-400">
                             {el.type === 'path' && <PenTool size={14}/>}
                             {el.type === 'rect' && <Square size={14}/>}
                             {el.type === 'circle' && <Circle size={14}/>}
                             {el.type === 'line' && <Minus size={14}/>}
                          </div>
                          <span className="text-xs text-slate-600 flex-1 truncate">{el.type} {realIdx + 1}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                       </div>
                    );
                 })}
                 {editingIcon.elements.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">要素がありません</div>}
              </div>
           </div>

           <div className="h-1/2 flex flex-col bg-slate-50 overflow-y-auto">
               <div className="p-3 border-b border-slate-200"><span className="text-xs font-bold text-slate-500 uppercase">プロパティ</span></div>
               <div className="p-4 space-y-4">
                  {selectedElementIds.length === 1 ? (() => {
                     const selectedElementId = selectedElementIds[0];
                     const el = editingIcon.elements.find(e => e.id === selectedElementId);
                     if (!el) return null;
                     return (
                        <>
                           <div className="text-xs text-indigo-600 font-bold mb-2 flex justify-between items-center">
                              {el.type.toUpperCase()} 選択中
                              {el.type !== 'path' && (
                                 <button onClick={convertToPath} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-indigo-50 flex items-center gap-1">
                                    <CornerUpRight size={10}/> パスに変換
                                 </button>
                              )}
                           </div>

                           <div className="grid grid-cols-2 gap-2 mb-4">
                              {el.type === 'rect' && (
                                 <>
                                    <div><label className="text-[10px] text-slate-400">X</label><input type="number" value={el.x} onChange={e=>updateElement(el.id, {x: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                    <div><label className="text-[10px] text-slate-400">Y</label><input type="number" value={el.y} onChange={e=>updateElement(el.id, {y: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                    <div><label className="text-[10px] text-slate-400">W</label><input type="number" value={el.width} onChange={e=>updateElement(el.id, {width: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                    <div><label className="text-[10px] text-slate-400">H</label><input type="number" value={el.height} onChange={e=>updateElement(el.id, {height: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                 </>
                              )}
                              {el.type === 'circle' && (
                                 <>
                                    <div><label className="text-[10px] text-slate-400">CX</label><input type="number" value={el.cx} onChange={e=>updateElement(el.id, {cx: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                    <div><label className="text-[10px] text-slate-400">CY</label><input type="number" value={el.cy} onChange={e=>updateElement(el.id, {cy: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                    <div><label className="text-[10px] text-slate-400">R</label><input type="number" value={el.r} onChange={e=>updateElement(el.id, {r: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                 </>
                              )}
                              {el.type === 'line' && (
                                 <>
                                     <div><label className="text-[10px] text-slate-400">X1</label><input type="number" value={el.x1} onChange={e=>updateElement(el.id, {x1: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                     <div><label className="text-[10px] text-slate-400">Y1</label><input type="number" value={el.y1} onChange={e=>updateElement(el.id, {y1: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                     <div><label className="text-[10px] text-slate-400">X2</label><input type="number" value={el.x2} onChange={e=>updateElement(el.id, {x2: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                     <div><label className="text-[10px] text-slate-400">Y2</label><input type="number" value={el.y2} onChange={e=>updateElement(el.id, {y2: parseFloat(e.target.value)})} className="w-full text-xs border rounded p-1"/></div>
                                 </>
                              )}
                           </div>

                           <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs">塗り</span>
                                 <div className="flex gap-2 items-center">
                                    <input type="color" value={el.fill==='none'?'#ffffff':el.fill} onChange={e=>updateElement(el.id, {fill: e.target.value})} disabled={el.fill==='none'} className="w-6 h-6 border rounded"/>
                                    <input type="checkbox" checked={el.fill!=='none'} onChange={e=>updateElement(el.id, {fill: e.target.checked ? '#000000' : 'none'})} />
                                 </div>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-xs">線</span>
                                 <div className="flex gap-2 items-center">
                                    <input type="color" value={el.stroke==='none'?'#ffffff':el.stroke} onChange={e=>updateElement(el.id, {stroke: e.target.value})} disabled={el.stroke==='none'} className="w-6 h-6 border rounded"/>
                                    <input type="checkbox" checked={el.stroke!=='none'} onChange={e=>updateElement(el.id, {stroke: e.target.checked ? '#000000' : 'none'})} />
                                 </div>
                              </div>
                              <div>
                                 <div className="flex justify-between text-[10px] mb-1"><span>線幅</span><span>{el.strokeWidth}px</span></div>
                                 <input type="range" min="0" max="10" step="0.5" value={el.strokeWidth} onChange={e=>updateElement(el.id, {strokeWidth: parseFloat(e.target.value)})} className="w-full h-1 bg-slate-300 rounded-lg appearance-none accent-indigo-600"/>
                              </div>
                           </div>
                        </>
                     );
                  })() : (
                     <div className="text-xs text-slate-400 text-center py-8">要素を選択してください</div>
                  )}

                  <div className="border-t pt-4 mt-4">
                     <label className="text-xs font-bold text-slate-400 block mb-2">アイコン情報</label>
                     <div className="space-y-3 mb-4">
                        <div>
                           <label className="text-[10px] text-slate-400 block mb-1">アイコン名</label>
                           <input type="text" className="w-full text-xs border rounded p-2" value={editingIcon.name} onChange={e=>setEditingIcon({...editingIcon, name: e.target.value})} placeholder="名前" />
                        </div>
                        <div>
                           <label className="text-[10px] text-slate-400 block mb-1">カテゴリー</label>
                           <select
                              className="w-full text-xs border rounded p-2 bg-white"
                              value={editingIcon.category}
                              onChange={e => setEditingIcon({...editingIcon, category: e.target.value})}
                           >
                              {categories.filter(c => c !== 'すべて').map(c => (
                                 <option key={c} value={c}>{c}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <button onClick={() => {
                        saveLibrary([...library.filter(l => l.id !== editingIcon.id), editingIcon]);
                        showNotification('保存しました');
                     }} className="w-full bg-indigo-600 text-white py-2 rounded text-xs flex justify-center gap-2"><Save size={14}/> ライブラリに保存</button>
                  </div>
               </div>
           </div>
        </aside>
    );
}
