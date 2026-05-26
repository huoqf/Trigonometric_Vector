/**
 * @file src/features/space-vector/SolidGeoMetric.tsx
 * @description 专题 5 — 空间角与距离的计算（度量求解）
 *
 * 四种度量模式：
 *   1. 二面角   — 两平面法向量夹角（半平面模型可视化）
 *   2. 线线角   — 两直线方向向量所成角（取锐角）
 *   3. 线面角   — 直线与平面所成角 θ = |90° − ∠(L, n)|
 *   4. 空间距离 — 点到平面距、点到直线距、异面直线距
 *
 * 布局：ThreeScreenLayout（左：控制 | 中：等轴测 SVG | 右：分步演算）
 */

import { useState, useMemo } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { math3DToScreen } from '@/utils/coordinate3';
import {
  sub3, add3, scale3, cross3, dot3,
  magnitude3, normalize3, angleBetween3,
  areParallel3, arePerpendicular3,
  planeNormal, pointToPlaneDistance, skewLinesDistance,
  pointToLineDistance, formatVector3,
} from '@/math/vector3';
import type { Vector3 } from '@/types/vector3';

// ─── SVG 参数 ────────────────────────────────────────
const SVG_W = 560;
const SVG_H = 560;
const UNIT_PX = 42;
const SP = { width: SVG_W, height: SVG_H, unitPx: UNIT_PX };

// ─── 工具函数 ─────────────────────────────────────────
const deg = (r: number) => ((r * 180) / Math.PI).toFixed(2);
const fmt = (v: Vector3, d = 2) => formatVector3(v, d);
const fN = (n: number, d = 4) => n.toFixed(d);

// ─── 箭头标记 ─────────────────────────────────────────
const ARROW_DEFS = [
  { id: 'am-axis',  color: '#334155' },
  { id: 'am-n1',   color: '#e879f9' },
  { id: 'am-n2',   color: '#fb923c' },
  { id: 'am-l1',   color: '#60a5fa' },
  { id: 'am-l2',   color: '#34d399' },
  { id: 'am-dist', color: '#fbbf24' },
  { id: 'am-pt',   color: '#f472b6' },
];

// ─── SVG 箭头线段 ─────────────────────────────────────
interface ArrowProps {
  from: Vector3; to: Vector3;
  mid: string; stroke: string;
  sw?: number; dashed?: boolean; opacity?: number;
}
function IsoArrow({ from, to, mid, stroke, sw = 2.5, dashed, opacity = 1 }: ArrowProps) {
  const s = math3DToScreen(from, SP);
  const e = math3DToScreen(to, SP);
  return (
    <line
      x1={s.x} y1={s.y} x2={e.x} y2={e.y}
      stroke={stroke} strokeWidth={sw}
      strokeDasharray={dashed ? '6 4' : undefined}
      markerEnd={`url(#${mid})`}
      opacity={opacity}
    />
  );
}

// ─── 点标签 ──────────────────────────────────────────
function PLabel({ pos, label, color = '#94a3b8', dx = 8, dy = -8 }: {
  pos: Vector3; label: string; color?: string; dx?: number; dy?: number;
}) {
  const s = math3DToScreen(pos, SP);
  return <text x={s.x + dx} y={s.y + dy} fill={color} fontSize="13" fontWeight="bold">{label}</text>;
}

// ─── 坐标轴标签 ─────────────────────────────────────
function AxisLabel({ pos, label }: { pos: Vector3; label: string }) {
  const s = math3DToScreen(pos, SP);
  return <text x={s.x + 6} y={s.y + 5} fill="#64748b" fontSize="13" fontWeight="bold">{label}</text>;
}

// ─── 控制 Slider ─────────────────────────────────────
interface SliderProps {
  id: string; axis: string; value: number;
  min?: number; max?: number; step?: number;
  color?: string; onChange: (v: number) => void;
}
function AxisSlider({ id, axis, value, min = -5, max = 5, step = 0.5, color = '#94a3b8', onChange }: SliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{ width: '22px', color, fontWeight: 700, fontSize: '13px' }}>{axis}</span>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
      <span style={{ width: '36px', textAlign: 'right', color: '#f1f5f9', fontSize: '12px' }}>
        {value >= 0 ? ` ${value.toFixed(1)}` : value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── 代数卡片 ────────────────────────────────────────
function MathCard({ title, children, accent = '#6366f1' }: {
  title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
      borderRadius: '12px', border: `1px solid ${accent}33`,
      padding: '13px 15px', boxShadow: `0 0 12px ${accent}15`,
    }}>
      <h4 style={{ margin: '0 0 9px 0', fontSize: '12.5px', color: accent, fontWeight: 700, letterSpacing: '0.03em' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Row({ label, value, color = '#f1f5f9', indent = false }: {
  label: string; value: string; color?: string; indent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', paddingLeft: indent ? '10px' : 0 }}>
      <span style={{ color: '#94a3b8', flexShrink: 0 }}>{label}</span>
      <span style={{ color, fontFamily: 'monospace', fontSize: '11.5px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function StepRow({ step, desc, value, color = '#f1f5f9' }: {
  step: string; desc: string; value: string; color?: string;
}) {
  return (
    <div style={{ marginBottom: '7px', padding: '5px 8px', background: '#ffffff08', borderRadius: '6px' }}>
      <span style={{ fontSize: '10px', color: '#475569', marginRight: '4px' }}>{step}</span>
      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{desc}</span>
      <div style={{ fontFamily: 'monospace', fontSize: '12px', color, marginTop: '2px', paddingLeft: '4px' }}>{value}</div>
    </div>
  );
}

// ─── 度量模式类型 ─────────────────────────────────────
type MetricMode = 'dihedral' | 'line-line' | 'line-plane' | 'distance';

// ─────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────
export function SolidGeoMetric() {
  const [mode, setMode] = useState<MetricMode>('dihedral');

  // 平面1 三点（默认水平面 z=0）
  const [A1, setA1] = useState<Vector3>({ x:  2, y: -2, z: 0 });
  const [B1, setB1] = useState<Vector3>({ x: -2, y: -2, z: 0 });
  const [C1, setC1] = useState<Vector3>({ x:  0, y:  2, z: 0 });

  // 平面2 三点（默认竖直面）
  const [A2, setA2] = useState<Vector3>({ x:  2, y:  0, z:  0 });
  const [B2, setB2] = useState<Vector3>({ x: -2, y:  0, z:  0 });
  const [C2, setC2] = useState<Vector3>({ x:  0, y:  0, z:  3 });

  // 直线1 & 2 方向向量
  const [L1, setL1] = useState<Vector3>({ x: 1, y: 2, z: 1 });
  const [L2, setL2] = useState<Vector3>({ x: 2, y: 1, z: -1 });

  // 待测点 P（距离模式）
  const [P, setP] = useState<Vector3>({ x: 1, y: 1, z: 3 });

  // 直线1 的基点（距离模式）
  const [Q1, setQ1] = useState<Vector3>({ x: 3, y: 0, z: 0 });
  // 直线2 的基点（距离模式）
  const [Q2, setQ2] = useState<Vector3>({ x: 0, y: 3, z: 2 });

  const O: Vector3 = { x: 0, y: 0, z: 0 };
  const axisLen = 4.2;

  // ─── 派生量 ─────────────────────────────────────────
  const d = useMemo(() => {
    // 二面角相关
    const N1 = planeNormal(A1, B1, C1);
    const N2 = planeNormal(A2, B2, C2);
    const magN1 = magnitude3(N1);
    const magN2 = magnitude3(N2);
    const Nn1 = normalize3(N1);
    const Nn2 = normalize3(N2);
    const dihedralRaw = angleBetween3(N1, N2);           // [0, π]
    const dihedralAngle = Math.min(dihedralRaw, Math.PI - dihedralRaw); // 取锐/直
    const dotN1N2 = dot3(N1, N2);

    // 线线角
    const magL1 = magnitude3(L1);
    const magL2 = magnitude3(L2);
    const Ln1 = normalize3(L1);
    const Ln2 = normalize3(L2);
    const lineLineRaw = angleBetween3(L1, L2);
    const lineLineAngle = Math.min(lineLineRaw, Math.PI - lineLineRaw); // 锐角
    const dotL1L2 = dot3(L1, L2);
    const crossL1L2 = cross3(L1, L2);
    const L1paraL2 = areParallel3(L1, L2);
    const L1perpL2 = arePerpendicular3(L1, L2);

    // 线面角（L1 与 平面1）
    const angleNL = angleBetween3(N1, L1);
    const linePlaneAngle = Math.abs(Math.PI / 2 - angleNL);
    const L1paraPlane1 = Math.abs(dot3(L1, N1)) < 1e-9 * Math.max(magN1 * magL1, 1);
    const L1perpPlane1 = areParallel3(L1, N1);

    // 距离
    const dPtoPlane1 = magN1 < 1e-9 ? 0 : pointToPlaneDistance(P, { normal: N1, point: A1 });
    const dPtoLine1  = magL1 < 1e-9 ? magnitude3(sub3(P, Q1)) : pointToLineDistance(P, { dir: L1, point: Q1 });
    const dSkew      = skewLinesDistance({ dir: L1, point: Q1 }, { dir: L2, point: Q2 });

    // 公垂线（异面线距）向量用于可视化
    const crossLL = cross3(L1, L2);
    const magCrossLL = magnitude3(crossLL);

    return {
      N1, N2, Nn1, Nn2, magN1, magN2,
      dihedralAngle, dihedralRaw, dotN1N2,
      L1, L2, Ln1, Ln2, magL1, magL2,
      lineLineAngle, lineLineRaw, dotL1L2, crossL1L2,
      L1paraL2, L1perpL2,
      N1forLine: N1, angleNL, linePlaneAngle,
      L1paraPlane1, L1perpPlane1,
      dPtoPlane1, dPtoLine1, dSkew,
      crossLL, magCrossLL,
    };
  }, [A1, B1, C1, A2, B2, C2, L1, L2, P, Q1, Q2]);

  // ─── 辅助：法向量可视化终点（从质心出发，长度1.8数学单位） ──
  function normalTip(pts: Vector3[], N: Vector3, magN: number): [Vector3, Vector3] {
    const cx = (pts[0].x + pts[1].x + pts[2].x) / 3;
    const cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
    const cz = (pts[0].z + pts[1].z + pts[2].z) / 3;
    const base: Vector3 = { x: cx, y: cy, z: cz };
    const sc = magN < 1e-9 ? 0 : 1.8 / magN;
    const tip: Vector3 = { x: cx + N.x * sc, y: cy + N.y * sc, z: cz + N.z * sc };
    return [base, tip];
  }

  // ─── 方向向量可视化终点（从点出发，长度1.6单位） ──────────
  function vecTip(base: Vector3, v: Vector3, mag: number, len = 1.6): Vector3 {
    const sc = mag < 1e-9 ? 0 : len / mag;
    return { x: base.x + v.x * sc, y: base.y + v.y * sc, z: base.z + v.z * sc };
  }

  const [nb1, nt1] = normalTip([A1, B1, C1], d.N1, d.magN1);
  const [nb2, nt2] = normalTip([A2, B2, C2], d.N2, d.magN2);

  // 直线1 显示端点（以 Q1 为基点，双向延伸）
  const lt1Pos = vecTip(Q1, L1, d.magL1, 1.8);
  const lt1Neg = vecTip(Q1, scale3(L1, -1), d.magL1, 1.2);
  // 直线2
  const lt2Pos = vecTip(Q2, L2, d.magL2, 1.8);
  const lt2Neg = vecTip(Q2, scale3(L2, -1), d.magL2, 1.2);

  // 点 P 的屏幕坐标
  const pScreen = math3DToScreen(P, SP);

  // P 到平面1 的垂线落点（近似）
  const footPtoPlane1 = useMemo(() => {
    if (d.magN1 < 1e-9) return P;
    const dotPN = dot3(d.Nn1, sub3(P, A1));
    return sub3(P, scale3(d.Nn1, dotPN));
  }, [P, A1, d.Nn1, d.magN1]);

  // ─── 坐标轴 ──────────────────────────────────────────
  function Axes() {
    return (
      <>
        <IsoArrow from={O} to={{ x: axisLen, y: 0, z: 0 }} mid="am-axis" stroke="#334155" sw={1.5} />
        <IsoArrow from={O} to={{ x: 0, y: axisLen, z: 0 }} mid="am-axis" stroke="#334155" sw={1.5} />
        <IsoArrow from={O} to={{ x: 0, y: 0, z: axisLen }} mid="am-axis" stroke="#334155" sw={1.5} />
        <AxisLabel pos={{ x: axisLen + 0.2, y: 0, z: 0 }} label="x" />
        <AxisLabel pos={{ x: 0, y: axisLen + 0.2, z: 0 }} label="y" />
        <AxisLabel pos={{ x: 0, y: 0, z: axisLen + 0.2 }} label="z" />
      </>
    );
  }

  // ─── 平面三角形填充 ───────────────────────────────────
  function PlaneFill({ pts, fillColor, fillOp = 0.13, strokeColor }: {
    pts: Vector3[]; fillColor: string; fillOp?: number; strokeColor: string;
  }) {
    const [sa, sb, sc_] = pts.map(p => math3DToScreen(p, SP));
    return (
      <>
        <polygon
          points={`${sa.x},${sa.y} ${sb.x},${sb.y} ${sc_.x},${sc_.y}`}
          fill={fillColor} fillOpacity={fillOp}
          stroke={strokeColor} strokeOpacity={0.4} strokeWidth="1"
        />
        <line x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y} stroke={strokeColor} strokeWidth={2} opacity={0.7} />
        <line x1={sb.x} y1={sb.y} x2={sc_.x} y2={sc_.y} stroke={strokeColor} strokeWidth={2} opacity={0.7} />
        <line x1={sc_.x} y1={sc_.y} x2={sa.x} y2={sa.y} stroke={strokeColor} strokeWidth={2} opacity={0.7} />
      </>
    );
  }

  // ─── 中间 SVG ────────────────────────────────────────
  const centerPanel = (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {ARROW_DEFS.map(({ id, color }) => (
            <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
            </marker>
          ))}
        </defs>

        <Axes />

        {/* ── 二面角模式 ─────────────────────────────── */}
        {mode === 'dihedral' && (
          <>
            <PlaneFill pts={[A1, B1, C1]} fillColor="#6366f1" strokeColor="#818cf8" />
            <PlaneFill pts={[A2, B2, C2]} fillColor="#fb923c" strokeColor="#fb923c" />
            {/* 顶点标签 */}
            <PLabel pos={A1} label="A₁" color="#818cf8" />
            <PLabel pos={B1} label="B₁" color="#818cf8" />
            <PLabel pos={C1} label="C₁" color="#818cf8" />
            <PLabel pos={A2} label="A₂" color="#fb923c" />
            <PLabel pos={B2} label="B₂" color="#fb923c" />
            <PLabel pos={C2} label="C₂" color="#fb923c" />
            {/* 法向量 N1, N2 */}
            {d.magN1 > 1e-9 && (
              <>
                <IsoArrow from={nb1} to={nt1} mid="am-n1" stroke="#e879f9" sw={3} />
                <PLabel pos={nt1} label="n₁" color="#e879f9" dx={6} dy={-10} />
              </>
            )}
            {d.magN2 > 1e-9 && (
              <>
                <IsoArrow from={nb2} to={nt2} mid="am-n2" stroke="#fb923c" sw={3} />
                <PLabel pos={nt2} label="n₂" color="#fb923c" dx={6} dy={-10} />
              </>
            )}
            {/* 退化提示 */}
            {(d.magN1 < 1e-9 || d.magN2 < 1e-9) && (
              <text x={SVG_W / 2} y={SVG_H - 18} textAnchor="middle" fill="#ef4444" fontSize="12">
                ⚠️ 存在三点共线退化平面，请调整坐标
              </text>
            )}
          </>
        )}

        {/* ── 线线角模式 ─────────────────────────────── */}
        {mode === 'line-line' && (
          <>
            {/* 公共原点展示两方向向量 */}
            <IsoArrow from={O} to={vecTip(O, L1, d.magL1, 2.5)} mid="am-l1" stroke="#60a5fa" sw={3} />
            <IsoArrow from={O} to={vecTip(O, L2, d.magL2, 2.5)} mid="am-l2" stroke="#34d399" sw={3} />
            <PLabel pos={vecTip(O, L1, d.magL1, 2.6)} label="L₁" color="#60a5fa" />
            <PLabel pos={vecTip(O, L2, d.magL2, 2.6)} label="L₂" color="#34d399" />
            {/* 反方向延伸（虚线） */}
            <IsoArrow from={O} to={vecTip(O, scale3(L1, -1), d.magL1, 1.5)} mid="am-l1" stroke="#60a5fa" sw={1.5} dashed opacity={0.3} />
            <IsoArrow from={O} to={vecTip(O, scale3(L2, -1), d.magL2, 1.5)} mid="am-l2" stroke="#34d399" sw={1.5} dashed opacity={0.3} />
            {/* 叉积方向（法向量指示所成角平面） */}
            {d.magL1 > 1e-9 && d.magL2 > 1e-9 && magnitude3(d.crossL1L2) > 1e-9 && (
              <>
                <IsoArrow
                  from={O}
                  to={vecTip(O, d.crossL1L2, magnitude3(d.crossL1L2), 1.8)}
                  mid="am-n1" stroke="#e879f955" sw={2} dashed opacity={0.6}
                />
              </>
            )}
          </>
        )}

        {/* ── 线面角模式 ─────────────────────────────── */}
        {mode === 'line-plane' && (
          <>
            <PlaneFill pts={[A1, B1, C1]} fillColor="#6366f1" strokeColor="#818cf8" />
            <PLabel pos={A1} label="A" color="#818cf8" />
            <PLabel pos={B1} label="B" color="#818cf8" />
            <PLabel pos={C1} label="C" color="#818cf8" />
            {/* 法向量 N1 */}
            {d.magN1 > 1e-9 && (
              <>
                <IsoArrow from={nb1} to={nt1} mid="am-n1" stroke="#e879f9" sw={2.5} dashed />
                <PLabel pos={nt1} label="n" color="#e879f9" />
              </>
            )}
            {/* 直线 L1（穿过质心） */}
            <IsoArrow from={lt1Neg} to={lt1Pos} mid="am-l1" stroke="#60a5fa" sw={3} />
            <PLabel pos={lt1Pos} label="L" color="#60a5fa" />
            {/* L 在平面上的投影（虚线） */}
            {d.magN1 > 1e-9 && d.magL1 > 1e-9 && (() => {
              const dotLN = dot3(d.L1, d.Nn1);
              const projOnN: Vector3 = scale3(d.Nn1, dotLN);
              const projOnPlane = sub3(d.L1, projOnN);
              const mpop = magnitude3(projOnPlane);
              if (mpop < 1e-9) return null;
              const sc = 1.6 / mpop;
              const projTip: Vector3 = { x: nb1.x + projOnPlane.x * sc, y: nb1.y + projOnPlane.y * sc, z: nb1.z + projOnPlane.z * sc };
              return (
                <>
                  <IsoArrow from={nb1} to={projTip} mid="am-dist" stroke="#fbbf24" sw={2} dashed opacity={0.7} />
                  <PLabel pos={projTip} label="L'" color="#fbbf24" />
                </>
              );
            })()}
          </>
        )}

        {/* ── 空间距离模式 ───────────────────────────── */}
        {mode === 'distance' && (
          <>
            {/* 平面1（参考平面） */}
            <PlaneFill pts={[A1, B1, C1]} fillColor="#6366f1" strokeColor="#818cf8" fillOp={0.1} />
            {/* 直线1（L1 过 Q1） */}
            <IsoArrow from={lt1Neg} to={lt1Pos} mid="am-l1" stroke="#60a5fa" sw={2.5} />
            <PLabel pos={Q1} label="Q₁" color="#60a5fa" dx={6} dy={-6} />
            {/* 直线2（L2 过 Q2） */}
            <IsoArrow from={lt2Neg} to={lt2Pos} mid="am-l2" stroke="#34d399" sw={2.5} />
            <PLabel pos={Q2} label="Q₂" color="#34d399" dx={6} dy={-6} />
            {/* 点 P */}
            {(() => {
              return (
                <>
                  <circle cx={pScreen.x} cy={pScreen.y} r={6} fill="#f472b6" />
                  <text x={pScreen.x + 9} y={pScreen.y - 9} fill="#f472b6" fontSize="13" fontWeight="bold">P</text>
                </>
              );
            })()}
            {/* P 到平面1 的垂线 */}
            {d.magN1 > 1e-9 && (() => {
              const fs = math3DToScreen(footPtoPlane1, SP);
              return (
                <>
                  <line x1={pScreen.x} y1={pScreen.y} x2={fs.x} y2={fs.y}
                    stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" opacity={0.8} />
                  <circle cx={fs.x} cy={fs.y} r={3} fill="#fbbf24" opacity={0.7} />
                </>
              );
            })()}
            {/* 公垂线（异面线距，若方向向量叉积不为零） */}
            {d.magCrossLL > 1e-9 && (() => {
              // 公垂线方向单位向量
              const cn = normalize3(d.crossLL);
              const A1A2 = sub3(Q2, Q1);
              const dVal = Math.abs(dot3(A1A2, d.crossLL)) / d.magCrossLL;
              // 简单连 Q1 → Q2 虚线表示公垂线向量方向示意
              const mid1 = add3(Q1, scale3(L1, 0.5));
              const mid2 = add3(Q2, scale3(L2, 0.5));
              const mids1 = math3DToScreen(mid1, SP);
              const mids2 = math3DToScreen(mid2, SP);
              return (
                <line x1={mids1.x} y1={mids1.y} x2={mids2.x} y2={mids2.y}
                  stroke="#e879f9" strokeWidth={2} strokeDasharray="7 4" opacity={0.7} />
              );
            })()}
          </>
        )}
      </svg>
    </div>
  );

  // ─── 左侧控制面板 ────────────────────────────────────
  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="control-group">
        <h3 className="control-title">空间角与距离计算</h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: '1.6' }}>
          选择度量模式，拖拽参数实时演算。右侧面板展示分步向量公式推导过程。
        </p>

        {/* 模式选择 */}
        <label className="control-label">度量模式</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
          {([
            ['dihedral',    '🔲 二面角'],
            ['line-line',   '📏 线线角'],
            ['line-plane',  '📐 线面角'],
            ['distance',    '📌 空间距离'],
          ] as [MetricMode, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setMode(val)} style={{
              padding: '7px 4px', fontSize: '12px', fontWeight: 600,
              borderRadius: '7px', border: '1px solid', cursor: 'pointer',
              transition: 'all 0.18s ease',
              borderColor: mode === val ? '#6366f1' : '#334155',
              backgroundColor: mode === val ? '#6366f114' : '#1e293b',
              color: mode === val ? '#a5b4fc' : '#94a3b8',
              boxShadow: mode === val ? '0 0 8px #6366f133' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* 二面角：两平面各三点 */}
      {mode === 'dihedral' && (
        <>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>平面① 点 A₁ {fmt(A1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`A1-${ax}`} id={`sl-A1-${ax}`} axis={ax.toUpperCase()} value={(A1 as any)[ax]} color="#818cf8"
                onChange={v => setA1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>平面① 点 B₁ {fmt(B1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`B1-${ax}`} id={`sl-B1-${ax}`} axis={ax.toUpperCase()} value={(B1 as any)[ax]} color="#818cf8"
                onChange={v => setB1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>平面① 点 C₁ {fmt(C1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`C1-${ax}`} id={`sl-C1-${ax}`} axis={ax.toUpperCase()} value={(C1 as any)[ax]} color="#818cf8"
                onChange={v => setC1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#fb923c' }}>平面② 点 A₂ {fmt(A2)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`A2-${ax}`} id={`sl-A2-${ax}`} axis={ax.toUpperCase()} value={(A2 as any)[ax]} color="#fb923c"
                onChange={v => setA2(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#fb923c' }}>平面② 点 B₂ {fmt(B2)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`B2-${ax}`} id={`sl-B2-${ax}`} axis={ax.toUpperCase()} value={(B2 as any)[ax]} color="#fb923c"
                onChange={v => setB2(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#fb923c' }}>平面② 点 C₂ {fmt(C2)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`C2-${ax}`} id={`sl-C2-${ax}`} axis={ax.toUpperCase()} value={(C2 as any)[ax]} color="#fb923c"
                onChange={v => setC2(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
        </>
      )}

      {/* 线线角：两方向向量 */}
      {mode === 'line-line' && (
        <>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#60a5fa' }}>方向向量 L₁ {fmt(L1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`L1-${ax}`} id={`sl-L1-${ax}`} axis={ax.toUpperCase()} value={(L1 as any)[ax]} color="#60a5fa"
                onChange={v => setL1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#34d399' }}>方向向量 L₂ {fmt(L2)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`L2-${ax}`} id={`sl-L2-${ax}`} axis={ax.toUpperCase()} value={(L2 as any)[ax]} color="#34d399"
                onChange={v => setL2(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
        </>
      )}

      {/* 线面角：方向向量 L1 + 平面 A1B1C1 */}
      {mode === 'line-plane' && (
        <>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#60a5fa' }}>直线方向 L {fmt(L1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`L1b-${ax}`} id={`sl-L1b-${ax}`} axis={ax.toUpperCase()} value={(L1 as any)[ax]} color="#60a5fa"
                onChange={v => setL1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>平面点 A {fmt(A1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`A1b-${ax}`} id={`sl-A1b-${ax}`} axis={ax.toUpperCase()} value={(A1 as any)[ax]} color="#818cf8"
                onChange={v => setA1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>平面点 B {fmt(B1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`B1b-${ax}`} id={`sl-B1b-${ax}`} axis={ax.toUpperCase()} value={(B1 as any)[ax]} color="#818cf8"
                onChange={v => setB1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>平面点 C {fmt(C1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`C1b-${ax}`} id={`sl-C1b-${ax}`} axis={ax.toUpperCase()} value={(C1 as any)[ax]} color="#818cf8"
                onChange={v => setC1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
        </>
      )}

      {/* 距离模式 */}
      {mode === 'distance' && (
        <>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#f472b6' }}>待测点 P {fmt(P)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`P-${ax}`} id={`sl-P-${ax}`} axis={ax.toUpperCase()} value={(P as any)[ax]} color="#f472b6"
                onChange={v => setP(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#818cf8' }}>参考平面 A {fmt(A1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`A1d-${ax}`} id={`sl-A1d-${ax}`} axis={ax.toUpperCase()} value={(A1 as any)[ax]} color="#818cf8"
                onChange={v => setA1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#60a5fa' }}>直线①基点 Q₁ {fmt(Q1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`Q1-${ax}`} id={`sl-Q1-${ax}`} axis={ax.toUpperCase()} value={(Q1 as any)[ax]} color="#60a5fa"
                onChange={v => setQ1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#60a5fa' }}>方向向量 L₁ {fmt(L1)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`L1d-${ax}`} id={`sl-L1d-${ax}`} axis={ax.toUpperCase()} value={(L1 as any)[ax]} color="#60a5fa"
                onChange={v => setL1(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#34d399' }}>直线②基点 Q₂ {fmt(Q2)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`Q2-${ax}`} id={`sl-Q2-${ax}`} axis={ax.toUpperCase()} value={(Q2 as any)[ax]} color="#34d399"
                onChange={v => setQ2(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#34d399' }}>方向向量 L₂ {fmt(L2)}</h4>
            {(['x','y','z'] as const).map(ax => (
              <AxisSlider key={`L2d-${ax}`} id={`sl-L2d-${ax}`} axis={ax.toUpperCase()} value={(L2 as any)[ax]} color="#34d399"
                onChange={v => setL2(p => ({ ...p, [ax]: v }))} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ─── 右侧代数演算面板 ─────────────────────────────────
  const isP1Degen = d.magN1 < 1e-9;
  const isP2Degen = d.magN2 < 1e-9;

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '12px' }}>

      {/* 二面角 */}
      {mode === 'dihedral' && (
        <>
          <MathCard title="📐 二面角计算步骤" accent="#e879f9">
            {isP1Degen || isP2Degen
              ? <p style={{ color: '#ef4444', fontSize: '12px' }}>存在退化平面（三点共线），请调整参数。</p>
              : <>
                  <StepRow step="① 求法向量" desc="n₁ = A₁B₁ × A₁C₁"
                    value={`n₁ = ${fmt(d.N1)}`} color="#e879f9" />
                  <StepRow step="② 求法向量" desc="n₂ = A₂B₂ × A₂C₂"
                    value={`n₂ = ${fmt(d.N2)}`} color="#fb923c" />
                  <StepRow step="③ 点积" desc="n₁ · n₂"
                    value={`= ${fN(d.dotN1N2)}`} />
                  <StepRow step="④ 模长" desc="|n₁| · |n₂|"
                    value={`= ${fN(d.magN1)} × ${fN(d.magN2)} = ${fN(d.magN1 * d.magN2)}`} />
                  <StepRow step="⑤ cos θ" desc="= n₁·n₂ / (|n₁||n₂|)"
                    value={`= ${fN(d.dotN1N2 / (d.magN1 * d.magN2))}`} />
                </>
            }
          </MathCard>

          {!isP1Degen && !isP2Degen && (
            <MathCard title="🎯 二面角结果" accent="#6366f1">
              <Row label="∠(n₁, n₂) =" value={`${deg(d.dihedralRaw)}°`} />
              <Row label="二面角 =" value={`${deg(d.dihedralAngle)}°`} color="#a5b4fc" />
              <div style={{ marginTop: '8px', padding: '6px 8px', background: '#6366f110', borderRadius: '6px', fontSize: '11px', color: '#818cf8', lineHeight: 1.6 }}>
                二面角 = min(∠(n₁,n₂), 180°−∠(n₁,n₂)) 取锐角或直角
              </div>
            </MathCard>
          )}

          <MathCard title="💡 面面关系" accent="#475569">
            <Row label="两面平行"
              value={areParallel3(d.N1, d.N2) ? '✅ 是（n₁ // n₂）' : '❌ 否'}
              color={areParallel3(d.N1, d.N2) ? '#34d399' : '#ef4444'} />
            <Row label="两面垂直"
              value={arePerpendicular3(d.N1, d.N2) ? '✅ 是（n₁·n₂=0）' : '❌ 否'}
              color={arePerpendicular3(d.N1, d.N2) ? '#34d399' : '#ef4444'} />
          </MathCard>
        </>
      )}

      {/* 线线角 */}
      {mode === 'line-line' && (
        <>
          <MathCard title="📏 线线角计算步骤" accent="#60a5fa">
            <StepRow step="① 方向向量" desc="L₁, L₂" value={`L₁=${fmt(L1)}  L₂=${fmt(L2)}`} />
            <StepRow step="② 点积" desc="L₁ · L₂"
              value={`= ${fN(d.dotL1L2)}`} />
            <StepRow step="③ 模长乘积" desc="|L₁||L₂|"
              value={`= ${fN(d.magL1)} × ${fN(d.magL2)} = ${fN(d.magL1 * d.magL2)}`} />
            <StepRow step="④ cos α" desc="= L₁·L₂/(|L₁||L₂|)"
              value={d.magL1 * d.magL2 < 1e-9 ? '— (零向量)' : `= ${fN(d.dotL1L2 / (d.magL1 * d.magL2))}`} />
          </MathCard>

          <MathCard title="🎯 线线角结果" accent="#6366f1">
            <Row label="∠(L₁, L₂) 原始值 =" value={`${deg(d.lineLineRaw)}°`} />
            <Row label="线线角（取锐角）=" value={`${deg(d.lineLineAngle)}°`} color="#a5b4fc" />
          </MathCard>

          <MathCard title="⚡ 线线关系判定" accent="#475569">
            <Row label="L₁ // L₂"
              value={d.L1paraL2 ? '✅ 是（叉积≈0）' : '❌ 否'}
              color={d.L1paraL2 ? '#34d399' : '#ef4444'} />
            <Row label="L₁ ⊥ L₂"
              value={d.L1perpL2 ? '✅ 是（点积≈0）' : '❌ 否'}
              color={d.L1perpL2 ? '#34d399' : '#ef4444'} />
            <Row label="|L₁ × L₂| =" value={fN(magnitude3(d.crossL1L2))} />
          </MathCard>

          <MathCard title="💡 公式" accent="#475569">
            <ul style={{ margin: 0, paddingLeft: '14px', color: '#64748b', fontSize: '11.5px', lineHeight: 2 }}>
              <li>线线角 α = arccos |L₁·L₂ / (|L₁||L₂|)|</li>
              <li>取绝对值保证结果为锐角或直角</li>
              <li>平行：|L₁ × L₂| = 0</li>
              <li>垂直：L₁ · L₂ = 0</li>
            </ul>
          </MathCard>
        </>
      )}

      {/* 线面角 */}
      {mode === 'line-plane' && (
        <>
          <MathCard title="📐 线面角计算步骤" accent="#60a5fa">
            {isP1Degen
              ? <p style={{ color: '#ef4444' }}>平面退化（三点共线）</p>
              : <>
                  <StepRow step="① 法向量" desc="n = AB × AC"
                    value={`n = ${fmt(d.N1)}`} color="#e879f9" />
                  <StepRow step="② 直线向量" desc="L"
                    value={`L = ${fmt(d.L1)}`} color="#60a5fa" />
                  <StepRow step="③ ∠(L, n)" desc="arccos(L·n / |L||n|)"
                    value={`= ${deg(d.angleNL)}°`} />
                  <StepRow step="④ 线面角" desc="θ = |90° − ∠(L,n)|"
                    value={`= ${deg(d.linePlaneAngle)}°`} color="#fbbf24" />
                </>
            }
          </MathCard>

          {!isP1Degen && (
            <MathCard title="🎯 线面角结果" accent="#6366f1">
              <Row label="线面角 θ =" value={`${deg(d.linePlaneAngle)}°`} color="#a5b4fc" />
              <Row label="状态"
                value={d.L1paraPlane1 ? '平行（θ=0°）' : d.L1perpPlane1 ? '垂直（θ=90°）' : '斜交'}
                color={d.L1paraPlane1 || d.L1perpPlane1 ? '#34d399' : '#f1f5f9'} />
            </MathCard>
          )}

          {!isP1Degen && (() => {
            const dotLN = dot3(d.L1, d.Nn1);
            const projOnN = scale3(d.Nn1, dotLN);
            const projOnPlane = sub3(d.L1, projOnN);
            return (
              <MathCard title="🔍 L 的投影分解" accent="#94a3b8">
                <Row label="L 沿 n 分量" value={fmt(projOnN, 3)} color="#e879f9" />
                <Row label="L 在平面投影 L'" value={fmt(projOnPlane, 3)} color="#fbbf24" />
                <Row label="|L'|" value={fN(magnitude3(projOnPlane))} />
              </MathCard>
            );
          })()}
        </>
      )}

      {/* 空间距离 */}
      {mode === 'distance' && (
        <>
          <MathCard title="📌 点 P 到平面距离" accent="#f472b6">
            {isP1Degen
              ? <p style={{ color: '#ef4444' }}>平面退化，请调整 A/B/C</p>
              : <>
                  <StepRow step="① 法向量" desc="n = AB × AC" value={`n = ${fmt(d.N1)}`} color="#e879f9" />
                  <StepRow step="② AP⃗" desc="= P − A" value={`= ${fmt(sub3(P, A1))}`} />
                  <StepRow step="③ 代入公式" desc="d = |n̂ · AP⃗|"
                    value={`= ${fN(d.dPtoPlane1)}`} color="#f472b6" />
                </>
            }
          </MathCard>

          <MathCard title="📏 点 P 到直线① 距离" accent="#60a5fa">
            {d.magL1 < 1e-9
              ? <p style={{ color: '#ef4444' }}>L₁ 为零向量</p>
              : <>
                  <StepRow step="① Q₁P⃗" desc="= P − Q₁" value={`= ${fmt(sub3(P, Q1))}`} />
                  <StepRow step="② 叉积" desc="Q₁P⃗ × L̂₁"
                    value={`|…| = ${fN(magnitude3(cross3(sub3(P, Q1), normalize3(L1))))}`} />
                  <StepRow step="③ 距离" desc="d = |Q₁P⃗ × L̂₁|"
                    value={`= ${fN(d.dPtoLine1)}`} color="#60a5fa" />
                </>
            }
          </MathCard>

          <MathCard title="🔀 异面直线①② 距离" accent="#34d399">
            {d.magCrossLL < 1e-9
              ? <>
                  <p style={{ color: '#fbbf24', fontSize: '11.5px', marginBottom: '6px' }}>
                    ⚠️ L₁ // L₂（平行或重合），退化为点到直线距离
                  </p>
                  <Row label="d(Q₁, 直线②) =" value={`${fN(pointToLineDistance(Q1, { dir: L2, point: Q2 }))}`} color="#34d399" />
                </>
              : <>
                  <StepRow step="① 公垂线方向" desc="n = L₁ × L₂"
                    value={`n = ${fmt(d.crossLL)}   |n|=${fN(d.magCrossLL)}`} color="#e879f9" />
                  <StepRow step="② Q₁Q₂⃗" desc="= Q₂ − Q₁"
                    value={`= ${fmt(sub3(Q2, Q1))}`} />
                  <StepRow step="③ 公式" desc="d = |Q₁Q₂⃗ · n| / |n|"
                    value={`= ${fN(d.dSkew)}`} color="#34d399" />
                </>
            }
          </MathCard>

          <MathCard title="💡 距离公式汇总" accent="#475569">
            <ul style={{ margin: 0, paddingLeft: '14px', color: '#64748b', fontSize: '11px', lineHeight: 2 }}>
              <li>点到平面：d = |n̂ · AP⃗|</li>
              <li>点到直线：d = |AP⃗ × d̂|</li>
              <li>异面线距：d = |Q₁Q₂⃗ · (d₁×d₂)| / |d₁×d₂|</li>
            </ul>
          </MathCard>
        </>
      )}
    </div>
  );

  return <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />;
}
