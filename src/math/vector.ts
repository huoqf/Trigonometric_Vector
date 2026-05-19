/**
 * @file src/math/vector.ts
 * @description 数学坐标系中的二维向量纯函数库
 *
 * 坐标系约定（适用于本文件所有函数）：
 *   - 数学坐标系：x 轴向右为正，y 轴向上为正
 *   - 原点居中，单位长度标准化
 *   - 逆时针为角度正方向，弧度制
 *
 * ⚠️ 严禁：
 *   - 引入 React 状态 / DOM / Canvas 像素坐标
 *   - 在本文件实现屏幕坐标转换（统一放入 src/utils/coordinate.ts）
 *   - 引入任何带副作用的操作
 */

import type { Vector2 } from '@/types/math';

// ─────────────────────────────────────────────
// § 常量
// ─────────────────────────────────────────────

export const TWO_PI = 2 * Math.PI;

// ─────────────────────────────────────────────
// § 核心：角度 ↔ 向量互转（向量优先律入口）
// ─────────────────────────────────────────────

/**
 * 将弧度角转换为单位向量。
 *
 * 数学定义：在标准数学坐标系（逆时针正方向）下，
 * θ 对应的单位向量为 (cos θ, sin θ)。
 *
 * @param rad 弧度角（任意实数，内部不做规范化，cos/sin 天然处理周期性）
 * @returns 模长为 1 的向量 { x: cos(rad), y: sin(rad) }
 *
 * @example
 * angleToVector(0)       // { x: 1,  y: 0  }
 * angleToVector(Math.PI) // { x: -1, y: 0  }
 * angleToVector(Math.PI / 2) // { x: 0, y: 1 }
 */
export function angleToVector(rad: number): Vector2 {
  return {
    x: Math.cos(rad),
    y: Math.sin(rad),
  };
}

/**
 * 将二维向量转换为其方向角（弧度）。
 *
 * 返回区间严格限定为 **[0, 2π)**：
 *   - atan2 原始返回区间为 (-π, π]，存在象限歧义（负值跨越 π 轴时不连续）
 *   - 本函数统一规范化至 [0, 2π)，保证角度连续性
 *   - 零向量（模为 0）无方向，返回 0（约定值，调用方应自行过滤）
 *
 * @param v 二维向量（数学坐标系，y 轴向上为正）
 * @returns 方向角，弧度，区间 [0, 2π)
 *
 * @example
 * vectorToAngle({ x: 1,  y: 0  }) // 0
 * vectorToAngle({ x: 0,  y: 1  }) // π/2
 * vectorToAngle({ x: -1, y: 0  }) // π
 * vectorToAngle({ x: 0,  y: -1 }) // 3π/2  ← 关键：不返回 -π/2
 */
export function vectorToAngle(v: Vector2): number {
  if (v.x === 0 && v.y === 0) return 0;
  const raw = Math.atan2(v.y, v.x); // 区间 (-π, π]
  // 规范化到 [0, 2π)：负值加 2π，正值不变；等于 2π 时（浮点极罕见）归 0
  const normalized = raw < 0 ? raw + TWO_PI : raw;
  return normalized === TWO_PI ? 0 : normalized;
}

// ─────────────────────────────────────────────
// § 向量基础运算
// ─────────────────────────────────────────────

/** 向量加法 */
export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** 向量减法 */
export function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** 标量乘法 */
export function scale(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s };
}

/**
 * 向量模长（欧氏距离）
 * 向量优先律：模长由向量定义，是派生标量，不独立存储
 */
export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 单位化向量
 * 零向量返回 { x: 0, y: 0 }（保护调用方安全）
 */
export function normalize(v: Vector2): Vector2 {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * 点积（内积）
 * 几何意义：|a||b|cos(θ)，用于计算投影与夹角
 */
export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * 二维叉积（标量形式，z 分量）
 * 几何意义：|a||b|sin(θ)，正值表示 b 在 a 的逆时针方向
 */
export function cross(a: Vector2, b: Vector2): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * 两向量夹角（返回区间 [0, π]，通过点积定义，不区分方向）
 * 若任一向量为零向量，返回 0
 */
export function angleBetween(a: Vector2, b: Vector2): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  // 数值钳制防止浮点误差导致 acos 溢出
  const cosTheta = Math.max(-1, Math.min(1, dot(a, b) / (magA * magB)));
  return Math.acos(cosTheta);
}

/**
 * 将向量按模长缩放到指定半径
 * 零向量不变
 */
export function withRadius(v: Vector2, radius: number): Vector2 {
  return scale(normalize(v), radius);
}
