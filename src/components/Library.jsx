
import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import { generateInnerSVG } from '../utils/svgHelpers';
export function Library({ library, setEditingIcon, setHistory, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, saveLibrary, editingIcon, categories, setCategories }) {

  const handleDragStart = (e, icon) => {
    e.dataTransfer.setData('application/json', JSON.stringify(icon));
  };

   const deleteIcon = (e, iconId) => {
     e.stopPropagation();
     if (confirm('このアイコンをライブラリから削除しますか？')) {
       const newLib = library.filter(i => i.id !== iconId);
       saveLibrary(newLib);
     }
   };

   return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-0">
      <div className="p-4 border-b space-y-3">
         <div className="relative"><Search className="absolute left-2 top-2.5 text-slate-400" size={16}/><input type="text" placeholder="検索..." className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-md text-sm outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <div className="flex flex-wrap gap-1">
            {categories.map(c => <button key={c} onClick={() => setSelectedCategory(c)} className={`px-2 py-1 text-xs rounded-full border ${selectedCategory === c ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200'}`}>{c}</button>)}
            <button onClick={() => {
                const name = prompt('新しいカテゴリー名');
                if(name && !categories.includes(name)) setCategories([...categories, name]);
            }} className="px-2 py-1 text-xs rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center gap-1"><Plus size={10}/> 追加</button>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2 content-start">
         <button onClick={() => {
             setEditingIcon({ id: 'new', name: '新規', enName: 'new', category: 'カスタム', viewBox: '0 0 24 24', elements: [] });
             setHistory([]);
         }} className="aspect-square flex flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50"><Plus size={20}/><span className="text-[10px] mt-1">新規</span></button>

         {library.filter(i => (selectedCategory==='すべて'||i.category===selectedCategory) && i.name.includes(searchQuery)).map(icon => (
            <div key={icon.id} draggable onDragStart={(e) => handleDragStart(e, icon)} className="cursor-move relative group">
              <button
                onClick={(e) => {
                  saveLibrary(library);
                  setEditingIcon({ ...icon, elements: JSON.parse(JSON.stringify(icon.elements || [])) });
                }}
                className={`w-full aspect-square p-2 rounded-md border flex flex-col items-center justify-center relative hover:shadow-sm ${editingIcon.id === icon.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'bg-white'}`}
              >
                  <svg
                    viewBox={icon.viewBox}
                    className="w-6 h-6 mb-1 pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: generateInnerSVG(icon.elements) }}
                  />
                  <span className="text-[10px] truncate w-full text-center text-slate-600 pointer-events-none">{icon.name}</span>
              </button>
              <button
                onClick={(e) => deleteIcon(e, icon.id)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
              >
                <X size={10} />
              </button>
            </div>
         ))}
      </div>
    </aside>
   );
}
