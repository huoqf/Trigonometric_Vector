import { useState, useMemo, useRef } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { mathToScreen, screenToMath } from '@/utils/coordinate';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { Vector2 } from '@/types/math';

const PI = Math.PI;
const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 400;
const UNIT_PX = 30; // 1个数学单位 = 30px

// 辅助函数：计算两点间距离
function distance(p1: Vector2, p2: Vector2): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// 辅助函数：绘制内角圆弧路径及文字位置
interface AngleArcInfo {
  pathD: string;
  textPt: Vector2;
}
function computeAngleArc(
  vertex: Vector2,
  pNext1: Vector2,
  pNext2: Vector2,
  radius: number = 22
): AngleArcInfo {
  // 计算顶点在屏幕像素空间下的邻边方向角
  const theta1 = Math.atan2(pNext1.y - vertex.y, pNext1.x - vertex.x);
  const theta2 = Math.atan2(pNext2.y - vertex.y, pNext2.x - vertex.x);

  // 计算角度差值并规范化到 [-PI, PI]
  let diff = (theta2 - theta1) % (2 * Math.PI);
  if (diff < -Math.PI) diff += 2 * Math.PI;
  if (diff > Math.PI) diff -= 2 * Math.PI;

  const x1 = vertex.x + radius * Math.cos(theta1);
  const y1 = vertex.y + radius * Math.sin(theta1);
  const x2 = vertex.x + radius * Math.cos(theta2);
  const y2 = vertex.y + radius * Math.sin(theta2);

  const sweep = diff > 0 ? 1 : 0;
  const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweep} ${x2} ${y2}`;

  // 角度文字的位置 (放在角平分线方向，再往外偏一点)
  const thetaText = theta1 + diff / 2;
  const textPt = {
    x: vertex.x + (radius + 15) * Math.cos(thetaText),
    y: vertex.y + (radius + 15) * Math.sin(thetaText),
  };

  return { pathD, textPt };
}

export function SolvingTriangle() {
  // 三角形三个顶点的数学坐标
  const [ptA, setPtA] = useState<Vector2>({ x: -1.0, y: 4.0 });
  const [ptB, setPtB] = useState<Vector2>({ x: -4.0, y: -2.0 });
  const [ptC, setPtC] = useState<Vector2>({ x: 4.0, y: -2.0 });

  // 交互控制
  const [showCircumcircle, setShowCircumcircle] = useState<boolean>(true);
  const [showAngleArcs, setShowAngleArcs] = useState<boolean>(true);
  const [theoremMode, setTheoremMode] = useState<'sine' | 'cosine'>('sine');

  // 正在拖拽的顶点
  const [draggedVertex, setDraggedVertex] = useState<'A' | 'B' | 'C' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 坐标参数
  const coordParams = { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX };

  // 屏幕坐标点映射
  const pxA = useMemo(() => mathToScreen(ptA, coordParams), [ptA]);
  const pxB = useMemo(() => mathToScreen(ptB, coordParams), [ptB]);
  const pxC = useMemo(() => mathToScreen(ptC, coordParams), [ptC]);

  // 计算三角形几何特征（边长、内角、外接圆）
  const geom = useMemo(() => {
    // 1. 三边长
    const aVal = distance(ptB, ptC); // 角 A 的对边
    const bVal = distance(ptA, ptC); // 角 B 的对边
    const cVal = distance(ptA, ptB); // 角 C 的对边

    if (aVal < 0.1 || bVal < 0.1 || cVal < 0.1) {
      return { a: 1, b: 1, c: 1, angleA: PI/3, angleB: PI/3, angleC: PI/3, R: 1, circumCenter: { x: 0, y: 0 }, isValid: false };
    }

    // 2. 三内角（使用余弦定理逆公式，并做边界安全截断）
    const cosA = Math.max(-1, Math.min(1, (bVal * bVal + cVal * cVal - aVal * aVal) / (2 * bVal * cVal)));
    const cosB = Math.max(-1, Math.min(1, (aVal * aVal + cVal * cVal - bVal * bVal) / (2 * aVal * cVal)));
    const cosC = Math.max(-1, Math.min(1, (aVal * aVal + bVal * bVal - cVal * cVal) / (2 * aVal * bVal)));

    const angleAVal = Math.acos(cosA);
    const angleBVal = Math.acos(cosB);
    const angleCVal = Math.acos(cosC);

    // 3. 外接圆计算（克莱姆法则解方程）
    // 设圆心 O(x0, y0)，满足 O 到 A, B, C 的距离相等
    const A1 = ptB.x - ptA.x;
    const B1 = ptB.y - ptA.y;
    const C1 = (ptB.x ** 2 - ptA.x ** 2 + ptB.y ** 2 - ptA.y ** 2) / 2;

    const A2 = ptC.x - ptA.x;
    const B2 = ptC.y - ptA.y;
    const C2 = (ptC.x ** 2 - ptA.x ** 2 + ptC.y ** 2 - ptA.y ** 2) / 2;

    const D = A1 * B2 - A2 * B1;

    let RVal = 0;
    let center = { x: 0, y: 0 };
    let isValid = false;

    // 当面积不退化（三点不共线）时解外接圆
    if (Math.abs(D) > 0.05) {
      center.x = (C1 * B2 - C2 * B1) / D;
      center.y = (A1 * C2 - A2 * C1) / D;
      RVal = distance(center, ptA);
      isValid = true;
    }

    return {
      a: aVal,
      b: bVal,
      c: cVal,
      angleA: angleAVal,
      angleB: angleBVal,
      angleC: angleCVal,
      R: RVal,
      circumCenter: center,
      isValid,
    };
  }, [ptA, ptB, ptC]);

  // 坐标网格背景线
  const gridElements = useMemo(() => {
    const lines = [];
    const cx = CONTAINER_WIDTH / 2;
    const cy = CONTAINER_HEIGHT / 2;

    // X轴 & Y轴
    lines.push(<line key="axis-x" x1={0} y1={cy} x2={CONTAINER_WIDTH} y2={cy} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />);
    lines.push(<line key="axis-y" x1={cx} y1={0} x2={cx} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />);

    // 绘制整数网格
    const xMax = Math.ceil(CONTAINER_WIDTH / 2 / UNIT_PX);
    for (let x = -xMax; x <= xMax; x++) {
      if (x === 0) continue;
      const pt = mathToScreen({ x, y: 0 }, coordParams);
      lines.push(<line key={`grid-x-${x}`} x1={pt.x} y1={0} x2={pt.x} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />);
      lines.push(
        <text key={`label-x-${x}`} x={pt.x} y={cy + 14} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle" style={{ userSelect: 'none' }}>
          {x}
        </text>
      );
    }

    const yMax = Math.ceil(CONTAINER_HEIGHT / 2 / UNIT_PX);
    for (let y = -yMax; y <= yMax; y++) {
      if (y === 0) continue;
      const pt = mathToScreen({ x: 0, y }, coordParams);
      lines.push(<line key={`grid-y-${y}`} x1={0} y1={pt.y} x2={CONTAINER_WIDTH} y2={pt.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />);
      lines.push(
        <text key={`label-y-${y}`} x={cx - 10} y={pt.y + 3} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end" style={{ userSelect: 'none' }}>
          {y}
        </text>
      );
    }

    return lines;
  }, []);

  // 计算三个内角在屏幕空间的圆弧与标注位置
  const angleArcs = useMemo(() => {
    if (!showAngleArcs) return null;
    return {
      A: computeAngleArc(pxA, pxB, pxC, 24),
      B: computeAngleArc(pxB, pxA, pxC, 24),
      C: computeAngleArc(pxC, pxA, pxB, 24),
    };
  }, [pxA, pxB, pxC, showAngleArcs]);

  // 外接圆屏幕投影
  const circumCirclePx = useMemo(() => {
    if (!geom.isValid) return null;
    const centerPx = mathToScreen(geom.circumCenter, coordParams);
    const radiusPx = geom.R * UNIT_PX;
    return { cx: centerPx.x, cy: centerPx.y, r: radiusPx };
  }, [geom]);

  // 指针拖拽事件处理
  const handlePointerDown = (vertex: 'A' | 'B' | 'C', e: React.PointerEvent<SVGCIRCLEElement>) => {
    e.stopPropagation();
    setDraggedVertex(vertex);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedVertex || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // 屏幕坐标 -> 数学坐标
    const mathPt = screenToMath({ x: clientX, y: clientY }, coordParams);

    // 限制拖动范围在网格内部 [-9.5, 9.5], [-6.2, 6.2]
    const clampedX = Math.max(-9.5, Math.min(9.5, mathPt.x));
    const clampedY = Math.max(-6.2, Math.min(6.2, mathPt.y));
    const newPt = { x: clampedX, y: clampedY };

    // 保护限制：防止“三点共线”退化三角形（行列式叉积必须大于一定面积阈值）
    let areaDet = 0;
    if (draggedVertex === 'A') {
      areaDet = (ptB.x - newPt.x) * (ptC.y - newPt.y) - (ptC.x - newPt.x) * (ptB.y - newPt.y);
    } else if (draggedVertex === 'B') {
      areaDet = (newPt.x - ptA.x) * (ptC.y - ptA.y) - (ptC.x - ptA.x) * (newPt.y - ptA.y);
    } else {
      areaDet = (ptB.x - ptA.x) * (newPt.y - ptA.y) - (newPt.x - ptA.x) * (ptB.y - ptA.y);
    }

    // 只要三角形叉积面积大于 1.5（相当于0.75个单位面积），就允许更新
    if (Math.abs(areaDet) > 1.5) {
      if (draggedVertex === 'A') setPtA(newPt);
      else if (draggedVertex === 'B') setPtB(newPt);
      else if (draggedVertex === 'C') setPtC(newPt);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedVertex) return;
    setDraggedVertex(null);
  };

  // 快捷模版预设
  const setTemplate = (type: 'straight' | 'equilateral' | 'obtuse' | 'isosceles') => {
    if (type === 'straight') {
      // 3:4:5 直角三角形，外接圆半径 2.5
      setPtA({ x: -2.0, y: 2.0 });
      setPtB({ x: -2.0, y: -1.0 });
      setPtC({ x: 2.0, y: -1.0 });
    } else if (type === 'equilateral') {
      // 等边三角形
      setPtA({ x: 0.0, y: 3.2 });
      setPtB({ x: -3.0, y: -2.0 });
      setPtC({ x: 3.0, y: -2.0 });
    } else if (type === 'obtuse') {
      // 钝角三角形
      setPtA({ x: -1.0, y: 1.0 });
      setPtB({ x: -4.0, y: -2.0 });
      setPtC({ x: 4.0, y: -2.0 });
    } else if (type === 'isosceles') {
      // 等腰直角三角形
      setPtA({ x: 0.0, y: 2.5 });
      setPtB({ x: -2.5, y: 0.0 });
      setPtC({ x: 2.5, y: 0.0 });
    }
  };

  // 左侧面板
  const leftPanel = (
    <div style={styles.sidebar}>
      <h3 style={styles.panelTitle}>解三角形控制器</h3>
      
      {/* 顶点数值微调 */}
      <div style={styles.controlGroup}>
        <div style={{ ...styles.labelRow, fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>
          <span>顶点坐标微调</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={styles.coordInputRow}>
            <span style={{ color: '#ec4899', fontWeight: 600 }}>顶点 A:</span>
            <span style={styles.coordValue}>({ptA.x.toFixed(1)}, {ptA.y.toFixed(1)})</span>
          </div>
          <div style={styles.coordInputRow}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>顶点 B:</span>
            <span style={styles.coordValue}>({ptB.x.toFixed(1)}, {ptB.y.toFixed(1)})</span>
          </div>
          <div style={styles.coordInputRow}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>顶点 C:</span>
            <span style={styles.coordValue}>({ptC.x.toFixed(1)}, {ptC.y.toFixed(1)})</span>
          </div>
        </div>
      </div>

      {/* 辅助开关 */}
      <div style={styles.controlGroup}>
        <div style={{ ...styles.labelRow, fontWeight: 'bold', marginBottom: '8px', color: '#fb923c' }}>
          <span>辅助线开关</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={showCircumcircle} 
              onChange={(e) => setShowCircumcircle(e.target.checked)} 
              style={{ marginRight: '8px' }}
            />
            显示外接圆（正弦定理联动）
          </label>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={showAngleArcs} 
              onChange={(e) => setShowAngleArcs(e.target.checked)} 
              style={{ marginRight: '8px' }}
            />
            显示内角扇形弧
          </label>
        </div>
      </div>

      {/* 经典形状模板 */}
      <div style={styles.controlGroup}>
        <div style={{ ...styles.labelRow, fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa' }}>
          <span>经典三角形模板</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button onClick={() => setTemplate('straight')} style={styles.templateButton}>直角三角形(3:4:5)</button>
          <button onClick={() => setTemplate('equilateral')} style={styles.templateButton}>等边三角形</button>
          <button onClick={() => setTemplate('isosceles')} style={styles.templateButton}>等腰直角三角形</button>
          <button onClick={() => setTemplate('obtuse')} style={styles.templateButton}>钝角三角形</button>
        </div>
      </div>

      {/* 定理看板模式切换 */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ ...styles.labelRow, fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>重点公式看板切换</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setTheoremMode('sine')} 
            style={{ ...styles.switchButton, ...(theoremMode === 'sine' ? styles.activeSwitch : {}) }}
          >
            正弦定理 (2R)
          </button>
          <button 
            onClick={() => setTheoremMode('cosine')} 
            style={{ ...styles.switchButton, ...(theoremMode === 'cosine' ? styles.activeSwitch : {}) }}
          >
            余弦定理
          </button>
        </div>
      </div>
    </div>
  );

  // 中间画布
  const centerPanel = (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasHeader}>
        <span style={styles.canvasTitle}>动态三角形交互面板</span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>任意拖拽顶点 A、B、C 体验联动</span>
      </div>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block', backgroundColor: '#020617', touchAction: 'none' }}
      >
        {/* 网格底图 */}
        {gridElements}

        {/* 外接圆辅助渲染 */}
        {showCircumcircle && circumCirclePx && (
          <>
            <circle 
              cx={circumCirclePx.cx} 
              cy={circumCirclePx.cy} 
              r={circumCirclePx.r} 
              fill="none" 
              stroke="rgba(251, 146, 60, 0.45)" 
              strokeWidth={1.5} 
              strokeDasharray="4 3" 
            />
            {/* 圆心 */}
            <circle cx={circumCirclePx.cx} cy={circumCirclePx.cy} r={3} fill="#fb923c" />
            <text x={circumCirclePx.cx + 6} y={circumCirclePx.cy + 4} fill="#fb923c" fontSize="10" fontWeight="bold">O</text>
            {/* 圆心到顶点A的半径虚线 */}
            <line 
              x1={circumCirclePx.cx} 
              y1={circumCirclePx.cy} 
              x2={pxA.x} 
              y2={pxA.y} 
              stroke="#fb923c" 
              strokeWidth={1} 
              strokeDasharray="2 2" 
            />
          </>
        )}

        {/* 三角形内角弧渲染 */}
        {showAngleArcs && angleArcs && (
          <>
            {/* 角 A */}
            <path d={angleArcs.A.pathD} fill="none" stroke="#ec4899" strokeWidth={1.5} />
            <text x={angleArcs.A.textPt.x} y={angleArcs.A.textPt.y + 3} fill="#ec4899" fontSize="9" textAnchor="middle" style={{ userSelect: 'none' }}>
              A
            </text>
            {/* 角 B */}
            <path d={angleArcs.B.pathD} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
            <text x={angleArcs.B.textPt.x} y={angleArcs.B.textPt.y + 3} fill="#38bdf8" fontSize="9" textAnchor="middle" style={{ userSelect: 'none' }}>
              B
            </text>
            {/* 角 C */}
            <path d={angleArcs.C.pathD} fill="none" stroke="#10b981" strokeWidth={1.5} />
            <text x={angleArcs.C.textPt.x} y={angleArcs.C.textPt.y + 3} fill="#10b981" fontSize="9" textAnchor="middle" style={{ userSelect: 'none' }}>
              C
            </text>
          </>
        )}

        {/* 三角形半透明填充与边界 */}
        <polygon 
          points={`${pxA.x},${pxA.y} ${pxB.x},${pxB.y} ${pxC.x},${pxC.y}`} 
          fill="rgba(99, 102, 241, 0.12)" 
          stroke="#6366f1" 
          strokeWidth={2.5} 
          strokeLinejoin="round" 
        />

        {/* 三边长度标注在边的中点位置 */}
        {(() => {
          const midA = { x: (pxB.x + pxC.x) / 2, y: (pxB.y + pxC.y) / 2 };
          const midB = { x: (pxA.x + pxC.x) / 2, y: (pxA.y + pxC.y) / 2 };
          const midC = { x: (pxA.x + pxB.x) / 2, y: (pxA.y + pxB.y) / 2 };
          
          // 对标注点进行微调偏移，避免贴线
          return (
            <>
              <text x={midA.x} y={midA.y + 12} fill="#94a3b8" fontSize="10" textAnchor="middle" style={{ userSelect: 'none', backgroundColor: '#020617', padding: '1px' }}>
                a = {geom.a.toFixed(2)}
              </text>
              <text x={midB.x + 12} y={midB.y + 4} fill="#94a3b8" fontSize="10" textAnchor="start" style={{ userSelect: 'none' }}>
                b = {geom.b.toFixed(2)}
              </text>
              <text x={midC.x - 12} y={midC.y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" style={{ userSelect: 'none' }}>
                c = {geom.c.toFixed(2)}
              </text>
            </>
          );
        })()}

        {/* 交互拖拽圆点 */}
        <circle 
          cx={pxA.x} 
          cy={pxA.y} 
          r={7} 
          fill="#ec4899" 
          stroke="#ffffff" 
          strokeWidth={2} 
          style={{ cursor: 'pointer' }} 
          onPointerDown={(e) => handlePointerDown('A', e)}
        />
        <circle 
          cx={pxB.x} 
          cy={pxB.y} 
          r={7} 
          fill="#38bdf8" 
          stroke="#ffffff" 
          strokeWidth={2} 
          style={{ cursor: 'pointer' }} 
          onPointerDown={(e) => handlePointerDown('B', e)}
        />
        <circle 
          cx={pxC.x} 
          cy={pxC.y} 
          r={7} 
          fill="#10b981" 
          stroke="#ffffff" 
          strokeWidth={2} 
          style={{ cursor: 'pointer' }} 
          onPointerDown={(e) => handlePointerDown('C', e)}
        />
      </svg>
      <div style={styles.legendContainer}>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#ec4899' }} />角 A 顶点</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#38bdf8' }} />角 B 顶点</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />角 C 顶点</div>
        {showCircumcircle && <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#fb923c', borderRadius: '0' }} />外接圆圆心与半径 R</div>}
      </div>
    </div>
  );

  // 右侧数值与定理演算看板
  const rightPanel = (
    <div style={styles.sidebar}>
      <h3 style={{ ...styles.panelTitle, color: '#c084fc' }}>几何参数与定理验算</h3>

      {/* 基础边角数值 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>实时几何测量数值</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px' }}>三边长度</div>
            <div style={{ fontFamily: 'monospace' }}>a = {geom.a.toFixed(3)}</div>
            <div style={{ fontFamily: 'monospace' }}>b = {geom.b.toFixed(3)}</div>
            <div style={{ fontFamily: 'monospace' }}>c = {geom.c.toFixed(3)}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px' }}>三个内角</div>
            <div style={{ fontFamily: 'monospace', color: '#ec4899' }}>A = {((geom.angleA * 180) / PI).toFixed(2)}°</div>
            <div style={{ fontFamily: 'monospace', color: '#38bdf8' }}>B = {((geom.angleB * 180) / PI).toFixed(2)}°</div>
            <div style={{ fontFamily: 'monospace', color: '#10b981' }}>C = {((geom.angleC * 180) / PI).toFixed(2)}°</div>
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
          内角和 A+B+C = {(((geom.angleA + geom.angleB + geom.angleC) * 180) / PI).toFixed(1)}°
        </div>
      </div>

      {/* 1. 正弦定理看板 */}
      {theoremMode === 'sine' && (
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, color: '#fb923c' }}>正弦定理验算 (Law of Sines)</div>
          <div style={styles.formulaWrapper}>
            <BlockMath math={`\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginTop: '10px' }}>
            <div style={styles.calcRow}>
              <span style={{ color: '#ec4899' }}>a / sin A :</span>
              <span style={styles.mathEquation}>
                <InlineMath math={`\\frac{${geom.a.toFixed(2)}}{\\sin ${((geom.angleA * 180) / PI).toFixed(1)}^\\circ} = ${(geom.a / Math.sin(geom.angleA)).toFixed(3)}`} />
              </span>
            </div>
            <div style={styles.calcRow}>
              <span style={{ color: '#38bdf8' }}>b / sin B :</span>
              <span style={styles.mathEquation}>
                <InlineMath math={`\\frac{${geom.b.toFixed(2)}}{\\sin ${((geom.angleB * 180) / PI).toFixed(1)}^\\circ} = ${(geom.b / Math.sin(geom.angleB)).toFixed(3)}`} />
              </span>
            </div>
            <div style={styles.calcRow}>
              <span style={{ color: '#10b981' }}>c / sin C :</span>
              <span style={styles.mathEquation}>
                <InlineMath math={`\\frac{${geom.c.toFixed(2)}}{\\sin ${((geom.angleC * 180) / PI).toFixed(1)}^\\circ} = ${(geom.c / Math.sin(geom.angleC)).toFixed(3)}`} />
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '4px 0' }} />
            <div style={styles.calcRow}>
              <span style={{ fontWeight: 'bold', color: '#fb923c' }}>外接圆直径 2R :</span>
              <span style={{ fontWeight: 'bold', color: '#fb923c', fontFamily: 'monospace' }}>
                {geom.isValid ? (2 * geom.R).toFixed(3) : '计算中...'}
              </span>
            </div>
          </div>
          <div style={styles.noteBox}>
            正弦定理阐明：三角形任一边长与对角正弦值的比值恒等于其<strong>外接圆的直径</strong>！
          </div>
        </div>
      )}

      {/* 2. 余弦定理看板 */}
      {theoremMode === 'cosine' && (
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, color: '#a78bfa' }}>余弦定理验算 (Law of Cosines)</div>
          <div style={styles.formulaWrapper}>
            <BlockMath math={`a^2 = b^2 + c^2 - 2bc\\cos A`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginTop: '10px' }}>
            <div style={styles.calcRow}>
              <span style={{ color: '#ec4899' }}>等号左侧 a² :</span>
              <span style={{ fontFamily: 'monospace' }}>{(geom.a ** 2).toFixed(3)}</span>
            </div>
            <div style={styles.calcRow}>
              <span style={{ color: '#a78bfa' }}>等号右侧 b²+c²-2bccosA :</span>
              <span style={styles.mathEquation}>
                <InlineMath 
                  math={`{${geom.b.toFixed(2)}}^2 + {${geom.c.toFixed(2)}}^2 - 2(${geom.b.toFixed(1)})(${geom.c.toFixed(1)})\\cos ${((geom.angleA * 180) / PI).toFixed(0)}^\\circ`} 
                />
              </span>
            </div>
            <div style={styles.calcRow}>
              <span>计算结果 :</span>
              <span style={{ fontWeight: 'bold', color: '#ec4899', fontFamily: 'monospace' }}>
                {(geom.b ** 2 + geom.c ** 2 - 2 * geom.b * geom.c * Math.cos(geom.angleA)).toFixed(3)}
              </span>
            </div>
          </div>
          <div style={styles.noteBox}>
            余弦定理是<strong>勾股定理</strong>在任意三角形下的推广。当角 A 为 90° 时，cos A = 0，定理完美退化为勾股定理：a² = b² + c²。
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />
  );
}

// 内联样式
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
    padding: '12px 10px',
    borderRadius: '6px',
    border: '1px solid #1e293b',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#f1f5f9',
  },
  coordInputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    backgroundColor: '#1e293b',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #334155',
  },
  coordValue: {
    fontFamily: 'monospace',
    color: '#f8fafc',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#cbd5e1',
    cursor: 'pointer',
    userSelect: 'none',
  },
  templateButton: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 4px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    fontWeight: 600,
  },
  switchButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  activeSwitch: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderColor: '#6366f1',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
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
    flexWrap: 'wrap',
    gap: '12px 16px',
    padding: '10px 8px',
    backgroundColor: '#020617',
    borderTop: '1px solid #1e293b',
    fontSize: '11px',
    color: '#64748b',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
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
  formulaWrapper: {
    backgroundColor: '#0f172a',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #1e293b',
    overflowX: 'auto',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mathEquation: {
    fontFamily: 'monospace',
    color: '#f8fafc',
  },
  noteBox: {
    marginTop: '12px',
    padding: '8px 10px',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderLeft: '3px solid #6366f1',
    borderRadius: '0 4px 4px 0',
    fontSize: '11.5px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
};
