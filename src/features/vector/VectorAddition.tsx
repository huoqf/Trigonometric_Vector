/**
 * @file src/features/vector/VectorAddition.tsx
 * @description 向量加法与分解实验（支持三角形法则与平行四边形法则动态切换、大屏分栏自适应与完整指标仪表盘）
 */

import { useState, useMemo, useRef } from 'react';
import { mathToScreen, screenToMath, containerCenter } from '@/utils/coordinate';
import { add, magnitude, vectorToAngle, angleBetween } from '@/math/vector';
import { radToDeg } from '@/math/trigonometry';
import type { Vector2 } from '@/types/math';

// ─── SVG 容器参数 ──────────────────────────────────────────
const SVG_SIZE = 360;
const COORD_PARAMS = { width: SVG_SIZE, height: SVG_SIZE, unitPx: 50 }; // 数学单位 [-3.5, 3.5] 范围
const CENTER = containerCenter(COORD_PARAMS);

// ─── 初始分向量（起点固定为原点 0, 0） ────────────────────
const INITIAL_A: Vector2 = { x: 1.5, y: 0.5 };
const INITIAL_B: Vector2 = { x: -0.5, y: 1.5 };

export function VectorAddition() {
  // 1. 规则模式：三角形法则 (triangle) 或 平行四边形法则 (parallelogram)
  const [ruleMode, setRuleMode] = useState<'triangle' | 'parallelogram'>('parallelogram');

  // 2. 底层向量分量状态
  const [a, setA] = useState<Vector2>(INITIAL_A);
  const [b, setB] = useState<Vector2>(INITIAL_B);

  // 3. 派生状态计算
  const c = useMemo(() => add(a, b), [a, b]); // 合向量 a + b

  const lenA = useMemo(() => magnitude(a), [a]);
  const lenB = useMemo(() => magnitude(b), [b]);
  const lenC = useMemo(() => magnitude(c), [c]);

  const angleC = useMemo(() => radToDeg(vectorToAngle(c)), [c]);
  const includeAngle = useMemo(() => radToDeg(angleBetween(a, b)), [a, b]);

  // 4. 转换数学坐标至屏幕像素坐标
  const oScreen = useMemo(() => mathToScreen({ x: 0, y: 0 }, COORD_PARAMS), []);
  const aScreen = useMemo(() => mathToScreen(a, COORD_PARAMS), [a]);
  const bScreen = useMemo(() => mathToScreen(b, COORD_PARAMS), [b]);
  const cScreen = useMemo(() => mathToScreen(c, COORD_PARAMS), [c]);

  // 5. 拖拽手势交互
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingNode = useRef<'nodeA' | 'nodeB' | 'nodeC' | null>(null);

  const handlePointerDown = (node: 'nodeA' | 'nodeB' | 'nodeC', e: React.PointerEvent<SVGCircleElement>) => {
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
    
    // 限制拖拽范围以防止超出视图
    const x = Math.max(-3.4, Math.min(3.4, mathPos.x));
    const y = Math.max(-3.4, Math.min(3.4, mathPos.y));

    if (draggingNode.current === 'nodeA') {
      // 拖动向量 a 的终点
      setA({ x, y });
    } else if (draggingNode.current === 'nodeB') {
      // 平行四边形模式下：拖动向量 b 的终点
      setB({ x, y });
    } else if (draggingNode.current === 'nodeC') {
      // 三角形模式下：拖动合向量 c 的终点。由于 c = a + b，改变 c 会倒推 b = c - a
      setB({ x: x - a.x, y: y - a.y });
    }
  };

  const handlePointerUp = () => {
    draggingNode.current = null;
  };

  const handleReset = () => {
    setA(INITIAL_A);
    setB(INITIAL_B);
  };

  // 生成坐标格网
  const gridLines = useMemo(() => {
    const lines = [];
    for (let val = -3; val <= 3; val++) {
      if (val === 0) continue;
      const p1 = mathToScreen({ x: val, y: -3.4 }, COORD_PARAMS);
      const p2 = mathToScreen({ x: val, y: 3.4 }, COORD_PARAMS);
      lines.push(<line key={`v-${val}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} style={styles.gridLine} />);
      const p3 = mathToScreen({ x: -3.4, y: val }, COORD_PARAMS);
      const p4 = mathToScreen({ x: 3.4, y: val }, COORD_PARAMS);
      lines.push(<line key={`h-${val}`} x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} style={styles.gridLine} />);
    }
    return lines;
  }, []);

  return (
    <div id="vector-addition-slice" className="lab-container">
      <h2 style={styles.title}>平面向量 · 加法合成实验室</h2>
      <p style={styles.subtitle}>切换合成法则，拖动端点观察合向量与分向量的关系</p>

      <div className="lab-layout-grid">
        {/* 左侧控制开关及交互画板 */}
        <div className="lab-left-panel">
          {/* ── 法则切换与重置 ────────────────────────── */}
          <div style={styles.topControl}>
            <div style={styles.toggleGroup}>
              <button
                id="btn-parallelogram-mode"
                onClick={() => setRuleMode('parallelogram')}
                style={{
                  ...styles.toggleBtn,
                  ...(ruleMode === 'parallelogram' ? styles.activeToggleBtn : {}),
                }}
              >
                平行四边形法则
              </button>
              <button
                id="btn-triangle-mode"
                onClick={() => setRuleMode('triangle')}
                style={{
                  ...styles.toggleBtn,
                  ...(ruleMode === 'triangle' ? styles.activeToggleBtn : {}),
                }}
              >
                三角形法则
              </button>
            </div>
            <button id="btn-addition-reset" onClick={handleReset} style={styles.resetButton}>
              重置
            </button>
          </div>

          {/* ── SVG 视图区 ────────────────────────────── */}
          <svg
            id="addition-svg"
            ref={svgRef}
            width={SVG_SIZE}
            height={SVG_SIZE}
            style={styles.svg}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <defs>
              {/* 霓虹发光滤镜 */}
              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 各向量箭头定义 */}
              <marker id="arrow-a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#c084fc" />
              </marker>
              <marker id="arrow-b" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#60a5fa" />
              </marker>
              <marker id="arrow-c" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#fb923c" />
              </marker>
            </defs>

            {/* 辅助网格与坐标轴 */}
            {gridLines}
            <line x1={0} y1={CENTER.y} x2={SVG_SIZE} y2={CENTER.y} style={styles.axis} />
            <line x1={CENTER.x} y1={0} x2={CENTER.x} y2={SVG_SIZE} style={styles.axis} />
            <text x={SVG_SIZE - 12} y={CENTER.y + 16} style={styles.axisLabel}>x</text>
            <text x={CENTER.x - 16} y={12} style={styles.axisLabel}>y</text>

            {/* ── 平行四边形法则辅助虚线 ── */}
            {ruleMode === 'parallelogram' && (
              <>
                {/* A -> C (相当于平移后的 b) */}
                <line x1={aScreen.x} y1={aScreen.y} x2={cScreen.x} y2={cScreen.y} style={styles.helperLine} />
                {/* B -> C (相当于平移后的 a) */}
                <line x1={bScreen.x} y1={bScreen.y} x2={cScreen.x} y2={cScreen.y} style={styles.helperLine} />
              </>
            )}

            {/* ── 向量 A (紫色) ── */}
            <line
              id="vector-a-line"
              x1={oScreen.x}
              y1={oScreen.y}
              x2={aScreen.x}
              y2={aScreen.y}
              style={styles.vectorA}
              markerEnd="url(#arrow-a)"
            />

            {/* ── 向量 B (蓝色) ── */}
            {ruleMode === 'parallelogram' ? (
              // 共起点模式
              <line
                id="vector-b-line"
                x1={oScreen.x}
                y1={oScreen.y}
                x2={bScreen.x}
                y2={bScreen.y}
                style={styles.vectorB}
                markerEnd="url(#arrow-b)"
              />
            ) : (
              // 首尾相接模式（平移后，从 A 终点指向 C 终点）
              <line
                id="vector-b-line"
                x1={aScreen.x}
                y1={aScreen.y}
                x2={cScreen.x}
                y2={cScreen.y}
                style={styles.vectorB}
                markerEnd="url(#arrow-b)"
              />
            )}

            {/* ── 合向量 C (橙色发光) ── */}
            <line
              id="vector-c-line"
              x1={oScreen.x}
              y1={oScreen.y}
              x2={cScreen.x}
              y2={cScreen.y}
              style={styles.vectorC}
              filter="url(#glow-effect)"
              markerEnd="url(#arrow-c)"
            />

            {/* ── 交互控制端点 ── */}
            {/* 点 A (控制分向量 a 终点) */}
            <circle
              id="node-a-drag"
              cx={aScreen.x}
              cy={aScreen.y}
              r={9}
              style={{ ...styles.nodeATip, cursor: 'grab' }}
              onPointerDown={(e) => handlePointerDown('nodeA', e)}
            />
            <text x={aScreen.x - 12} y={aScreen.y - 12} style={styles.labelA}>a</text>

            {/* 平行四边形模式下：控制点 B (控制分向量 b 终点) */}
            {ruleMode === 'parallelogram' && (
              <>
                <circle
                  id="node-b-drag"
                  cx={bScreen.x}
                  cy={bScreen.y}
                  r={9}
                  style={{ ...styles.nodeBTip, cursor: 'grab' }}
                  onPointerDown={(e) => handlePointerDown('nodeB', e)}
                />
                <text x={bScreen.x - 12} y={bScreen.y - 12} style={styles.labelB}>b</text>
              </>
            )}

            {/* 三角形模式下：控制合向量终点 C (间接平滑改变 b) */}
            {ruleMode === 'triangle' && (
              <>
                <circle
                  id="node-c-drag"
                  cx={cScreen.x}
                  cy={cScreen.y}
                  r={9}
                  style={{ ...styles.nodeCTip, cursor: 'grab' }}
                  onPointerDown={(e) => handlePointerDown('nodeC', e)}
                />
              </>
            )}
            <text x={cScreen.x + 12} y={cScreen.y - 12} style={styles.labelC}>a+b</text>
          </svg>
        </div>

        {/* 右侧：代数仪表盘与核心看板 */}
        <div className="lab-right-panel" style={{ justifyContent: 'center' }}>
          <div style={styles.dashboard}>
            {/* 公式显示栏 */}
            <div style={styles.formulaRow}>
              <span style={styles.formulaLabel}>加法代数等式：</span>
              <span id="display-formula" style={styles.formulaText}>
                a + b = ({a.x.toFixed(2)}, {a.y.toFixed(2)}) + ({b.x.toFixed(2)}, {b.y.toFixed(2)}) = ({c.x.toFixed(2)}, {c.y.toFixed(2)})
              </span>
            </div>

            {/* 详细数据网格 */}
            <div style={styles.grid}>
              <div style={styles.gridItem}>
                <span style={{ ...styles.itemLabel, color: '#c084fc' }}>分向量 a 坐标</span>
                <span style={styles.itemVal}>({a.x.toFixed(2)}, {a.y.toFixed(2)})</span>
                <span style={styles.itemSubVal}>模长 |a|: {lenA.toFixed(2)}</span>
              </div>
              <div style={styles.gridItem}>
                <span style={{ ...styles.itemLabel, color: '#60a5fa' }}>分向量 b 坐标</span>
                <span style={styles.itemVal}>({b.x.toFixed(2)}, {b.y.toFixed(2)})</span>
                <span style={styles.itemSubVal}>模长 |b|: {lenB.toFixed(2)}</span>
              </div>
              <div style={styles.gridItem}>
                <span style={{ ...styles.itemLabel, color: '#fb923c' }}>合向量 c 坐标</span>
                <span style={styles.itemVal}>({c.x.toFixed(2)}, {c.y.toFixed(2)})</span>
                <span style={styles.itemSubVal}>模长 |c|: {lenC.toFixed(2)}</span>
              </div>
              <div style={styles.gridItem}>
                <span style={{ ...styles.itemLabel, color: '#e2e8f0' }}>几何关联指标</span>
                <span style={styles.itemVal}>夹角: {includeAngle.toFixed(1)}°</span>
                <span style={styles.itemSubVal}>合向角: {angleC.toFixed(1)}°</span>
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
  toggleGroup: {
    display: 'flex',
    background: '#1e293b',
    padding: '3px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  toggleBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  activeToggleBtn: {
    backgroundColor: '#334155',
    color: '#ffffff',
  },
  resetButton: {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
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
  axisLabel: {
    fontSize: '12px',
    fill: '#94a3b8',
    fontWeight: 500,
  } as React.CSSProperties,
  helperLine: {
    stroke: '#475569',
    strokeWidth: 1.2,
    strokeDasharray: '3 3',
  } as React.CSSProperties,
  vectorA: {
    stroke: '#c084fc', // 紫色 a
    strokeWidth: 2.5,
  } as React.CSSProperties,
  vectorB: {
    stroke: '#60a5fa', // 蓝色 b
    strokeWidth: 2.5,
  } as React.CSSProperties,
  vectorC: {
    stroke: '#fb923c', // 橙色 c
    strokeWidth: 3.5,
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
  nodeCTip: {
    fill: '#fb923c',
    stroke: '#c2410c',
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
  labelC: {
    fontSize: '12px',
    fill: '#fb923c',
    fontWeight: 'bold',
  } as React.CSSProperties,
  dashboard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  formulaRow: {
    background: '#1e293b',
    borderRadius: '6px',
    padding: '8px 12px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formulaLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 500,
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#fb923c',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  gridItem: {
    background: '#1e293b',
    borderRadius: '6px',
    padding: '8px 10px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  itemLabel: {
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '2px',
  },
  itemVal: {
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 500,
    color: '#f8fafc',
  },
  itemSubVal: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px',
  },
};