import { useMemo } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { useMathState } from '@/store/useMathState';
import { mathToScreen } from '@/utils/coordinate';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { Vector2 } from '@/types/math';

const PI = Math.PI;
const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 400;
const UNIT_PX = 30; // 1 个数学单位 = 30px。X 轴约容纳 -10 到 10 (3π左右)

// 辅助函数：将小数近似转为带 π 的分数格式展示
function formatAnglePi(val: number): string {
  if (Math.abs(val) < 0.01) return '0';
  const fractions = [
    { v: PI, s: '\\pi' },
    { v: PI / 2, s: '\\frac{\\pi}{2}' },
    { v: PI / 3, s: '\\frac{\\pi}{3}' },
    { v: PI / 4, s: '\\frac{\\pi}{4}' },
    { v: PI / 6, s: '\\frac{\\pi}{6}' },
    { v: PI / 12, s: '\\frac{\\pi}{12}' },
  ];
  const sign = val < 0 ? '-' : '';
  const absVal = Math.abs(val);

  for (const { v, s } of fractions) {
    const ratio = absVal / v;
    const rounded = Math.round(ratio);
    if (Math.abs(ratio - rounded) < 0.01) {
      if (rounded === 1) return sign + s;
      return sign + `${rounded}${s}`;
    }
  }
  return val.toFixed(2);
}

export function TrigFunctionGraph() {
  const params = useMathState((s) => s.graphParams);
  const updateParam = useMathState((s) => s.updateGraphParam);

  const { A, omega, phi, b, funcType } = params;

  // 生成波形路径
  const pathD = useMemo(() => {
    const points: Vector2[] = [];
    // 覆盖整个画布的数学 X 域：
    const xMin = -CONTAINER_WIDTH / 2 / UNIT_PX;
    const xMax = CONTAINER_WIDTH / 2 / UNIT_PX;
    const step = 0.05; // 采样步长

    for (let x = xMin; x <= xMax; x += step) {
      const y = funcType === 'sin' 
        ? A * Math.sin(omega * x + phi) + b 
        : A * Math.cos(omega * x + phi) + b;
      
      const screenPt = mathToScreen({ x, y }, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX });
      points.push(screenPt);
    }

    if (points.length === 0) return '';
    return 'M ' + points.map((p) => `${p.x},${p.y}`).join(' L ');
  }, [A, omega, phi, b, funcType]);

  // 生成坐标系轴线与网格线
  const axes = useMemo(() => {
    const lines = [];
    const cx = CONTAINER_WIDTH / 2;
    const cy = CONTAINER_HEIGHT / 2;

    // x 轴
    lines.push(<line key="x-axis" x1={0} y1={cy} x2={CONTAINER_WIDTH} y2={cy} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />);
    // y 轴
    lines.push(<line key="y-axis" x1={cx} y1={0} x2={cx} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />);

    // 网格线 (X 轴以 π/2 为刻度)
    const xMin = -10;
    const xMax = 10;
    for (let i = Math.floor(xMin / (PI / 2)); i <= Math.ceil(xMax / (PI / 2)); i++) {
      if (i === 0) continue;
      const mathX = i * (PI / 2);
      const screenPt = mathToScreen({ x: mathX, y: 0 }, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX });
      lines.push(
        <line key={`grid-x-${i}`} x1={screenPt.x} y1={0} x2={screenPt.x} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 4" />
      );
      // 添加刻度文本
      let label = '';
      if (i === 1) label = 'π/2';
      else if (i === -1) label = '-π/2';
      else if (i % 2 === 0) label = `${i / 2}π`;
      else label = `${i}π/2`;
      
      lines.push(
        <text key={`text-x-${i}`} x={screenPt.x} y={cy + 15} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">
          {label}
        </text>
      );
    }

    // Y轴整数刻度
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue;
      const screenPt = mathToScreen({ x: 0, y: i }, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX });
      lines.push(
        <line key={`grid-y-${i}`} x1={0} y1={screenPt.y} x2={CONTAINER_WIDTH} y2={screenPt.y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      );
      lines.push(
        <text key={`text-y-${i}`} x={cx + 5} y={screenPt.y + 4} fill="rgba(255,255,255,0.5)" fontSize="10">
          {i}
        </text>
      );
    }

    return lines;
  }, []);

  const period = omega === 0 ? '\\infty' : Math.abs((2 * PI) / omega).toFixed(2);
  const formattedPhi = formatAnglePi(phi);

  const leftPanel = (
    <div style={{ width: '100%', padding: '10px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#60a5fa' }}>参数控制区</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>函数类型</span>
          <select 
            value={funcType} 
            onChange={(e) => updateParam('funcType', e.target.value as 'sin' | 'cos')}
            style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px', padding: '2px 8px' }}
          >
            <option value="sin">y = sin(x)</option>
            <option value="cos">y = cos(x)</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>振幅 A: {A.toFixed(1)}</span>
        </label>
        <input type="range" min="0" max="4" step="0.1" value={A} onChange={(e) => updateParam('A', parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>频率 ω: {omega.toFixed(1)}</span>
        </label>
        <input type="range" min="-3" max="3" step="0.1" value={omega} onChange={(e) => updateParam('omega', parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>初相 φ: {phi.toFixed(2)}</span>
        </label>
        <input type="range" min={-PI} max={PI} step={PI/12} value={phi} onChange={(e) => updateParam('phi', parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>平移 b: {b.toFixed(1)}</span>
        </label>
        <input type="range" min="-3" max="3" step="0.1" value={b} onChange={(e) => updateParam('b', parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>
    </div>
  );

  const centerPanel = (
    <div style={{ background: '#0f172a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b', width: '100%', maxWidth: '600px', alignSelf: 'center' }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        style={{ display: 'block', backgroundColor: '#020617' }}
      >
        {/* 背景与坐标轴 */}
        {axes}
        
        {/* 函数波形 */}
        <path d={pathD} fill="none" stroke="#f472b6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  const rightPanel = (
    <div style={{ width: '100%', padding: '10px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#c084fc' }}>属性与解析式</h3>
      
      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>标准解析式</div>
        <BlockMath math={`y = A \\${funcType}(\\omega x + \\varphi) + b`} />
      </div>

      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>实时方程</div>
        <BlockMath math={`y = ${A.toFixed(1)}\\${funcType}(${omega.toFixed(1)}x ${phi >= 0 ? '+' : ''} ${formattedPhi}) ${b >= 0 ? '+' : ''} ${b.toFixed(1)}`} />
      </div>

      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>关键特征</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>周期 $T$</span>
            <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{omega === 0 ? '无' : period}</span>
          </li>
          <li style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>最大值 y_max</span>
            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{(b + Math.abs(A)).toFixed(1)}</span>
          </li>
          <li style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>最小值 y_min</span>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{(b - Math.abs(A)).toFixed(1)}</span>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />
  );
}
