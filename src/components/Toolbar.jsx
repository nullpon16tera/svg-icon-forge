
import React from 'react';
import { MousePointer2, MousePointer, PenTool, Square, Circle, Minus, Spline } from 'lucide-react';

export function Toolbar({ tool, setTool }) {
  return (
    <div className="w-12 border-r border-slate-200 bg-slate-50 flex flex-col items-center py-4 gap-3 z-10">
      <button onClick={() => setTool('select')} className={`p-2 rounded ${tool === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="選択ツール (V)"><MousePointer2 size={18}/></button>
      <button onClick={() => setTool('direct')} className={`p-2 rounded ${tool === 'direct' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="ダイレクト選択ツール (A)"><MousePointer size={18} className="rotate-90"/></button>
      <div className="h-px w-6 bg-slate-200"/>
      <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="ペンツール (P)"><PenTool size={18}/></button>
      <button onClick={() => setTool('curve')} className={`p-2 rounded ${tool === 'curve' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="カーブツール (Q)"><Spline size={18}/></button>
      <button onClick={() => setTool('rect')} className={`p-2 rounded ${tool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="長方形ツール (R)"><Square size={18}/></button>
      <button onClick={() => setTool('circle')} className={`p-2 rounded ${tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="円形ツール (C)"><Circle size={18}/></button>
      <button onClick={() => setTool('line')} className={`p-2 rounded ${tool === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`} title="直線ツール (L)"><Minus size={18}/></button>
    </div>
  );
}
