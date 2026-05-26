/**
 * @file src/features/space-vector/SolidGeoJudge.tsx
 * @description 专题 4 — 向量方法在立体几何中的应用（几何判定）
 *
 * 功能：
 *   - 法向量求解：叉积可视化（三点确定平面，实时渲染法向量）
 *   - 直线平行/垂直/线面角判定：通过点积/叉积实时代数推断
 *   - 等轴测 SVG 渲染三维几何体，右侧代数过程分步演算
 */

import { useState, useMemo } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { math3DToScreen } from '@/utils/coordinate3';
import {
  sub3, cross3, dot3, magnitude3, normalize3, angleBetween3,
  areParallel3, arePerpendicular3, formatVector3, planeNormal,
  pointToPlaneDistance,
} from '@/math/vector3';
import type { Vector3 } from '@/types/vector3';

// ─── 等轴测投影参数 ───────────────────────────────────
const SVG_W = 560;
const SVG_H = 560;
const UNIT_PX = 44;
const SVG_PARAMS = { width: SVG_W, height: SVG_H, unitPx: UNIT_PX };

// ─── 工具函数 ─────────────────────────────────────────
function deg(rad: number) {
  return ((rad * 180) / Math.PI).toFixed(1);
}
function fmt(v: Vector3, d = 2) {
  return formatVector3(v, d);
}
function fmtN(n: number, d = 3) {
  return n.toFixed(d);
}

// ─── 箭头标记 ID ───────────────────────────────────────
const MARKERS = [
  { id: 'arr-axis', color: '#334155' },
  { id: 'arr-a',    color: '#60a5fa' },
  { id: 'arr-b',    color: '#34d399' },
  { id: 'arr-c',    color: '#fb923c' },
  { id: 'arr-n',    color: '#e879f9' },
  { id: 'arr-l',    color: '#fbbf24' },
  { id: 'arr-proj', color: '#94a3b8' },
];

// ─── 等轴测 SVG 向量线段 ───────────────────────────────
interface ArrowProps {
  from: Vector3;
  to: Vector3;
  markerId: string;
  stroke: string;
  strokeWidth?: number;
  dashed?: boolean;
  opacity?: number;
}
function IsoArrow({ from, to, markerId, stroke, strokeWidth = 2.5, dashed, opacity = 1 }: ArrowProps) {
  const s = math3DToScreen(from, SVG_PARAMS);
  const e = math3DToScreen(to, SVG_PARAMS);
  return (
    <line
      x1={s.x} y1={s.y} x2={e.x} y2={e.y}
      stroke={stroke} strokeWidth={strokeWidth}
      strokeDasharray={dashed ? '6 4' : undefined}
      markerEnd={`url(#${markerId})`}
      opacity={opacity}
    />
  );
}

// ─── 坐标轴文字标签 ────────────────────────────────────
function AxisLabel({ pos, label }: { pos: Vector3; label: string }) {
  const s = math3DToScreen(pos, SVG_PARAMS);
  return (
    <text x={s.x + 6} y={s.y + 5} fill="#64748b" fontSize="13" fontWeight="bold">
      {label}
    </text>
  );
}

// ─── 点标签 ─────────────────────────────────────────────
function PointLabel({ pos, label, color = '#94a3b8', dx = 8, dy = -6 }: { pos: Vector3; label: string; color?: string; dx?: number; dy?: number }) {
  const s = math3DToScreen(pos, SVG_PARAMS);
  return (
    <text x={s.x + dx} y={s.y + dy} fill={color} fontSize="13" fontWeight="bold">
      {label}
    </text>
  );
}

// ─── 控制 Slider ───────────────────────────────────────
interface AxisSliderProps {
  id: string;
  axis: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  onChange: (v: number) => void;
}
function AxisSlider({ id, axis, value, min = -5, max = 5, step = 0.5, color = '#94a3b8', onChange }: AxisSliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{ width: '24px', color, fontWeight: 700, fontSize: '13px' }}>{axis}</span>
      <input
        id={id}
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{ width: '36px', textAlign: 'right', color: '#f1f5f9', fontSize: '12px' }}>
        {value >= 0 ? ` ${value.toFixed(1)}` : value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── 右侧代数卡片 ─────────────────────────────────────
interface CardProps {
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}
function MathCard({ title, children, accentColor = '#6366f1' }: CardProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: '12px',
      border: `1px solid ${accentColor}33`,
      padding: '14px 16px',
      boxShadow: `0 0 12px ${accentColor}18`,
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: accentColor, fontWeight: 700, letterSpacing: '0.03em' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Row({ label, value, color = '#f1f5f9' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12.5px', gap: '8px' }}>
      <span style={{ color: '#94a3b8', flexShrink: 0 }}>{label}</span>
      <span style={{ color, fontFamily: 'monospace', fontSize: '12px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────────────
type JudgeMode = 'normal' | 'parallel' | 'perp' | 'line-plane';

export function SolidGeoJudge() {
  // 平面上三点 A, B, C（默认为长方体的一个面）
  const [A, setA] = useState<Vector3>({ x: 2, y: -2, z: 0 });
  const [B, setB] = useState<Vector3>({ x: -2, y: -2, z: 0 });
  const [C, setC] = useState<Vector3>({ x: -2, y:  2, z: 0 });

  // 直线方向向量（用于线线/线面判定）
  const [L, setL] = useState<Vector3>({ x: 1, y: 1, z: 2 });

  // 判定模式
  const [mode, setMode] = useState<JudgeMode>('normal');

  // ─── 派生量 ─────────────────────────────────────────
  const derived = useMemo(() => {
    const AB = sub3(B, A);
    const AC = sub3(C, A);
    const N  = planeNormal(A, B, C);       // 法向量（未归一化）
    const Nn = normalize3(N);              // 单位法向量
    const magN = magnitude3(N);

    const magL = magnitude3(L);
    const Ln = normalize3(L);

    // 直线 L 与平面法向量 N 的夹角
    const angleNL = angleBetween3(N, L);   // [0, π]
    // 线面角 = |π/2 - 夹角(N, L)|
    const linePlaneAngle = Math.abs(Math.PI / 2 - angleNL);

    // 直线 L 与向量 AB 的平行/垂直关系
    const LparallelAB = areParallel3(L, AB);
    const LperpAB     = arePerpendicular3(L, AB);
    // 直线 L 与向量 AC 的平行/垂直关系
    const LparallelAC = areParallel3(L, AC);
    const LperpAC     = arePerpendicular3(L, AC);
    // 直线 L 是否平行于平面（L · N ≈ 0）
    const LparallelPlane = Math.abs(dot3(L, N)) < 1e-9 * Math.max(magN * magL, 1);
    // 直线 L 是否垂直于平面（L × N ≈ 0）
    const LperpPlane = areParallel3(L, N);

    // AB ⊥ AC
    const ABperpAC = arePerpendicular3(AB, AC);
    const dotABAC  = dot3(AB, AC);

    // 线线夹角 L 与 AB
    const angleLAB = angleBetween3(L, AB);

    // 点 D = 原点，到平面(A,B,C)的距离演示
    const dOriginToPlane = magN < 1e-9 ? 0 : pointToPlaneDistance({ x: 0, y: 0, z: 0 }, { normal: N, point: A });

    return {
      AB, AC, N, Nn, magN,
      L, Ln, magL,
      angleNL, linePlaneAngle,
      LparallelAB, LperpAB,
      LparallelAC, LperpAC,
      LparallelPlane, LperpPlane,
      ABperpAC, dotABAC,
      angleLAB,
      dOriginToPlane,
    };
  }, [A, B, C, L]);

  // ─── SVG 辅助点位 ───────────────────────────────────
  const O: Vector3 = { x: 0, y: 0, z: 0 };
  const axisLen = 4.5;

  // 法向量末点（从质心出发，长度 = 2 单位）
  const centroid: Vector3 = {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3,
    z: (A.z + B.z + C.z) / 3,
  };
  const normalScale = derived.magN < 1e-9 ? 0 : 1.8 / derived.magN;
  const normalTip: Vector3 = {
    x: centroid.x + derived.N.x * normalScale,
    y: centroid.y + derived.N.y * normalScale,
    z: centroid.z + derived.N.z * normalScale,
  };

  // 直线 L 的显示（从质心出发，长度 2 单位）
  const lScale = derived.magL < 1e-9 ? 0 : 1.6 / derived.magL;
  const lTip: Vector3 = {
    x: centroid.x + L.x * lScale,
    y: centroid.y + L.y * lScale,
    z: centroid.z + L.z * lScale,
  };
  const lBase: Vector3 = {
    x: centroid.x - L.x * lScale * 0.6,
    y: centroid.y - L.y * lScale * 0.6,
    z: centroid.z - L.z * lScale * 0.6,
  };

  // ─── 左侧控制面板 ────────────────────────────────────
  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="control-group">
        <h3 className="control-title">向量方法判定立体几何</h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: '1.6' }}>
          拖拽滑块调整三点 A、B、C 坐标（确定一个平面），以及直线方向向量 L，实时观察法向量求解与几何关系判定。
        </p>

        {/* 判定模式 */}
        <label className="control-label">实验模式</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
          {([
            ['normal',     '法向量求解'],
            ['parallel',   '平行关系判定'],
            ['perp',       '垂直关系判定'],
            ['line-plane', '线面角计算'],
          ] as [JudgeMode, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setMode(val)}
              style={{
                padding: '7px 6px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '7px',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                borderColor: mode === val ? '#6366f1' : '#334155',
                backgroundColor: mode === val ? '#6366f114' : '#1e293b',
                color: mode === val ? '#a5b4fc' : '#94a3b8',
                boxShadow: mode === val ? '0 0 8px #6366f133' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 点 A */}
      <div className="control-group">
        <h4 className="control-title" style={{ color: '#60a5fa' }}>点 A {fmt(A)}</h4>
        {(['x', 'y', 'z'] as const).map(ax => (
          <AxisSlider
            key={`A-${ax}`} id={`slider-A-${ax}`}
            axis={ax.toUpperCase()} value={(A as any)[ax]} color="#60a5fa"
            onChange={v => setA(prev => ({ ...prev, [ax]: v }))}
          />
        ))}
      </div>

      {/* 点 B */}
      <div className="control-group">
        <h4 className="control-title" style={{ color: '#34d399' }}>点 B {fmt(B)}</h4>
        {(['x', 'y', 'z'] as const).map(ax => (
          <AxisSlider
            key={`B-${ax}`} id={`slider-B-${ax}`}
            axis={ax.toUpperCase()} value={(B as any)[ax]} color="#34d399"
            onChange={v => setB(prev => ({ ...prev, [ax]: v }))}
          />
        ))}
      </div>

      {/* 点 C */}
      <div className="control-group">
        <h4 className="control-title" style={{ color: '#fb923c' }}>点 C {fmt(C)}</h4>
        {(['x', 'y', 'z'] as const).map(ax => (
          <AxisSlider
            key={`C-${ax}`} id={`slider-C-${ax}`}
            axis={ax.toUpperCase()} value={(C as any)[ax]} color="#fb923c"
            onChange={v => setC(prev => ({ ...prev, [ax]: v }))}
          />
        ))}
      </div>

      {/* 方向向量 L（线面/线线判定时用） */}
      {(mode === 'parallel' || mode === 'perp' || mode === 'line-plane') && (
        <div className="control-group">
          <h4 className="control-title" style={{ color: '#fbbf24' }}>方向向量 L {fmt(L)}</h4>
          {(['x', 'y', 'z'] as const).map(ax => (
            <AxisSlider
              key={`L-${ax}`} id={`slider-L-${ax}`}
              axis={ax.toUpperCase()} value={(L as any)[ax]} color="#fbbf24"
              onChange={v => setL(prev => ({ ...prev, [ax]: v }))}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ─── 中间 SVG 画布 ────────────────────────────────────
  const centerPanel = (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {MARKERS.map(({ id, color }) => (
            <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
            </marker>
          ))}
        </defs>

        {/* 坐标轴 */}
        <IsoArrow from={O} to={{ x: axisLen, y: 0, z: 0 }} markerId="arr-axis" stroke="#334155" strokeWidth={1.5} />
        <IsoArrow from={O} to={{ x: 0, y: axisLen, z: 0 }} markerId="arr-axis" stroke="#334155" strokeWidth={1.5} />
        <IsoArrow from={O} to={{ x: 0, y: 0, z: axisLen }} markerId="arr-axis" stroke="#334155" strokeWidth={1.5} />
        <AxisLabel pos={{ x: axisLen + 0.2, y: 0, z: 0 }} label="x" />
        <AxisLabel pos={{ x: 0, y: axisLen + 0.2, z: 0 }} label="y" />
        <AxisLabel pos={{ x: 0, y: 0, z: axisLen + 0.2 }} label="z" />

        {/* 平面三角形 ABC（半透明填充） */}
        {(() => {
          const sa = math3DToScreen(A, SVG_PARAMS);
          const sb = math3DToScreen(B, SVG_PARAMS);
          const sc = math3DToScreen(C, SVG_PARAMS);
          return (
            <polygon
              points={`${sa.x},${sa.y} ${sb.x},${sb.y} ${sc.x},${sc.y}`}
              fill="#6366f1" fillOpacity="0.12"
              stroke="#6366f155" strokeWidth="1"
            />
          );
        })()}

        {/* 边 AB, BC, CA */}
        <IsoArrow from={A} to={B} markerId="arr-a" stroke="#60a5fa" strokeWidth={2} />
        <IsoArrow from={B} to={C} markerId="arr-b" stroke="#34d399" strokeWidth={2} />
        <IsoArrow from={C} to={A} markerId="arr-c" stroke="#fb923c" strokeWidth={2} />

        {/* 顶点标签 */}
        <PointLabel pos={A} label="A" color="#60a5fa" dx={8} dy={-8} />
        <PointLabel pos={B} label="B" color="#34d399" dx={8} dy={-8} />
        <PointLabel pos={C} label="C" color="#fb923c" dx={8} dy={-8} />

        {/* 原点 O */}
        {(() => {
          const so = math3DToScreen(O, SVG_PARAMS);
          return <circle cx={so.x} cy={so.y} r={4} fill="#6366f1" opacity={0.8} />;
        })()}

        {/* 法向量 N（从质心出发） */}
        {derived.magN > 1e-9 && (
          <>
            <IsoArrow from={centroid} to={normalTip} markerId="arr-n" stroke="#e879f9" strokeWidth={3} />
            <PointLabel pos={normalTip} label="n" color="#e879f9" dx={6} dy={-8} />
            {/* 质心小点 */}
            {(() => {
              const sc = math3DToScreen(centroid, SVG_PARAMS);
              return <circle cx={sc.x} cy={sc.y} r={3} fill="#e879f955" />;
            })()}
          </>
        )}

        {/* 直线方向向量 L（线面/平行/垂直模式显示） */}
        {(mode === 'parallel' || mode === 'perp' || mode === 'line-plane') && derived.magL > 1e-9 && (
          <>
            <IsoArrow from={lBase} to={lTip} markerId="arr-l" stroke="#fbbf24" strokeWidth={2.5} />
            <PointLabel pos={lTip} label="L" color="#fbbf24" dx={6} dy={-8} />
          </>
        )}

        {/* 线面垂直时：绘制 L 在平面上的投影（虚线） */}
        {mode === 'line-plane' && derived.magN > 1e-9 && derived.magL > 1e-9 && (() => {
          // 投影向量: L_proj = L - (L·N̂)N̂
          const dotLN = dot3(derived.L, derived.Nn);
          const projOnN: Vector3 = {
            x: derived.Nn.x * dotLN,
            y: derived.Nn.y * dotLN,
            z: derived.Nn.z * dotLN,
          };
          const projOnPlane: Vector3 = sub3(derived.L, projOnN);
          const pScale = magnitude3(projOnPlane) > 1e-9 ? lScale : 0;
          const projTip: Vector3 = {
            x: centroid.x + projOnPlane.x * pScale,
            y: centroid.y + projOnPlane.y * pScale,
            z: centroid.z + projOnPlane.z * pScale,
          };
          return (
            <IsoArrow from={centroid} to={projTip} markerId="arr-proj" stroke="#94a3b8" strokeWidth={1.5} dashed opacity={0.7} />
          );
        })()}

        {/* 退化提示 */}
        {derived.magN < 1e-9 && (
          <text x={SVG_W / 2} y={SVG_H - 20} textAnchor="middle" fill="#ef4444" fontSize="13">
            ⚠️ A、B、C 三点共线，无法确定平面
          </text>
        )}
      </svg>
    </div>
  );

  // ─── 右侧代数演算面板 ─────────────────────────────────
  const isDegenerate = derived.magN < 1e-9;

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>

      {/* 向量基础信息 */}
      <MathCard title="📐 平面基向量" accentColor="#6366f1">
        <Row label="AB⃗ =" value={fmt(derived.AB)} color="#60a5fa" />
        <Row label="AC⃗ =" value={fmt(derived.AC)} color="#fb923c" />
        <Row label="AB⃗ · AC⃗ =" value={fmtN(derived.dotABAC)} color={Math.abs(derived.dotABAC) < 0.01 ? '#34d399' : '#f1f5f9'} />
        {derived.ABperpAC && (
          <div style={{ marginTop: '6px', padding: '4px 8px', background: '#34d39922', borderRadius: '6px', color: '#34d399', fontSize: '11.5px' }}>
            ✅ AB ⊥ AC（点积为零）
          </div>
        )}
      </MathCard>

      {/* 法向量求解 */}
      {!isDegenerate ? (
        <MathCard title="🔮 法向量（叉积）" accentColor="#e879f9">
          <Row label="n = AB × AC" value="" />
          <Row label="=" value={fmt(derived.N)} color="#e879f9" />
          <Row label="|n| =" value={fmtN(derived.magN)} color="#e879f9" />
          <Row label="n̂ (单位法向量)" value={fmt(derived.Nn, 3)} color="#c084fc" />
          <div style={{ marginTop: '8px', padding: '6px 8px', background: '#e879f910', borderRadius: '6px', fontSize: '11px', color: '#a855f7', lineHeight: 1.6 }}>
            <strong>叉积判定法：</strong><br />
            n = AB⃗ × AC⃗，结果向量同时垂直于 AB⃗ 和 AC⃗，即为平面 ABC 的法向量。
          </div>
        </MathCard>
      ) : (
        <MathCard title="⚠️ 退化：三点共线" accentColor="#ef4444">
          <p style={{ color: '#ef4444', fontSize: '12px' }}>A、B、C 共线时叉积为零向量，平面无法确定。请调整坐标使三点不共线。</p>
        </MathCard>
      )}

      {/* 根据模式显示额外信息 */}
      {mode === 'normal' && !isDegenerate && (
        <MathCard title="📏 O 到平面 ABC 的距离" accentColor="#64748b">
          <Row label="d(O, 平面ABC) =" value={fmtN(derived.dOriginToPlane)} color="#94a3b8" />
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
            公式：d = |n̂ · AO⃗|<br />
            其中 AO⃗ = O - A = {fmt(sub3(O, A))}
          </div>
        </MathCard>
      )}

      {(mode === 'parallel' || mode === 'perp') && (
        <>
          <MathCard title="📍 方向向量 L" accentColor="#fbbf24">
            <Row label="L =" value={fmt(L)} color="#fbbf24" />
            <Row label="|L| =" value={fmtN(derived.magL)} color="#fbbf24" />
          </MathCard>

          <MathCard title="⚡ 线线关系（L vs AB）" accentColor="#60a5fa">
            <Row label="L · AB =" value={fmtN(dot3(L, derived.AB))} />
            <Row label="|L × AB| =" value={fmtN(magnitude3(cross3(L, derived.AB)))} />
            <Row
              label="平行（L // AB）"
              value={derived.LparallelAB ? '✅ 是' : '❌ 否'}
              color={derived.LparallelAB ? '#34d399' : '#ef4444'}
            />
            <Row
              label="垂直（L ⊥ AB）"
              value={derived.LperpAB ? '✅ 是' : '❌ 否'}
              color={derived.LperpAB ? '#34d399' : '#ef4444'}
            />
          </MathCard>

          <MathCard title="⚡ 线线关系（L vs AC）" accentColor="#fb923c">
            <Row label="L · AC =" value={fmtN(dot3(L, derived.AC))} />
            <Row
              label="平行（L // AC）"
              value={derived.LparallelAC ? '✅ 是' : '❌ 否'}
              color={derived.LparallelAC ? '#34d399' : '#ef4444'}
            />
            <Row
              label="垂直（L ⊥ AC）"
              value={derived.LperpAC ? '✅ 是' : '❌ 否'}
              color={derived.LperpAC ? '#34d399' : '#ef4444'}
            />
          </MathCard>

          {!isDegenerate && (
            <MathCard title="🎯 线面关系（L vs 平面ABC）" accentColor="#e879f9">
              <Row label="L · n =" value={fmtN(dot3(L, derived.N))} />
              <Row label="|L × n| =" value={fmtN(magnitude3(cross3(L, derived.N)))} />
              <Row
                label="L // 平面"
                value={derived.LparallelPlane ? '✅ 是（L·n=0）' : '❌ 否'}
                color={derived.LparallelPlane ? '#34d399' : '#ef4444'}
              />
              <Row
                label="L ⊥ 平面"
                value={derived.LperpPlane ? '✅ 是（L×n=0）' : '❌ 否'}
                color={derived.LperpPlane ? '#34d399' : '#ef4444'}
              />
            </MathCard>
          )}
        </>
      )}

      {mode === 'line-plane' && !isDegenerate && (
        <>
          <MathCard title="📐 线面角计算" accentColor="#fbbf24">
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', lineHeight: 1.6 }}>
              线面角 θ = |90° − ∠(L, n)|<br />
              若 L 平行于平面，θ = 0°；垂直时，θ = 90°
            </div>
            <Row label="∠(L, n) =" value={`${deg(derived.angleNL)}°`} />
            <Row label="线面角 θ =" value={`${deg(derived.linePlaneAngle)}°`} color="#fbbf24" />
            <Row
              label="状态"
              value={
                derived.LparallelPlane ? '平行（θ = 0°）' :
                derived.LperpPlane     ? '垂直（θ = 90°）' :
                '斜交'
              }
              color={
                derived.LparallelPlane || derived.LperpPlane ? '#34d399' : '#f1f5f9'
              }
            />
          </MathCard>

          <MathCard title="🧮 L 在平面上的投影" accentColor="#94a3b8">
            {(() => {
              const dotLN = dot3(derived.L, derived.Nn);
              const projOnN: Vector3 = { x: derived.Nn.x * dotLN, y: derived.Nn.y * dotLN, z: derived.Nn.z * dotLN };
              const projOnPlane = sub3(derived.L, projOnN);
              return (
                <>
                  <Row label="L 沿 n 的分量" value={fmt(projOnN, 3)} color="#c084fc" />
                  <Row label="L 在平面投影" value={fmt(projOnPlane, 3)} color="#94a3b8" />
                  <Row label="|投影|" value={fmtN(magnitude3(projOnPlane))} />
                </>
              );
            })()}
          </MathCard>
        </>
      )}

      {/* 知识点提示 */}
      <MathCard title="💡 核心结论" accentColor="#475569">
        <ul style={{ margin: 0, paddingLeft: '14px', color: '#64748b', fontSize: '11.5px', lineHeight: 2 }}>
          <li>面的法向量 <strong style={{ color: '#e879f9' }}>n = AB × AC</strong></li>
          <li>线 // 面 ⟺ <strong style={{ color: '#34d399' }}>L · n = 0</strong></li>
          <li>线 ⊥ 面 ⟺ <strong style={{ color: '#60a5fa' }}>L × n = 0</strong>（即 L // n）</li>
          <li>面 // 面 ⟺ 两法向量平行</li>
          <li>面 ⊥ 面 ⟺ <strong style={{ color: '#fb923c' }}>n₁ · n₂ = 0</strong></li>
        </ul>
      </MathCard>
    </div>
  );

  return <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />;
}
