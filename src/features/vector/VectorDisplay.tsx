/**
 * @file src/features/vector/VectorDisplay.tsx
 * @description 向量基础组件（支持首尾拖拽、分量投影、平移到原点及数值看板）
 *
 * 职责：
 *   ✅ 提供起点 A 和终点 B 的拖拽手势交互（通过 screenToMath / mathToScreen 转换）
 *   ✅ 绘制带箭头的向量线段，并在端点渲染控制滑块
 *   ✅ 绘制 $dx$ 和 $dy$ 投影虚线段，构建直角三角形以直白展现分量
 *   ✅ 支持“平移到原点”以说明自由向量与位置无关的数学本质
 *   ✅ 只读展示 A, B 坐标、向量分量、长度及方向角
 */

import { useState, useMemo, useRef } from 'react';
import { mathToScreen, screenToMath, containerCenter } from '@/utils/coordinate';
import { sub, magnitude, vectorToAngle } from '@/math/vector';
import { radToDeg } from '@/math/trigonometry';
import type { Vector2 } from '@/types/math';

// ─── SVG 容器参数 ──────────────────────────────────────────
const SVG_SIZE = 360;
const COORD_PARAMS = { width: SVG_SIZE, height: SVG_SIZE, unitPx: 55 }; // 数学单位 [-3, 3] 范围
const CENTER = containerCenter(COORD_PARAMS);

// ─── 初始值 ────────────────────────────────────────────────
const INITIAL_START: Vector2 = { x: -1, y: -0.5 };
const INITIAL_END: Vector2 = { x: 1, y: 1.5 };

export function VectorDisplay() {
  // 1. 局部状态维护起点与终点数学坐标
  const [start, setStart] = useState<Vector2>(INITIAL_START);
  const [end, setEnd] = useState<Vector2>(INITIAL_END);

  // 2. 派生状态计算
  const vector = useMemo(() => sub(end, start), [start, end]);
  const len = useMemo(() => magnitude(vector), [vector]);
  const angleRad = useMemo(() => vectorToAngle(vector), [vector]);
  const angleDeg = useMemo(() => radToDeg(angleRad), [angleRad]);

  // 3. 坐标转换用于渲染
  const startScreen = useMemo(() => mathToScreen(start, COORD_PARAMS), [start]);
  const endScreen = useMemo(() => mathToScreen(end, COORD_PARAMS), [end]);
  const cornerScreen = useMemo(() => mathToScreen({ x: end.x, y: start.y }, COORD_PARAMS), [start.y, end.x]);

  // 4. 拖拽手势逻辑
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingNode = useRef<'start' | 'end' | null>(null);

  const handlePointerDown = (node: 'start' | 'end', e: React.PointerEvent<SVGCircleElement>) => {
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
    
    // 限制向量端点在绘制区域内 [-3.2, 3.2]
    const x = Math.max(-3.2, Math.min(3.2, mathPos.x));
    const y = Math.max(-3.2, Math.min(3.2, mathPos.y));

    if (draggingNode.current === 'start') {
      setStart({ x, y });
    } else if (draggingNode.current === 'end') {
      setEnd({ x, y });
    }
  };

  const handlePointerUp = () => {
    if (!draggingNode.current) return;
    draggingNode.current = null;
  };

  // 5. 交互 Action
  const handleReset = () => {
    setStart(INITIAL_START);
    setEnd(INITIAL_END);
  };

  const handleTranslateToOrigin = () => {
    // 平移向量起点到原点 (0, 0)，终点保持相对向量位置不变
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    setStart({ x: 0, y: 0 });
    setEnd({ x: dx, y: dy });
  };

  // 6. 生成网格线
  const gridLines = useMemo(() => {
    const lines = [];
    // 范围在 [-3, 3] 之间画辅助线
    for (let val = -3; val <= 3; val++) {
      if (val === 0) continue;
      // 垂直线
      const p1 = mathToScreen({ x: val, y: -3.2 }, COORD_PARAMS);
      const p2 = mathToScreen({ x: val, y: 3.2 }, COORD_PARAMS);
      lines.push(
        <line key={`v-${val}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} style={styles.gridLine} />
      );
      // 水平线
      const p3 = mathToScreen({ x: -3.2, y: val }, COORD_PARAMS);
      const p4 = mathToScreen({ x: 3.2, y: val }, COORD_PARAMS);
      lines.push(
        <line key={`h-${val}`} x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} style={styles.gridLine} />
      );
    }
    return lines;
  }, []);

  return (
    <div id="vector-display-slice" className="lab-container">
      <h2 style={styles.title}>平面向量 · 首尾交互实验室</h2>
      <p style={styles.subtitle}>拖拽起点 A 或终点 B，体验向量的坐标分量与平移本质</p>

      <div className="lab-layout-grid">
        {/* 左侧：画板及交互控制 */}
        <div className="lab-left-panel">
          <svg
            id="vector-svg"
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
              {/* 定义向量箭头 */}
              <marker
                id="vector-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 Z" fill="#c084fc" />
              </marker>
            </defs>

            {/* 辅助网格 */}
            {gridLines}

            {/* 坐标轴 */}
            <line x1={0} y1={CENTER.y} x2={SVG_SIZE} y2={CENTER.y} style={styles.axis} />
            <line x1={CENTER.x} y1={0} x2={CENTER.x} y2={SVG_SIZE} style={styles.axis} />

            {/* x轴和y轴箭头 */}
            <path d={`M ${SVG_SIZE} ${CENTER.y} L ${SVG_SIZE - 8} ${CENTER.y - 4} L ${SVG_SIZE - 8} ${CENTER.y + 4} Z`} fill="#475569" />
            <path d={`M ${CENTER.x} 0 L ${CENTER.x - 4} 8 L ${CENTER.x + 4} 8 Z`} fill="#475569" />
            <text x={SVG_SIZE - 12} y={CENTER.y + 16} style={styles.axisLabel}>x</text>
            <text x={CENTER.x - 16} y={12} style={styles.axisLabel}>y</text>

            {/* ── 投影与直角三角形辅助线（展现坐标分量） ── */}
            {/* dx 投影线（水平，起点到直角顶点） */}
            <line
              id="vector-dx-line"
              x1={startScreen.x}
              y1={startScreen.y}
              x2={cornerScreen.x}
              y2={cornerScreen.y}
              style={styles.dxLine}
            />
            {/* dy 投影线（垂直，直角顶点到终点） */}
            <line
              id="vector-dy-line"
              x1={cornerScreen.x}
              y1={cornerScreen.y}
              x2={endScreen.x}
              y2={endScreen.y}
              style={styles.dyLine}
            />

            {/* ── 向量主线 ── */}
            <line
              id="vector-line"
              x1={startScreen.x}
              y1={startScreen.y}
              x2={endScreen.x}
              y2={endScreen.y}
              style={styles.vector}
              markerEnd="url(#vector-arrow)"
            />

            {/* ── 控制手势圆点 ── */}
            {/* 起点 A */}
            <circle
              id="vector-start-node"
              cx={startScreen.x}
              cy={startScreen.y}
              r={10}
              style={{ ...styles.startTip, cursor: 'grab' }}
              onPointerDown={(e) => handlePointerDown('start', e)}
            />
            {/* 终点 B */}
            <circle
              id="vector-end-node"
              cx={endScreen.x}
              cy={endScreen.y}
              r={10}
              style={{ ...styles.endTip, cursor: 'grab' }}
              onPointerDown={(e) => handlePointerDown('end', e)}
            />

            {/* 文本标注（随点漂移） */}
            <text x={startScreen.x - 12} y={startScreen.y - 12} style={styles.nodeLabel}>A</text>
            <text x={endScreen.x + 12} y={endScreen.y - 12} style={styles.nodeLabel}>B</text>
          </svg>

          {/* ── 快速操作区 ────────────────────────────── */}
          <div style={styles.buttonGroup}>
            <button id="btn-translate-origin" onClick={handleTranslateToOrigin} style={styles.primaryButton}>
              平移到原点 (A = 0)
            </button>
            <button id="btn-reset-vector" onClick={handleReset} style={styles.secondaryButton}>
              重置
            </button>
          </div>
        </div>

        {/* 右侧：数据分析看板 */}
        <div className="lab-right-panel" style={{ justifyContent: 'center' }}>
          <div style={styles.readonlyGrid}>
            <div style={styles.readonlyRow}>
              <span style={{ ...styles.readonlyLabel, color: '#60a5fa' }}>起点 A 坐标</span>
              <span id="display-vector-start" style={styles.readonlyValue}>
                ({start.x.toFixed(2)}, {start.y.toFixed(2)})
              </span>
            </div>
            <div style={styles.readonlyRow}>
              <span style={{ ...styles.readonlyLabel, color: '#f472b6' }}>终点 B 坐标</span>
              <span id="display-vector-end" style={styles.readonlyValue}>
                ({end.x.toFixed(2)}, {end.y.toFixed(2)})
              </span>
            </div>
            <div style={styles.readonlyRow}>
              <span style={{ ...styles.readonlyLabel, color: '#c084fc' }}>向量 AB (B - A)</span>
              <span id="display-vector-coords" style={styles.readonlyValue}>
                ({vector.x.toFixed(2)}, {vector.y.toFixed(2)})
              </span>
            </div>
            <div style={styles.readonlyRow}>
              <span style={{ ...styles.readonlyLabel, color: '#4ade80' }}>向量模长 |AB|</span>
              <span id="display-vector-len" style={styles.readonlyValue}>
                {len.toFixed(4)}
              </span>
            </div>
            <div style={styles.readonlyRow}>
              <span style={{ ...styles.readonlyLabel, color: '#fbbf24' }}>方向角 θ (与x轴正向)</span>
              <span id="display-vector-angle" style={styles.readonlyValue}>
                {angleDeg.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

// ─── 内联样式 ──────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    background: '#0f172a',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, sans-serif',
    maxWidth: '420px',
    margin: '0 auto',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    border: '1px solid #1e293b',
  },
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
  dxLine: {
    stroke: '#38bdf8', // 浅蓝色代表 dx
    strokeWidth: 1.5,
    strokeDasharray: '4 4',
  } as React.CSSProperties,
  dyLine: {
    stroke: '#fb7185', // 浅粉色代表 dy
    strokeWidth: 1.5,
    strokeDasharray: '4 4',
  } as React.CSSProperties,
  vector: {
    stroke: '#c084fc', // 紫色代表向量
    strokeWidth: 3,
  } as React.CSSProperties,
  startTip: {
    fill: '#60a5fa', // 蓝色起点
    stroke: '#1d4ed8',
    strokeWidth: 2,
  } as React.CSSProperties,
  endTip: {
    fill: '#f472b6', // 粉色终点
    stroke: '#be185d',
    strokeWidth: 2,
  } as React.CSSProperties,
  nodeLabel: {
    fontSize: '13px',
    fill: '#f8fafc',
    fontWeight: 'bold',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  primaryButton: {
    flex: 2,
    background: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
    outline: 'none',
  },
  secondaryButton: {
    flex: 1,
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
    outline: 'none',
  },
  readonlyGrid: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  readonlyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#1e293b',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #334155',
  },
  readonlyLabel: {
    fontWeight: 600,
  },
  readonlyValue: {
    fontFamily: 'monospace',
    color: '#f8fafc',
    fontWeight: 500,
  },
};
