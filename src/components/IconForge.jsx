
import React, { useState, useRef, useEffect } from 'react';
import {
  Download, Upload, Settings, Code, Layers, Undo, Redo,
  Check, X, ImageIcon, Copy
} from 'lucide-react';
import { Toolbar } from './Toolbar';
import { Library } from './Library';
import { PropertiesPanel } from './PropertiesPanel';
import { Canvas } from './Canvas';
import { DEFAULT_ICONS, CATEGORIES } from '../icons/defaultIcons';
import {
  uid, parsePath, stringifyPath, shapeToPath,
  parseSVGContentToElements, generateInnerSVG, getElementsBBox
} from '../utils/svgHelpers';

export function IconForge() {
  const [library, setLibrary] = useState(DEFAULT_ICONS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [editingIcon, setEditingIcon] = useState({
    id: 'new',
    name: '新規アイコン',
    enName: 'new-icon',
    category: 'カスタム',
    viewBox: '0 0 24 24',
    elements: []
  });

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [activeTab, setActiveTab] = useState('gui');
  const [tool, setTool] = useState('select');
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSize, setExportSize] = useState(512);
  const [isTransparent, setIsTransparent] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [notification, setNotification] = useState(null);
  const [spriteList, setSpriteList] = useState([]);

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const [pathCommands, setPathCommands] = useState([]);
  const [polylinePoints, setPolylinePoints] = useState([]);
  const [selectedVertex, setSelectedVertex] = useState(null);

  // Load Library
  useEffect(() => {
    const STORAGE_KEY = 'iconForgeLibrary_v2';
    const saved = localStorage.getItem(STORAGE_KEY);
    const CAT_KEY = 'iconForgeCategories_v1';
    const savedCats = localStorage.getItem(CAT_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const customIcons = parsed.filter(p => !DEFAULT_ICONS.find(d => d.id === p.id));
        setLibrary([...DEFAULT_ICONS, ...customIcons]);
      } catch (e) {
        setLibrary(DEFAULT_ICONS);
      }
    } else {
        setLibrary(DEFAULT_ICONS);
    }

    if (savedCats) {
      try {
        setCategories(JSON.parse(savedCats));
      } catch (e) {
        setCategories(CATEGORIES);
      }
    }
  }, []);

  const saveLibraryInternal = (newLib) => {
      setLibrary(newLib);
      const customOnly = newLib.filter(p => !DEFAULT_ICONS.find(d => d.id === p.id));
      localStorage.setItem('iconForgeLibrary_v2', JSON.stringify(customOnly));
  };

  const saveCategoriesInternal = (newCats) => {
     setCategories(newCats);
     localStorage.setItem('iconForgeCategories_v1', JSON.stringify(newCats));
  };

  useEffect(() => {
     setHistory([editingIcon]);
     setHistoryIndex(0);
     setSelectedElementIds([]);
     setSelectedVertex(null);
  }, [editingIcon.id]);

  useEffect(() => {
     if (dragState) return; // Skip heavy parsing while dragging for performance
     if (tool === 'direct' && selectedElementIds.length === 1) {
        const el = editingIcon.elements.find(e => e.id === selectedElementIds[0]);
        if (el) {
          if (el.type === 'path') {
            setPathCommands(parsePath(el.d));
            setPolylinePoints([]);
          } else if (el.type === 'polyline') {
            const pts = el.points.trim().split(/[\s,]+/).map(parseFloat);
            const pointObjs = [];
            for(let i=0; i<pts.length; i+=2) {
              if(!isNaN(pts[i]) && !isNaN(pts[i+1])) {
                pointObjs.push({ x: pts[i], y: pts[i+1] });
              }
            }
            setPolylinePoints(pointObjs);
            setPathCommands([]);
          } else {
            setPathCommands([]);
            setPolylinePoints([]);
          }
        }
    }
    setSelectedVertex(null);
  }, [selectedElementIds, tool, editingIcon.elements, !!dragState]);

  const preParseElements = (elements) => elements.map(el => {
     if (el.type === 'path') return { ...el, _parsed: parsePath(el.d) };
     if (el.type === 'polyline') return { ...el, _parsed: el.points.trim().split(/[\s,]+/).map(parseFloat) };
     return { ...el };
  });

  const pushHistory = (newState) => {
     const newHistory = history.slice(0, historyIndex + 1);
     newHistory.push(newState);
     if (newHistory.length > 30) newHistory.shift();
     setHistory(newHistory);
     setHistoryIndex(newHistory.length - 1);
     setEditingIcon(newState);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditingIcon(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditingIcon(history[historyIndex + 1]);
    }
  };

  const updateElements = (patchesMap, recordHistory = true) => {
     const newElements = editingIcon.elements.map(el => patchesMap[el.id] ? { ...el, ...patchesMap[el.id] } : el);
     const newState = { ...editingIcon, elements: newElements };
     if (recordHistory) pushHistory(newState);
     else setEditingIcon(newState);
  };

  const updateElement = (id, patches, recordHistory = true) => {
     updateElements({ [id]: patches }, recordHistory);
  };

  const addElement = (element) => {
     const newState = { ...editingIcon, elements: [...editingIcon.elements, element] };
     pushHistory(newState);
     setSelectedElementIds([element.id]);
  };

  const deleteElement = (id) => {
     const idsToDelete = id ? [id] : selectedElementIds;
     const newState = { ...editingIcon, elements: editingIcon.elements.filter(e => !idsToDelete.includes(e.id)) };
     pushHistory(newState);
     setSelectedElementIds([]);
  };

  const convertToPath = () => {
     if (selectedElementIds.length === 0) return;
     const newElements = editingIcon.elements.map(el => {
        if (selectedElementIds.includes(el.id) && el.type !== 'path') {
           const d = shapeToPath(el);
           return {
             id: el.id, type: 'path', d,
             fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
             strokeLinecap: el.strokeLinecap, strokeLinejoin: el.strokeLinejoin
           };
        }
        return el;
     });
     setEditingIcon({...editingIcon, elements: newElements});
     setTool('direct');
     showNotification('パスに変換しました');
  };

  const getSvgPoint = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
  };

  const handleMouseDown = (e) => {
    if (activeTab !== 'gui') return;
    const pt = getSvgPoint(e);

    if (['rect', 'circle', 'line', 'curve'].includes(tool)) {
       setDragState({ mode: 'create', start: pt, current: pt });
       return;
    }

    if (tool === 'pen') {
       let targetId = selectedElementIds[0];
       let el = editingIcon.elements.find(e => e.id === targetId);

       if (el && el.type === 'path') {
          // Check if clicking near the starting point to close the path
          const match = el.d.match(/M\s*([\d.-]+)[\s,]+([\d.-]+)/);
          if (match) {
             const sx = parseFloat(match[1]);
             const sy = parseFloat(match[2]);
             const dist = Math.sqrt(Math.pow(pt.x - sx, 2) + Math.pow(pt.y - sy, 2));
             if (dist < 0.8 && !el.d.includes('Z')) {
                updateElement(el.id, { d: el.d + ' Z' });
                setSelectedElementIds([]);
                showNotification('パスを閉じました');
                return;
             }
          }
          const newD = el.d + ` L ${pt.x} ${pt.y}`;
          updateElement(el.id, { d: newD }, false);
       } else {
          const newId = uid();
          const newPath = {
             id: newId, type: 'path', d: `M ${pt.x} ${pt.y}`,
             fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'
          };
          addElement(newPath);
          targetId = newId;
       }

       const currentEl = editingIcon.elements.find(e => e.id === targetId);
       const cmds = parsePath(currentEl?.d || `M ${pt.x} ${pt.y}`);
       setPathCommands(cmds);
       setDragState({ mode: 'pen-drag', targetId, startPt: pt, cmdIndex: cmds.length - 1 });
       return;
    }

     if (e.target.tagName === 'svg' || e.target.id === 'grid-rect') {
        if (tool === 'select') {
           setDragState({ mode: 'marquee', start: pt, current: pt });
           if (!e.shiftKey) setSelectedElementIds([]);
        } else {
           setSelectedElementIds([]);
        }
     }
  };

  const handleElementMouseDown = (e, elId) => {
     if (tool === 'select') {
        e.stopPropagation();
        let newSelection = [...selectedElementIds];

        // Cycling logic: If clicking an already selected element, try to select through to the next one
        if (newSelection.includes(elId) && newSelection.length === 1 && !e.shiftKey) {
           const hits = document.elementsFromPoint(e.clientX, e.clientY)
               .map(node => node.getAttribute('data-id'))
               .filter(id => id && editingIcon.elements.find(el => el.id === id));

           if (hits.length > 1) {
               const currentIndex = hits.indexOf(elId);
               const nextId = hits[(currentIndex + 1) % hits.length];
               setSelectedElementIds([nextId]);
               setDragState({
                   mode: 'move', start: getSvgPoint(e), current: getSvgPoint(e),
                   initialElements: preParseElements(editingIcon.elements.filter(el => el.id === nextId))
               });
               return;
           }
        }

        if (e.shiftKey) {
           if (newSelection.includes(elId)) {
              newSelection = newSelection.filter(id => id !== elId);
           } else {
              newSelection.push(elId);
           }
        } else {
           if (!newSelection.includes(elId)) {
               newSelection = [elId];
           }
        }
        setSelectedElementIds(newSelection);
        setDragState({ mode: 'move', start: getSvgPoint(e), current: getSvgPoint(e), initialElements: preParseElements(editingIcon.elements.filter(el => newSelection.includes(el.id))) });
     } else if (tool === 'direct' || tool === 'curve') {
        e.stopPropagation();
        setSelectedElementIds([elId]);

        if (tool === 'curve') {
           const pt = getSvgPoint(e);
           const el = editingIcon.elements.find(e => e.id === elId);
           if (el && el.type === 'path') {
              const cmds = parsePath(el.d);
              setPathCommands(cmds);
              setDragState({ mode: 'segment-bend', targetId: elId, startPt: pt, initialCmds: cmds });
           }
        }
     }
  };

  const handleMouseMove = (e) => {
     if (!dragState) return;
     const pt = getSvgPoint(e);

     if (dragState.mode === 'create') {
        setDragState(prev => ({ ...prev, current: pt }));
     } else if (dragState.mode === 'move') {
        const dx = pt.x - dragState.start.x;
        const dy = pt.y - dragState.start.y;
        const patchesMap = {};

        dragState.initialElements.forEach(el => {
           let patch = {};
           if (el.type === 'rect') { patch = { x: el.x + dx, y: el.y + dy }; }
           else if (el.type === 'circle') { patch = { cx: el.cx + dx, cy: el.cy + dy }; }
           else if (el.type === 'line') { patch = { x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy }; }
           else if (el.type === 'path') {
              const cmds = JSON.parse(JSON.stringify(el._parsed));
              cmds.forEach(c => c.points.forEach(p => { p.x += dx; p.y += dy; }));
              patch = { d: stringifyPath(cmds) };
           } else if (el.type === 'polyline') {
              const points = el._parsed;
              let newPoints = '';
              for (let i = 0; i < points.length; i += 2) {
                 if(!isNaN(points[i]) && !isNaN(points[i+1])) {
                    newPoints += `${points[i]+dx} ${points[i+1]+dy} `;
                 }
              }
              patch = { points: newPoints.trim() };
           }
           patchesMap[el.id] = patch;
        });

        updateElements(patchesMap, false);
     } else if (dragState.mode === 'resize') {
        const { dir, initialBBox, initialElements, start } = dragState;
        const current = getSvgPoint(e);
        const dx = current.x - start.x;
        const dy = current.y - start.y;

        let newX = initialBBox.x;
        let newY = initialBBox.y;
        let newW = initialBBox.w;
        let newH = initialBBox.h;

        if (dir.includes('e')) newW += dx;
        if (dir.includes('w')) { newX += dx; newW -= dx; }
        if (dir.includes('s')) newH += dy;
        if (dir.includes('n')) { newY += dy; newH -= dy; }

        if (newW < 0.1) newW = 0.1;
        if (newH < 0.1) newH = 0.1;

        const scaleX = newW / initialBBox.w;
        const scaleY = newH / initialBBox.h;

        const patchesMap = {};
        initialElements.forEach(el => {
           const mapX = (val) => newX + (val - initialBBox.x) * scaleX;
           const mapY = (val) => newY + (val - initialBBox.y) * scaleY;
           const mapDistX = (val) => val * scaleX;
           const mapDistY = (val) => val * scaleY;

           let patch = {};
           if (el.type === 'rect') {
              patch = { x: mapX(el.x), y: mapY(el.y), width: mapDistX(el.width), height: mapDistY(el.height) };
           } else if (el.type === 'circle') {
              patch = { cx: mapX(el.cx), cy: mapY(el.cy), r: (mapDistX(el.r) + mapDistY(el.r)) / 2 };
           } else if (el.type === 'line') {
              patch = { x1: mapX(el.x1), y1: mapY(el.y1), x2: mapX(el.x2), y2: mapY(el.y2) };
           } else if (el.type === 'path') {
               const cmds = JSON.parse(JSON.stringify(el._parsed));
               cmds.forEach(c => c.points.forEach(p => {
                   p.x = mapX(p.x);
                   p.y = mapY(p.y);
               }));
               patch = { d: stringifyPath(cmds) };
           } else if (el.type === 'polyline') {
               const points = el._parsed;
               let newPoints = '';
               for (let i = 0; i < points.length; i += 2) {
                   if(!isNaN(points[i]) && !isNaN(points[i+1])) {
                       newPoints += `${mapX(points[i])} ${mapY(points[i+1])} `;
                   }
               }
               patch = { points: newPoints.trim() };
           }
           patchesMap[el.id] = patch;
        });
        updateElements(patchesMap, false);
     } else if (dragState.mode === 'segment-bend') {
        const { targetId, startPt, initialCmds } = dragState;
        const dx = pt.x - startPt.x;
        const dy = pt.y - startPt.y;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
           // On first significant move, find the closest segment
           if (!dragState.cmdIndex) {
              let minDist = Infinity;
              let closestIdx = -1;
              for (let i = 1; i < initialCmds.length; i++) {
                 const cmd = initialCmds[i];
                 const prevCmd = initialCmds[i-1];
                 const start = prevCmd.points?.[prevCmd.points.length-1];
                 const end = cmd.points?.[cmd.points.length-1];

                 if (!start || !end) continue;

                 // Distance from startPt to segment (approximation: distance to midpoint)
                 const midX = (start.x + end.x) / 2;
                 const midY = (start.y + end.y) / 2;
                 const d = Math.sqrt(Math.pow(startPt.x - midX, 2) + Math.pow(startPt.y - midY, 2));
                 if (d < minDist) {
                    minDist = d;
                    closestIdx = i;
                 }
              }
              if (closestIdx !== -1) dragState.cmdIndex = closestIdx;
           }

           if (dragState.cmdIndex) {
              const newCmds = JSON.parse(JSON.stringify(initialCmds)); // Use initialCmds to avoid accumulation
              const cmd = { ...newCmds[dragState.cmdIndex] };
              const prevCmd = newCmds[dragState.cmdIndex - 1];
              const start = prevCmd.points?.[prevCmd.points.length - 1];
              const end = cmd.points?.[cmd.points.length - 1];

              if (!start || !end) {
                 setDragState(null);
                 return;
              }

              if (cmd.type === 'L' || cmd.type === 'M') {
                 cmd.type = 'C';
                 // Bend L into C by pulling handles from the midpoint towards drag direction
                 const mx = (start.x + end.x) / 2 + dx;
                 const my = (start.y + end.y) / 2 + dy;

                 // CP1 and CP2 should move relative to midpoint
                 cmd.points = [
                    { x: start.x + (mx - start.x) * 0.6, y: start.y + (my - start.y) * 0.6, type: 'control1' },
                    { x: end.x + (mx - end.x) * 0.6, y: end.y + (my - end.y) * 0.6, type: 'control2' },
                    { x: end.x, y: end.y, type: 'anchor' }
                 ];
              } else if (cmd.type === 'C') {
                 // Existing curve: move both handles relative to initial positions
                 cmd.points[0].x += dx * 0.5;
                 cmd.points[0].y += dy * 0.5;
                 cmd.points[1].x += dx * 0.5;
                 cmd.points[1].y += dy * 0.5;
              }
              newCmds[dragState.cmdIndex] = cmd;
              setPathCommands(newCmds);
              const el = editingIcon.elements.find(e => e.id === targetId);
              if (el) updateElement(targetId, { d: stringifyPath(newCmds) }, false);
           }
        }
     } else if (dragState.mode === 'pen-drag') {
        const { cmdIndex, startPt } = dragState;
        const dist = Math.sqrt(Math.pow(pt.x - startPt.x, 2) + Math.pow(pt.y - startPt.y, 2));
        if (dist > 0.3) {
           setPathCommands(prev => {
              const newCmds = [...prev];
              const cmd = { ...newCmds[cmdIndex] };
              const anchor = cmd.points[cmd.points.length - 1];
              const dx = pt.x - anchor.x;
              const dy = pt.y - anchor.y;

              if (cmd.type === 'M' || cmd.type === 'L') {
                 // Convert to a C-like structure for visualization in Canvas.jsx
                 // Since our stringifyPath might handle it or we convert to C on MouseUp
                 cmd.type = 'C';
                 cmd.points = [
                    { x: anchor.x - dx, y: anchor.y - dy, type: 'control1' },
                    { x: anchor.x + dx, y: anchor.y + dy, type: 'control2' },
                    { x: anchor.x, y: anchor.y, type: 'anchor' }
                 ];
                 // If L, we need correct control1 from previous anchor
                 if (cmd.type === 'C' && cmdIndex > 0) {
                    const prevAnchor = newCmds[cmdIndex-1].points.slice(-1)[0];
                    cmd.points[0].x = prevAnchor.x;
                    cmd.points[0].y = prevAnchor.y;
                 }
              } else if (cmd.type === 'C') {
                 cmd.points[0].x = anchor.x - dx;
                 cmd.points[0].y = anchor.y - dy;
                 cmd.points[1].x = anchor.x + dx;
                 cmd.points[1].y = anchor.y + dy;
              }
              newCmds[cmdIndex] = cmd;
              return newCmds;
           });
        }
     } else if (dragState.mode === 'marquee') {
        setDragState(prev => ({ ...prev, current: pt }));
     } else if (dragState.mode === 'vertex') {
        if (!selectedVertex) return;
        const { cmdIndex, ptIndex } = selectedVertex;
        if (typeof selectedVertex.linePoint === 'string') {
          const el = editingIcon.elements.find(e => e.id === selectedElementIds[0]);
          if (el && el.type === 'line') {
             const patch = selectedVertex.linePoint === 'start' ? { x1: pt.x, y1: pt.y } : { x2: pt.x, y2: pt.y };
             updateElement(selectedElementIds[0], patch, false);
          }
          return;
       }

        if (cmdIndex === null) {
           const newPoints = [...polylinePoints];
           if (newPoints[ptIndex]) {
              newPoints[ptIndex] = { x: pt.x, y: pt.y };
              setPolylinePoints(newPoints);
              // Real-time update for polyline
              if (selectedElementIds.length === 1) {
                 const pointsStr = newPoints.map(p => `${Math.round(p.x*100)/100} ${Math.round(p.y*100)/100}`).join(' ');
                 updateElement(selectedElementIds[0], { points: pointsStr }, false);
              }
           }
        } else {
          const newCmds = [...pathCommands];
          const cmd = { ...newCmds[cmdIndex] };
          const pts = [...cmd.points];

          if (tool === 'curve' && pts[ptIndex].type === 'anchor') {
              const anchor = pts[ptIndex];
              const dx = pt.x - anchor.x;
              const dy = pt.y - anchor.y;

              if (cmd.type === 'C') {
                 pts[1].x = anchor.x + dx;
                 pts[1].y = anchor.y + dy;
              } else if (cmd.type === 'L' || cmd.type === 'M') {
                 if (cmd.type === 'L') {
                    cmd.type = 'C';
                    cmd.points = [
                       { x: anchor.x, y: anchor.y, type: 'control1' },
                       { x: anchor.x + dx, y: anchor.y + dy, type: 'control2' },
                       { x: anchor.x, y: anchor.y, type: 'anchor' }
                    ];
                    const prevCmd = newCmds[cmdIndex-1];
                    if (prevCmd) {
                       const prevAnchor = prevCmd.points[prevCmd.points.length-1];
                       cmd.points[0].x = prevAnchor.x;
                       cmd.points[0].y = prevAnchor.y;
                    }
                 }
              }

              const nextCmd = newCmds[cmdIndex + 1];
              if (nextCmd) {
                 if (nextCmd.type === 'C') {
                    nextCmd.points[0].x = anchor.x - dx;
                    nextCmd.points[0].y = anchor.y - dy;
                 } else if (nextCmd.type === 'L') {
                    const nextAnchor = nextCmd.points[0];
                    nextCmd.type = 'C';
                    nextCmd.points = [
                       { x: anchor.x - dx, y: anchor.y - dy, type: 'control1' },
                       { x: nextAnchor.x, y: nextAnchor.y, type: 'control2' },
                       { x: nextAnchor.x, y: nextAnchor.y, type: 'anchor' }
                    ];
                 }
                 newCmds[cmdIndex + 1] = { ...nextCmd };
              }
          } else if (pts[ptIndex].type.includes('control')) {
             if (tool === 'curve') {
                if (pts[ptIndex].type === 'control2') {
                   const anchor = pts[2];
                   const dx = pt.x - anchor.x;
                   const dy = pt.y - anchor.y;
                   pts[1].x = anchor.x + dx;
                   pts[1].y = anchor.y + dy;

                   const nextCmd = newCmds[cmdIndex + 1];
                   if (nextCmd && nextCmd.type === 'C') {
                      nextCmd.points[0].x = anchor.x - dx;
                      nextCmd.points[0].y = anchor.y - dy;
                      newCmds[cmdIndex + 1] = { ...nextCmd };
                   }
                } else if (pts[ptIndex].type === 'control1') {
                   const anchor = newCmds[cmdIndex - 1]?.points.slice(-1)[0];
                   if (anchor) {
                      const dx = pt.x - anchor.x;
                      const dy = pt.y - anchor.y;
                      pts[0].x = anchor.x + dx;
                      pts[0].y = anchor.y + dy;

                      const prevCmd = newCmds[cmdIndex - 1];
                      if (prevCmd && prevCmd.type === 'C') {
                         prevCmd.points[1].x = anchor.x - dx;
                         prevCmd.points[1].y = anchor.y - dy;
                         newCmds[cmdIndex - 1] = { ...prevCmd };
                      }
                   }
                }
             }
          } else if (pts[ptIndex].type === 'anchor') {
              const dx = pt.x - pts[ptIndex].x;
              const dy = pt.y - pts[ptIndex].y;
              if (pts[ptIndex-1] && pts[ptIndex-1].type === 'control2') { pts[ptIndex-1].x += dx; pts[ptIndex-1].y += dy; }
              if (cmd.points[ptIndex+1] && cmd.points[ptIndex+1].type === 'control1') { cmd.points[ptIndex+1].x += dx; cmd.points[ptIndex+1].y += dy; }
          }

          if (tool !== 'curve' || !pts[ptIndex].type.includes('anchor')) {
             pts[ptIndex] = { ...pts[ptIndex], x: pt.x, y: pt.y };
          }

           cmd.points = pts;
           newCmds[cmdIndex] = cmd;
           setPathCommands(newCmds);

           // Real-time update to element state
           if (selectedElementIds.length === 1) {
              updateElement(selectedElementIds[0], { d: stringifyPath(newCmds) }, false);
           }
        }
     }
  };

  const handleMouseUp = () => {
     if (!dragState) return;

     if (dragState.mode === 'create') {
        const { start, current } = dragState;
        if (tool === 'rect') {
           const w = current.x - start.x; const h = current.y - start.y;
           if (Math.abs(w) > 0.1 && Math.abs(h) > 0.1) {
             addElement({ id: uid(), type: 'rect', x: w<0?current.x:start.x, y: h<0?current.y:start.y, width: Math.abs(w), height: Math.abs(h), fill: 'none', stroke: '#000000', strokeWidth: 2 });
             setTool('select');
           }
        } else if (tool === 'circle') {
           const r = Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2));
           addElement({ id: uid(), type: 'circle', cx: start.x, cy: start.y, r, fill: 'none', stroke: '#000000', strokeWidth: 2 });
           setTool('select');
        } else if (tool === 'line') {
           addElement({ id: uid(), type: 'line', x1: start.x, y1: start.y, x2: current.x, y2: current.y, fill: 'none', stroke: '#000000', strokeWidth: 2 });
           setTool('select');
        } else if (tool === 'curve') {
           const cp1x = start.x + (current.x - start.x) / 3;
           const cp1y = start.y - 5;
           const cp2x = start.x + 2 * (current.x - start.x) / 3;
           const cp2y = current.y - 5;
           const d = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
           addElement({ id: uid(), type: 'path', d, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' });
           setTool('select');
        }
        setDragState(null);
     } else if (dragState.mode === 'marquee') {
        const { start, current } = dragState;
        const x = Math.min(start.x, current.x);
        const y = Math.min(start.y, current.y);
        const w = Math.abs(current.x - start.x);
        const h = Math.abs(current.y - start.y);

        const newSelection = [];
        editingIcon.elements.forEach(el => {
           let intersect = false;
           // Simple BBox intersection test
           let b = { x: 0, y: 0, w: 0, h: 0 };
           if (el.type === 'rect') b = { x: el.x, y: el.y, w: el.width, h: el.height };
           else if (el.type === 'circle') b = { x: el.cx-el.r, y: el.cy-el.r, w: el.r*2, h: el.r*2 };
           else if (el.type === 'line') b = { x: Math.min(el.x1,el.x2), y: Math.min(el.y1,el.y2), w: Math.abs(el.x1-el.x2), h: Math.abs(el.y1-el.y2) };
           else if (el.type === 'path' || el.type === 'polyline') {
               b = getElementsBBox([el]) || { x:0,y:0,w:0,h:0 };
           }

           if (b.x < x + w && b.x + b.w > x && b.y < y + h && b.y + b.h > y) {
               newSelection.push(el.id);
           }
        });
        setSelectedElementIds(newSelection);
        setDragState(null);
     } else if (dragState.mode === 'move' || dragState.mode === 'resize') {
        pushHistory(editingIcon);
     } else if (dragState.mode === 'vertex' || dragState.mode === 'pen-drag' || dragState.mode === 'segment-bend') {
          if (selectedElementIds.length === 1) {
             const el = editingIcon.elements.find(e => e.id === selectedElementIds[0]);
             if (el) {
                if (el.type === 'path') {
                   updateElement(selectedElementIds[0], { d: stringifyPath(pathCommands) });
                } else if (el.type === 'polyline') {
                   const pointsStr = polylinePoints.map(p => `${Math.round(p.x*100)/100} ${Math.round(p.y*100)/100}`).join(' ');
                   updateElement(selectedElementIds[0], { points: pointsStr });
                }
             }
          }
     }
     setDragState(null);
  };

  const handleVertexMouseDown = (e, cmdIndex, ptIndex, linePoint) => {
     e.stopPropagation();
     setSelectedVertex({ cmdIndex, ptIndex, linePoint });
     setDragState({ mode: 'vertex' });

     // Initialize pathCommands or polylinePoints if empty to ensure real-time rendering
     if (selectedElementIds.length === 1) {
         const el = editingIcon.elements.find(el => el.id === selectedElementIds[0]);
         if (el) {
             if (el.type === 'path' && pathCommands.length === 0) {
                 setPathCommands(parsePath(el.d));
             } else if (el.type === 'polyline' && polylinePoints.length === 0) {
                 const pts = el.points.split(/[\s,]+/).map(parseFloat);
                 const parsed = [];
                 for (let i = 0; i < pts.length; i += 2) {
                     if (!isNaN(pts[i]) && !isNaN(pts[i+1])) parsed.push({ x: pts[i], y: pts[i+1] });
                 }
                 setPolylinePoints(parsed);
             }
         }
     }
  };

  const handleResizeStart = (e, dir) => {
      e.stopPropagation();
      const selectedEls = editingIcon.elements.filter(el => selectedElementIds.includes(el.id));
      const bbox = getElementsBBox(selectedEls);
      if (!bbox) return;

      setDragState({
          mode: 'resize',
          start: getSvgPoint(e),
          dir,
          initialBBox: bbox,
          initialElements: preParseElements(selectedEls)
      });
  };

  const showNotification = (msg, type = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleImportSVG = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const content = ev.target.result;
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'image/svg+xml');

          // Check for Symbols (Sprite File)
          const symbols = Array.from(doc.querySelectorAll('symbol'));

          if (symbols.length > 0) {
              const newItems = symbols.map(sym => {
                  const id = sym.getAttribute('id') || uid();
                  const viewBox = sym.getAttribute('viewBox') || '0 0 24 24';
                  const elements = parseSVGContentToElements(sym.outerHTML);
                  return {
                      spriteId: id,
                      name: id,
                      enName: id,
                      category: 'インポート',
                      viewBox,
                      elements
                  };
              });
              setSpriteList(prev => [...prev, ...newItems]);
              setActiveTab('sprite');
              showNotification(`${newItems.length}件のアイコンをSpriteに追加しました`);
          } else {
              // Regular SVG
              const svg = doc.querySelector('svg');
              if (svg) {
                  const viewBox = svg.getAttribute('viewBox') || '0 0 24 24';
                  const elements = parseSVGContentToElements(svg.innerHTML);
                  const newIcon = { ...editingIcon, viewBox, elements };
                  setEditingIcon(newIcon);
                  pushHistory(newIcon);
                  setActiveTab('gui');
                  showNotification('インポートしました');
              } else {
                  showNotification('SVGの解析に失敗しました', 'error');
              }
          }
      };
      reader.readAsText(file);
  };

  const generateSpriteString = () => {
    return `<svg style="display: none;">\n` +
      spriteList.map(item => `  <symbol id="${item.spriteId}" viewBox="${item.viewBox}">\n    ${generateInnerSVG(item.elements)}\n  </symbol>`).join('\n') +
      `\n</svg>`;
  };

  const handleDrop = (e) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data && data.elements) {
            setSpriteList(items => [...items, { ...data, spriteId: data.enName }]);
        }
      } catch(err) { console.error(err); }
  };

  const generateSVGString = (icon) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}">${generateInnerSVG(icon.elements)}</svg>`;
  };

  const handleExportSVG = () => {
    const blob = new Blob([generateSVGString(editingIcon)], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${editingIcon.enName || 'icon'}.svg`;
    link.click();
    showNotification('SVGをダウンロードしました');
  };

  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    if (!isTransparent) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, exportSize, exportSize); }

    const img = new Image();
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${editingIcon.viewBox}" width="${exportSize}" height="${exportSize}">${generateInnerSVG(editingIcon.elements)}</svg>`;
    const url = URL.createObjectURL(new Blob([rawSvg], { type: 'image/svg+xml' }));

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${editingIcon.enName || 'icon'}.png`;
      link.click();
      showNotification('PNGをダウンロードしました');
    };
    img.src = url;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e) => {
       if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
       if (e.key === 'v') setTool('select');
       if (e.key === 'a') setTool('direct');
       if (e.key === 'p') setTool('pen');
       if (e.key === 'q') setTool('curve');
       if (e.key === 'r') setTool('rect');
       if (e.key === 'c') setTool('circle');
       if (e.key === 'l') setTool('line');

       if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
       if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || ((e.ctrlKey || e.metaKey) && e.key === 'y')) { e.preventDefault(); redo(); }

       if (e.key === 'Backspace' || e.key === 'Delete') {
          if (tool === 'select' && selectedElementIds.length > 0) {
             deleteElement();
          }
       }

       if ((e.key === 'Enter' || e.key === 'Escape') && tool === 'pen') {
          setSelectedElementIds([]);
       }
     };
     window.addEventListener('keydown', handleKey);
     return () => window.removeEventListener('keydown', handleKey);
  }, [tool, selectedElementIds, historyIndex, activeTab]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20 relative">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Settings size={20} /></div>
            <h1 className="text-xl font-bold text-slate-800">Icon Forge Pro</h1>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="text-slate-600 hover:text-indigo-600 text-sm font-medium flex gap-1 items-center"><Upload size={16}/> インポート</button>
            <input type="file" ref={fileInputRef} accept=".svg" className="hidden" onChange={handleImportSVG} />
            <button onClick={() => setIsExportModalOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-700"><Download size={16}/> 書き出し</button>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
         <Library
            library={library} setEditingIcon={setEditingIcon} setHistory={setHistory}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            saveLibrary={saveLibraryInternal} editingIcon={editingIcon}
            categories={categories} setCategories={saveCategoriesInternal}
         />

         <main className="flex-1 flex flex-col bg-slate-50 relative">
            <div className="flex items-center justify-between p-4 pb-0">
               <div className="flex bg-slate-200 rounded-lg p-1">
                 <button onClick={() => setActiveTab('gui')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gui' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}>編集</button>
                 <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'code' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}>コード</button>
                 <button onClick={() => setActiveTab('sprite')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'sprite' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}><Layers size={16}/> Sprite</button>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={undo} disabled={historyIndex <= 0} className={`p-1.5 rounded ${historyIndex > 0 ? 'hover:bg-slate-200' : 'text-slate-300'}`}><Undo size={18}/></button>
                 <button onClick={redo} disabled={historyIndex < history.length - 1} className={`p-1.5 rounded ${historyIndex < history.length - 1 ? 'hover:bg-slate-200' : 'text-slate-300'}`}><Redo size={18}/></button>
               </div>
            </div>

            <div className="flex-1 p-4 overflow-hidden relative">
               {activeTab === 'gui' ? (
                  <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 flex overflow-hidden">
                     <Toolbar tool={tool} setTool={setTool} />
                     <Canvas
                         editingIcon={editingIcon} tool={tool}
                         selectedElementIds={selectedElementIds} setSelectedElementIds={setSelectedElementIds}
                         handleMouseDown={handleMouseDown} handleMouseMove={handleMouseMove} handleMouseUp={handleMouseUp}
                         handleElementMouseDown={handleElementMouseDown}
                         pathCommands={pathCommands} polylinePoints={polylinePoints} selectedVertex={selectedVertex}
                         handleVertexMouseDown={handleVertexMouseDown} handleResizeStart={handleResizeStart} dragState={dragState}
                         svgRef={svgRef}
                     />
                  </div>
               ) : activeTab === 'sprite' ? (
                  <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row overflow-hidden">
                     <div className="flex-1 flex flex-col border-r border-slate-200" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between">
                           <h3 className="font-bold text-slate-700">Spriteリスト</h3>
                           <span className="text-xs text-slate-500">{spriteList.length} 件</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                           {spriteList.length === 0 && <div className="h-full col-span-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2 mt-20"><Layers size={32} className="opacity-20"/><span>アイコンをここにドロップ</span></div>}
                           {spriteList.map((item, idx) => (
                              <div key={idx} className="relative group bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-indigo-300 transition-all hover:shadow-md">
                                 <button
                                    onClick={() => setSpriteList(l => l.filter((_, i) => i !== idx))}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="削除"
                                 >
                                    <X size={14}/>
                                 </button>
                                 <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-md border border-slate-100">
                                       <svg viewBox={item.viewBox} className="w-10 h-10" dangerouslySetInnerHTML={{ __html: generateInnerSVG(item.elements) }} />
                                    </div>
                                    <div className="w-full space-y-1.5">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center block">Symbol ID</label>
                                       <input
                                          type="text"
                                          value={item.spriteId}
                                          spellCheck={false}
                                          onChange={(e) => { const l = [...spriteList]; l[idx].spriteId = e.target.value; setSpriteList(l); }}
                                          className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none font-mono text-slate-700 bg-slate-50/50"
                                       />
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="w-80 bg-slate-900 text-slate-300 flex flex-col">
                        <div className="p-4 bg-slate-800 flex justify-between items-center">
                           <span className="text-xs font-bold text-white">生成コード</span>
                           <div className="flex gap-2">
                              <button
                                 onClick={() => {
                                    const blob = new Blob([generateSpriteString()], { type: 'image/svg+xml' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = 'sprite.svg';
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    showNotification('ダウンロードを開始しました');
                                 }}
                                 className="text-xs bg-slate-700 px-2 py-1 rounded text-white hover:bg-slate-600 flex items-center gap-1"
                                 title="SVGファイルとしてダウンロード"
                              >
                                 <Download size={12}/> ダウンロード
                              </button>
                              <button onClick={() => { navigator.clipboard.writeText(generateSpriteString()); showNotification('コピーしました'); }} className="text-xs bg-indigo-600 px-2 py-1 rounded text-white hover:bg-indigo-500">コピー</button>
                           </div>
                        </div>
                        <textarea readOnly value={generateSpriteString()} className="flex-1 bg-slate-900 p-4 text-xs font-mono text-green-400 resize-none focus:outline-none" />
                     </div>
                  </div>
               ) : (
                  <div className="w-full h-full bg-white border rounded-lg shadow-sm p-0 flex flex-col">
                     <div className="p-3 bg-slate-50 border-b text-xs text-slate-500 font-bold uppercase">Generated SVG Code</div>
                     <textarea
                        className="flex-1 p-4 font-mono text-xs resize-none focus:outline-none bg-slate-50"
                        defaultValue={generateSVGString(editingIcon)}
                        onChange={(e) => {
                            const val = e.target.value;
                            const svgMatch = val.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
                            if (svgMatch) {
                                const elements = parseSVGContentToElements(svgMatch[1]);
                                setEditingIcon(prev => ({...prev, elements}));
                            }
                        }}
                        key={editingIcon.elements.length + editingIcon.id}
                     />
                  </div>
               )}
            </div>
         </main>

         <PropertiesPanel
            editingIcon={editingIcon} setEditingIcon={setEditingIcon}
            selectedElementIds={selectedElementIds} setSelectedElementIds={setSelectedElementIds}
            updateElement={updateElement} deleteElement={deleteElement}
            convertToPath={convertToPath} saveLibrary={saveLibraryInternal} library={library}
            showNotification={showNotification}
            categories={categories}
         />
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-700">書き出し設定</h3>
                 <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-6">
                 <div className="flex justify-center py-4 bg-slate-100/50 border rounded-lg overflow-hidden">
                    <svg viewBox={editingIcon.viewBox} width="96" height="96" dangerouslySetInnerHTML={{ __html: generateInnerSVG(editingIcon.elements) }}/>
                 </div>

                 <div className="space-y-4">
                    <button onClick={handleExportSVG} className="w-full border border-slate-300 rounded-lg p-3 flex items-center justify-between hover:bg-slate-50 hover:border-indigo-300 transition group">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded"><Code size={20}/></div>
                          <div className="text-left">
                             <div className="font-bold text-sm text-slate-700 group-hover:text-indigo-700">SVG形式</div>
                             <div className="text-xs text-slate-500">ベクターデータ (Web/Code用)</div>
                          </div>
                       </div>
                       <Download size={16} className="text-slate-400 group-hover:text-indigo-600"/>
                    </button>

                    <div className="border border-slate-300 rounded-lg p-3 space-y-3">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-pink-50 text-pink-600 rounded"><ImageIcon size={20}/></div>
                          <div className="font-bold text-sm text-slate-700">PNG形式</div>
                       </div>
                       <div className="pl-12 pr-2 space-y-3">
                          <div className="flex items-center justify-between text-xs"><span>サイズ: <strong>{exportSize}px</strong></span></div>
                          <input type="range" min="64" max="1024" step="64" value={exportSize} onChange={e => setExportSize(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"/>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                             <input type="checkbox" checked={isTransparent} onChange={e => setIsTransparent(e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500"/>
                             背景を透過する
                          </label>
                          <button onClick={handleExportPNG} className="w-full bg-slate-800 text-white py-2 rounded text-xs hover:bg-slate-700">PNGをダウンロード</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg flex items-center gap-3 z-50 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
          {notification.type === 'error' ? <X size={16} /> : <Check size={16} />}
          <span className="text-sm">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}
