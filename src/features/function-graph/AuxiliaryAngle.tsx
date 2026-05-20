import { useState, useMemo, useRef, useEffect } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { mathToScreen, screenToMath } from '@/utils/coordinate';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { Vector2 } from '@/types/math';

const PI = Math.PI;
const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 400;
const UNIT_PX = 30; // 1个数学单位 = 30px。X 轴半宽约 10 个单位 (约 3π)

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

export function AuxiliaryAngle() {
  // A 是 sin(x) 的振幅，B 是 cos(x) 的振幅
  const [A, setA] = useState<number>(3.0);
  const [B, setB] = useState<number>(4.0);
  // x 处的动点，默认 x = 1.0 (约 57.3 度)，范围 [-2π, 2π]
  const [currX, setCurrX] = useState<number>(1.0);

  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 计算辅助角合成参数
  const { C, phiRad, phiDeg } = useMemo(() => {
    const ampC = Math.sqrt(A * A + B * B);
    if (ampC < 0.001) {
      return { C: 0, phiRad: 0, phiDeg: 0 };
    }
    // 辅助角公式：A sin(x) + B cos(x) = C sin(x + φ)
    // 展开有 C sin(x + φ) = C(sin(x)cos(φ) + cos(x)sin(φ))
    // 对比系数：cos(φ) = A/C, sin(φ) = B/C
    // 因此 φ = atan2(B, A) 也就是以 (A, B) 为终边端点时的平面夹角。
    const rad = Math.atan2(B, A);
    let deg = (rad * 180) / PI;
    return { C: ampC, phiRad: rad, phiDeg: deg };
  }, [A, B]);

  // 生成三条曲线的 SVG 路径
  const { pathDSin, pathDCos, pathDComposite } = useMemo(() => {
    const pointsSin: Vector2[] = [];
    const pointsCos: Vector2[] = [];
    const pointsComp: Vector2[] = [];

    const xMin = -CONTAINER_WIDTH / 2 / UNIT_PX;
    const xMax = CONTAINER_WIDTH / 2 / UNIT_PX;
    const step = 0.05;

    for (let x = xMin; x <= xMax; x += step) {
      const ySin = A * Math.sin(x);
      const yCos = B * Math.cos(x);
      const yComp = ySin + yCos;

      const coordParams = { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX };
      pointsSin.push(mathToScreen({ x, y: ySin }, coordParams));
      pointsCos.push(mathToScreen({ x, y: yCos }, coordParams));
      pointsComp.push(mathToScreen({ x, y: yComp }, coordParams));
    }

    return {
      pathDSin: pointsSin.length ? 'M ' + pointsSin.map(p => `${p.x},${p.y}`).join(' L ') : '',
      pathDCos: pointsCos.length ? 'M ' + pointsCos.map(p => `${p.x},${p.y}`).join(' L ') : '',
      pathDComposite: pointsComp.length ? 'M ' + pointsComp.map(p => `${p.x},${p.y}`).join(' L ') : '',
    };
  }, [A, B]);

  // 生成坐标网格线
  const axesAndTicks = useMemo(() => {
    const elements = [];
    const cx = CONTAINER_WIDTH / 2;
    const cy = CONTAINER_HEIGHT / 2;

    // x 轴和 y 轴
    elements.push(
      <line key="axis-x" x1={0} y1={cy} x2={CONTAINER_WIDTH} y2={cy} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
    );
    elements.push(
      <line key="axis-y" x1={cx} y1={0} x2={cx} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
    );

    // X轴以 π/2 为刻度网格
    const xRange = CONTAINER_WIDTH / 2 / UNIT_PX;
    const piStep = PI / 2;
    const minStepIndex = Math.floor(-xRange / piStep);
    const maxStepIndex = Math.ceil(xRange / piStep);

    for (let i = minStepIndex; i <= maxStepIndex; i++) {
      if (i === 0) continue;
      const xMath = i * piStep;
      const screenPt = mathToScreen({ x: xMath, y: 0 }, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX });

      if (screenPt.x >= 0 && screenPt.x <= CONTAINER_WIDTH) {
        elements.push(
          <line
            key={`grid-x-${i}`}
            x1={screenPt.x}
            y1={0}
            x2={screenPt.x}
            y2={CONTAINER_HEIGHT}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        );

        let label = '';
        if (i === 1) label = 'π/2';
        else if (i === -1) label = '-π/2';
        else if (i % 2 === 0) label = `${i / 2}π`;
        else label = `${i}π/2`;

        elements.push(
          <text
            key={`label-x-${i}`}
            x={screenPt.x}
            y={cy + 15}
            fill="rgba(255,255,255,0.5)"
            fontSize="10"
            textAnchor="middle"
            style={{ userSelect: 'none' }}
          >
            {label}
          </text>
        );
      }
    }

    // Y轴整数刻度网格
    for (let yVal = -6; yVal <= 6; yVal++) {
      if (yVal === 0) continue;
      const screenPt = mathToScreen({ x: 0, y: yVal }, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX });
      if (screenPt.y >= 0 && screenPt.y <= CONTAINER_HEIGHT) {
        elements.push(
          <line
            key={`grid-y-${yVal}`}
            x1={0}
            y1={screenPt.y}
            x2={CONTAINER_WIDTH}
            y2={screenPt.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
        elements.push(
          <text
            key={`label-y-${yVal}`}
            x={cx - 15}
            y={screenPt.y + 4}
            fill="rgba(255,255,255,0.5)"
            fontSize="10"
            textAnchor="end"
            style={{ userSelect: 'none' }}
          >
            {yVal}
          </text>
        );
      }
    }

    return elements;
  }, []);

  // 动点坐标及屏幕坐标映射
  const curYSin = A * Math.sin(currX);
  const curYCos = B * Math.cos(currX);
  const curYComp = curYSin + curYCos;

  const coordParams = { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX };
  const ptZero = mathToScreen({ x: currX, y: 0 }, coordParams);
  const ptSin = mathToScreen({ x: currX, y: curYSin }, coordParams);
  const ptCos = mathToScreen({ x: currX, y: curYCos }, coordParams);
  const ptComp = mathToScreen({ x: currX, y: curYComp }, coordParams);

  // 在画布上实现拖拽 X 坐标
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateXFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateXFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateXFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    // 映射回数学坐标
    const mathPt = screenToMath({ x: clientX, y: CONTAINER_HEIGHT / 2 }, coordParams);
    // 限制在 [-2π, 2π] 范围内
    const clampedX = Math.max(-2 * PI, Math.min(2 * PI, mathPt.x));
    setCurrX(clampedX);
  };

  // 快捷参数设置
  const setPreset = (ampA: number, ampB: number) => {
    setA(ampA);
    setB(ampB);
  };

  // 左侧操作栏组件
  const leftPanel = (
    <div style={styles.sidebar}>
      <h3 style={styles.panelTitle}>辅助角参数控制器</h3>
      
      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>正弦波振幅 A:</span>
          <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{A.toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="-4" 
          max="4" 
          step="0.1" 
          value={A} 
          onChange={(e) => setA(parseFloat(e.target.value))} 
          style={styles.rangeInput}
        />
        <div style={styles.funcFormula}>
          y₁ = {A.toFixed(1)} sin(x)
        </div>
      </div>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>余弦波振幅 B:</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{B.toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="-4" 
          max="4" 
          step="0.1" 
          value={B} 
          onChange={(e) => setB(parseFloat(e.target.value))} 
          style={styles.rangeInput}
        />
        <div style={styles.funcFormula}>
          y₂ = {B.toFixed(1)} cos(x)
        </div>
      </div>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>当前观察点 x:</span>
          <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{currX.toFixed(2)} rad</span>
        </div>
        <input 
          type="range" 
          min={-2 * PI} 
          max={2 * PI} 
          step="0.02" 
          value={currX} 
          onChange={(e) => setCurrX(parseFloat(e.target.value))} 
          style={styles.rangeInput}
        />
        <div style={{ ...styles.funcFormula, color: '#94a3b8' }}>
          约 {((currX * 180) / PI).toFixed(1)}°
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ ...styles.labelRow, fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>经典勾股与辅助角预设</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button onClick={() => setPreset(3.0, 4.0)} style={styles.presetButton}>
            A=3, B=4 (φ≈53.1°)
          </button>
          <button onClick={() => setPreset(1.0, 1.732)} style={styles.presetButton}>
            A=1, B=√3 (φ=60°)
          </button>
          <button onClick={() => setPreset(2.0, -2.0)} style={styles.presetButton}>
            A=2, B=-2 (φ=-45°)
          </button>
          <button onClick={() => setPreset(1.732, 1.0)} style={styles.presetButton}>
            A=√3, B=1 (φ=30°)
          </button>
        </div>
      </div>
    </div>
  );

  // 中间绘图区域组件
  const centerPanel = (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasHeader}>
        <span style={styles.canvasTitle}>波形叠加与物理振动联动面</span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>支持在画面上直接左右拖拽观察垂线</span>
      </div>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block', backgroundColor: '#020617', cursor: 'ew-resize', touchAction: 'none' }}
      >
        {/* 定义发光滤镜和箭头标记 */}
        <defs>
          <filter id="glow-composite" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <marker id="arrow-violet" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 Z" fill="#a78bfa" />
          </marker>
          <marker id="arrow-sky" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 Z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* 坐标轴与网格 */}
        {axesAndTicks}
        
        {/* 正弦波 (y1) 路径 */}
        <path d={pathDSin} fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.6} />
        {/* 余弦波 (y2) 路径 */}
        <path d={pathDCos} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.6} />
        {/* 合成波 (y3) 路径 */}
        <path 
          d={pathDComposite} 
          fill="none" 
          stroke="#fb923c" 
          strokeWidth={3} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter="url(#glow-composite)"
        />

        {/* 动点观察垂线 */}
        <line x1={ptZero.x} y1={0} x2={ptZero.x} y2={CONTAINER_HEIGHT} stroke="rgba(239, 68, 68, 0.4)" strokeWidth={1.5} strokeDasharray="5 3" />
        
        {/* 高度代数叠加几何表达 */}
        {/* 1. y1 虚线及箭头段 (从原点 x_zero 变动到 y1) */}
        <line 
          x1={ptZero.x} 
          y1={ptZero.y} 
          x2={ptSin.x} 
          y2={ptSin.y} 
          stroke="#a78bfa" 
          strokeWidth={2} 
          markerEnd="url(#arrow-violet)" 
        />
        {/* 2. y2 虚线及箭头段 (起自 y1 连点，长度和方向等于 y2，终止于 y3(comp) ) */}
        <line 
          x1={ptSin.x} 
          y1={ptSin.y} 
          x2={ptComp.x} 
          y2={ptComp.y} 
          stroke="#38bdf8" 
          strokeWidth={2} 
          markerEnd="url(#arrow-sky)" 
        />

        {/* 动点圆圈 */}
        {/* 正弦点 */}
        <circle cx={ptSin.x} cy={ptSin.y} r={5} fill="#a78bfa" stroke="#ffffff" strokeWidth={1.5} />
        {/* 余弦点 */}
        <circle cx={ptCos.x} cy={ptCos.y} r={5} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} />
        {/* 合成点 */}
        <circle cx={ptComp.x} cy={ptComp.y} r={6} fill="#fb923c" stroke="#ffffff" strokeWidth={2} />
        
        {/* 刻度及当前x轴位置指示器 */}
        <circle cx={ptZero.x} cy={ptZero.y} r={4} fill="#ef4444" />
      </svg>
      <div style={styles.legendContainer}>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#a78bfa' }} />y₁ = {A.toFixed(1)}sin(x)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#38bdf8' }} />y₂ = {B.toFixed(1)}cos(x)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#fb923c' }} />y₃ = y₁ + y₂ (合成波)</div>
      </div>
    </div>
  );

  // 右侧极坐标圆及 LaTeX 看板组件
  const rightPanel = (
    <div style={styles.sidebar}>
      <h3 style={{ ...styles.panelTitle, color: '#c084fc' }}>解析与几何解释</h3>

      {/* 实时方程看板 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>实时公式 (LaTeX)</div>
        <div style={{ overflowX: 'auto', padding: '8px 0' }}>
          <BlockMath 
            math={`y_3 = ${A.toFixed(2)}\\sin x ${B >= 0 ? '+' : ''} ${B.toFixed(2)}\\cos x`} 
          />
          <div style={{ textAlign: 'center', margin: '4px 0', color: '#94a3b8', fontSize: '13px' }}>化简为单一正弦型：</div>
          <BlockMath 
            math={`= ${C.toFixed(2)}\\sin(x ${phiRad >= 0 ? '+' : ''} ${phiRad.toFixed(2)})`} 
          />
        </div>
      </div>

      {/* 高度累加明细 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>在 x = {currX.toFixed(2)} 处的代数叠加</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a78bfa' }}>分量 y₁ = A sin(x)</span>
            <span>{curYSin.toFixed(3)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#38bdf8' }}>分量 y₂ = B cos(x)</span>
            <span>{curYCos.toFixed(3)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span style={{ color: '#fb923c' }}>合成 y₃ = y₁ + y₂</span>
            <span>{curYComp.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* (A, B) 终边几何圆可视化 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>辅助角 φ 几何意义解释</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
          <svg 
            width={160} 
            height={160} 
            viewBox="0 0 160 160" 
            style={{ backgroundColor: '#020617', borderRadius: '50%', border: '1px solid #334155' }}
          >
            {/* 极坐标网格 */}
            <circle cx={80} cy={80} r={70} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <circle cx={80} cy={80} r={40} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            
            {/* 坐标轴 */}
            <line x1={5} y1={80} x2={155} y2={80} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <line x1={80} y1={5} x2={80} y2={155} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            
            {/* X、Y轴标签 */}
            <text x={148} y={88} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">A</text>
            <text x={88} y={12} fill="rgba(255,255,255,0.4)" fontSize="9">B</text>

            {/* 当 C > 0 时绘制辅助线与终边 */}
            {C > 0.001 && (() => {
              // 极径的缩放因子：将最大振幅 5.5 映射到 70px 半径内。1单位 = 12px
              const scale = 12;
              const targetX = 80 + A * scale;
              // 屏幕Y轴是翻转的：数学Y轴向上，对应屏幕上Y减小
              const targetY = 80 - B * scale;

              // 绘制从原点向 (A, B) 指向的辅助直角三角形
              // 1. 直角边 A (沿横轴)
              // 2. 直角边 B (沿纵向)
              return (
                <>
                  {/* 直角三角形虚线 */}
                  <line x1={80} y1={80} x2={targetX} y2={80} stroke="rgba(167, 139, 250, 0.4)" strokeWidth={1} strokeDasharray="2 2" />
                  <line x1={targetX} y1={80} x2={targetX} y2={targetY} stroke="rgba(56, 189, 248, 0.4)" strokeWidth={1} strokeDasharray="2 2" />

                  {/* 终边 C */}
                  <line x1={80} y1={80} x2={targetX} y2={targetY} stroke="#fb923c" strokeWidth={2} />
                  
                  {/* 动点 (A, B) */}
                  <circle cx={targetX} cy={targetY} r={4.5} fill="#fb923c" stroke="#ffffff" strokeWidth={1.2} />

                  {/* 角度弧线 (使用 SVG Arc 绘制) */}
                  {(() => {
                    const radiusArc = 20;
                    // phiRad 介于 [-PI, PI]
                    // 计算弧线起点 (X 轴正方向) 和终点 (phi 方向)
                    const arcStartX = 80 + radiusArc;
                    const arcStartY = 80;
                    const arcEndX = 80 + radiusArc * Math.cos(phiRad);
                    const arcEndY = 80 - radiusArc * Math.sin(phiRad); // 屏幕坐标Y轴翻转

                    // SVG large-arc-flag 和 sweep-flag
                    // sweep-flag = 0 逆时针(即数学正方向)，1 顺时针
                    // 因为屏幕坐标系 Y 轴向下，所以在屏幕坐标系中：
                    // 当 phiRad > 0 时，角度向上旋转，对应 SVG 的逆时针(sweep-flag = 0)。
                    // 实际上为了在屏幕上完美画弧，可用角度公式：
                    const isLargeArc = 0;
                    const sweepFlag = phiRad >= 0 ? 0 : 1; // 顺时针或逆时针

                    return (
                      <path
                        d={`M ${arcStartX} ${arcStartY} A ${radiusArc} ${radiusArc} 0 ${isLargeArc} ${sweepFlag} ${arcEndX} ${arcEndY}`}
                        fill="none"
                        stroke="#fb7185"
                        strokeWidth={1.5}
                      />
                    );
                  })()}
                </>
              );
            })()}
            
            {/* 原点中心点 */}
            <circle cx={80} cy={80} r={2.5} fill="#ffffff" />
          </svg>
          
          <div style={{ marginTop: '12px', fontSize: '13px', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>终边端点 (A, B):</span>
              <span style={{ fontWeight: 'bold', color: '#a78bfa' }}>({A.toFixed(1)}, {B.toFixed(1)})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>合成波幅 C = √A²+B²:</span>
              <span style={{ fontWeight: 'bold', color: '#fb923c' }}>{C.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>辅助角 φ = atan2(B, A):</span>
              <span style={{ fontWeight: 'bold', color: '#fb7185' }}>
                {phiDeg.toFixed(1)}° ({phiRad.toFixed(2)} rad)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />
  );
}

// 内联样式定义
const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#60a5fa',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '8px',
  },
  controlGroup: {
    marginBottom: '16px',
    backgroundColor: '#111827',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #1e293b',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#f1f5f9',
  },
  rangeInput: {
    width: '100%',
    cursor: 'pointer',
    margin: '8px 0',
  },
  funcFormula: {
    fontSize: '11px',
    color: '#a78bfa',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  presetButton: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '6px 4px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  canvasContainer: {
    background: '#0f172a',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #1e293b',
    width: '100%',
    maxWidth: '600px',
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  canvasHeader: {
    padding: '10px 14px',
    backgroundColor: '#020617',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canvasTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  legendContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    padding: '8px',
    backgroundColor: '#020617',
    borderTop: '1px solid #1e293b',
    fontSize: '11px',
    color: '#64748b',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #334155',
  },
  cardHeader: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
