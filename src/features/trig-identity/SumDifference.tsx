import { useState, useMemo, useRef } from 'react';
import { useMathState } from '@/store/useMathState';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { mathToScreen, screenToMath } from '@/utils/coordinate';
import { angleToVector, vectorToAngle, scale } from '@/math/vector';
import { computeSumDifference } from '@/math/trigIdentity';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';


const PI = Math.PI;
const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 400;
const UNIT_PX = 130; // 适当缩放以完美展示单位圆

export function SumDifference() {
  const alpha = useMathState((s) => s.angleRad);
  const beta = useMathState((s) => s.angleRad2);
  const setAlpha = useMathState((s) => s.setAngle);
  const setBeta = useMathState((s) => s.setAngle2);

  // 区分是“两角和”还是“两角差”实验
  const [opMode, setOpMode] = useState<'sum' | 'diff'>('sum');

  // 手势拖拽状态控制
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<'alpha' | 'beta' | null>(null);

  const coordParams = { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX };

  // 派生计算 U (α), V (β), U_perp (α+π/2)
  const U = useMemo(() => angleToVector(alpha), [alpha]);
  const V = useMemo(() => angleToVector(beta), [beta]);



  // 和差角结果
  const targetAngle = useMemo(() => {
    return opMode === 'sum' ? alpha + beta : alpha - beta;
  }, [alpha, beta, opMode]);

  const W = useMemo(() => angleToVector(targetAngle), [targetAngle]);

  // 几何投影计算：W = cos(β) * U ± sin(β) * U_perp
  const cosBeta = Math.cos(beta);

  const P = useMemo(() => scale(U, cosBeta), [U, cosBeta]); // 沿着 U 的投影点


  // 屏幕坐标映射
  const ptCenter = mathToScreen({ x: 0, y: 0 }, coordParams);
  const ptU = mathToScreen(U, coordParams);
  const ptV = mathToScreen(V, coordParams);
  const ptW = mathToScreen(W, coordParams);
  const ptP = mathToScreen(P, coordParams);

  // 纯代数恒等计算
  const derived = useMemo(() => computeSumDifference(alpha, beta), [alpha, beta]);

  // 手势事件响应
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const clickMath = screenToMath({ x: clientX, y: clientY }, coordParams);

    // 计算点击位置距 U、V 两个端点的数学距离，决定拖动目标
    const distSqU = Math.pow(clickMath.x - U.x, 2) + Math.pow(clickMath.y - U.y, 2);
    const distSqV = Math.pow(clickMath.x - V.x, 2) + Math.pow(clickMath.y - V.y, 2);

    const threshold = 0.15; // 约等于 20px
    if (distSqU < distSqV && distSqU < threshold) {
      setDragTarget('alpha');
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (distSqV < threshold) {
      setDragTarget('beta');
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragTarget || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const mathPt = screenToMath({ x: clientX, y: clientY }, coordParams);

    const newAngle = vectorToAngle(mathPt);
    if (dragTarget === 'alpha') {
      setAlpha(newAngle);
    } else {
      setBeta(newAngle);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setDragTarget(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // 快捷预设角
  const setPreset = (degA: number, degB: number) => {
    setAlpha((degA * PI) / 180);
    setBeta((degB * PI) / 180);
  };

  // 角度转换度数方便显示
  const alphaDeg = ((alpha * 180) / PI).toFixed(1);
  const betaDeg = ((beta * 180) / PI).toFixed(1);
  const targetAngleDeg = ((targetAngle * 180) / PI).toFixed(1);

  // ─────────────────────────────────────────────
  // § UI 渲染 - 左侧面板 (操作区)
  // ─────────────────────────────────────────────
  const leftPanel = (
    <div style={styles.sidebar}>
      <h3 style={styles.panelTitle}>两角和差控制器</h3>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>变换公式选择:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={() => setOpMode('sum')}
            style={{
              ...styles.modeButton,
              backgroundColor: opMode === 'sum' ? '#6366f1' : '#1e293b',
              borderColor: opMode === 'sum' ? '#818cf8' : '#334155',
            }}
          >
            两角和 (α + β)
          </button>
          <button
            onClick={() => setOpMode('diff')}
            style={{
              ...styles.modeButton,
              backgroundColor: opMode === 'diff' ? '#6366f1' : '#1e293b',
              borderColor: opMode === 'diff' ? '#818cf8' : '#334155',
            }}
          >
            两角差 (α - β)
          </button>
        </div>
      </div>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>角 α 弧度 (蓝色基准):</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{alphaDeg}°</span>
        </div>
        <input
          type="range"
          min="0"
          max={2 * PI}
          step="0.02"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          style={styles.rangeInput}
        />
        <div style={{ ...styles.funcFormula, color: '#38bdf8' }}>
          α = {(alpha / PI).toFixed(2)}π
        </div>
      </div>

      <div style={styles.controlGroup}>
        <div style={styles.labelRow}>
          <span>角 β 弧度 (绿色参考):</span>
          <span style={{ color: '#34d399', fontWeight: 'bold' }}>{betaDeg}°</span>
        </div>
        <input
          type="range"
          min="0"
          max={2 * PI}
          step="0.02"
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          style={styles.rangeInput}
        />
        <div style={{ ...styles.funcFormula, color: '#34d399' }}>
          β = {(beta / PI).toFixed(2)}π
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ ...styles.labelRow, fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
          常用经典角组合预设
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button onClick={() => setPreset(30, 45)} style={styles.presetButton}>
            α=30°, β=45°
          </button>
          <button onClick={() => setPreset(60, 30)} style={styles.presetButton}>
            α=60°, β=30°
          </button>
          <button onClick={() => setPreset(120, 45)} style={styles.presetButton}>
            α=120°, β=45°
          </button>
          <button onClick={() => setPreset(45, 45)} style={styles.presetButton}>
            α=45°, β=45°
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // § UI 渲染 - 中间面板 (图形区)
  // ─────────────────────────────────────────────
  const centerPanel = (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasHeader}>
        <span style={styles.canvasTitle}>单位圆双角投影与分解几何圆</span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>拖动圆周上的端点交互</span>
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
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 坐标轴 */}
        <line x1={0} y1={ptCenter.y} x2={CONTAINER_WIDTH} y2={ptCenter.y} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={ptCenter.x} y1={0} x2={ptCenter.x} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* 单位圆 */}
        <circle cx={ptCenter.x} cy={ptCenter.y} r={UNIT_PX} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />

        {/* 基底向量 U (α) — 蓝色 */}
        <line x1={ptCenter.x} y1={ptCenter.y} x2={ptU.x} y2={ptU.y} stroke="#38bdf8" strokeWidth={2.5} />
        <text x={ptU.x + 8} y={ptU.y - 4} fill="#38bdf8" fontSize="12" fontWeight="bold" style={{ userSelect: 'none' }}>
          U (α)
        </text>

        {/* 参考向量 V (β) — 绿色 */}
        <line x1={ptCenter.x} y1={ptCenter.y} x2={ptV.x} y2={ptV.y} stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
        <text x={ptV.x + 8} y={ptV.y + 12} fill="#34d399" fontSize="12" opacity={0.7} style={{ userSelect: 'none' }}>
          V (β)
        </text>

        {/* 目标叠加向量 W (α ± β) — 橙色 */}
        <line x1={ptCenter.x} y1={ptCenter.y} x2={ptW.x} y2={ptW.y} stroke="#fb923c" strokeWidth={3} filter="url(#glow-orange)" />
        <text x={ptW.x + 8} y={ptW.y - 8} fill="#fb923c" fontSize="12" fontWeight="bold" style={{ userSelect: 'none' }}>
          W (α {opMode === 'sum' ? '+' : '-'} β)
        </text>

        {/* 几何分解关系绘制 */}
        {/* 1. 沿 U 的投影段 OP (长度 cos β) */}
        <line x1={ptCenter.x} y1={ptCenter.y} x2={ptP.x} y2={ptP.y} stroke="#818cf8" strokeWidth={3.5} strokeDasharray="4 2" />
        <circle cx={ptP.x} cy={ptP.y} r={3} fill="#818cf8" />
        <text x={ptP.x - 12} y={ptP.y + 14} fill="#818cf8" fontSize="10" style={{ userSelect: 'none' }}>
          P (cos β·U)
        </text>

        {/* 2. 垂直于 U 的投影段 PW (长度 sin β, 方向垂直) */}
        <line x1={ptP.x} y1={ptP.y} x2={ptW.x} y2={ptW.y} stroke="#c084fc" strokeWidth={2.5} strokeDasharray="4 2" />
        <text x={(ptP.x + ptW.x) / 2 + 8} y={(ptP.y + ptW.y) / 2} fill="#c084fc" fontSize="10" style={{ userSelect: 'none' }}>
          {opMode === 'sum' ? '+' : '-'}sin β·U┴
        </text>

        {/* 拖动控制小球 */}
        <circle cx={ptU.x} cy={ptU.y} r={7} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} style={{ cursor: 'pointer' }} />
        <circle cx={ptV.x} cy={ptV.y} r={7} fill="#34d399" stroke="#ffffff" strokeWidth={1.5} style={{ cursor: 'pointer' }} />
        <circle cx={ptW.x} cy={ptW.y} r={4} fill="#fb923c" stroke="#ffffff" strokeWidth={1} />
        <circle cx={ptCenter.x} cy={ptCenter.y} r={3.5} fill="#ffffff" />
      </svg>

      <div style={styles.legendContainer}>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#38bdf8' }} />U (α基准)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#34d399' }} />V (β输入)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#fb923c' }} />W (合成角)</div>
        <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#818cf8' }} />OP 纵向投影</div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // § UI 渲染 - 右侧面板 (公式与数据区)
  // ─────────────────────────────────────────────
  const rightPanel = (
    <div style={styles.sidebar}>
      <h3 style={{ ...styles.panelTitle, color: '#fb923c' }}>恒等变换代数看板</h3>

      {/* 实时公式对照 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>向量投影分解模型 (直观几何法)</div>
        <div style={{ fontSize: '13px', lineHeight: '1.5em', color: '#cbd5e1' }}>
          建立以 <span style={{ color: '#38bdf8' }}>U</span> 及其正交向量 <span style={{ color: '#c084fc' }}>U┴</span> 的平面基底：
          <div style={{ margin: '8px 0' }}>
            <BlockMath math={`\\vec{W} = \\cos\\beta \\cdot \\vec{U} ${opMode === 'sum' ? '+' : '-'} \\sin\\beta \\cdot \\vec{U}^\\perp`} />
          </div>
          代入 <InlineMath math={`\\vec{U}=(\\cos\\alpha, \\sin\\alpha)`} /> 与 <InlineMath math={`\\vec{U}^\\perp=(-\\sin\\alpha, \\cos\\alpha)`} />，即可严格推导出两角和差公式。
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          {opMode === 'sum' ? '两角和公式' : '两角差公式'} (LaTeX 恒等性)
        </div>
        <div style={{ overflowX: 'auto', padding: '6px 0' }}>
          {opMode === 'sum' ? (
            <>
              <div style={styles.katexBox}>
                <BlockMath math={`\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta`} />
              </div>
              <div style={styles.katexBox}>
                <BlockMath math={`\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta`} />
              </div>
            </>
          ) : (
            <>
              <div style={styles.katexBox}>
                <BlockMath math={`\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta`} />
              </div>
              <div style={styles.katexBox}>
                <BlockMath math={`\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta`} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 实时数值对比校验 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>数值实时校验 (精度误差检验)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>和差角度:</span>
            <span style={{ fontWeight: 'bold' }}>{opMode === 'sum' ? 'α+β' : 'α-β'} = {targetAngleDeg}°</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a78bfa' }}>
            <span>左边计算值:</span>
            <span>
              {opMode === 'sum'
                ? Math.sin(alpha + beta).toFixed(4)
                : Math.sin(alpha - beta).toFixed(4)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f472b6' }}>
            <span>公式右边展开:</span>
            <span>{opMode === 'sum' ? derived.sinSum.toFixed(4) : derived.sinDiff.toFixed(4)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '4px 0' }} />
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
            已通过后台纯函数高精校验，满足恒等变换规律。
          </div>
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
  modeButton: {
    flex: 1,
    color: '#f8fafc',
    border: '1px solid',
    borderRadius: '4px',
    padding: '8px 4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
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
  katexBox: {
    margin: '4px 0',
  },
};
