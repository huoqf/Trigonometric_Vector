/**
 * @file src/features/space-vector/SolidGeo3D.tsx
 * @description 专题 6 — 立体几何综合题与微专题（Three.js 3D 渲染层）
 *
 * 功能：
 *   - 正四棱锥 / 正三棱锥 / 长方体 三维模型展示与交互
 *   - OrbitControls 旋转/缩放/平移
 *   - 关键点、棱、法向量可视化
 *   - 右侧分步演算看板（向量公式验证）
 */

import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text, Sphere, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { cross3, dot3, magnitude3, normalize3, sub3, planeNormal, pointToPlaneDistance } from '@/math/vector3';
import type { Vector3 as Vec3 } from '@/types/vector3';

// ─── 类型 ─────────────────────────────────────────────
type ShapeType = 'pyramid4' | 'pyramid3' | 'cuboid';

// ─── 工具 ─────────────────────────────────────────────
const fN = (n: number, d = 3) => n.toFixed(d);
const fmt = (v: Vec3, d = 2) => `(${v.x.toFixed(d)}, ${v.y.toFixed(d)}, ${v.z.toFixed(d)})`;
const toTHREE = (v: Vec3) => new THREE.Vector3(v.x, v.y, v.z);

// ─── 几何体顶点定义 ────────────────────────────────────
function getPyramid4Verts(a = 2, h = 3): Vec3[] {
  const half = a / 2;
  return [
    { x: -half, y: 0, z: -half }, // A
    { x:  half, y: 0, z: -half }, // B
    { x:  half, y: 0, z:  half }, // C
    { x: -half, y: 0, z:  half }, // D
    { x:  0,    y: h, z:  0    }, // P (顶点)
  ];
}

function getPyramid3Verts(a = 2.5, h = 3): Vec3[] {
  const r = a / Math.sqrt(3);
  return [
    { x:  r,         y: 0, z:  0          }, // A
    { x: -r / 2,     y: 0, z:  r * Math.sqrt(3) / 2 }, // B
    { x: -r / 2,     y: 0, z: -r * Math.sqrt(3) / 2 }, // C
    { x:  0,         y: h, z:  0          }, // P (顶点)
  ];
}

function getCuboidVerts(lx = 3, ly = 2, lz = 2): Vec3[] {
  const hx = lx / 2, hy = ly / 2, hz = lz / 2;
  return [
    { x: -hx, y: -hy, z: -hz }, // 0 A
    { x:  hx, y: -hy, z: -hz }, // 1 B
    { x:  hx, y: -hy, z:  hz }, // 2 C
    { x: -hx, y: -hy, z:  hz }, // 3 D
    { x: -hx, y:  hy, z: -hz }, // 4 E
    { x:  hx, y:  hy, z: -hz }, // 5 F
    { x:  hx, y:  hy, z:  hz }, // 6 G
    { x: -hx, y:  hy, z:  hz }, // 7 H
  ];
}

// ─── 棱（edges）定义 ─────────────────────────────────
const PYRAMID4_EDGES = [
  [0,1],[1,2],[2,3],[3,0], // 底面
  [0,4],[1,4],[2,4],[3,4], // 侧棱
];
const PYRAMID3_EDGES = [
  [0,1],[1,2],[2,0], // 底面
  [0,3],[1,3],[2,3], // 侧棱
];
const CUBOID_EDGES = [
  [0,1],[1,2],[2,3],[3,0], // 底面
  [4,5],[5,6],[6,7],[7,4], // 顶面
  [0,4],[1,5],[2,6],[3,7], // 侧棱
];

// 顶点标签
const PYRAMID4_LABELS = ['A','B','C','D','P'];
const PYRAMID3_LABELS = ['A','B','C','P'];
const CUBOID_LABELS   = ['A','B','C','D','E','F','G','H'];

// ─── 旋转动画包装 ─────────────────────────────────────
function AutoRotateGroup({ children, rotate }: { children: React.ReactNode; rotate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rotate && ref.current) ref.current.rotation.y += delta * 0.4;
  });
  return <group ref={ref}>{children}</group>;
}

// ─── 几何线框 ─────────────────────────────────────────
function WireframeEdges({ verts, edges, color }: {
  verts: Vec3[]; edges: number[][]; color: string;
}) {
  return (
    <>
      {edges.map(([i, j], idx) => (
        <Line
          key={idx}
          points={[toTHREE(verts[i]), toTHREE(verts[j])]}
          color={color}
          lineWidth={2.5}
        />
      ))}
    </>
  );
}

// ─── 顶点球 + 标签 ────────────────────────────────────
function VertexMarkers({ verts, labels, showLabels }: {
  verts: Vec3[]; labels: string[]; showLabels: boolean;
}) {
  return (
    <>
      {verts.map((v, i) => (
        <group key={i} position={[v.x, v.y, v.z]}>
          <Sphere args={[0.07, 12, 12]}>
            <meshStandardMaterial color="#f8fafc" emissive="#6366f1" emissiveIntensity={0.6} />
          </Sphere>
          {showLabels && (
            <Text
              position={[0.15, 0.15, 0]}
              fontSize={0.25}
              color="#a5b4fc"
              anchorX="left"
            >
              {labels[i]}
            </Text>
          )}
        </group>
      ))}
    </>
  );
}

// ─── 法向量箭头（用 Line 近似） ───────────────────────
function NormalArrow({ origin, dir, len = 1.2, color = '#e879f9' }: {
  origin: Vec3; dir: Vec3; len?: number; color?: string;
}) {
  const mag = magnitude3(dir);
  if (mag < 1e-9) return null;
  const n = normalize3(dir);
  const tip: Vec3 = { x: origin.x + n.x * len, y: origin.y + n.y * len, z: origin.z + n.z * len };
  return (
    <Line
      points={[toTHREE(origin), toTHREE(tip)]}
      color={color}
      lineWidth={3}
    />
  );
}

// ─── 半透明面片 ───────────────────────────────────────
function TransparentFace({ verts, color, opacity = 0.15 }: {
  verts: [Vec3, Vec3, Vec3]; color: string; opacity?: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      verts[0].x, verts[0].y, verts[0].z,
      verts[1].x, verts[1].y, verts[1].z,
      verts[2].x, verts[2].y, verts[2].z,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [verts]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── 3D 场景内容 ──────────────────────────────────────
function Scene({ shape, showNormal, showLabels, rotate, highlightFace }: {
  shape: ShapeType;
  showNormal: boolean;
  showLabels: boolean;
  rotate: boolean;
  highlightFace: number;
}) {
  const verts = shape === 'pyramid4' ? getPyramid4Verts()
    : shape === 'pyramid3' ? getPyramid3Verts()
    : getCuboidVerts();
  const edges = shape === 'pyramid4' ? PYRAMID4_EDGES
    : shape === 'pyramid3' ? PYRAMID3_EDGES
    : CUBOID_EDGES;
  const labels = shape === 'pyramid4' ? PYRAMID4_LABELS
    : shape === 'pyramid3' ? PYRAMID3_LABELS
    : CUBOID_LABELS;

  // 高亮面三角形（取第一个三角面做演示）
  const faceTris: [Vec3, Vec3, Vec3][] = useMemo(() => {
    if (shape === 'pyramid4') {
      return [
        [verts[0], verts[1], verts[4]], // 面 ABP
        [verts[1], verts[2], verts[4]], // 面 BCP
        [verts[2], verts[3], verts[4]], // 面 CDP
        [verts[3], verts[0], verts[4]], // 面 DAP
        [verts[0], verts[1], verts[2]], // 底面 ABC
        [verts[0], verts[2], verts[3]], // 底面 ACD
      ];
    }
    if (shape === 'pyramid3') {
      return [
        [verts[0], verts[1], verts[3]],
        [verts[1], verts[2], verts[3]],
        [verts[2], verts[0], verts[3]],
        [verts[0], verts[1], verts[2]],
      ];
    }
    // 长方体：6 个面，每面 2 个三角形，只取第一个
    return [
      [verts[0], verts[1], verts[2]], // 底面
      [verts[4], verts[5], verts[6]], // 顶面
      [verts[0], verts[1], verts[5]], // 前面
      [verts[2], verts[3], verts[7]], // 后面
      [verts[0], verts[3], verts[7]], // 左面
      [verts[1], verts[2], verts[6]], // 右面
    ];
  }, [shape, verts]);

  const highlightedTri = faceTris[highlightFace] ?? faceTris[0];
  const normalOrig: Vec3 = {
    x: (highlightedTri[0].x + highlightedTri[1].x + highlightedTri[2].x) / 3,
    y: (highlightedTri[0].y + highlightedTri[1].y + highlightedTri[2].y) / 3,
    z: (highlightedTri[0].z + highlightedTri[1].z + highlightedTri[2].z) / 3,
  };
  const normalDir = planeNormal(highlightedTri[0], highlightedTri[1], highlightedTri[2]);

  return (
    <>
      {/* 环境光 + 方向光 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 6, -4]} intensity={0.6} color="#818cf8" />

      {/* 网格辅助（地面） */}
      <gridHelper args={[10, 10, '#1e293b', '#1e293b']} position={[0, -0.01, 0]} />

      <AutoRotateGroup rotate={rotate}>
        {/* 高亮面 */}
        <TransparentFace verts={highlightedTri} color="#6366f1" opacity={0.25} />

        {/* 棱 */}
        <WireframeEdges verts={verts} edges={edges} color="#818cf8" />

        {/* 顶点 */}
        <VertexMarkers verts={verts} labels={labels} showLabels={showLabels} />

        {/* 法向量 */}
        {showNormal && (
          <NormalArrow origin={normalOrig} dir={normalDir} len={1.4} color="#e879f9" />
        )}
      </AutoRotateGroup>

      {/* 坐标辅助 */}
      <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
        <GizmoViewport axisColors={['#ef4444', '#34d399', '#60a5fa']} labelColor="#f8fafc" />
      </GizmoHelper>

      <OrbitControls enablePan enableZoom enableRotate makeDefault />
    </>
  );
}

// ─── 代数卡片 ─────────────────────────────────────────
function Card({ title, children, accent = '#6366f1' }: {
  title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: '12px', border: `1px solid ${accent}33`, padding: '13px 15px', marginBottom: '11px', boxShadow: `0 0 10px ${accent}15` }}>
      <h4 style={{ margin: '0 0 9px', fontSize: '12.5px', color: accent, fontWeight: 700 }}>{title}</h4>
      {children}
    </div>
  );
}
function Row({ label, value, color = '#f1f5f9' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color, fontFamily: 'monospace', fontSize: '11.5px' }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────
export function SolidGeo3D() {
  const [shape, setShape]           = useState<ShapeType>('pyramid4');
  const [showNormal, setShowNormal] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [rotate, setRotate]         = useState(false);
  const [highlightFace, setHighlightFace] = useState(0);

  // 取当前形状顶点用于右侧演算
  const verts = shape === 'pyramid4' ? getPyramid4Verts()
    : shape === 'pyramid3' ? getPyramid3Verts()
    : getCuboidVerts();
  const labels = shape === 'pyramid4' ? PYRAMID4_LABELS
    : shape === 'pyramid3' ? PYRAMID3_LABELS
    : CUBOID_LABELS;

  // 高亮面三角形（与 Scene 内一致）
  const faceTrisForCalc: [Vec3, Vec3, Vec3][] = useMemo(() => {
    if (shape === 'pyramid4') return [
      [verts[0], verts[1], verts[4]],
      [verts[1], verts[2], verts[4]],
      [verts[2], verts[3], verts[4]],
      [verts[3], verts[0], verts[4]],
      [verts[0], verts[1], verts[2]],
      [verts[0], verts[2], verts[3]],
    ];
    if (shape === 'pyramid3') return [
      [verts[0], verts[1], verts[3]],
      [verts[1], verts[2], verts[3]],
      [verts[2], verts[0], verts[3]],
      [verts[0], verts[1], verts[2]],
    ];
    return [
      [verts[0], verts[1], verts[2]],
      [verts[4], verts[5], verts[6]],
      [verts[0], verts[1], verts[5]],
      [verts[2], verts[3], verts[7]],
      [verts[0], verts[3], verts[7]],
      [verts[1], verts[2], verts[6]],
    ];
  }, [shape, verts]);

  const faceCount = faceTrisForCalc.length;
  const safeFace = Math.min(highlightFace, faceCount - 1);
  const tri = faceTrisForCalc[safeFace];
  const N = planeNormal(tri[0], tri[1], tri[2]);
  const magN = magnitude3(N);
  const Nn = normalize3(N);
  const AB = sub3(tri[1], tri[0]);
  const AC = sub3(tri[2], tri[0]);
  // 原点到该面距离
  const dOriginToFace = magN < 1e-9 ? 0 : pointToPlaneDistance({ x: 0, y: 0, z: 0 }, { normal: N, point: tri[0] });

  const shapeNames: Record<ShapeType, string> = {
    pyramid4: '正四棱锥',
    pyramid3: '正三棱锥',
    cuboid:   '长方体',
  };
  const faceNames: Record<ShapeType, string[]> = {
    pyramid4: ['面 ABP','面 BCP','面 CDP','面 DAP','底面△ABC','底面△ACD'],
    pyramid3: ['面 ABP','面 BCP','面 CAP','底面 ABC'],
    cuboid:   ['底面 ABC','顶面 EFG','前面 ABF','后面 CDH','左面 ADH','右面 BCG'],
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '82vh', gap: '16px', boxSizing: 'border-box' }}>

      {/* ── 左侧控制 ────────────────────────────── */}
      <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
        <div className="control-group">
          <h3 className="control-title">3D 立体几何综合</h3>
          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            拖拽旋转视角，选择几何体与高亮面，观察法向量与代数推导。
          </p>
        </div>

        {/* 形状选择 */}
        <div className="control-group">
          <label className="control-label">几何体</label>
          {(['pyramid4', 'pyramid3', 'cuboid'] as ShapeType[]).map(s => (
            <button key={s} onClick={() => { setShape(s); setHighlightFace(0); }} style={{
              display: 'block', width: '100%', marginBottom: '6px',
              padding: '8px 10px', fontSize: '13px', fontWeight: 600,
              borderRadius: '8px', border: '1px solid', cursor: 'pointer',
              transition: 'all 0.18s',
              borderColor: shape === s ? '#6366f1' : '#334155',
              backgroundColor: shape === s ? '#6366f120' : '#1e293b',
              color: shape === s ? '#a5b4fc' : '#94a3b8',
            }}>
              {shapeNames[s]}
            </button>
          ))}
        </div>

        {/* 高亮面 */}
        <div className="control-group">
          <label className="control-label">高亮面</label>
          <select
            value={safeFace}
            onChange={e => setHighlightFace(parseInt(e.target.value))}
            style={{ width: '100%', padding: '7px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', fontSize: '12px' }}
          >
            {faceNames[shape].map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>

        {/* 显示选项 */}
        <div className="control-group">
          <label className="control-label">显示选项</label>
          {[
            ['showNormal', showNormal, () => setShowNormal(v => !v), '法向量'],
            ['showLabels', showLabels, () => setShowLabels(v => !v), '顶点标签'],
            ['rotate',     rotate,     () => setRotate(v => !v),     '自动旋转'],
          ].map(([key, val, fn, text]) => (
            <label key={key as string} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px', color: val ? '#a5b4fc' : '#64748b' }}>
              <input type="checkbox" checked={val as boolean} onChange={fn as any} style={{ accentColor: '#6366f1' }} />
              {text as string}
            </label>
          ))}
        </div>
      </div>

      {/* ── 中间 3D Canvas ───────────────────────── */}
      <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid #1e293b', background: '#090d16' }}>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
            加载 3D 场景中…
          </div>
        }>
          <Canvas
            camera={{ position: [5, 4, 5], fov: 45 }}
            gl={{ antialias: true }}
            shadows
          >
            <color attach="background" args={['#090d16']} />
            <fog attach="fog" args={['#090d16', 12, 25]} />
            <Scene
              shape={shape}
              showNormal={showNormal}
              showLabels={showLabels}
              rotate={rotate}
              highlightFace={safeFace}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* ── 右侧代数演算 ─────────────────────────── */}
      <div style={{ width: '220px', flexShrink: 0, overflowY: 'auto' }}>
        <Card title={`📐 ${shapeNames[shape]}`} accent="#6366f1">
          <Row label="顶点数" value={`${verts.length}`} />
          {verts.map((v, i) => (
            <Row key={i} label={labels[i]} value={fmt(v)} color="#94a3b8" />
          ))}
        </Card>

        <Card title={`🔮 高亮面法向量`} accent="#e879f9">
          <Row label="顶点1" value={fmt(tri[0])} color="#60a5fa" />
          <Row label="顶点2" value={fmt(tri[1])} color="#34d399" />
          <Row label="顶点3" value={fmt(tri[2])} color="#fb923c" />
          <div style={{ margin: '6px 0', height: '1px', background: '#1e293b' }} />
          <Row label="AB⃗" value={fmt(AB)} />
          <Row label="AC⃗" value={fmt(AC)} />
          <Row label="n = AB×AC" value={fmt(N)} color="#e879f9" />
          <Row label="|n|" value={fN(magN)} color="#e879f9" />
          <Row label="n̂" value={fmt(Nn, 3)} color="#c084fc" />
        </Card>

        <Card title="📏 原点→高亮面距离" accent="#fbbf24">
          <Row label="d(O, 面) =" value={fN(dOriginToFace)} color="#fbbf24" />
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', lineHeight: 1.6 }}>
            d = |n̂ · AO⃗|<br />
            AO⃗ = {fmt(sub3({ x: 0, y: 0, z: 0 }, tri[0]))}
          </div>
        </Card>

        <Card title="⚡ 点积验证" accent="#34d399">
          <Row label="n · AB⃗" value={fN(dot3(N, AB))} color={Math.abs(dot3(N, AB)) < 0.01 ? '#34d399' : '#ef4444'} />
          <Row label="n · AC⃗" value={fN(dot3(N, AC))} color={Math.abs(dot3(N, AC)) < 0.01 ? '#34d399' : '#ef4444'} />
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', lineHeight: 1.6 }}>
            两值均≈0 验证 n⊥面 ✓
          </div>
        </Card>
      </div>
    </div>
  );
}
