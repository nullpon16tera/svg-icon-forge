
export const uid = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const camelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

export const generateInnerSVG = (elements) => {
  let content = '';
  elements.forEach(el => {
    const common = `fill="${el.fill || 'none'}" fill-rule="${el.fillRule || 'nonzero'}" stroke="${el.stroke || 'none'}" stroke-width="${el.strokeWidth ?? 1}" stroke-linecap="${el.strokeLinecap || 'butt'}" stroke-linejoin="${el.strokeLinejoin || 'miter'}" stroke-dasharray="${el.strokeDasharray || ''}" transform="${el.transform || ''}"`;
    if (el.type === 'path') content += `<path d="${el.d}" ${common} />`;
    else if (el.type === 'rect') content += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ${common} />`;
    else if (el.type === 'circle') content += `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}" ${common} />`;
    else if (el.type === 'line') content += `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke || '#000'}" stroke-width="${el.strokeWidth ?? 1}" stroke-linecap="${el.strokeLinecap || 'butt'}" stroke-dasharray="${el.strokeDasharray || ''}" transform="${el.transform || ''}" />`;
    else if (el.type === 'polyline') content += `<polyline points="${el.points}" ${common} />`;
  });
  return content;
};

export const parseSVGContentToElements = (svgString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svgString}</svg>`, 'image/svg+xml');
  const svgRoot = doc.querySelector('svg');
  if (!svgRoot) return [];

  const elements = [];

  const parseNodes = (nodes, currentTransform = '') => {
    Array.from(nodes).forEach(node => {
      if (node.nodeType !== 1) return; // Only process Element nodes

      const tagName = node.tagName.toLowerCase();
      if (tagName === 'g' || tagName === 'svg' || tagName === 'symbol') {
        const trans = node.getAttribute('transform') || '';
        const combinedTransform = currentTransform ? `${currentTransform} ${trans}`.trim() : trans;
        parseNodes(node.childNodes, combinedTransform);
        return;
      }

      if (!['path', 'circle', 'rect', 'line', 'polyline', 'polygon'].includes(tagName)) return;

      const attrs = {};
      Array.from(node.attributes).forEach(attr => attrs[attr.name] = attr.value);

      const trans = node.getAttribute('transform') || '';
      const combinedTransform = currentTransform ? `${currentTransform} ${trans}`.trim() : trans;

      ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'stroke-width'].forEach(k => {
        if (attrs[k]) attrs[camelCase(k)] = parseFloat(attrs[k]);
      });
      ['fill', 'stroke', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'stroke-dasharray'].forEach(k => {
        if (attrs[k]) attrs[camelCase(k)] = attrs[k];
      });

      let el = {
        id: uid(),
        type: tagName === 'polygon' ? 'polyline' : tagName,
        ...attrs,
        // Ensure numeric attributes have defaults if missing or NaN
        x: attrs.x ?? 0,
        y: attrs.y ?? 0,
        width: attrs.width ?? 0,
        height: attrs.height ?? 0,
        cx: attrs.cx ?? 0,
        cy: attrs.cy ?? 0,
        r: attrs.r ?? 0,
        x1: attrs.x1 ?? 0,
        y1: attrs.y1 ?? 0,
        x2: attrs.x2 ?? 0,
        y2: attrs.y2 ?? 0,
        fill: attrs.fill || (attrs.stroke && attrs.stroke !== 'none' ? 'none' : '#000000'),
        stroke: attrs.stroke || 'none',
        strokeWidth: attrs['stroke-width'] !== undefined ? parseFloat(attrs['stroke-width']) : 1,
        strokeLinecap: attrs['stroke-linecap'] || 'butt',
        strokeLinejoin: attrs['stroke-linejoin'] || 'miter',
        fillRule: attrs['fill-rule'] || 'nonzero',
        strokeDasharray: attrs['stroke-dasharray'] || '',
        transform: combinedTransform
      };

      // Handle currentColor
      if (el.fill === 'currentColor') el.fill = '#000000';
      if (el.stroke === 'currentColor') el.stroke = '#000000';

      elements.push(el);
    });
  };

  parseNodes(svgRoot.childNodes);
  return elements;
};

export const shapeToPath = (element) => {
  const { type } = element;
  if (type === 'path') return element.d;
  if (type === 'rect') {
    const { x, y, width: w, height: h } = element;
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  }
  if (type === 'circle') {
    const { cx, cy, r } = element;
    const k = 0.55228475;
    return `M ${cx - r} ${cy} C ${cx - r} ${cy - r * k} ${cx - r * k} ${cy - r} ${cx} ${cy - r} C ${cx + r * k} ${cy - r} ${cx + r} ${cy - r * k} ${cx + r} ${cy} C ${cx + r} ${cy + r * k} ${cx + r * k} ${cy + r} ${cx} ${cy + r} C ${cx - r * k} ${cy + r} ${cx - r} ${cy + r * k} ${cx - r} ${cy} Z`;
  }
  if (type === 'line') {
    const { x1, y1, x2, y2 } = element;
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  if (type === 'polyline') {
      const points = element.points.trim().split(/\s+|,/);
      if (points.length < 2) return '';
      let d = `M ${points[0]} ${points[1]}`;
      for(let i=2; i<points.length; i+=2) d += ` L ${points[i]} ${points[i+1]}`;
      return d;
  }
  return '';
};

export const stringifyPath = (commands) => {
  return commands.map(cmd => {
    if (cmd.type === 'Z') return 'Z';
    const pts = cmd.points.map(p => `${Math.round(p.x * 100) / 100} ${Math.round(p.y * 100) / 100}`).join(' ');
    return `${cmd.type} ${pts}`;
  }).join(' ');
};

const arcToCubic = (px, py, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) => {
    const curves = [];
    if (rx === 0 || ry === 0) return [];

    const sinPhi = Math.sin(xAxisRotation * Math.PI / 180);
    const cosPhi = Math.cos(xAxisRotation * Math.PI / 180);

    const pxp = cosPhi * (px - x) / 2 + sinPhi * (py - y) / 2;
    const pyp = -sinPhi * (px - x) / 2 + cosPhi * (py - y) / 2;

    if (pxp === 0 && pyp === 0) return [];

    rx = Math.abs(rx);
    ry = Math.abs(ry);

    const lambda = Math.pow(pxp, 2) / Math.pow(rx, 2) + Math.pow(pyp, 2) / Math.pow(ry, 2);
    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }

    let centerx = 0;
    let centery = 0;
    let centerSign = 0;

    if (largeArcFlag !== sweepFlag) {
        centerSign = 1;
    } else {
        centerSign = -1;
    }

    const num = Math.pow(rx, 2) * Math.pow(ry, 2) - Math.pow(rx, 2) * Math.pow(pyp, 2) - Math.pow(ry, 2) * Math.pow(pxp, 2);
    const den = Math.pow(rx, 2) * Math.pow(pyp, 2) + Math.pow(ry, 2) * Math.pow(pxp, 2);
    let ratio = num / den;
    if (ratio < 0) ratio = 0;

    const centercoef = centerSign * Math.sqrt(ratio);
    const cxp = centercoef * (rx * pyp / ry);
    const cyp = centercoef * -(ry * pxp / rx);

    const cx = cosPhi * cxp - sinPhi * cyp + (px + x) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (py + y) / 2;

    const theta1 = Math.atan2((pyp - cyp) / ry, (pxp - cxp) / rx);
    const theta2 = Math.atan2((-pyp - cyp) / ry, (-pxp - cxp) / rx);
    let deltaTheta = theta2 - theta1;

    if (sweepFlag === 0 && deltaTheta > 0) {
        deltaTheta -= 2 * Math.PI;
    } else if (sweepFlag === 1 && deltaTheta < 0) {
        deltaTheta += 2 * Math.PI;
    }

    let segments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2));
    if (segments === 0) segments = 1;

    const delta = deltaTheta / segments;
    const t = 8 / 3 * Math.sin(delta / 4) * Math.sin(delta / 4) / Math.sin(delta / 2);

    let startX = px;
    let startY = py;

    for (let i = 0; i < segments; i++) {
        const theta_curr = theta1 + i * delta;
        const cosTheta = Math.cos(theta_curr);
        const sinTheta = Math.sin(theta_curr);
        const theta_next = theta1 + (i + 1) * delta;
        const cosThetaNext = Math.cos(theta_next);
        const sinThetaNext = Math.sin(theta_next);

        const e1x = cosPhi * rx * cosTheta - sinPhi * ry * sinTheta;
        const e1y = sinPhi * rx * cosTheta + cosPhi * ry * sinTheta;
        const enx = cosPhi * rx * cosThetaNext - sinPhi * ry * sinThetaNext;
        const eny = sinPhi * rx * cosThetaNext + cosPhi * ry * sinThetaNext;
        const dx = -cosPhi * rx * sinTheta - sinPhi * ry * cosTheta;
        const dy = -sinPhi * rx * sinTheta + cosPhi * ry * cosTheta;
        const dnx = -cosPhi * rx * sinThetaNext - sinPhi * ry * cosThetaNext;
        const dny = -sinPhi * rx * sinThetaNext + cosPhi * ry * cosThetaNext;

        const cp1x = startX + t * dx;
        const cp1y = startY + t * dy;
        const cp2x = (cx + enx) - t * dnx;
        const cp2y = (cy + eny) - t * dny;
        const endX = (cx + enx);
        const endY = (cy + eny);

        curves.push({
            x1: cp1x, y1: cp1y,
            x2: cp2x, y2: cp2y,
            x: endX, y: endY
        });
        startX = endX;
        startY = endY;
    }
    return curves;
};

export const parsePath = (d) => {
  if (!d) return [];
  const tokens = d.match(/([a-zA-Z]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g);
  if (!tokens) return [];

  const commands = [];
  let i = 0;
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;
  let lastCommandType = null;

  const getNum = () => {
      if (i >= tokens.length) return 0;
      const val = parseFloat(tokens[i]);
      if (!isNaN(val)) i++;
      return isNaN(val) ? 0 : val;
  };

  while (i < tokens.length) {
    let type = tokens[i];

    if (!isNaN(parseFloat(type))) {
       if (lastCommandType) {
          type = lastCommandType;
          if (type === 'M') type = 'L'; // Subsequent M points are L
          if (type === 'm') type = 'l';
       } else {
          i++; continue;
       }
    } else {
       i++;
       lastCommandType = type;
    }

    const upperChar = type.toUpperCase();
    const isRelative = type === type.toLowerCase();

    let cmd = { type: upperChar, points: [] };

    switch (upperChar) {
      case 'M':
        {
          let x = getNum(), y = getNum();
          if (isRelative) { x += currentX; y += currentY; }
          cmd.points = [{ x, y, type: 'anchor' }];
          currentX = x; currentY = y;
          startX = x; startY = y;
          cmd.type = 'M';
          commands.push(cmd);
        }
        break;
      case 'L':
        {
          let x = getNum(), y = getNum();
          if (isRelative) { x += currentX; y += currentY; }
          cmd.points = [{ x, y, type: 'anchor' }];
          currentX = x; currentY = y;
          cmd.type = 'L';
          commands.push(cmd);
        }
        break;
      case 'H':
        {
          let x = getNum();
          if (isRelative) { x += currentX; }
          cmd.type = 'L';
          cmd.points = [{ x, y: currentY, type: 'anchor' }];
          currentX = x;
          commands.push(cmd);
        }
        break;
      case 'V':
        {
          let y = getNum();
          if (isRelative) { y += currentY; }
          cmd.type = 'L';
          cmd.points = [{ x: currentX, y, type: 'anchor' }];
          currentY = y;
          commands.push(cmd);
        }
        break;
      case 'C':
        {
          let x1 = getNum(), y1 = getNum();
          let x2 = getNum(), y2 = getNum();
          let x = getNum(), y = getNum();
          if (isRelative) {
            x1 += currentX; y1 += currentY;
            x2 += currentX; y2 += currentY;
            x += currentX; y += currentY;
          }
          cmd.points = [
            { x: x1, y: y1, type: 'control1' },
            { x: x2, y: y2, type: 'control2' },
            { x, y, type: 'anchor' }
          ];
          currentX = x; currentY = y;
          commands.push(cmd);
        }
        break;
      case 'S':
        {
          let x2 = getNum(), y2 = getNum();
          let x = getNum(), y = getNum();
          if (isRelative) {
             x2 += currentX; y2 += currentY;
             x += currentX; y += currentY;
          }
          let x1 = currentX, y1 = currentY;
          const prevCmd = commands[commands.length - 1];
          if (prevCmd && (prevCmd.type === 'C' || prevCmd.type === 'S')) {
             const prevCtl = prevCmd.points[prevCmd.points.length - 2];
             x1 = currentX * 2 - prevCtl.x;
             y1 = currentY * 2 - prevCtl.y;
          }
          cmd.type = 'C';
          cmd.points = [
             { x: x1, y: y1, type: 'control1' },
             { x: x2, y: y2, type: 'control2' },
             { x, y, type: 'anchor' }
          ];
          currentX = x; currentY = y;
          commands.push(cmd);
        }
        break;
      case 'Q':
        {
          let x1 = getNum(), y1 = getNum();
          let x = getNum(), y = getNum();
          if (isRelative) { x1+=currentX; y1+=currentY; x+=currentX; y+=currentY; }
          let cp1x = currentX + (2/3) * (x1 - currentX);
          let cp1y = currentY + (2/3) * (y1 - currentY);
          let cp2x = x + (2/3) * (x1 - x);
          let cp2y = y + (2/3) * (y1 - y);

          cmd.type = 'C';
          cmd.points = [
             { x: cp1x, y: cp1y, type: 'control1' },
             { x: cp2x, y: cp2y, type: 'control2' },
             { x, y, type: 'anchor' }
          ];
          currentX = x; currentY = y;
          commands.push(cmd);
        }
        break;
      case 'T':
        {
          let x = getNum(), y = getNum();
          if (isRelative) { x += currentX; y += currentY; }
          cmd.type = 'L';
          cmd.points = [{ x, y, type: 'anchor' }];
          currentX = x; currentY = y;
          commands.push(cmd);
        }
        break;
      case 'A':
        {
          let rx = getNum(), ry = getNum();
          let xAxisRotation = getNum();
          let largeArcFlag = getNum(), sweepFlag = getNum();
          let x = getNum(), y = getNum();
          if (isRelative) { x += currentX; y += currentY; }

          // Arc to Cubic Bezier conversion
          const curves = arcToCubic(currentX, currentY, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y);
          curves.forEach(curve => {
              const c = {
                  type: 'C',
                  points: [
                      { x: curve.x1, y: curve.y1, type: 'control1' },
                      { x: curve.x2, y: curve.y2, type: 'control2' },
                      { x: curve.x, y: curve.y, type: 'anchor' }
                  ]
              };
              commands.push(c);
          });

          currentX = x; currentY = y;
        }
        break;
      case 'Z':
        cmd.points = [];
        currentX = startX; currentY = startY;
        commands.push(cmd);
        break;
      default:
        break;
    }
  }
  return commands;
};

// Selection Box Helper
export const getElementsBBox = (elements) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (elements.length === 0) return null;

    elements.forEach(el => {
         let bbox = { x: 0, y: 0, w: 0, h: 0 };
         if (el.type === 'rect') bbox = { x: el.x, y: el.y, w: el.width, h: el.height };
         else if (el.type === 'circle') bbox = { x: el.cx - el.r, y: el.cy - el.r, w: el.r*2, h: el.r*2 };
         else if (el.type === 'line') bbox = { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x1-el.x2), h: Math.abs(el.y1-el.y2) };
         else if (el.type === 'path') {
             const cmds = parsePath(el.d);
             cmds.forEach(c => c.points.forEach(p => {
                 if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x;
                 if(p.y < minY) minY = p.y; if(p.y > maxY) maxY = p.y;
             }));
         } else if (el.type === 'polyline') {
             const points = el.points.trim().split(/[\s,]+/).map(parseFloat);
             for(let i=0; i<points.length; i+=2) {
                  if(!isNaN(points[i]) && !isNaN(points[i+1])) {
                      const px = points[i]; const py = points[i+1];
                      if(px < minX) minX = px; if(px > maxX) maxX = px;
                      if(py < minY) minY = py; if(py > maxY) maxY = py;
                  }
             }
         }

         if (['rect', 'circle', 'line'].includes(el.type)) {
            if (bbox.x < minX) minX = bbox.x;
            if (bbox.y < minY) minY = bbox.y;
            if (bbox.x + bbox.w > maxX) maxX = bbox.x + bbox.w;
            if (bbox.y + bbox.h > maxY) maxY = bbox.y + bbox.h;
         }
    });

    if (minX === Infinity) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};
