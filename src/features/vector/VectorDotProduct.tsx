/**
 * @file src/features/vector/VectorDotProduct.tsx
 * @description 向量点积与投影实验（支持端点拖拽、正交投影、点积波形联动与公式看板）
 */

import { useState, useMemo, useRef } from 'react';
import { mathToScreen, screenToMath, containerCenter } from '@/utils/coordinate';
import { dot, magnitude, vectorToAngle, normalize, scale } from '@/math/vector';
import { radToDeg } from '@/math/trigonometry';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { Vector2 } from '@/types/math';

// ─── SVG 几何区参数 ────────────────────────────────────────
const GEO_SIZE = 320;
const COORD_PARAMS = { width: GEO_SIZE, height: GEO_SIZE, unitPx: 55 }; // 数学单位 [-2.8, 2.8] 范围
const CENTER = containerCenter(COORD_PARAMS);

// ─── 图表区参数 ──────────────────────────────────────────
const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const MAX_DOT_PRODUCT = 6.5; // 限制点积最大显示幅值（向量半径最大 2.5 时，最大点积为 6.25）

// ─── 初始端点坐标 ──────────────────────────────────────────
const INITIAL_A: Vector2 = { x: 1.8, y: 0.6 };
const INITIAL_B: Vector2 = { x: 0.8, y: 1.6 };

export function VectorDotProduct() {
  // 1. 本地状态保存两个向量的终点数学坐标
  const [a, setA] = useState<Vector2>(INITIAL_A);
  const [b, setB] = useState<Vector2>(INITIAL_B);

  // 2. 派生数学指标
  const lenA = useMemo(() => magnitude(a), [a]);
  const lenB = useMemo(() => magnitude(b), [b]);
  
  // 点积值
  const dotVal = useMemo(() => dot(a, b), [a, b]);

  // 各自的方向角
  const angleA = useMemo(() => radToDeg(vectorToAngle(a)), [a]);
  const angleB = useMemo(() => radToDeg(vectorToAngle(b)), [b]);

  // 带方向的夹角，范围在 [-180, 180] 度内，以展现余弦对称性及奇偶性
  const dirAngleDeg = useMemo(() => {
    let diff = angleB - angleA;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }, [angleA, angleB]);



  // 3. 计算在 a 上的正交投影点坐标 P
  const projPoint = useMemo(() => {
    if (lenA === 0) return { x: 0, y: 0 };
    const uA = normalize(a); // a 方向的单位向量
    const projScalar = dot(uA, b); // 投影标量长度
    return scale(uA, projScalar);
  }, [a, b, lenA]);

  // 4. 坐标转换用于 SVG 渲染
  const oScreen = useMemo(() => mathToScreen({ x: 0, y: 0 }, COORD_PARAMS), []);
  const aScreen = useMemo(() => mathToScreen(a, COORD_PARAMS), [a]);
  const bScreen = useMemo(() => mathToScreen(b, COORD_PARAMS), [b]);
  const pScreen = useMemo(() => mathToScreen(projPoint, COORD_PARAMS), [projPoint]);

  // 延长辅助线（绘制 a 所在的共线轴）
  const axisALine = useMemo(() => {
    if (lenA === 0) return null;
    const uA = normalize(a);
    const pFar = mathToScreen(scale(uA, 3.2), COORD_PARAMS);
    const pNear = mathToScreen(scale(uA, -3.2), COORD_PARAMS);
    return { x1: pNear.x, y1: pNear.y, x2: pFar.x, y2: pFar.y };
  }, [a, lenA]);

  // 5. 手势拖拽逻辑
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingNode = useRef<'a' | 'b' | null>(null);

  const handlePointerDown = (node: 'a' | 'b', e: React.PointerEvent<SVGCircleElement>) => {
    draggingNode.current = node;
    (e.target as Element).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingNode.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const mathPos = screenToMath({ x: screenX, y: screenY }, COORD_PARAMS);
    
    // 限制拖动范围在圆形区域内，防超出界限，最大半径 2.5
    const r = Math.min(2.5, magnitude(mathPos));
    const angle = vectorToAngle(mathPos);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    if (draggingNode.current === 'a') {
      setA({ x, y });
    } else if (draggingNode.current === 'b') {
      setB({ x, y });
    }
  };

  const handlePointerUp = () => {
    if (!draggingNode.current) return;
    draggingNode.current = null;
  };

  const handleReset = () => {
    setA(INITIAL_A);
    setB(INITIAL_B);
  };

  // 6. 余弦波形曲线生成
  const chartCurvePath = useMemo(() => {
    const points = [];
    const amp = lenA * lenB; // 振幅由 a, b 模长之积实时决定
    // x 轴范围从 -180 度到 180 度
    for (let deg = -180; deg <= 180; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const val = amp * Math.cos(rad);

      // 映射到图表内
      const tx = 30 + ((deg + 180) / 360) * (CHART_WIDTH - 60); // 左右留 30px
      const ty = CHART_HEIGHT / 2 - (val / MAX_DOT_PRODUCT) * (CHART_HEIGHT / 2 - 15); // 上下留 15px

      points.push(`${deg === -180 ? 'M' : 'L'} ${tx} ${ty}`);
    }
    return points.join(' ');
  }, [lenA, lenB]);

  // 当前动点在图表上的像素坐标
  const chartPointCoords = useMemo(() => {
    const tx = 30 + ((dirAngleDeg + 180) / 360) * (CHART_WIDTH - 60);
    const ty = CHART_HEIGHT / 2 - (dotVal / MAX_DOT_PRODUCT) * (CHART_HEIGHT / 2 - 15);
    return { x: tx, y: ty };
  }, [dirAngleDeg, dotVal]);

  // 几何网格背景线
  const gridLines = useMemo(() => {
    const lines = [];
    for (let val = -2; val <= 2; val++) {
      if (val === 0) continue;
      const p1 = mathToScreen({ x: val, y: -2.6 }, COORD_PARAMS);
      const p2 = mathToScreen({ x: val, y: 2.6 }, COORD_PARAMS);
      lines.push(<line key={`v-${val}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} style={styles.gridLine} />);
      const p3 = mathToScreen({ x: -2.6, y: val }, COORD_PARAMS);
      const p4 = mathToScreen({ x: 2.6, y: val }, COORD_PARAMS);
      lines.push(<line key={`h-${val}`} x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} style={styles.gridLine} />);
    }
    return lines;
  }, []);

  return (
    <div id="vector-dot-product-slice" className="lab-container">
      <h2 style={styles.title}>平面向量 · 点积与正交投影</h2>
      <p style={styles.subtitle}>拖拽向量 A 或 B 端点，观察正交投影与点积波形图的联动</p>

      <div className="lab-layout-grid">
        {/* 左侧：操作、主几何图、余弦波形图 */}
        <div className="lab-left-panel">
          {/* ── 快速操作区 ────────────────────────────── */}
          <div style={styles.topControl}>
            <span style={styles.infoSpan}>拖动半径限制：最大 2.5</span>
            <button id="btn-dot-product-reset" onClick={handleReset} style={styles.resetButton}>
              重置
            </button>
          </div>

          {/* ── 几何交互 SVG 容器 ───────────────────────── */}
          <svg
            id="dot-product-svg"
            ref={svgRef}
            width={GEO_SIZE}
            height={GEO_SIZE}
            style={styles.svg}
            viewBox={`0 0 ${GEO_SIZE} ${GEO_SIZE}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <defs>
              {/* 发光霓虹滤镜 */}
              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 箭头 */}
              <marker id="arrow-a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#c084fc" />
              </marker>
              <marker id="arrow-b" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#60a5fa" />
              </marker>
              <marker id="arrow-p-pos" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#4ade80" />
              </marker>
              <marker id="arrow-p-neg" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#f43f5e" />
              </marker>
            </defs>

            {/* 辅助网格与坐标轴 */}
            {gridLines}
            <line x1={0} y1={CENTER.y} x2={GEO_SIZE} y2={CENTER.y} style={styles.axis} />
            <line x1={CENTER.x} y1={0} x2={CENTER.x} y2={GEO_SIZE} style={styles.axis} />

            {/* 向量 A 的共线轴延长虚线 */}
            {axisALine && (
              <line
                id="axis-a-ray"
                x1={axisALine.x1}
                y1={axisALine.y1}
                x2={axisALine.x2}
                y2={axisALine.y2}
                style={styles.axisARay}
              />
            )}

            {/* ── 投影垂直正交线（B -> P） ── */}
            {lenA > 0 && (
              <line
                id="proj-orthogonal-line"
                x1={bScreen.x}
                y1={bScreen.y}
                x2={pScreen.x}
                y2={pScreen.y}
                style={styles.orthogonalLine}
              />
            )}

            {/* ── 投影向量 OP (带箭头) ── */}
            {lenA > 0 && (
              <line
                id="proj-vector-line"
                x1={oScreen.x}
                y1={oScreen.y}
                x2={pScreen.x}
                y2={pScreen.y}
                style={{
                  ...styles.projVector,
                  stroke: dotVal >= 0 ? '#4ade80' : '#f43f5e', // 正向绿色，反向红色
                }}
                markerEnd={dotVal >= 0 ? 'url(#arrow-p-pos)' : 'url(#arrow-p-neg)'}
              />
            )}

            {/* ── 向量 A (被投影轴，紫色) ── */}
            <line
              id="vector-a"
              x1={oScreen.x}
              y1={oScreen.y}
              x2={aScreen.x}
              y2={aScreen.y}
              style={styles.vectorA}
              markerEnd="url(#arrow-a)"
            />

            {/* ── 向量 B (蓝色) ── */}
            <line
              id="vector-b"
              x1={oScreen.x}
              y1={oScreen.y}
              x2={bScreen.x}
              y2={bScreen.y}
              style={styles.vectorB}
              markerEnd="url(#arrow-b)"
            />

            {/* 拖动控制端点 */}
            <circle
              id="node-a-drag"
              cx={aScreen.x}
              cy={aScreen.y}
              r={9}
              style={{ ...styles.nodeATip, cursor: 'grab' }}
              onPointerDown={(e) => handlePointerDown('a', e)}
            />
            <text x={aScreen.x + 12} y={aScreen.y - 12} style={styles.labelA}>A</text>

            <circle
              id="node-b-drag"
              cx={bScreen.x}
              cy={bScreen.y}
              r={9}
              style={{ ...styles.nodeBTip, cursor: 'grab' }}
              onPointerDown={(e) => handlePointerDown('b', e)}
            />
            <text x={bScreen.x + 12} y={bScreen.y - 12} style={styles.labelB}>B</text>

            {/* 投影点 P 标注 */}
            {lenA > 0 && <text x={pScreen.x - 8} y={pScreen.y + 20} style={styles.labelP}>P</text>}
          </svg>

          {/* ── 变化曲线动态图表 ────── */}
          <div style={styles.chartWrapper}>
            <div style={styles.chartTitle}>点积与夹角余弦曲线联动 (θ → a·b)</div>
            <svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
              {/* 图表坐标轴 */}
              <line x1={20} y1={CHART_HEIGHT / 2} x2={CHART_WIDTH - 20} y2={CHART_HEIGHT / 2} style={styles.chartAxis} />
              <line x1={30} y1={10} x2={30} y2={CHART_HEIGHT - 10} style={styles.chartAxis} />
              <line x1={CHART_WIDTH / 2} y1={10} x2={CHART_WIDTH / 2} y2={CHART_HEIGHT - 10} style={styles.chartZeroAxis} />

              {/* 轴刻度标注 */}
              <text x={30} y={CHART_HEIGHT / 2 + 14} style={styles.chartScale}>-180°</text>
              <text x={CHART_WIDTH / 2 - 10} y={CHART_HEIGHT / 2 + 14} style={styles.chartScale}>0°</text>
              <text x={CHART_WIDTH - 55} y={CHART_HEIGHT / 2 + 14} style={styles.chartScale}>180°</text>
              <text x={10} y={16} style={styles.chartScale}>+y</text>
              <text x={10} y={CHART_HEIGHT - 6} style={styles.chartScale}>-y</text>

              {/* 余弦曲线路径 */}
              <path d={chartCurvePath} style={styles.chartCurve} />

              {/* 当前状态发光指示点 */}
              <circle
                cx={chartPointCoords.x}
                cy={chartPointCoords.y}
                r={5}
                style={styles.chartIndicator}
                filter="url(#glow-effect)"
              />
            </svg>
          </div>
        </div>

        {/* 右侧：仪表数据分析看板 */}
        <div className="lab-right-panel" style={{ justifyContent: 'center' }}>
          <div style={styles.dashboard}>
            <div style={styles.formulaBox}>
              <div style={styles.formulaTitle}>点积公式多维对比计算：</div>
              <div style={{ ...styles.formulaText, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                <span style={{ color: '#c084fc', fontWeight: 'bold' }}>代数法</span>：
                <InlineMath math={`\\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2 = (${a.x.toFixed(2)}) \\cdot (${b.x.toFixed(2)}) + (${a.y.toFixed(2)}) \\cdot (${b.y.toFixed(2)}) = ${dotVal.toFixed(3)}`} />
              </div>
              <div style={{ ...styles.formulaText, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>几何法</span>：
                <InlineMath math={`\\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos \\theta = ${lenA.toFixed(2)} \\cdot ${lenB.toFixed(2)} \\cdot \\cos(${dirAngleDeg.toFixed(1)}^\\circ) = ${dotVal.toFixed(3)}`} />
              </div>
              <div style={{ ...styles.formulaText, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>投影法</span>：
                <InlineMath math={`\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot \\text{Proj}_{\\vec{a}} \\vec{b} = ${lenA.toFixed(2)} \\cdot (${(dotVal / (lenA || 1)).toFixed(2)}) = ${dotVal.toFixed(3)}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

// ─── 内联样式 ──────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#f1f5f9',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    margin: '-8px 0 0 0',
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '8px',
  },
  topControl: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  infoSpan: {
    fontSize: '11px',
    color: '#64748b',
  },
  resetButton: {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    transition: 'background 0.2s',
  },
  svg: {
    background: '#1e293b',
    borderRadius: '8px',
    display: 'block',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  },
  gridLine: {
    stroke: '#334155',
    strokeWidth: 0.5,
    strokeDasharray: '2 2',
  } as React.CSSProperties,
  axis: {
    stroke: '#475569',
    strokeWidth: 1.5,
  } as React.CSSProperties,
  axisARay: {
    stroke: '#475569',
    strokeWidth: 1,
    strokeDasharray: '4 4',
  } as React.CSSProperties,
  orthogonalLine: {
    stroke: '#94a3b8',
    strokeWidth: 1.5,
    strokeDasharray: '3 3',
  } as React.CSSProperties,
  projVector: {
    strokeWidth: 3.5, // 投影向量
  } as React.CSSProperties,
  vectorA: {
    stroke: '#c084fc', // 紫色 a
    strokeWidth: 2.5,
  } as React.CSSProperties,
  vectorB: {
    stroke: '#60a5fa', // 蓝色 b
    strokeWidth: 2.5,
  } as React.CSSProperties,
  nodeATip: {
    fill: '#c084fc',
    stroke: '#7e22ce',
    strokeWidth: 1.5,
  } as React.CSSProperties,
  nodeBTip: {
    fill: '#60a5fa',
    stroke: '#1d4ed8',
    strokeWidth: 1.5,
  } as React.CSSProperties,
  labelA: {
    fontSize: '12px',
    fill: '#c084fc',
    fontWeight: 'bold',
  } as React.CSSProperties,
  labelB: {
    fontSize: '12px',
    fill: '#60a5fa',
    fontWeight: 'bold',
  } as React.CSSProperties,
  labelP: {
    fontSize: '13px',
    fill: '#f8fafc',
    fontWeight: 'bold',
  } as React.CSSProperties,
  chartWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  chartTitle: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 600,
  },
  chartSvg: {
    background: '#1e293b',
    borderRadius: '8px',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  },
  chartAxis: {
    stroke: '#334155',
    strokeWidth: 1,
  } as React.CSSProperties,
  chartZeroAxis: {
    stroke: '#334155',
    strokeWidth: 1,
    strokeDasharray: '2 2',
  } as React.CSSProperties,
  chartScale: {
    fontSize: '10px',
    fill: '#475569',
  } as React.CSSProperties,
  chartCurve: {
    fill: 'none',
    stroke: '#fb923c', // 橙色余弦曲线
    strokeWidth: 2,
  } as React.CSSProperties,
  chartIndicator: {
    fill: '#fb923c',
    stroke: '#ffffff',
    strokeWidth: 1.5,
  } as React.CSSProperties,
  dashboard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formulaBox: {
    background: '#1e293b',
    borderRadius: '6px',
    padding: '10px 12px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formulaTitle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: '2px',
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#e2e8f0',
  },
};
