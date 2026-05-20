/**
 * @file src/features/unit-circle/UnitCircleSlice.tsx
 * @description 单位圆最小集成切片（验证数据流闭环）
 *
 * 职责（严格限制）：
 *   ✅ 读取 Store 的 angleRad / radius
 *   ✅ 在组件内用 useMemo 派生 snapshot（sin/cos/tan/向量坐标）
 *   ✅ 提供 angleRad 滑块/输入触发 setAngle Action
 *   ✅ SVG 展示单位圆 + 向量端点联动
 *   ✅ 只读展示 sin / cos / tan / (x, y)
 *
 * 严禁：
 *   ❌ 用 useState 保存角度或任何数学真值
 *   ❌ 把 sin/cos/tan 写入 Store
 *   ❌ 引入屏幕坐标逻辑（已委托给 coordinate.ts）
 */

import { useMemo, useRef, useCallback } from 'react';
import { useMathState } from '@/store/useMathState';
import { computeDerivedSnapshot } from '@/math/trigonometry';
import { radToDeg, degToRad } from '@/math/trigonometry';
import { mathToScreen, screenToMath, containerCenter } from '@/utils/coordinate';
import { vectorToAngle } from '@/math/vector';

// ─── SVG 容器参数（固定用于最小切片展示） ──────────────────
const SVG_SIZE = 320;
const COORD_PARAMS = { width: SVG_SIZE, height: SVG_SIZE, unitPx: 120 };
const CENTER = containerCenter(COORD_PARAMS);

// ─── 主组件 ───────────────────────────────────────────────

export function UnitCircleSlice() {
  // 1. 只从 Store 读取基础状态（真值基底）
  const angleRad = useMathState((s) => s.angleRad);
  const radius = useMathState((s) => s.radius);
  const setAngle = useMathState((s) => s.setAngle);

  // 2. 在组件内派生，不写进 Store
  const snap = useMemo(
    () => computeDerivedSnapshot(angleRad, radius),
    [angleRad, radius],
  );

  // 3. 转换数学坐标到 SVG 屏幕坐标
  const tipScreen = useMemo(
    () => mathToScreen(snap.vector.tip, COORD_PARAMS),
    [snap.vector.tip],
  );

  // 辅助：sin/cos 的屏幕坐标端点（显示辅助线）
  const sinScreen = useMemo(
    () => mathToScreen({ x: snap.vector.tip.x, y: 0 }, COORD_PARAMS),
    [snap.vector.tip],
  );
  const cosScreen = useMemo(
    () => mathToScreen({ x: 0, y: snap.vector.tip.y }, COORD_PARAMS),
    [snap.vector.tip],
  );

  // 4. 用户交互处理（唯一数据入口）
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  const updateAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const mathPos = screenToMath({ x: screenX, y: screenY }, COORD_PARAMS);
      const newAngle = vectorToAngle(mathPos);
      setAngle(newAngle);
    },
    [setAngle],
  );

  const handlePointerDown = (e: React.PointerEvent<SVGGElement | SVGCircleElement>) => {
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement | SVGCircleElement>) => {
    if (!isDragging.current) return;
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement | SVGCircleElement>) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAngle(degToRad(Number(e.target.value)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value);
    if (!isNaN(deg)) {
      setAngle(degToRad(deg));
    }
  };

  const tanDisplay =
    snap.trig.tan === null ? '未定义' : snap.trig.tan.toFixed(4);

  return (
    <div id="unit-circle-slice" className="lab-container">
      <h2 style={styles.title}>单位圆 · 三角定义定义实验室</h2>

      <div className="lab-layout-grid">
        {/* 左侧控制与图形展示面板 */}
        <div className="lab-left-panel">
          <svg
            id="unit-circle-svg"
            ref={svgRef}
            width={SVG_SIZE}
            height={SVG_SIZE}
            style={styles.svg}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          >
            {/* 坐标轴 */}
            <line x1={0} y1={CENTER.y} x2={SVG_SIZE} y2={CENTER.y} style={styles.axis} />
            <line x1={CENTER.x} y1={0} x2={CENTER.x} y2={SVG_SIZE} style={styles.axis} />

            {/* 单位圆 */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={COORD_PARAMS.unitPx}
              style={styles.circle}
            />

            {/* sin 辅助线（竖线，从 x 轴到端点） */}
            <line
              id="sin-line"
              x1={tipScreen.x}
              y1={CENTER.y}
              x2={tipScreen.x}
              y2={tipScreen.y}
              style={styles.sinLine}
            />

            {/* cos 辅助线（横线，从 y 轴到端点） */}
            <line
              id="cos-line"
              x1={CENTER.x}
              y1={tipScreen.y}
              x2={tipScreen.x}
              y2={tipScreen.y}
              style={styles.cosLine}
            />

            {/* 向量（从原点到端点） */}
            <line
              id="vector-line"
              x1={CENTER.x}
              y1={CENTER.y}
              x2={tipScreen.x}
              y2={tipScreen.y}
              style={styles.vector}
            />

            {/* 向量端点 */}
            <circle
              id="vector-tip"
              cx={tipScreen.x}
              cy={tipScreen.y}
              r={10}
              style={{ ...styles.tip, cursor: 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            {/* sin 投影点（x 轴上） */}
            <circle cx={sinScreen.x} cy={CENTER.y} r={4} style={styles.sinDot} />

            {/* cos 投影点（y 轴上） */}
            <circle cx={CENTER.x} cy={cosScreen.y} r={4} style={styles.cosDot} />

            {/* 角度标注 */}
            <text x={CENTER.x + 18} y={CENTER.y - 8} style={styles.label}>
              θ = {radToDeg(angleRad).toFixed(1)}°
            </text>
          </svg>

          {/* ── 控制区（唯一的数据写入入口） ─────────── */}
          <div style={styles.controls}>
            <label htmlFor="angle-slider" style={styles.controlLabel}>
              角度 θ（度）
            </label>
            <div style={styles.sliderRow}>
              <input
                id="angle-slider"
                type="range"
                min={0}
                max={360}
                step={1}
                value={Math.round(radToDeg(angleRad))}
                onChange={handleSliderChange}
                style={styles.slider}
              />
              <input
                id="angle-input"
                type="number"
                min={0}
                max={360}
                step={1}
                value={radToDeg(angleRad).toFixed(1)}
                onChange={handleInputChange}
                style={styles.numberInput}
              />
            </div>
          </div>
        </div>

        {/* 右侧数据分析面板 */}
        <div className="lab-right-panel" style={{ justifyContent: 'center' }}>
          <div style={styles.readonlyGrid}>
            <ReadonlyRow id="display-sin" label="sin θ (对边/斜边)" value={snap.trig.sin.toFixed(6)} color="#4ade80" />
            <ReadonlyRow id="display-cos" label="cos θ (邻边/斜边)" value={snap.trig.cos.toFixed(6)} color="#60a5fa" />
            <ReadonlyRow id="display-tan" label="tan θ (对边/邻边)" value={tanDisplay} color="#f59e0b" />
            <ReadonlyRow id="display-x" label="x 轴分量" value={snap.vector.tip.x.toFixed(6)} color="#a78bfa" />
            <ReadonlyRow id="display-y" label="y 轴分量" value={snap.vector.tip.y.toFixed(6)} color="#f472b6" />
          </div>
        </div>
      </div>
    </div>
  );

}

// ─── 只读值展示子组件 ──────────────────────────────────────
function ReadonlyRow({
  id,
  label,
  value,
  color,
}: {
  id: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={styles.readonlyRow}>
      <span style={{ ...styles.readonlyLabel, color }}>{label}</span>
      <span id={id} style={styles.readonlyValue}>
        {value}
      </span>
    </div>
  );
}

// ─── 内联样式（最小集成，不引入 CSS 文件避免路径复杂度） ────
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
    maxWidth: '400px',
    margin: '0 auto',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  svg: {
    background: '#1e293b',
    borderRadius: '8px',
    display: 'block',
  },
  axis: {
    stroke: '#334155',
    strokeWidth: 1,
  } as React.CSSProperties,
  circle: {
    fill: 'none',
    stroke: '#475569',
    strokeWidth: 1.5,
    strokeDasharray: '4 3',
  } as React.CSSProperties,
  vector: {
    stroke: '#818cf8',
    strokeWidth: 2.5,
  } as React.CSSProperties,
  tip: {
    fill: '#818cf8',
  } as React.CSSProperties,
  sinLine: {
    stroke: '#4ade80',
    strokeWidth: 1.5,
    strokeDasharray: '3 2',
  } as React.CSSProperties,
  cosLine: {
    stroke: '#60a5fa',
    strokeWidth: 1.5,
    strokeDasharray: '3 2',
  } as React.CSSProperties,
  sinDot: {
    fill: '#4ade80',
  } as React.CSSProperties,
  cosDot: {
    fill: '#60a5fa',
  } as React.CSSProperties,
  label: {
    fontSize: '11px',
    fill: '#94a3b8',
  } as React.CSSProperties,
  controls: {
    width: '100%',
  },
  controlLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    display: 'block',
    marginBottom: '6px',
  },
  sliderRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    accentColor: '#818cf8',
  },
  numberInput: {
    width: '64px',
    padding: '4px 6px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#e2e8f0',
    fontSize: '13px',
    textAlign: 'right',
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
    padding: '6px 10px',
    background: '#1e293b',
    borderRadius: '6px',
    fontSize: '13px',
  },
  readonlyLabel: {
    fontWeight: 500,
  },
  readonlyValue: {
    fontFamily: 'monospace',
    color: '#e2e8f0',
  },
};
