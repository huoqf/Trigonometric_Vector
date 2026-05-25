/**
 * @file src/math/vector3.ts
 * @description 三维向量纯函数库
 *
 * 坐标系约定（适用于本文件所有函数）：
 *   - 数学右手坐标系：x 轴向右，y 轴向上，z 轴朝向观察者
 *   - 原点居中，单位长度标准化
 *   - 所有函数无副作用、无全局状态
 *
 * ⚠️ 严禁：
 *   - 引入 React 状态 / DOM / Canvas / 像素坐标
 *   - 在本文件实现屏幕坐标转换（→ src/utils/coordinate3.ts）
 *   - 引入任何带副作用的操作
 *   - 引用 src/math/vector.ts（两套坐标系独立，避免隐式混用）
 */

import type { Vector3, Plane3, Line3 } from '@/types/vector3';
import type { Vector2 } from '@/types/math';

// ─────────────────────────────────────────────
// § 基础运算
// ─────────────────────────────────────────────

/** 向量加法 */
export function add3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** 向量减法 */
export function sub3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** 标量乘法 */
export function scale3(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/** 向量取反（数乘 -1） */
export function negate3(v: Vector3): Vector3 {
  return { x: -v.x, y: -v.y, z: -v.z };
}

/**
 * 向量模长（欧氏距离）
 * 派生标量，不独立存储
 */
export function magnitude3(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** 模长的平方（避免开平方，用于仅需比较大小的场景） */
export function magnitudeSq3(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

/**
 * 归一化（单位向量）
 * 零向量返回 {x:0, y:0, z:0}（安全约定，调用方应自行过滤零向量场景）
 */
export function normalize3(v: Vector3): Vector3 {
  const mag = magnitude3(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

// ─────────────────────────────────────────────
// § 点积与叉积
// ─────────────────────────────────────────────

/**
 * 点积（内积）
 * 几何意义：|a||b|cos(θ)，用于计算投影、夹角、垂直判定
 */
export function dot3(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * 叉积（外积）
 * 几何意义：结果向量垂直于 a 和 b 所在平面，模为 |a||b|sin(θ)
 * 方向遵从右手定则：四指从 a 转向 b，拇指朝向结果方向
 *
 * @returns 垂直于 a 和 b 的向量（法向量）
 *
 * @example
 * cross3({x:1,y:0,z:0}, {x:0,y:1,z:0}) // {x:0, y:0, z:1}（z 轴方向）
 */
export function cross3(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * 两向量夹角（返回区间 [0, π]，通过点积定义，不区分方向）
 * 若任一向量为零向量，返回 0
 *
 * @returns 弧度，区间 [0, π]
 */
export function angleBetween3(a: Vector3, b: Vector3): number {
  const magA = magnitude3(a);
  const magB = magnitude3(b);
  if (magA === 0 || magB === 0) return 0;
  // 数值钳制防止浮点误差导致 acos 溢出（[-1, 1] 区间外）
  const cosTheta = Math.max(-1, Math.min(1, dot3(a, b) / (magA * magB)));
  return Math.acos(cosTheta);
}

// ─────────────────────────────────────────────
// § 判定函数
// ─────────────────────────────────────────────

/** 判定两向量是否平行（共线）
 *  通过叉积模长判定：若 |a × b| ≈ 0 则平行（含反向平行）
 */
export function areParallel3(a: Vector3, b: Vector3, epsilon = 1e-9): boolean {
  const c = cross3(a, b);
  return magnitudeSq3(c) < epsilon * epsilon;
}

/**
 * 判定两向量是否垂直
 * 通过点积判定：若 a·b ≈ 0 则垂直
 */
export function arePerpendicular3(a: Vector3, b: Vector3, epsilon = 1e-9): boolean {
  return Math.abs(dot3(a, b)) < epsilon;
}

/**
 * 判定三向量是否共面
 * 通过混合积（标量三重积）判定：若 a·(b×c) ≈ 0 则共面
 */
export function areCoplanar3(a: Vector3, b: Vector3, c: Vector3, epsilon = 1e-9): boolean {
  return Math.abs(dot3(a, cross3(b, c))) < epsilon;
}

// ─────────────────────────────────────────────
// § 投影
// ─────────────────────────────────────────────

/**
 * 向量 a 在向量 b 方向上的标量投影（有向长度）
 * 公式：proj = a·b̂ = a·b / |b|
 * 正值表示与 b 同向，负值表示反向
 */
export function scalarProjection3(a: Vector3, b: Vector3): number {
  const magB = magnitude3(b);
  if (magB === 0) return 0;
  return dot3(a, b) / magB;
}

/**
 * 向量 a 在向量 b 方向上的向量投影
 * 公式：proj = (a·b / |b|²) * b
 */
export function vectorProjection3(a: Vector3, b: Vector3): Vector3 {
  const magBSq = magnitudeSq3(b);
  if (magBSq === 0) return { x: 0, y: 0, z: 0 };
  return scale3(b, dot3(a, b) / magBSq);
}

// ─────────────────────────────────────────────
// § 距离计算
// ─────────────────────────────────────────────

/** 两点之间的欧氏距离 */
export function distance3(a: Vector3, b: Vector3): number {
  return magnitude3(sub3(b, a));
}

/**
 * 点到平面的有向距离（含符号）。
 * 公式：d = n̂·(P - P₀)，其中 P₀ 为平面上的点，n̂ 为单位法向量。
 * 正值：点在法向量所指方向一侧；负值：点在另一侧。
 *
 * @param point 待求距离的点
 * @param plane 平面（由法向量和平面上一点确定）
 * @returns 有向距离（取绝对值得几何距离）
 */
export function signedPointToPlane(point: Vector3, plane: Plane3): number {
  const n = normalize3(plane.normal);
  if (magnitude3(n) === 0) return 0; // 退化平面
  return dot3(n, sub3(point, plane.point));
}

/**
 * 点到平面的几何距离（非负）。
 */
export function pointToPlaneDistance(point: Vector3, plane: Plane3): number {
  return Math.abs(signedPointToPlane(point, plane));
}

/**
 * 点到直线的距离。
 * 公式：d = |AP × dir̂|，其中 A 为直线上的点，P 为待求点。
 *
 * @param point 待求距离的点
 * @param line  直线（由方向向量和直线上一点确定）
 * @returns 几何距离（非负）
 */
export function pointToLineDistance(point: Vector3, line: Line3): number {
  const dirMag = magnitude3(line.dir);
  if (dirMag === 0) return distance3(point, line.point); // 退化直线（退为点）
  const AP = sub3(point, line.point);
  const cross = cross3(AP, normalize3(line.dir));
  return magnitude3(cross);
}

/**
 * 异面直线之间的距离。
 * 公式：d = |（A₁A₂）·（d₁ × d₂）| / |d₁ × d₂|
 * 若两直线平行（d₁ × d₂ ≈ 0），退化为点到直线的距离。
 *
 * @param l1 第一条直线
 * @param l2 第二条直线
 * @returns 公垂线长度（非负）
 */
export function skewLinesDistance(l1: Line3, l2: Line3): number {
  const crossDir = cross3(l1.dir, l2.dir);
  const crossMag = magnitude3(crossDir);
  if (crossMag < 1e-9) {
    // 平行（含重合）：退化为点到直线距离
    return pointToLineDistance(l1.point, l2);
  }
  const A1A2 = sub3(l2.point, l1.point);
  return Math.abs(dot3(A1A2, crossDir)) / crossMag;
}

// ─────────────────────────────────────────────
// § 方向余弦
// ─────────────────────────────────────────────

/**
 * 计算向量与三个坐标轴的方向余弦 [cos α, cos β, cos γ]。
 * 分别是向量与 x 轴、y 轴、z 轴所成角的余弦值。
 * 零向量返回 [0, 0, 0]。
 *
 * @returns [cosAlpha, cosBeta, cosGamma] — 数组长度固定为 3
 */
export function directionCosines(v: Vector3): [number, number, number] {
  const mag = magnitude3(v);
  if (mag === 0) return [0, 0, 0];
  return [v.x / mag, v.y / mag, v.z / mag];
}

// ─────────────────────────────────────────────
// § 中点与分点
// ─────────────────────────────────────────────

/**
 * 空间线段中点公式。
 * M = (A + B) / 2
 */
export function midpoint3(a: Vector3, b: Vector3): Vector3 {
  return scale3(add3(a, b), 0.5);
}

/**
 * 空间线段内分点公式（m:n 内分）。
 * P = (n·A + m·B) / (m + n)
 *
 * @param a 起点
 * @param b 终点
 * @param m AP 段比例
 * @param n PB 段比例
 */
export function divisionPoint3(a: Vector3, b: Vector3, m: number, n: number): Vector3 {
  if (m + n === 0) return midpoint3(a, b); // 防除零，退化为中点
  return scale3(add3(scale3(a, n), scale3(b, m)), 1 / (m + n));
}

// ─────────────────────────────────────────────
// § 平面法向量
// ─────────────────────────────────────────────

/**
 * 由平面上三个不共线的点 A, B, C 求平面法向量。
 * 法向量 n = AB × AC，未归一化（保留模长信息）。
 * 若三点共线则返回零向量（调用方应检查）。
 *
 * @param a 点 A（坐标向量，原点 O 到 A 的位置向量）
 * @param b 点 B
 * @param c 点 C
 * @returns 平面法向量（未归一化）
 */
export function planeNormal(a: Vector3, b: Vector3, c: Vector3): Vector3 {
  const AB = sub3(b, a);
  const AC = sub3(c, a);
  return cross3(AB, AC);
}

// ─────────────────────────────────────────────
// § 二面角
// ─────────────────────────────────────────────

/**
 * 求两平面之间的二面角（返回区间 [0, π]）。
 * 通过两平面法向量的夹角计算，若法向量夹角为钝角则取补角使结果在 [0, π/2] 内可选。
 *
 * 注意：此函数直接返回两法向量夹角，即两平面所成的二面角（不做锐化）。
 * 调用方可根据需要取 min(angle, π - angle) 得到锐二面角。
 *
 * @param plane1 第一个平面
 * @param plane2 第二个平面
 * @returns 二面角（弧度，[0, π]）
 */
export function dihedralAngle(plane1: Plane3, plane2: Plane3): number {
  return angleBetween3(plane1.normal, plane2.normal);
}

// ─────────────────────────────────────────────
// § 坐标轴工具
// ─────────────────────────────────────────────

/** 标准基向量：x 轴方向 */
export const UNIT_X: Readonly<Vector3> = { x: 1, y: 0, z: 0 };
/** 标准基向量：y 轴方向 */
export const UNIT_Y: Readonly<Vector3> = { x: 0, y: 1, z: 0 };
/** 标准基向量：z 轴方向 */
export const UNIT_Z: Readonly<Vector3> = { x: 0, y: 0, z: 1 };
/** 零向量 */
export const ZERO3: Readonly<Vector3> = { x: 0, y: 0, z: 0 };

// ─────────────────────────────────────────────
// § 类型守卫
// ─────────────────────────────────────────────

/** 判断一个对象是否为合法的 Vector3（含 x/y/z 数字字段） */
export function isVector3(v: unknown): v is Vector3 {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).x === 'number' &&
    typeof (v as Record<string, unknown>).y === 'number' &&
    typeof (v as Record<string, unknown>).z === 'number'
  );
}

// ─────────────────────────────────────────────
// § 辅助：向量转为可读字符串（用于调试/UI 显示）
// ─────────────────────────────────────────────

/**
 * 将 Vector3 格式化为 "(x, y, z)" 字符串，保留指定小数位。
 * 仅用于 UI 显示层，不参与任何数学计算。
 */
export function formatVector3(v: Vector3, decimals = 2): string {
  const f = (n: number) => n.toFixed(decimals);
  return `(${f(v.x)}, ${f(v.y)}, ${f(v.z)})`;
}

// ─────────────────────────────────────────────
// § 与 2D 的互转（仅用于等轴测投影前的坐标准备）
// ─────────────────────────────────────────────

/**
 * 从 Vector3 提取 XY 平面分量（忽略 z），返回 Vector2。
 * 仅用于将三维点投影到 xy 平面的辅助场景，不作为常规坐标转换使用。
 */
export function toXY(v: Vector3): Vector2 {
  return { x: v.x, y: v.y };
}
