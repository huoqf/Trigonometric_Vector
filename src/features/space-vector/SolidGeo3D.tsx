/**
 * @file src/features/space-vector/SolidGeo3D.tsx
 * @description 专题 6 — 立体几何综合题与微专题（Three.js 3D 渲染层）
 *
 * 功能：
 *   - 正四棱锥 / 正三棱锥 / 长方体 三维模型展示与交互
 *   - OrbitControls 旋转/缩放/平移
 *   - 关键点、棱、法向量可视化
 *   - 右侧分步演算看板（向量公式验证）
 *   - 立体几何题库 + 苏格拉底分步提示面板（题目模式）
 */

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, Sphere, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { dot3, magnitude3, normalize3, sub3, planeNormal, pointToPlaneDistance, cross3 } from '@/math/vector3';
import type { Vector3 as Vec3 } from '@/types/vector3';

// ─── 类型 ─────────────────────────────────────────────
type ShapeType = 'pyramid4' | 'pyramid3' | 'cuboid';
type AppMode = 'explore' | 'problem';

// ─── 工具 ─────────────────────────────────────────────
const fN = (n: number, d = 3) => n.toFixed(d);
const fmt = (v: Vec3, d = 2) => `(${v.x.toFixed(d)}, ${v.y.toFixed(d)}, ${v.z.toFixed(d)})`;
const toTHREE = (v: Vec3) => new THREE.Vector3(v.x, v.y, v.z);
const deg = (rad: number) => (rad * 180 / Math.PI).toFixed(2);

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

// ─── 题库类型 ─────────────────────────────────────────
interface ProblemStep {
  hint: string;       // 苏格拉底式引导提示
  solution: string;   // 完整计算步骤/答案
  formula?: string;   // 核心公式（可选）
}

interface Problem {
  id: string;
  shape: ShapeType;
  highlightFace: number;
  title: string;
  statement: string;   // 题干
  steps: ProblemStep[];
  answer: string;      // 最终答案
}

// ─── 立体几何题库 ─────────────────────────────────────
const PROBLEMS: Problem[] = [
  // ── 正四棱锥题组 ──────────────────────────────────
  {
    id: 'p4-01',
    shape: 'pyramid4',
    highlightFace: 0,
    title: '正四棱锥侧面法向量',
    statement:
      '正四棱锥 P-ABCD，底面边长 a = 2，高 h = 3。\n' +
      '以 A 为原点建立空间直角坐标系。求侧面 △ABP 的法向量 n。',
    steps: [
      {
        hint: '① 先写出三个顶点的坐标。A、B 在底面，P 是顶点——你能写出它们的坐标吗？',
        solution: 'A = (−1, 0, −1)，B = (1, 0, −1)，P = (0, 3, 0)',
        formula: '以底面中心为原点，x/z 轴平行底面边',
      },
      {
        hint: '② 计算 AB⃗ 和 AP⃗ 两个向量。向量 = 终点坐标 − 起点坐标。',
        solution: 'AB⃗ = B − A = (2, 0, 0)\nAP⃗ = P − A = (1, 3, 1)',
        formula: 'AB⃗ = (x_B−x_A, y_B−y_A, z_B−z_A)',
      },
      {
        hint: '③ 法向量 n = AB⃗ × AP⃗（叉积）。回忆叉积公式：\nn = (a₂b₃−a₃b₂, a₃b₁−a₁b₃, a₁b₂−a₂b₁)',
        solution:
          'n = AB⃗ × AP⃗\n' +
          '  = (0·1 − 0·3, 0·1 − 2·1, 2·3 − 0·1)\n' +
          '  = (0, −2, 6)',
        formula: 'n = AB⃗ × AP⃗',
      },
      {
        hint: '④ 验证 n ⊥ 面：计算 n · AB⃗ 和 n · AP⃗，结果应均为 0。',
        solution:
          'n · AB⃗ = 0·2 + (−2)·0 + 6·0 = 0 ✓\n' +
          'n · AP⃗ = 0·1 + (−2)·3 + 6·1 = 0 ✓\n' +
          '验证通过！n = (0, −2, 6) 即为所求法向量。',
        formula: 'n ⊥ 面 ⟺ n·AB = 0 且 n·AP = 0',
      },
    ],
    answer: 'n = (0, −2, 6)（或化简为 (0, −1, 3)）',
  },
  {
    id: 'p4-02',
    shape: 'pyramid4',
    highlightFace: 1,
    title: '正四棱锥二面角',
    statement:
      '正四棱锥 P-ABCD，底面边长 a = 2，高 h = 3。\n' +
      '求侧面 △BCP 与底面 ABCD 所成的二面角 θ。',
    steps: [
      {
        hint: '① 二面角需要两个面各自的法向量。\n先求底面 ABCD 的法向量 n₁——底面平行于 xOz，法向量指向哪个方向？',
        solution: '底面 ABCD 平行于 xOz 平面，故 n₁ = (0, 1, 0)（指向 y 轴正方向）',
        formula: '水平面的法向量 = (0, 1, 0)',
      },
      {
        hint: '② 求侧面 △BCP 的法向量 n₂。\n取 B = (1,0,−1)，C = (1,0,1)，P = (0,3,0)。\n先算 BC⃗ 和 BP⃗。',
        solution:
          'BC⃗ = C − B = (0, 0, 2)\n' +
          'BP⃗ = P − B = (−1, 3, 1)\n' +
          'n₂ = BC⃗ × BP⃗ = (0·1−2·3, 2·(−1)−0·1, 0·3−0·(−1))\n' +
          '   = (−6, −2, 0)',
        formula: 'n₂ = BC⃗ × BP⃗',
      },
      {
        hint: '③ 用两法向量的夹角求二面角。\ncos θ = |n₁ · n₂| / (|n₁| · |n₂|)\n注意要取绝对值（取锐角/直角侧）。',
        solution:
          'n₁ · n₂ = 0·(−6) + 1·(−2) + 0·0 = −2\n' +
          '|n₁| = 1，|n₂| = √(36+4+0) = √40 = 2√10\n' +
          'cos θ = |−2| / (1 · 2√10) = 1/√10\n' +
          'θ = arccos(1/√10) ≈ 71.57°',
        formula: 'cos θ = |n₁·n₂| / (|n₁|·|n₂|)',
      },
    ],
    answer: 'θ = arccos(1/√10) ≈ 71.57°',
  },

  // ── 正三棱锥题组 ──────────────────────────────────
  {
    id: 'p3-01',
    shape: 'pyramid3',
    highlightFace: 0,
    title: '正三棱锥线面角',
    statement:
      '正三棱锥 P-ABC，底面边长 a = 2.5，高 h = 3。\n' +
      '求棱 PA 与底面 ABC 所成的线面角 φ。',
    steps: [
      {
        hint: '① 线面角 = 斜线与其在面内投影所成的角。\nPA 在底面的投影是 OA（O 为底面中心）。\n先求 OA 的长度——底面是正三角形，边长 2.5，外接圆半径是多少？',
        solution:
          '正三角形外接圆半径 R = a/√3 = 2.5/√3 ≈ 1.443\n' +
          '故 |OA| ≈ 1.443，|PA|² = |OA|² + h² = 1/3·a² + h² = 2.083 + 9 = 11.083\n' +
          '|PA| ≈ 3.329',
        formula: 'R = a/√3（正三角形外接圆半径）',
      },
      {
        hint: '② 线面角 φ 满足 tan φ = 高 / 投影长 = h / |OA|。\n代入计算。',
        solution:
          'tan φ = h / R = 3 / (2.5/√3) = 3√3/2.5 = 6√3/5 ≈ 2.078\n' +
          'φ = arctan(6√3/5) ≈ 64.34°',
        formula: 'tan φ = h / R（线面角公式）',
      },
      {
        hint: '③ 用向量法验证：\nn = 底面法向量 (0,1,0)，PA⃗ = A − P。\ncos(90°−φ) = |PA⃗ · n| / |PA⃗|，则 sin φ = |PA⃗ · n| / |PA⃗|。',
        solution:
          '设 A = (R, 0, 0)，P = (0, 3, 0)（此处 R = a/√3 ≈ 1.443）\n' +
          'PA⃗ = (R, −3, 0)，n = (0,1,0)\n' +
          'PA⃗ · n = −3，|PA⃗| ≈ 3.329\n' +
          'sin φ = |−3| / 3.329 ≈ 0.9010\n' +
          'φ = arcsin(0.9010) ≈ 64.34° ✓ 两法一致。',
        formula: 'sin φ = |l⃗ · n| / |l⃗|（线面角向量公式）',
      },
    ],
    answer: 'φ = arctan(6√3/5) ≈ 64.34°',
  },

  // ── 长方体题组 ──────────────────────────────────
  {
    id: 'cb-01',
    shape: 'cuboid',
    highlightFace: 2,
    title: '长方体体对角线与面的角',
    statement:
      '长方体 ABCD-EFGH，长 lx = 3，宽 lz = 2，高 ly = 2。\n' +
      '求体对角线 AG 与底面 ABCD 所成的线面角 θ。',
    steps: [
      {
        hint: '① 先写出 A、G 的坐标。\nA 是底面一角，G 是顶面对角——对应哪两个顶点？',
        solution:
          'A = (−1.5, −1, −1)，G = (1.5, 1, 1)\n（以长方体中心为坐标原点）',
        formula: '顶点坐标 = (±lx/2, ±ly/2, ±lz/2)',
      },
      {
        hint: '② AG⃗ = G − A。计算出 AG⃗ 各分量。',
        solution: 'AG⃗ = (3, 2, 2)',
        formula: 'AG⃗ = G − A',
      },
      {
        hint: '③ AG 在底面的投影是 AG 在 xOz 平面内的投影 AC\' = (3, 0, 2)。\n线面角 θ 满足 tan θ = 竖直分量 / 水平投影长。',
        solution:
          '水平投影 = √(3² + 2²) = √13\n' +
          'tan θ = 高度分量 / 投影长 = 2 / √13\n' +
          'θ = arctan(2/√13) ≈ 29.05°',
        formula: 'tan θ = ly / √(lx² + lz²)',
      },
      {
        hint: '④ 用向量法验证：底面法向量 n = (0,1,0)。\nsin θ = |AG⃗ · n| / |AG⃗|。',
        solution:
          '|AG⃗| = √(9+4+4) = √17\n' +
          'AG⃗ · n = 2\n' +
          'sin θ = 2/√17 ≈ 0.4851\n' +
          'θ = arcsin(2/√17) ≈ 29.05° ✓',
        formula: 'sin θ = |AG⃗ · n̂|，n̂ = (0,1,0)',
      },
    ],
    answer: 'θ = arctan(2/√13) ≈ 29.05°',
  },
  {
    id: 'cb-02',
    shape: 'cuboid',
    highlightFace: 0,
    title: '长方体点到面的距离',
    statement:
      '长方体 ABCD-EFGH，长 lx = 3，宽 lz = 2，高 ly = 2。\n' +
      '求顶点 G 到底面 ABCD 的距离。',
    steps: [
      {
        hint: '① G 在底面的垂足是哪个点？底面 ABCD 平行于 xOz 平面，G 的 y 坐标是多少？',
        solution:
          'G = (1.5, 1, 1)，底面 y = −1。\n' +
          'G 在底面的垂足为 G\' = (1.5, −1, 1)（C 顶点正上方）。',
        formula: '垂直距离 = Δy（因底面平行于 xOz）',
      },
      {
        hint: '② 直接用坐标计算：距离 = |y_G − y_{底面}|。',
        solution:
          'd = |1 − (−1)| = 2\n' +
          '即长方体高度 ly = 2，符合预期。',
        formula: 'd = |y_G − y_底面|',
      },
      {
        hint: '③ 用向量点面距公式验证：\nn = 底面法向量 (0,1,0)，取底面一点 A = (−1.5,−1,−1)。\nd = |GA⃗ · n̂|',
        solution:
          'GA⃗ = A − G = (−3, −2, −2)\n' +
          'n̂ = (0,1,0)\n' +
          'd = |GA⃗ · n̂| = |(−2)| = 2 ✓',
        formula: 'd = |(P₀−P) · n̂|',
      },
    ],
    answer: 'd = 2（即长方体高度）',
  },
];

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
            <Html
              position={[0.12, 0.12, 0]}
              style={{
                color: '#ffffff',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                fontWeight: 'bold',
                fontSize: '13px',
                userSelect: 'none',
                textShadow: '1px 1px 2px #090d16, -1px -1px 2px #090d16, 1px -1px 2px #090d16, -1px 1px 2px #090d16',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {labels[i]}
            </Html>
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

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

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

// ─── 苏格拉底分步提示面板 ─────────────────────────────
function SocraticPanel({ problem }: { problem: Problem }) {
  const [unlockedSteps, setUnlockedSteps] = useState(0);
  const [showSolution, setShowSolution] = useState<boolean[]>(new Array(problem.steps.length).fill(false));
  const [finished, setFinished] = useState(false);

  const unlockNext = () => {
    if (unlockedSteps < problem.steps.length) {
      setUnlockedSteps(s => s + 1);
    }
    if (unlockedSteps + 1 >= problem.steps.length) {
      setFinished(true);
    }
  };

  const toggleSolution = (idx: number) => {
    setShowSolution(arr => {
      const next = [...arr];
      next[idx] = !next[idx];
      return next;
    });
  };

  // 重置
  const reset = () => {
    setUnlockedSteps(0);
    setShowSolution(new Array(problem.steps.length).fill(false));
    setFinished(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 题干 */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 0 12px rgba(99, 102, 241, 0.15)',
      }}>
        <div style={{ fontSize: '13px', color: '#818cf8', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.03em' }}>
          📋 题目
        </div>
        <div style={{ fontSize: '14px', color: '#f8fafc', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {problem.statement}
        </div>
      </div>

      {/* 分步解题 */}
      {problem.steps.map((step, i) => (
        <div
          key={i}
          style={{
            background: i < unlockedSteps
              ? 'rgba(17, 24, 39, 0.95)'
              : 'rgba(17, 24, 39, 0.5)',
            border: `1px solid ${i < unlockedSteps ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            transition: 'all 0.3s ease',
            opacity: i < unlockedSteps ? 1 : 0.6,
            boxShadow: i < unlockedSteps ? '0 0 10px rgba(129, 140, 248, 0.1)' : 'none',
          }}
        >
          {/* 步骤头 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: i < unlockedSteps ? '#6366f1' : '#1f2937',
              border: `2px solid ${i < unlockedSteps ? '#818cf8' : '#374151'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#f8fafc', fontWeight: 700, flexShrink: 0,
              transition: 'all 0.3s',
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '13px', color: i < unlockedSteps ? '#e2e8f0' : '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>
              {i >= unlockedSteps && '🔒 '}{step.hint}
            </div>
          </div>

          {/* 公式标签 */}
          {step.formula && i < unlockedSteps && (
            <div style={{ 
              background: '#030712', 
              border: '1px solid rgba(245, 158, 11, 0.2)', 
              borderRadius: '6px', 
              padding: '6px 10px', 
              marginBottom: '8px', 
              fontSize: '11.5px', 
              color: '#f59e0b', 
              fontFamily: 'monospace',
              maxWidth: '100%',
              overflowX: 'auto'
            }}>
              🔑 {step.formula}
            </div>
          )}

          {/* 解答展开 */}
          {i < unlockedSteps && (
            <div>
              <button
                onClick={() => toggleSolution(i)}
                style={{
                  background: showSolution[i] ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '6px', padding: '5px 12px',
                  fontSize: '12px', color: '#c7d2fe', cursor: 'pointer',
                  transition: 'all 0.2s', marginBottom: showSolution[i] ? '8px' : '0',
                }}
              >
                {showSolution[i] ? '▼ 收起解答' : '▶ 查看解答'}
              </button>
              {showSolution[i] && (
                <div style={{
                  background: '#030712',
                  border: '1px solid rgba(14, 165, 233, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12.5px', color: '#38bdf8',
                  fontFamily: 'monospace', lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  animation: 'fadeIn 0.25s ease',
                  maxWidth: '100%',
                  overflowX: 'auto'
                }}>
                  {step.solution}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* 解锁下一步 / 最终答案 */}
      {!finished ? (
        <button
          onClick={unlockNext}
          disabled={unlockedSteps >= problem.steps.length}
          style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '10px',
            padding: '10px 0', fontSize: '13.5px',
            color: '#fff', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            transition: 'opacity 0.2s',
            opacity: unlockedSteps >= problem.steps.length ? 0.4 : 1,
          }}
        >
          {unlockedSteps === 0 ? '🚀 开始解题' : `🔓 解锁第 ${unlockedSteps + 1} 步`}
        </button>
      ) : (
        <div style={{
          background: 'rgba(6, 78, 59, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '14px 16px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
        }}>
          <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>
            🎯 最终答案
          </div>
          <div style={{ fontSize: '13.5px', color: '#a7f3d0', fontFamily: 'monospace', lineHeight: 1.7, maxWidth: '100%', overflowX: 'auto' }}>
            {problem.answer}
          </div>
        </div>
      )}

      {/* 重置按钮 */}
      {unlockedSteps > 0 && (
        <button
          onClick={reset}
          style={{
            background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '8px', padding: '7px 0',
            fontSize: '12px', color: '#94a3b8', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ↺ 重新练习
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────
export function SolidGeo3D() {
  const [appMode, setAppMode]            = useState<AppMode>('explore');
  const [shape, setShape]                = useState<ShapeType>('pyramid4');
  const [showNormal, setShowNormal]      = useState(true);
  const [showLabels, setShowLabels]      = useState(true);
  const [rotate, setRotate]             = useState(false);
  const [highlightFace, setHighlightFace] = useState(0);

  // 题目模式
  const [problemIdx, setProblemIdx]      = useState(0);
  const currentProblem                   = PROBLEMS[problemIdx];

  // 当切换题目时同步几何体和高亮面
  const selectProblem = (idx: number) => {
    setProblemIdx(idx);
    setShape(PROBLEMS[idx].shape);
    setHighlightFace(PROBLEMS[idx].highlightFace);
  };

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

  // 右侧面板按 appMode 切换
  const rightPanel = appMode === 'problem' ? (
    <div style={{ width: '28%', minWidth: '280px', maxWidth: '360px', flexShrink: 0, overflowY: 'auto', paddingRight: '2px' }}>
      {/* 题目选择器 */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '12px',
      }}>
        <div style={{ fontSize: '13px', color: '#818cf8', fontWeight: 700, marginBottom: '8px' }}>
          📚 题目列表
        </div>
        {PROBLEMS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => selectProblem(i)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: problemIdx === i ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: `1px solid ${problemIdx === i ? 'rgba(99, 102, 241, 0.6)' : 'rgba(255, 255, 255, 0.05)'}`,
              borderRadius: '7px', padding: '7px 10px',
              marginBottom: '5px', cursor: 'pointer',
              fontSize: '12.5px', color: problemIdx === i ? '#a5b4fc' : '#94a3b8',
              transition: 'all 0.18s',
            }}
          >
            <span style={{ color: '#64748b', marginRight: '6px' }}>
              {p.shape === 'pyramid4' ? '🔺' : p.shape === 'pyramid3' ? '▲' : '🟦'}
            </span>
            {p.title}
          </button>
        ))}
      </div>
      <SocraticPanel key={currentProblem.id} problem={currentProblem} />
    </div>
  ) : (
    <div style={{ width: '28%', minWidth: '280px', maxWidth: '360px', flexShrink: 0, overflowY: 'auto' }}>
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
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '82vh', gap: '0', boxSizing: 'border-box' }}>

      {/* ── 顶部模式切换 Tab ─────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {([['explore', '🔍 自由探索'], ['problem', '📝 综合例题']] as [AppMode, string][]).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setAppMode(mode)}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              border: `1px solid ${appMode === mode ? '#6366f1' : '#1e293b'}`,
              background: appMode === mode ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#0f172a',
              color: appMode === mode ? '#fff' : '#64748b',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              boxShadow: appMode === mode ? '0 4px 15px #6366f130' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11.5px', color: '#334155', alignSelf: 'center' }}>
          拖拽旋转 · 滚轮缩放
        </span>
      </div>

      {/* ── 主体三栏布局 ─────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, gap: '16px', minHeight: 0 }}>

        {/* ── 左侧控制 ─────────────────────────── */}
        <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          <div className="control-group">
            <h3 className="control-title">3D 立体几何综合</h3>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              {appMode === 'explore'
                ? '选择几何体与高亮面，观察法向量与代数推导。'
                : '选择题目后，3D 视图会自动切换对应几何体。'}
            </p>
          </div>

          {/* 形状选择（探索模式显示） */}
          {appMode === 'explore' && (
            <>
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
            </>
          )}

          {/* 题目模式：形状只读展示 */}
          {appMode === 'problem' && (
            <div className="control-group">
              <label className="control-label">当前几何体</label>
              <div style={{
                padding: '8px 10px', borderRadius: '8px',
                background: '#6366f120', border: '1px solid #6366f133',
                fontSize: '13px', color: '#a5b4fc', fontWeight: 600,
              }}>
                {shapeNames[shape]}
              </div>
            </div>
          )}

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
          <ErrorBoundary fallback={
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fca5a5', gap: '12px', padding: '20px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>3D 场景渲染出错</span>
              <span style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', maxWidth: '80%' }}>
                可能由于浏览器 WebGL 支持不足或网络加载字体超时导致。
              </span>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '6px 16px',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                刷新页面
              </button>
            </div>
          }>
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
          </ErrorBoundary>
        </div>

        {/* ── 右侧面板（按模式切换） ─────────────────── */}
        {rightPanel}
      </div>
    </div>
  );
}
