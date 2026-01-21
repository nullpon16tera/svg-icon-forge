export const DEFAULT_ICONS = [
  // Web Category
  {
    id: 'home', name: 'ホーム', enName: 'home', category: 'Web', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-h1', type: 'path', d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-h2', type: 'polyline', points: '9 22 9 12 15 12 15 22', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  {
    id: 'search', name: '検索', enName: 'search', category: 'Web', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-s1', type: 'circle', cx: 11, cy: 11, r: 8, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-s2', type: 'line', x1: 21, y1: 21, x2: 16.65, y2: 16.65, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  {
    id: 'menu', name: 'メニュー', enName: 'menu', category: 'Web', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-m1', type: 'line', x1: 3, y1: 12, x2: 21, y2: 12, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-m2', type: 'line', x1: 3, y1: 6, x2: 21, y2: 6, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-m3', type: 'line', x1: 3, y1: 18, x2: 21, y2: 18, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  // Admin Category
  {
    id: 'settings', name: '設定', enName: 'settings', category: '管理画面', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-st1', type: 'circle', cx: 12, cy: 12, r: 3, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-st2', type: 'path', d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  {
    id: 'trash', name: '削除', enName: 'trash', category: '管理画面', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-tr1', type: 'polyline', points: '3 6 5 6 21 6', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-tr2', type: 'path', d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  {
    id: 'check', name: 'チェック', enName: 'check', category: '管理画面', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-ch1', type: 'polyline', points: '20 6 9 17 4 12', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  // Member Category
  {
    id: 'user', name: 'ユーザー', enName: 'user', category: '会員', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-u1', type: 'path', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-u2', type: 'circle', cx: 12, cy: 7, r: 4, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  {
    id: 'users', name: '複数ユーザー', enName: 'users', category: '会員', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-us1', type: 'path', d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-us2', type: 'circle', cx: 9, cy: 7, r: 4, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-us3', type: 'path', d: 'M23 21v-2a4 4 0 0 0-3-3.87', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-us4', type: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  // SNS Category
  {
    id: 'heart', name: 'いいね', enName: 'heart', category: 'SNS', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-ht1', type: 'path', d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  },
  {
    id: 'share', name: 'シェア', enName: 'share', category: 'SNS', viewBox: '0 0 24 24',
    elements: [
      { id: 'el-sh1', type: 'circle', cx: 18, cy: 5, r: 3, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-sh2', type: 'circle', cx: 6, cy: 12, r: 3, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-sh3', type: 'circle', cx: 18, cy: 19, r: 3, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-sh4', type: 'line', x1: 8.59, y1: 13.51, x2: 15.42, y2: 17.49, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { id: 'el-sh5', type: 'line', x1: 15.41, y1: 6.51, x2: 8.59, y2: 10.49, fill: 'none', stroke: '#000000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
    ]
  }
];

export const CATEGORIES = ['すべて', 'Web', '管理画面', '会員', 'SNS', 'カスタム'];
