import { useState, useMemo, useRef } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { mathToScreen } from '@/utils/coordinate';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { Vector2 } from '@/types/math';

const PI = Math.PI;
const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 360;

export function DoubleAnglePowerReduction() {
  // 当前观察点 x, 范围限制在 [0, PI] 便于几何圆展示
  const [currX, setCurrX] = useState<number>(PI / 6); // 30度起手

  // 实验类型：'sin2' (二倍角正弦) | 'cos2' (二倍角余弦) | 'sinSq' (正弦降次) | 'cosSq' (余弦降次)
  const [expType, setExpType] = useState<'sin2' | 'cos2' | 'sinSq' | 'cosSq'>('sinSq');

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<'geom' | 'wave' | null>(null);

  // ─────────────────────────────────────────────
  // § 坐标系映射定义
  // ─────────────────────────────────────────────
  // 1. 左侧几何圆：原点在像素 (150, 180)，单位半径 100px
  const geomParams = { width: 300, height: 360, unitPx: 100 };
  const ptGeomCenter = { x: 150, y: 180 };

  // 2. 右侧波形图：X轴 [-1.5π, 1.5π] 映射到 [320, 580]，Y轴 [-1.5, 1.5] 映射到 [60, 300]
  const waveCx = 450;
  const waveCy = 180;
  const waveScaleX = 260 / (3 * PI); // 260px 对应 3π 宽度
  const waveScaleY = 80;  // 80px 对应 1 个数学单位高度

  const mathToScreenWave = (x: number, y: number): Vector2 => {
    return {
      x: waveCx + x * waveScaleX,
      y: waveCy - y * waveScaleY,
    };
  };

  const screenToMathWave = (px: number, py: number): Vector2 => {
    return {
      x: (px - waveCx) / waveScaleX,
      y: (waveCy - py) / waveScaleY,
    };
  };

  // ─────────────────────────────────────────────
  // § 数学几何量计算
  // ─────────────────────────────────────────────
  const cosX = Math.cos(currX);
  const sinX = Math.sin(currX);
  const cos2X = Math.cos(2 * currX);
  const sin2X = Math.sin(2 * currX);

  // 几何圆上各关键点的数学坐标 (以几何圆心为原点)
  const U = { x: cosX, y: sinX };     // 基准角 x 终边点
  const W = { x: cos2X, y: sin2X };   // 倍角 2x 终边点
  const A = { x: 1, y: 0 };           // (1, 0) 正向端点
  const B = { x: -1, y: 0 };          // (-1, 0) 负向端点

  // H 是弦 AW 的中点 (同时是 O 到 AW 的垂足)
  const H = { x: (1 + cos2X) / 2, y: sin2X / 2 };

  // W 在 X 轴的投影
  const Wx = { x: cos2X, y: 0 };

  // 转换为几何圆屏幕像素坐标
  const pxCenter = ptGeomCenter;
  const pxU = mathToScreen(U, geomParams);
  const pxW = mathToScreen(W, geomParams);
  const pxA = mathToScreen(A, geomParams);
  const pxB = mathToScreen(B, geomParams);
  const pxH = mathToScreen(H, geomParams);
  const pxWx = mathToScreen(Wx, geomParams);

  // ─────────────────────────────────────────────
  // § 绘图曲线路径生成
  // ─────────────────────────────────────────────
  const { pathDOriginal, pathDTransformed, labelOriginal, labelTransformed, formulaLatex } = useMemo(() => {
    const pointsOrig: Vector2[] = [];
    const pointsTrans: Vector2[] = [];

    const xMin = -1.5 * PI;
    const xMax = 1.5 * PI;
    const step = 0.05;

    let origFunc = (_x: number) => 0;
    let transFunc = (_x: number) => 0;
    let lblOrig = '';
    let lblTrans = '';
    let formula = '';

    switch (expType) {
      case 'sin2':
        origFunc = (x) => Math.sin(2 * x);
        transFunc = (x) => 2 * Math.sin(x) * Math.cos(x);
        lblOrig = 'y = sin(2x)';
        lblTrans = 'y = 2 sin(x)cos(x)';
        formula = '\\sin(2x) = 2\\sin x \\cos x';
        break;
      case 'cos2':
        origFunc = (x) => Math.cos(2 * x);
        transFunc = (x) => Math.cos(x) * Math.cos(x) - Math.sin(x) * Math.sin(x);
        lblOrig = 'y = cos(2x)';
        lblTrans = 'y = cos²x - sin²x';
        formula = '\\cos(2x) = \\cos^2 x - \\sin^2 x';
        break;
      case 'sinSq':
        origFunc = (x) => Math.sin(x) * Math.sin(x);
        transFunc = (x) => (1 - Math.cos(2 * x)) / 2;
        lblOrig = 'y = sin²x';
        lblTrans = 'y = \\frac{1 - \\cos 2x}{2}';
        formula = '\\sin^2 x = \\frac{1 - \\cos(2x)}{2}';
        break;
      case 'cosSq':
        origFunc = (x) => Math.cos(x) * Math.cos(x);
        transFunc = (x) => (1 + Math.cos(2 * x)) / 2;
        lblOrig = 'y = cos²x';
        lblTrans = 'y = \\frac{1 + \\cos 2x}{2}';
        formula = '\\cos^2 x = \\frac{1 + \\cos(2x)}{2}';
        break;
    }

    for (let x = xMin; x <= xMax; x += step) {
      pointsOrig.push(mathToScreenWave(x, origFunc(x)));
      pointsTrans.push(mathToScreenWave(x, transFunc(x)));
    }

    return {
      pathDOriginal: pointsOrig.length ? 'M ' + pointsOrig.map(p => `${p.x},${p.y}`).join(' L ') : '',
      pathDTransformed: pointsTrans.length ? 'M ' + pointsTrans.map(p => `${p.x},${p.y}`).join(' L ') : '',
      labelOriginal: lblOrig,
      labelTransformed: lblTrans,
      formulaLatex: formula,
    };
  }, [expType]);

  // 波形图在当前 x 的数值
  const { origY, transY } = useMemo(() => {
    let orig = 0;
    let trans = 0;
    switch (expType) {
      case 'sin2':
        orig = Math.sin(2 * currX);
        trans = 2 * Math.sin(currX) * Math.cos(currX);
        break;
      case 'cos2':
        orig = Math.cos(2 * currX);
        trans = Math.cos(currX) * Math.cos(currX) - Math.sin(currX) * Math.sin(currX);
        break;
      case 'sinSq':
        orig = Math.sin(currX) * Math.sin(currX);
        trans = (1 - Math.cos(2 * currX)) / 2;
        break;
      case 'cosSq':
        orig = Math.cos(currX) * Math.cos(currX);
        trans = (1 + Math.cos(2 * currX)) / 2;
        break;
    }
    return { origY: orig, transY: trans };
  }, [currX, expType]);

  const ptWaveZero = mathToScreenWave(currX, 0);
  const ptWavePoint = mathToScreenWave(currX, origY);

  // ─────────────────────────────────────────────
  // § 手势交互
  // ─────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    // 点击左侧 [0, 300] 区域为几何圆拖拽
    if (clientX <= 300) {
      setDragTarget('geom');
    } else {
      setDragTarget('wave');
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    updateXFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragTarget) return;
    updateXFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setDragTarget(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateXFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (dragTarget === 'geom' || (dragTarget === null && clientX <= 300)) {
      // 几何圆拖动：计算相对几何圆心的方向角
      const dx = clientX - ptGeomCenter.x;
      const dy = ptGeomCenter.y - clientY; // y轴向上为正
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * PI;
      // 限制在 [0, PI] 使其在单位圆上半圆移动，避免几何重叠困扰
      const clampedAngle = Math.max(0, Math.min(PI, angle));
      setCurrX(clampedAngle);
    } else {
      // 波形图拖动
      const mathPt = screenToMathWave(clientX, clientY);
      const clampedX = Math.max(-1.5 * PI, Math.min(1.5 * PI, mathPt.x));
      // 为方便几何对照，将波形图拖动产生的 x 映射回 [0, PI]
      let normalizedX = clampedX;
      while (normalizedX < 0) normalizedX += PI;
      while (normalizedX > PI) normalizedX -= PI;
      setCurrX(normalizedX);
    }
  };

  // ─────────────────────────────────────────────
  // § UI 渲染 - 左侧控制区
  // ─────────────────────────────────────────────
  const leftPanel = (
    <div style={styles.sidebar}>
      <h3 style={styles.panelTitle}>几何与图像对照控制</h3>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>实验模式:</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <button
            onClick={() => setExpType('sin2')}
            style={{
              ...styles.presetButton,
              backgroundColor: expType === 'sin2' ? '#6366f1' : '#1e293b',
              borderColor: expType === 'sin2' ? '#818cf8' : '#334155',
            }}
          >
            二倍角正弦 (sin 2x) 几何推导
          </button>
          <button
            onClick={() => setExpType('sinSq')}
            style={{
              ...styles.presetButton,
              backgroundColor: expType === 'sinSq' ? '#6366f1' : '#1e293b',
              borderColor: expType === 'sinSq' ? '#818cf8' : '#334155',
            }}
          >
            正弦平方降次 勾股推导
          </button>
          <button
            onClick={() => setExpType('cosSq')}
            style={{
              ...styles.presetButton,
              backgroundColor: expType === 'cosSq' ? '#6366f1' : '#1e293b',
              borderColor: expType === 'cosSq' ? '#818cf8' : '#334155',
            }}
          >
            余弦平方降次 勾股推导
          </button>
        </div>
      </div>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>自变量 x 角度:</span>
          <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{((currX * 180) / PI).toFixed(1)}°</span>
        </div>
        <input
          type="range"
          min="0.05"
          max={PI - 0.05}
          step="0.02"
          value={currX}
          onChange={(e) => setCurrX(parseFloat(e.target.value))}
          style={styles.rangeInput}
        />
        <div style={{ ...styles.funcFormula, color: '#94a3b8' }}>
          倍角 2x = {((currX * 360) / PI).toFixed(1)}°
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ ...styles.labelRow, fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
          特殊角度对照
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button onClick={() => setCurrX(PI / 6)} style={styles.presetButton}>
            x = 30° (2x = 60°)
          </button>
          <button onClick={() => setCurrX(PI / 4)} style={styles.presetButton}>
            x = 45° (2x = 90°)
          </button>
          <button onClick={() => setCurrX(PI / 3)} style={styles.presetButton}>
            x = 60° (2x = 120°)
          </button>
          <button onClick={() => setCurrX(PI / 2.5)} style={styles.presetButton}>
            x = 72° (2x = 144°)
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // § UI 渲染 - 中间画布（双联动：左几何圆，右波形图）
  // ─────────────────────────────────────────────
  const centerPanel = (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasHeader}>
        <span style={styles.canvasTitle}>【双联动】左：几何推导圆  |  右：恒等图象对照</span>
        <span style={{ fontSize: '11px', color: '#a78bfa' }}>拖拽 U 点或波形图以联动</span>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block', backgroundColor: '#020617', touchAction: 'none' }}
      >
        <defs>
          <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 分割线 */}
        <line x1={300} y1={0} x2={300} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="5 5" />

        {/* ================================================================= */}
        {/* § 左侧：几何推导圆 (X: 0~300) */}
        {/* ================================================================= */}
        <g>
          {/* 几何原点与基准线 */}
          <line x1={50} y1={ptGeomCenter.y} x2={250} y2={ptGeomCenter.y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          <line x1={pxCenter.x} y1={80} x2={pxCenter.x} y2={280} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          
          {/* 单位圆 */}
          <circle cx={pxCenter.x} cy={pxCenter.y} r={geomParams.unitPx} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />

          {/* 终边 U (角 x) — 蓝色 */}
          <line x1={pxCenter.x} y1={pxCenter.y} x2={pxU.x} y2={pxU.y} stroke="#38bdf8" strokeWidth={2} />
          <text x={pxU.x + 8} y={pxU.y - 4} fill="#38bdf8" fontSize="10" fontWeight="bold">U (x)</text>

          {/* 终边 W (角 2x) — 橙色 */}
          <line x1={pxCenter.x} y1={pxCenter.y} x2={pxW.x} y2={pxW.y} stroke="#fb923c" strokeWidth={2} />
          <text x={pxW.x - 16} y={pxW.y - 8} fill="#fb923c" fontSize="10" fontWeight="bold">W (2x)</text>

          {/* 二倍角正弦几何解释：等腰三角形 OAW 分解面积法 */}
          {expType === 'sin2' && (
            <>
              {/* 三角形 OAW 弦 AW (绿色，半弦高 sin x) */}
              <line x1={pxA.x} y1={pxA.y} x2={pxW.x} y2={pxW.y} stroke="#22c55e" strokeWidth={2} />
              
              {/* 高线 OH (蓝色虚线，长度 cos x) */}
              <line x1={pxCenter.x} y1={pxCenter.y} x2={pxH.x} y2={pxH.y} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3" />
              <circle cx={pxH.x} cy={pxH.y} r={2} fill="#38bdf8" />
              
              {/* 高线标注 */}
              <text x={(pxCenter.x + pxH.x) / 2 + 10} y={(pxCenter.y + pxH.y) / 2 + 12} fill="#38bdf8" fontSize="9">cos x</text>
              <text x={(pxA.x + pxH.x) / 2 + 6} y={(pxA.y + pxH.y) / 2 - 6} fill="#22c55e" fontSize="9">sin x</text>
              <text x={(pxW.x + pxH.x) / 2 - 12} y={(pxW.y + pxH.y) / 2 - 6} fill="#22c55e" fontSize="9">sin x</text>

              {/* 纵坐标 W_y (sin 2x) */}
              <line x1={pxW.x} y1={pxW.y} x2={pxWx.x} y2={pxWx.y} stroke="#c084fc" strokeWidth={2} strokeDasharray="2 2" />
              <text x={pxWx.x - 8} y={(pxW.y + pxWx.y) / 2} fill="#c084fc" fontSize="9" textAnchor="end">sin 2x</text>
            </>
          )}

          {/* 降次公式几何解释：弦长平方勾股法 */}
          {(expType === 'sinSq' || expType === 'cosSq') && (
            <>
              {/* W 在横轴的投影 Wx */}
              <line x1={pxW.x} y1={pxW.y} x2={pxWx.x} y2={pxWx.y} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" />
              
              {expType === 'sinSq' ? (
                <>
                  {/* 正弦降次：关注弦 AW (绿色，长度 2 sin x) */}
                  <line x1={pxA.x} y1={pxA.y} x2={pxW.x} y2={pxW.y} stroke="#22c55e" strokeWidth={2.5} />
                  
                  {/* 横轴投影线段 Wx -> A (红色，长度 1 - cos 2x) */}
                  <line x1={pxWx.x} y1={pxWx.y} x2={pxA.x} y2={pxA.y} stroke="#f43f5e" strokeWidth={3} />
                  
                  <text x={(pxWx.x + pxA.x) / 2} y={pxA.y + 14} fill="#f43f5e" fontSize="9" textAnchor="middle">1 - cos 2x</text>
                  <text x={(pxA.x + pxW.x) / 2 + 10} y={(pxA.y + pxW.y) / 2 - 10} fill="#22c55e" fontSize="9">弦长=2sin x</text>
                </>
              ) : (
                <>
                  {/* 余弦降次：关注负半轴端点 B (-1, 0) 与 W 的弦 BW (绿色，长度 2 cos x) */}
                  <line x1={pxB.x} y1={pxB.y} x2={pxW.x} y2={pxW.y} stroke="#22c55e" strokeWidth={2.5} />
                  
                  {/* 横轴投影线段 B -> Wx (红色，长度 1 + cos 2x) */}
                  <line x1={pxB.x} y1={pxB.y} x2={pxWx.x} y2={pxWx.y} stroke="#f43f5e" strokeWidth={3} />
                  
                  <text x={(pxB.x + pxWx.x) / 2} y={pxB.y + 14} fill="#f43f5e" fontSize="9" textAnchor="middle">1 + cos 2x</text>
                  <text x={(pxB.x + pxW.x) / 2 - 10} y={(pxB.y + pxW.y) / 2 - 10} fill="#22c55e" fontSize="9">弦长=2cos x</text>
                </>
              )}
            </>
          )}

          {/* 控制球 */}
          <circle cx={pxU.x} cy={pxU.y} r={7} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} style={{ cursor: 'pointer' }} />
          <circle cx={pxW.x} cy={pxW.y} r={4.5} fill="#fb923c" />
          <circle cx={pxCenter.x} cy={pxCenter.y} r={3.5} fill="#ffffff" />
        </g>

        {/* ================================================================= */}
        {/* § 右侧：波形图对照 (X: 300~600) */}
        {/* ================================================================= */}
        <g>
          {/* 右轴 X 轴与 Y 轴 */}
          <line x1={320} y1={waveCy} x2={580} y2={waveCy} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
          <line x1={waveCx} y1={20} x2={waveCx} y2={340} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />

          {/* X 轴刻度 -π, 0, π */}
          {[-PI, PI].map((xVal, idx) => {
            const pt = mathToScreenWave(xVal, 0);
            return (
              <g key={`w-tick-${idx}`}>
                <line x1={pt.x} y1={waveCy - 4} x2={pt.x} y2={waveCy + 4} stroke="rgba(255,255,255,0.5)" />
                <text x={pt.x} y={waveCy + 15} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
                  {xVal < 0 ? '-π' : 'π'}
                </text>
              </g>
            );
          })}

          {/* 曲线 1: 代数原形 (绿色细实线) */}
          <path d={pathDOriginal} fill="none" stroke="#22c55e" strokeWidth={1.5} opacity={0.6} />

          {/* 曲线 2: 恒等变换式 (橙色粗虚线) — 物理/数学完美重合 */}
          <path
            d={pathDTransformed}
            fill="none"
            stroke="#fb923c"
            strokeWidth={3}
            strokeDasharray="5 3"
            strokeLinecap="round"
            filter="url(#glow-orange)"
          />

          {/* 右侧观察垂线与焦点 */}
          <line x1={ptWaveZero.x} y1={20} x2={ptWaveZero.x} y2={340} stroke="rgba(239, 68, 68, 0.4)" strokeWidth={1.5} strokeDasharray="3 3" />
          <circle cx={ptWavePoint.x} cy={ptWavePoint.y} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.2} />
        </g>
      </svg>

      <div style={styles.legendContainer}>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#38bdf8' }} />单角 U(x)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#fb923c' }} />倍角 W(2x)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#22c55e' }} />代数原形</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#f43f5e' }} />投影推导段</div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // § UI 渲染 - 右侧解析与几何公式推导
  // ─────────────────────────────────────────────
  const rightPanel = (
    <div style={styles.sidebar}>
      <h3 style={{ ...styles.panelTitle, color: '#22c55e' }}>几何直觉推导说明</h3>

      {/* LaTeX 公式展示 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>变换公式</div>
        <div style={{ overflowX: 'auto', padding: '6px 0' }}>
          <BlockMath math={formulaLatex} />
        </div>
      </div>

      {/* 数值校验 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>实时值对照 (当前 x = {currX.toFixed(2)})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#22c55e' }}>{labelOriginal}:</span>
            <span style={{ fontWeight: 'bold' }}>{origY.toFixed(4)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb923c' }}>
            <span>{labelTransformed}:</span>
            <span style={{ fontWeight: 'bold' }}>{transY.toFixed(4)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '4px 0' }} />
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
            两波形在全定义域完全重叠，误差几乎为零。
          </div>
        </div>
      </div>

      {/* 核心几何与物理解释 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>几何原理推导看板</div>
        <div style={{ fontSize: '12px', lineHeight: '1.6em', color: '#cbd5e1' }}>
          {expType === 'sin2' ? (
            <div>
              <strong>二倍角正弦的面积法推导：</strong>
              <div style={{ margin: '6px 0' }}>
                等腰三角形 <InlineMath math="OAW" /> 中，顶角为 <InlineMath math="2x" />，腰长为 1：
                <ul style={{ paddingLeft: '14px', marginTop: '4px' }}>
                  <li>若以 <InlineMath math="OW" /> 为底，则高线为 <InlineMath math="AH + HW = 2\sin x" /> 乘以 <InlineMath math="OH = \cos x" />，面积为 <InlineMath math="\sin x \cos x" />。</li>
                  <li>若以 <InlineMath math="OA" /> 为底，高线为 <InlineMath math="W" /> 的纵坐标 <InlineMath math="\sin 2x" />，面积为 <InlineMath math="\frac{1}{2}\sin 2x" />。</li>
                </ul>
                由此可得：
                <InlineMath math="\sin 2x = 2\sin x\cos x" />。
              </div>
            </div>
          ) : (
            <div>
              <strong>平方降次公式的勾股弦长推导：</strong>
              <div style={{ margin: '6px 0' }}>
                {expType === 'sinSq' ? (
                  <div>
                    在直角三角形 <InlineMath math="W W_x A" /> 中，斜边是弦线 <InlineMath math="AW = 2\sin x" />：
                    <ul style={{ paddingLeft: '14px', marginTop: '4px' }}>
                      <li>直角边分别等于 <InlineMath math="\sin 2x" /> 和 <InlineMath math="1 - \cos 2x" />。</li>
                      <li>利用勾股定理：<InlineMath math="AW^2 = (W W_x)^2 + (W_x A)^2" />，展开得 <InlineMath math="4\sin^2 x = 2(1 - \cos 2x)" />。</li>
                    </ul>
                    变形即可得：
                    <InlineMath math="\sin^2 x = \frac{1-\cos 2x}{2}" />。
                  </div>
                ) : (
                  <div>
                    在以负半轴端点 <InlineMath math="B(-1,0)" /> 组成的直角三角形中，斜边为弦 <InlineMath math="BW = 2\cos x" />：
                    <ul style={{ paddingLeft: '14px', marginTop: '4px' }}>
                      <li>利用直角三角形 <InlineMath math="W W_x B" /> 勾股定理：展开得 <InlineMath math="4\cos^2 x = 2(1 + \cos 2x)" />。</li>
                    </ul>
                    变形可得余弦降次公式：
                    <InlineMath math="\cos^2 x = \frac{1+\cos 2x}{2}" />。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />;
}

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
    fontStyle: 'italic',
    textAlign: 'right',
  },
  presetButton: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 6px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    width: '100%',
    textAlign: 'center',
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
    flexWrap: 'wrap',
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
