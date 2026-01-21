
import React from 'react';
import { parsePath, stringifyPath, getElementsBBox } from '../utils/svgHelpers';

export function Canvas({
    editingIcon, tool, selectedElementIds, setSelectedElementIds,
    handleMouseDown, handleMouseMove, handleMouseUp, handleElementMouseDown,
    pathCommands, polylinePoints, selectedVertex, handleVertexMouseDown,
    handleResizeStart, dragState, svgRef
}) {

    const renderOverlay = () => {
        if (dragState && dragState.mode === 'create') {
           const { start, current } = dragState;
           if (tool === 'rect') {
              const w = current.x - start.x; const h = current.y - start.y;
              return <rect x={w<0?current.x:start.x} y={h<0?current.y:start.y} width={Math.abs(w)} height={Math.abs(h)} fill="none" stroke="#3b82f6" strokeWidth="0.6" strokeDasharray="2 2" />;
           } else if (tool === 'circle') {
              const r = Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2));
              return <circle cx={start.x} cy={start.y} r={r} fill="none" stroke="#3b82f6" strokeWidth="0.6" strokeDasharray="2 2" />;
           } else if (tool === 'line') {
              return <line x1={start.x} y1={start.y} x2={current.x} y2={current.y} stroke="#3b82f6" strokeWidth="0.6" strokeDasharray="2 2" />;
           } else if (tool === 'curve') {
              const cp1x = start.x + (current.x - start.x) / 3;
              const cp1y = start.y - 5;
              const cp2x = start.x + 2 * (current.x - start.x) / 3;
              const cp2y = current.y - 5;
              const d = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
              return <path d={d} fill="none" stroke="#3b82f6" strokeWidth="0.6" strokeDasharray="2 2" />;
           }
        }

        // Visible Marquee Selection
        if (dragState && dragState.mode === 'marquee') {
            const { start, current } = dragState;
            const x = Math.min(start.x, current.x);
            const y = Math.min(start.y, current.y);
            const w = Math.abs(current.x - start.x);
            const h = Math.abs(current.y - start.y);
            return <rect x={x} y={y} width={w} height={h} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 2" pointerEvents="none" />;
        }

        if (tool === 'select' && selectedElementIds.length > 0) {
           const selectedEls = editingIcon.elements.filter(el => selectedElementIds.includes(el.id));
           const bbox = getElementsBBox(selectedEls);

           if (!bbox) return null; // No valid bounds

           const { x:minX, y:minY, w, h } = bbox;
           const maxX = minX + w;
           const maxY = minY + h;

           return (
             <>
                <rect x={minX-0.5} y={minY-0.5} width={w+1} height={h+1} fill="none" stroke="#3b82f6" strokeWidth="0.15" pointerEvents="none" />
                {/* Resize Handles - 8 points - Approx 20px on screen (1 unit) */}
                {[
                  {x: minX-0.5, y: minY-0.5, cursor: 'nw-resize', dir: 'nw'}, {x: minX+w/2, y: minY-0.5, cursor: 'n-resize', dir: 'n'}, {x: maxX+0.5, y: minY-0.5, cursor: 'ne-resize', dir: 'ne'},
                  {x: maxX+0.5, y: minY+h/2, cursor: 'e-resize', dir: 'e'}, {x: maxX+0.5, y: maxY+0.5, cursor: 'se-resize', dir: 'se'}, {x: minX+w/2, y: maxY+0.5, cursor: 's-resize', dir: 's'},
                  {x: minX-0.5, y: maxY+0.5, cursor: 'sw-resize', dir: 'sw'}, {x: minX-0.5, y: minY+h/2, cursor: 'w-resize', dir: 'w'}
                ].map((h, i) => (
                   <g key={i} onMouseDown={(e) => handleResizeStart(e, h.dir)} style={{cursor: h.cursor}}>
                       {/* Invisible larger hit area */}
                       <rect x={h.x-0.75} y={h.y-0.75} width={1.5} height={1.5} fill="transparent" />
                       {/* Visible dot - Approx 10px (0.5 unit) with 0.12 unit stroke */}
                       <rect x={h.x-0.25} y={h.y-0.25} width={0.5} height={0.5} fill="white" stroke="#3b82f6" strokeWidth="0.12" />
                   </g>
                ))}
             </>
           );
        }

        if ((tool === 'direct' || tool === 'curve') && selectedElementIds.length === 1) {
           const selectedElementId = selectedElementIds[0];
           // Path Handles
           if (pathCommands.length > 0) {
                return pathCommands.map((cmd, cIdx) => (
                   <g key={cIdx}>
                      {cmd.type === 'C' && (
                         <>
                           <line x1={pathCommands[cIdx-1]?.points.slice(-1)[0]?.x || 0} y1={pathCommands[cIdx-1]?.points.slice(-1)[0]?.y || 0} x2={cmd.points[0].x} y2={cmd.points[0].y} stroke="#93c5fd" strokeWidth="0.2" />
                           <line x1={cmd.points[2].x} y1={cmd.points[2].y} x2={cmd.points[1].x} y2={cmd.points[1].y} stroke="#93c5fd" strokeWidth="0.2" />
                         </>
                      )}
                      {cmd.points.map((pt, pIdx) => {
                         const isSelected = selectedVertex?.cmdIndex === cIdx && selectedVertex?.ptIndex === pIdx;
                         return (
                            <g key={pIdx} onMouseDown={(e) => handleVertexMouseDown(e, cIdx, pIdx)} style={{ cursor: 'move' }}>
                               {pt.type === 'anchor' ?
                                 <rect
                                   x={pt.x - (isSelected ? 0.35 : 0.25)}
                                   y={pt.y - (isSelected ? 0.35 : 0.25)}
                                   width={isSelected ? 0.7 : 0.5}
                                   height={isSelected ? 0.7 : 0.5}
                                   fill={isSelected ? "#3b82f6" : "white"}
                                   stroke="#3b82f6"
                                   strokeWidth={isSelected ? "0.15" : "0.1"}
                                 /> :
                                 <circle
                                   cx={pt.x}
                                   cy={pt.y}
                                   r={isSelected ? 0.35 : 0.25}
                                   fill={isSelected ? "#3b82f6" : "#60a5fa"}
                                   stroke="white"
                                   strokeWidth="0.05"
                                 />
                               }
                            </g>
                         );
                      })}
                   </g>
                ));
           }

           // Polyline Handles
           if (polylinePoints.length > 0) {
               return polylinePoints.map((pt, idx) => {
                  const isSelected = selectedVertex?.ptIndex === idx && selectedVertex?.cmdIndex === null;
                  return (
                    <g key={idx} onMouseDown={(e) => handleVertexMouseDown(e, null, idx)} style={{ cursor: 'move' }}>
                       <rect
                         x={pt.x - (isSelected ? 0.35 : 0.25)}
                         y={pt.y - (isSelected ? 0.35 : 0.25)}
                         width={isSelected ? 0.7 : 0.5}
                         height={isSelected ? 0.7 : 0.5}
                         fill={isSelected ? "#3b82f6" : "white"}
                         stroke="#3b82f6"
                         strokeWidth={isSelected ? "0.15" : "0.1"}
                       />
                    </g>
                  );
               });
           }

           // Line Handles
           if (selectedElementId) {
               const el = editingIcon.elements.find(e => e.id === selectedElementId);
               if (el && el.type === 'line') {
                  const startSel = selectedVertex?.linePoint === 'start';
                  const endSel = selectedVertex?.linePoint === 'end';
                  return (
                     <>
                        <g onMouseDown={(e) => handleVertexMouseDown(e, null, null, 'start')} style={{ cursor: 'move' }}>
                           <rect
                              x={el.x1 - (startSel ? 0.35 : 0.25)}
                              y={el.y1 - (startSel ? 0.35 : 0.25)}
                              width={startSel ? 0.7 : 0.5}
                              height={startSel ? 0.7 : 0.5}
                              fill={startSel ? "#3b82f6" : "white"}
                              stroke="#3b82f6"
                              strokeWidth={startSel ? "0.15" : "0.1"}
                           />
                        </g>
                        <g onMouseDown={(e) => handleVertexMouseDown(e, null, null, 'end')} style={{ cursor: 'move' }}>
                           <rect
                              x={el.x2 - (endSel ? 0.35 : 0.25)}
                              y={el.y2 - (endSel ? 0.35 : 0.25)}
                              width={endSel ? 0.7 : 0.5}
                              height={endSel ? 0.7 : 0.5}
                              fill={endSel ? "#3b82f6" : "white"}
                              stroke="#3b82f6"
                              strokeWidth={endSel ? "0.15" : "0.1"}
                           />
                        </g>
                     </>
                  );
               }
           }
        }
        if (tool === 'pen' && selectedElementIds.length === 1) {
           const el = editingIcon.elements.find(e => e.id === selectedElementIds[0]);
           if (el && el.type === 'path' && !el.d.includes('Z')) {
              const match = el.d.match(/M\s*([\d.-]+)[\s,]+([\d.-]+)/);
              if (match) {
                 const x = parseFloat(match[1]);
                 const y = parseFloat(match[2]);
                 return (
                    <g pointerEvents="none">
                        <circle cx={x} cy={y} r={0.5} fill="none" stroke="#3b82f6" strokeWidth="0.05" strokeDasharray="0.2 0.2" />
                        <circle cx={x} cy={y} r={0.25} fill="#3b82f6" opacity="0.8" />
                    </g>
                 );
              }
           }
        }
        return null;
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
            <div className="w-[500px] h-[500px] bg-white border border-dashed border-slate-300 shadow-sm relative cursor-crosshair">
                <svg
                    ref={svgRef}
                    viewBox={editingIcon.viewBox}
                    width="100%"
                    height="100%"
                    className="w-full h-full p-12 overflow-visible"
                    onMouseDown={handleMouseDown}
                >
                    <defs><pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.05"/></pattern></defs>
                    <rect width="24" height="24" fill="url(#grid)" pointerEvents="none" id="grid-rect"/>

                    {editingIcon.elements.map(el => {
                        const isSelected = selectedElementIds.includes(el.id);
                        const commonProps = {
                            'data-id': el.id,
                            fill: el.fill,
                            fillRule: el.fillRule,
                            stroke: el.stroke,
                            strokeWidth: el.strokeWidth,
                            strokeLinecap: el.strokeLinecap,
                            strokeLinejoin: el.strokeLinejoin,
                            strokeDasharray: el.strokeDasharray,
                            transform: el.transform,
                            style: { cursor: tool === 'select' ? 'move' : 'default', opacity: isSelected && tool === 'direct' ? 0.5 : 1, pointerEvents: 'all' },
                            onMouseDown: (e) => handleElementMouseDown(e, el.id)
                        };

                        if (el.type === 'path') {
                             const d = (isSelected && (tool === 'direct' || tool === 'curve') && pathCommands.length > 0)
                                       ? stringifyPath(pathCommands)
                                       : el.d;
                             return <path key={el.id} d={d} {...commonProps} />;
                        }
                        if (el.type === 'rect') return <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} {...commonProps} />;
                        if (el.type === 'circle') return <circle key={el.id} cx={el.cx} cy={el.cy} r={el.r} {...commonProps} />;
                        if (el.type === 'line') return <line key={el.id} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} {...commonProps} />;
                        if (el.type === 'polyline') {
                           const pointsStr = (isSelected && (tool === 'direct' || tool === 'curve') && polylinePoints.length > 0)
                              ? polylinePoints.map(p => `${p.x},${p.y}`).join(' ')
                              : el.points;
                           return <polyline key={el.id} points={pointsStr} {...commonProps} />;
                        }
                        return null;
                    })}

                   {renderOverlay()}
                </svg>
            </div>
        </div>
    );
}
