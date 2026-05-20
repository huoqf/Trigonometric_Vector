/**
 * @file src/features/unit-circle/InductionSymmetry.tsx
 * @description 诱导公式几何对称映射实验主组件
 */

import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useMathState } from '@/store/useMathState';
import { computeTrig } from '@/math/trigonometry';
import { radToDeg, degToRad } from '@/math/trigonometry';
import { mathToScreen, screenToMath, containerCenter } from '@/utils/coordinate';
import { vectorToAngle } from '@/math/vector';

// ─── SVG 容器与坐标系参数 ──────────────────────────
const SVG_SIZE = 340;
const COORD_PARAMS = { width: SVG_SIZE, height: SVG_SIZE, unitPx: 120 };
const CENTER = containerCenter(COORD_PARAMS);

// ─── 诱导公式类型定义 ──────────────────────────────
type FormulaType =
  | 'pi_plus_alpha'
  | 'neg_alpha'
  | 'pi_minus_alpha'
  | 'two_pi_minus_alpha'
  | 'half_pi_minus_alpha'
  | 'half_pi_plus_alpha';

interface FormulaMeta {
  readonly id: FormulaType;
  readonly name: string;
  readonly mathExpr: string;
  readonly symmetry: string;
  readonly relation: string;
  readonly sinFormula: string;
  readonly cosFormula: string;
  readonly tanFormula: string;
  readonly explanation: string;
}

const FORMULA_LIST: FormulaMeta[] = [
  {
    id: 'pi_minus_alpha',
    name: '公式四：π - α',
    mathExpr: 'π - α',
    symmetry: '关于 y 轴对称',
    relation: '终点关于 y 轴对称，纵坐标相同，横坐标相反',
    sinFormula: 'sin(π - α) = sin α',
    cosFormula: 'cos(π - α) = -cos α',
    tanFormula: 'tan(π - α) = -tan α',
    explanation: '“偶”倍π函数名不变；第二象限中 sin 为正，cos 和 tan 为负。',
  },
  {
    id: 'neg_alpha',
    name: '公式三：-α',
    mathExpr: '-α',
    symmetry: '关于 x 轴对称',
    relation: '终点关于 x 轴对称，横坐标相同，纵坐标相反',
    sinFormula: 'sin(-α) = -sin α',
    cosFormula: 'cos(-α) = cos α',
    tanFormula: 'tan(-α) = -tan α',
    explanation: '“偶”倍π函数名不变；第四象限中 cos 为正，sin 和 tan 为负。',
  },
  {
    id: 'pi_plus_alpha',
    name: '公式二：π + α',
    mathExpr: 'π + α',
    symmetry: '关于原点对称',
    relation: '终点关于原点对称，横纵坐标均相反',
    sinFormula: 'sin(π + α) = -sin α',
    cosFormula: 'cos(π + α) = -cos α',
    tanFormula: 'tan(π + α) = tan α',
    explanation: '“偶”倍π函数名不变；第三象限中 tan 为正，sin 和 cos 为负。',
  },
  {
    id: 'two_pi_minus_alpha',
    name: '公式五：2π - α',
    mathExpr: '2π - α',
    symmetry: '关于 x 轴对称',
    relation: '终点关于 x 轴对称，等价于 -α 角',
    sinFormula: 'sin(2π - α) = -sin α',
    cosFormula: 'cos(2π - α) = cos α',
    tanFormula: 'tan(2π - α) = -tan α',
    explanation: '“偶”倍π函数名不变；第四象限中 cos 为正，sin 和 tan 为负。',
  },
  {
    id: 'half_pi_minus_alpha',
    name: '公式六：π/2 - α',
    mathExpr: 'π/2 - α',
    symmetry: '关于直线 y = x 对称',
    relation: '终点关于 y = x 对称，横纵坐标互换',
    sinFormula: 'sin(π/2 - α) = cos α',
    cosFormula: 'cos(π/2 - α) = sin α',
    tanFormula: 'tan(π/2 - α) = cot α',
    explanation: '“奇”倍π/2导致“正余弦互变”；第一象限中所有三角函数均为正。',
  },
  {
    id: 'half_pi_plus_alpha',
    name: '公式七：π/2 + α',
    mathExpr: 'π/2 + α',
    symmetry: '旋转 90° (关于第二象限垂直角)',
    relation: '终点相当于将 P 逆时针转 90°，横纵坐标互换并加符号',
    sinFormula: 'sin(π/2 + α) = cos α',
    cosFormula: 'cos(π/2 + α) = -sin α',
    tanFormula: 'tan(π/2 + α) = -cot α',
    explanation: '“奇”倍π/2导致“正余弦互变”；第二象限中 sin 为正，cos 为负。',
  },
];

// ─── 弧度规范化到 [0, 2π) ──────────────────────────
function formatRadTo2Pi(rad: number): number {
  const TWO_PI = 2 * Math.PI;
  const mod = rad % TWO_PI;
  return mod < 0 ? mod + TWO_PI : mod;
}

export function InductionSymmetry() {
  const angleRad = useMathState((s) => s.angleRad); // 参考角 α
  const setAngle = useMathState((s) => s.setAngle);
  
  const [selectedFormulaId, setSelectedFormulaId] = useState<FormulaType>('pi_minus_alpha');
  const [mnemonicExpanded, setMnemonicExpanded] = useState(true);

  // 1. 获取当前公式元数据
  const currentMeta = useMemo(() => {
    return FORMULA_LIST.find((f) => f.id === selectedFormulaId) || FORMULA_LIST[0];
  }, [selectedFormulaId]);

  // 2. 计算对称角 β
  const betaRad = useMemo(() => {
    switch (selectedFormulaId) {
      case 'pi_minus_alpha':
        return Math.PI - angleRad;
      case 'neg_alpha':
        return -angleRad;
      case 'pi_plus_alpha':
        return Math.PI + angleRad;
      case 'two_pi_minus_alpha':
        return 2 * Math.PI - angleRad;
      case 'half_pi_minus_alpha':
        return Math.PI / 2 - angleRad;
      case 'half_pi_plus_alpha':
        return Math.PI / 2 + angleRad;
      default:
        return angleRad;
    }
  }, [angleRad, selectedFormulaId]);

  // 3. 计算三角函数值 (参考角 α 与 对称角 β)
  const trigAlpha = useMemo(() => computeTrig(angleRad), [angleRad]);
  const trigBeta = useMemo(() => computeTrig(betaRad), [betaRad]);

  // 4. 终点坐标 (数学空间)
  const pMath = useMemo(() => ({ x: trigAlpha.cos, y: trigAlpha.sin }), [trigAlpha]);
  const qMath = useMemo(() => ({ x: trigBeta.cos, y: trigBeta.sin }), [trigBeta]);

  // 5. 转换到 SVG 屏幕空间
  const pScreen = useMemo(() => mathToScreen(pMath, COORD_PARAMS), [pMath]);
  const qScreen = useMemo(() => mathToScreen(qMath, COORD_PARAMS), [qMath]);

  // 6. 用户鼠标/触控拖拽 P 点以改变 α
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

  // 7. 计算弧度路径 (SVG A 弧线)
  const getArcPath = useCallback((angle: number, radius: number) => {
    const normalized = formatRadTo2Pi(angle);
    if (normalized <= 0.02) return '';
    
    const startX = CENTER.x + radius;
    const startY = CENTER.y;
    const endX = CENTER.x + radius * Math.cos(normalized);
    const endY = CENTER.y - radius * Math.sin(normalized);

    const largeArcFlag = normalized > Math.PI ? 1 : 0;
    // 逆时针绘制在屏幕上 (sweep-flag 为 0)
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endX} ${endY}`;
  }, []);

  const arcAlphaPath = useMemo(() => getArcPath(angleRad, 36), [angleRad, getArcPath]);
  const arcBetaPath = useMemo(() => getArcPath(betaRad, 52), [betaRad, getArcPath]);

  // 8. 辅助对称辅助线渲染
  const renderSymmetryLines = () => {
    switch (selectedFormulaId) {
      case 'pi_minus_alpha': // 关于 y 轴对称：水平连接
        return (
          <>
            <line x1={pScreen.x} y1={pScreen.y} x2={qScreen.x} y2={qScreen.y} style={styles.symmetryDottedLine} />
            {/* y 轴对称提示投影虚线 */}
            <line x1={pScreen.x} y1={pScreen.y} x2={pScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={qScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
          </>
        );
      case 'neg_alpha':
      case 'two_pi_minus_alpha': // 关于 x 轴对称：垂直连接
        return (
          <>
            <line x1={pScreen.x} y1={pScreen.y} x2={qScreen.x} y2={qScreen.y} style={styles.symmetryDottedLine} />
            {/* x 轴对称提示投影虚线 */}
            <line x1={pScreen.x} y1={pScreen.y} x2={CENTER.x} y2={pScreen.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={CENTER.x} y2={qScreen.y} style={styles.projectionDottedLine} />
          </>
        );
      case 'pi_plus_alpha': // 关于原点对称：穿过中心的直线
        return (
          <>
            <line x1={pScreen.x} y1={pScreen.y} x2={qScreen.x} y2={qScreen.y} style={styles.symmetryDottedLine} />
            {/* 正交投影辅助虚线箱 */}
            <line x1={pScreen.x} y1={pScreen.y} x2={pScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={qScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={pScreen.x} y1={pScreen.y} x2={CENTER.x} y2={pScreen.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={CENTER.x} y2={qScreen.y} style={styles.projectionDottedLine} />
          </>
        );
      case 'half_pi_minus_alpha': // 关于直线 y = x 对称
        const diagStart = mathToScreen({ x: -1.2, y: -1.2 }, COORD_PARAMS);
        const diagEnd = mathToScreen({ x: 1.2, y: 1.2 }, COORD_PARAMS);
        return (
          <>
            {/* 绘制对角线 y = x */}
            <line x1={diagStart.x} y1={diagStart.y} x2={diagEnd.x} y2={diagEnd.y} style={styles.diagReferenceLine} />
            {/* 连接 P 与 Q */}
            <line x1={pScreen.x} y1={pScreen.y} x2={qScreen.x} y2={qScreen.y} style={styles.symmetryDottedLine} />
            {/* 正交投影虚线展示 x, y 坐标互换 */}
            <line x1={pScreen.x} y1={pScreen.y} x2={pScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={pScreen.x} y1={pScreen.y} x2={CENTER.x} y2={pScreen.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={qScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={CENTER.x} y2={qScreen.y} style={styles.projectionDottedLine} />
          </>
        );
      case 'half_pi_plus_alpha': // 旋转 90°
        return (
          <>
            {/* 呈现两终边互相垂直 */}
            <line x1={pScreen.x} y1={pScreen.y} x2={qScreen.x} y2={qScreen.y} style={{ ...styles.symmetryDottedLine, stroke: '#a78bfa', opacity: 0.4 }} />
            <line x1={pScreen.x} y1={pScreen.y} x2={pScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={pScreen.x} y1={pScreen.y} x2={CENTER.x} y2={pScreen.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={qScreen.x} y2={CENTER.y} style={styles.projectionDottedLine} />
            <line x1={qScreen.x} y1={qScreen.y} x2={CENTER.x} y2={qScreen.y} style={styles.projectionDottedLine} />
          </>
        );
      default:
        return null;
    }
  };

  const formattedAlpha = (radToDeg(angleRad) % 360).toFixed(1);
  const formattedBeta = (radToDeg(betaRad) % 360).toFixed(1);

  return (
    <div id="induction-symmetry-lab" className="lab-container" style={styles.containerOverride}>
      <h2 style={styles.title}>诱导公式与几何对称实验室</h2>

      {/* 公式类型选择 Tab 组 */}
      <div style={styles.selectorGrid}>
        {FORMULA_LIST.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFormulaId(f.id)}
            style={{
              ...styles.selectorButton,
              ...(selectedFormulaId === f.id ? styles.selectorActiveButton : {}),
            }}
          >
            {f.mathExpr}
          </button>
        ))}
      </div>

      <div className="lab-layout-grid">
        {/* 左侧画板 */}
        <div className="lab-left-panel">
          <svg
            id="symmetry-circle-svg"
            ref={svgRef}
            width={SVG_SIZE}
            height={SVG_SIZE}
            style={styles.svg}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          >
            {/* 网格线 */}
            <line x1={0} y1={CENTER.y} x2={SVG_SIZE} y2={CENTER.y} style={styles.axis} />
            <line x1={CENTER.x} y1={0} x2={CENTER.x} y2={SVG_SIZE} style={styles.axis} />

            {/* 单位圆 */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={COORD_PARAMS.unitPx}
              style={styles.circle}
            />

            {/* 对称辅助虚线 */}
            {renderSymmetryLines()}

            {/* 参考角终线 OP (紫色) */}
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={pScreen.x}
              y2={pScreen.y}
              style={styles.vectorP}
            />

            {/* 对称角终线 OQ (粉色) */}
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={qScreen.x}
              y2={qScreen.y}
              style={styles.vectorQ}
            />

            {/* 角度 α 弧线与标注 (紫色) */}
            {arcAlphaPath && <path d={arcAlphaPath} style={styles.arcP} />}
            {/* 角度 β 弧线与标注 (粉色) */}
            {arcBetaPath && <path d={arcBetaPath} style={styles.arcQ} />}

            {/* 可拖拽端点 P (紫色) */}
            <circle
              id="node-p"
              cx={pScreen.x}
              cy={pScreen.y}
              r={9}
              style={{ ...styles.tipP, cursor: 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            <text x={pScreen.x + 10} y={pScreen.y - 8} style={styles.labelP}>
              P (cos α, sin α)
            </text>

            {/* 只读端点 Q (粉色/橙色) */}
            <circle cx={qScreen.x} cy={qScreen.y} r={7} style={styles.tipQ} />
            <text x={qScreen.x - 12} y={qScreen.y + 18} style={styles.labelQ}>
              Q
            </text>

            {/* 坐标轴标签 */}
            <text x={SVG_SIZE - 12} y={CENTER.y + 14} style={styles.axisLabel}>x</text>
            <text x={CENTER.x + 8} y={15} style={styles.axisLabel}>y</text>
            <text x={CENTER.x - 12} y={CENTER.y + 14} style={styles.axisLabel}>O</text>
          </svg>

          {/* 角度滑动控制器 */}
          <div style={styles.controls}>
            <div style={styles.controlHeader}>
              <span style={styles.controlLabel}>
                参考角 <strong>α</strong> = {formattedAlpha}° ({angleRad.toFixed(3)} rad)
              </span>
            </div>
            <div style={styles.sliderRow}>
              <input
                id="alpha-slider"
                type="range"
                min={0}
                max={360}
                step={0.5}
                value={(radToDeg(angleRad) % 360).toFixed(1)}
                onChange={handleSliderChange}
                style={styles.slider}
              />
              <input
                id="alpha-input"
                type="number"
                min={0}
                max={360}
                step={1}
                value={parseFloat((radToDeg(angleRad) % 360).toFixed(1))}
                onChange={handleInputChange}
                style={styles.numberInput}
              />
            </div>
          </div>
        </div>

        {/* 右侧数据看板与公式讲解 */}
        <div className="lab-right-panel">
          {/* 当前公式看板 */}
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>
              <span>{currentMeta.name}</span>
              <span style={styles.badge}>{currentMeta.symmetry}</span>
            </div>
            <p style={styles.infoCardRelation}>{currentMeta.relation}</p>
            <div style={styles.formulaBox}>
              <div style={styles.formulaRow}>{currentMeta.sinFormula}</div>
              <div style={styles.formulaRow}>{currentMeta.cosFormula}</div>
              <div style={styles.formulaRow}>{currentMeta.tanFormula}</div>
            </div>
          </div>

          {/* 数值对比表格 */}
          <div style={styles.tableCard}>
            <h4 style={styles.tableCardTitle}>实时三角函数值对照</h4>
            <div style={styles.tableGrid}>
              <div style={styles.tableHeader}>函数</div>
              <div style={styles.tableHeader}>α = {formattedAlpha}°</div>
              <div style={styles.tableHeader}>β = {formattedBeta}°</div>
              
              {/* sin 对比 */}
              <div style={styles.tableCellLabel}>sin (纵坐标)</div>
              <div style={styles.tableCellP}>{trigAlpha.sin.toFixed(4)}</div>
              <div style={styles.tableCellQ}>{trigBeta.sin.toFixed(4)}</div>

              {/* cos 对比 */}
              <div style={styles.tableCellLabel}>cos (横坐标)</div>
              <div style={styles.tableCellP}>{trigAlpha.cos.toFixed(4)}</div>
              <div style={styles.tableCellQ}>{trigBeta.cos.toFixed(4)}</div>

              {/* tan 对比 */}
              <div style={styles.tableCellLabel}>tan (斜率)</div>
              <div style={styles.tableCellP}>
                {trigAlpha.tan === null ? '无定义' : trigAlpha.tan.toFixed(4)}
              </div>
              <div style={styles.tableCellQ}>
                {trigBeta.tan === null ? '无定义' : trigBeta.tan.toFixed(4)}
              </div>
            </div>
          </div>

          {/* 教学锦囊：奇变偶不变，符号看象限 */}
          <div style={styles.mnemonicCard}>
            <div
              style={styles.mnemonicHeader}
              onClick={() => setMnemonicExpanded(!mnemonicExpanded)}
            >
              <span>💡 诱导公式核心口诀锦囊</span>
              <span style={styles.chevron}>{mnemonicExpanded ? '▼' : '►'}</span>
            </div>

            {mnemonicExpanded && (
              <div style={styles.mnemonicContent}>
                <div style={styles.keywordRow}>
                  <span style={styles.keywordBadgeBlue}>奇变偶不变</span>
                  <p style={styles.keywordDesc}>
                    角度写成 <strong>k·(π/2) ± α</strong> 时：
                    <br />
                    • 若 <strong>k 为奇数</strong>：sin 变 cos，cos 变 sin（如 π/2 ± α）。
                    <br />
                    • 若 <strong>k 为偶数</strong>：函数名保持不变（如 π ± α，2π - α）。
                  </p>
                </div>
                <div style={styles.keywordRow}>
                  <span style={styles.keywordBadgePink}>符号看象限</span>
                  <p style={styles.keywordDesc}>
                    将 <strong>α 视为锐角</strong>（第一象限），判断对称角 <strong>k·(π/2) ± α</strong> 落在第几象限。
                    <br />
                    在该象限中，<strong>原三角函数</strong>的符号即为右侧公式的符号！
                    <br />
                    <i>例如：π - α 落在第二象限，第二象限中原函数 sin 为正，cos 为负，故 sin(π-α) = +sin α，cos(π-α) = -cos α。</i>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 内联样式 ──────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  containerOverride: {
    maxWidth: '960px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#f8fafc',
    textAlign: 'center',
  },
  selectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    margin: '8px 0 16px 0',
    background: '#1e293b',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  selectorButton: {
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 4px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  } as React.CSSProperties,
  selectorActiveButton: {
    background: '#334155',
    color: '#a78bfa',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  svg: {
    background: '#0a0f1d',
    borderRadius: '10px',
    display: 'block',
    border: '1px solid #1e293b',
    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)',
  },
  axis: {
    stroke: '#1e293b',
    strokeWidth: 1.5,
  } as React.CSSProperties,
  circle: {
    fill: 'none',
    stroke: '#334155',
    strokeWidth: 2,
    strokeDasharray: '4 4',
  } as React.CSSProperties,
  vectorP: {
    stroke: '#a78bfa',
    strokeWidth: 3,
    strokeLinecap: 'round',
  } as React.CSSProperties,
  vectorQ: {
    stroke: '#f472b6',
    strokeWidth: 2.5,
    strokeLinecap: 'round',
    strokeDasharray: '3 1',
  } as React.CSSProperties,
  arcP: {
    fill: 'none',
    stroke: '#a78bfa',
    strokeWidth: 2,
  } as React.CSSProperties,
  arcQ: {
    fill: 'none',
    stroke: '#f472b6',
    strokeWidth: 1.5,
    strokeDasharray: '2 2',
  } as React.CSSProperties,
  tipP: {
    fill: '#a78bfa',
    stroke: '#ffffff',
    strokeWidth: 2,
    filter: 'drop-shadow(0 2px 4px rgba(167, 139, 250, 0.5))',
  } as React.CSSProperties,
  tipQ: {
    fill: '#f472b6',
    stroke: '#ffffff',
    strokeWidth: 1.5,
    filter: 'drop-shadow(0 2px 4px rgba(244, 114, 182, 0.4))',
  } as React.CSSProperties,
  labelP: {
    fontSize: '11px',
    fill: '#a78bfa',
    fontWeight: 600,
  } as React.CSSProperties,
  labelQ: {
    fontSize: '11px',
    fill: '#f472b6',
    fontWeight: 600,
  } as React.CSSProperties,
  axisLabel: {
    fontSize: '12px',
    fill: '#475569',
    fontStyle: 'italic',
  } as React.CSSProperties,
  symmetryDottedLine: {
    stroke: '#f59e0b',
    strokeWidth: 1.5,
    strokeDasharray: '4 3',
  } as React.CSSProperties,
  projectionDottedLine: {
    stroke: '#334155',
    strokeWidth: 1,
    strokeDasharray: '2 2',
  } as React.CSSProperties,
  diagReferenceLine: {
    stroke: '#475569',
    strokeWidth: 1,
    strokeDasharray: '5 5',
    opacity: 0.7,
  } as React.CSSProperties,
  controls: {
    width: '100%',
    padding: '4px 0',
  },
  controlHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  controlLabel: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  sliderRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    accentColor: '#a78bfa',
    height: '6px',
    cursor: 'pointer',
  },
  numberInput: {
    width: '68px',
    padding: '6px 8px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '13px',
    textAlign: 'right',
    outline: 'none',
  } as React.CSSProperties,

  // 右侧看板样式
  infoCard: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
    border: '1px solid #312e81',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  infoCardTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: 700,
    color: '#e0e7ff',
  },
  badge: {
    fontSize: '11px',
    background: '#312e81',
    color: '#c7d2fe',
    padding: '3px 8px',
    borderRadius: '20px',
    border: '1px solid #4338ca',
  },
  infoCardRelation: {
    margin: '8px 0 12px 0',
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  formulaBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: 'rgba(0,0,0,0.2)',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  formulaRow: {
    fontFamily: 'Consolas, monospace',
    fontSize: '14px',
    color: '#f472b6',
    fontWeight: 600,
  },

  // 对照表样式
  tableCard: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '16px',
  },
  tableCardTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '8px',
    alignItems: 'center',
  },
  tableHeader: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    paddingBottom: '4px',
    borderBottom: '1px solid #334155',
  },
  tableCellLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  tableCellP: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#a78bfa',
    fontWeight: 600,
  },
  tableCellQ: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#f472b6',
    fontWeight: 600,
  },

  // 口诀锦囊样式
  mnemonicCard: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  mnemonicHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#1f2937',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#e5e7eb',
    userSelect: 'none',
  } as React.CSSProperties,
  chevron: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  mnemonicContent: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  keywordRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  keywordBadgeBlue: {
    alignSelf: 'flex-start',
    fontSize: '11px',
    fontWeight: 700,
    background: '#1e3a8a',
    color: '#93c5fd',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  keywordBadgePink: {
    alignSelf: 'flex-start',
    fontSize: '11px',
    fontWeight: 700,
    background: '#831843',
    color: '#fbcfe8',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  keywordDesc: {
    margin: 0,
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: 1.5,
  },
};
