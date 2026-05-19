/**
 * @file src/math/trigonometry.ts
 * @description 三角函数派生计算纯函数库
 *
 * 向量优先律在本文件的体现：
 *   - 三角函数值不直接存储，仅作为从角度/向量派生的标量
 *   - tan 的奇异点（π/2 + kπ）明确以 null 表达，不使用 Infinity 或 NaN
 *   - 所有函数无副作用、无全局状态
 *
 * ⚠️ 严禁：
 *   - 引入 React 状态 / DOM / 像素坐标
 *   - 在本文件处理屏幕坐标变换（→ src/utils/coordinate.ts）
 */

import type { TrigDerived, MathDerivedSnapshot, Vector2 } from '@/types/math';
import { angleToVector, vectorToAngle, magnitude, TWO_PI } from '@/math/vector';

// ─────────────────────────────────────────────
// § 常量
// ─────────────────────────────────────────────

/** tan 奇异点的判定阈值（浮点安全区间宽度） */
const TAN_SINGULARITY_EPSILON = 1e-9;

// ─────────────────────────────────────────────
// § 弧度规范化
// ─────────────────────────────────────────────

/**
 * 将任意弧度值规范化到 [0, 2π)。
 * 用于 Store setAngle 的输入处理，保证 angleRad 始终在标准区间内。
 *
 * @param rad 任意弧度值
 * @returns 区间 [0, 2π) 内的等价角度
 *
 * @example
 * normalizeAngle(-Math.PI)    // π
 * normalizeAngle(3 * Math.PI) // π
 * normalizeAngle(TWO_PI)      // 0
 */
export function normalizeAngle(rad: number): number {
  const mod = rad % TWO_PI;
  return mod < 0 ? mod + TWO_PI : mod;
}

// ─────────────────────────────────────────────
// § tan 奇异点判定
// ─────────────────────────────────────────────

/**
 * 判断给定角度（弧度，已规范化到 [0, 2π)）是否为 tan 的奇异点。
 * 奇异点为 π/2 + kπ，即 cos(θ) ≈ 0 的位置。
 *
 * @param normalizedRad 已规范化到 [0, 2π) 的角度
 */
export function isTanSingularity(normalizedRad: number): boolean {
  return Math.abs(Math.cos(normalizedRad)) < TAN_SINGULARITY_EPSILON;
}

// ─────────────────────────────────────────────
// § 核心派生函数：从角度计算三角函数值
// ─────────────────────────────────────────────

/**
 * 从角度（弧度）派生标准三角函数值。
 *
 * 向量优先律体现：
 *   - 内部先通过 angleToVector 得到单位向量 (cos θ, sin θ)
 *   - 再从向量的 x / y 分量读取 cos / sin，彰显向量是三角函数的几何根源
 *   - tan = sin / cos，奇异点返回 null
 *
 * @param rad 弧度角（任意实数，内部规范化处理）
 * @returns TrigDerived（包含 sin / cos / tan | null）
 */
export function computeTrig(rad: number): TrigDerived {
  // 向量优先：通过向量分量读取 cos/sin
  const unit: Vector2 = angleToVector(rad);
  const cosVal = unit.x; // cos θ = 向量 x 分量
  const sinVal = unit.y; // sin θ = 向量 y 分量

  // tan 奇异点判断
  const tanVal: number | null =
    Math.abs(cosVal) < TAN_SINGULARITY_EPSILON
      ? null
      : sinVal / cosVal;

  return { sin: sinVal, cos: cosVal, tan: tanVal };
}

// ─────────────────────────────────────────────
// § 完整派生快照（一次计算，供组件批量消费）
// ─────────────────────────────────────────────

/**
 * 从基础状态（angleRad + radius）生成完整的派生数学快照。
 *
 * 调用时机：Store 的 selector 或组件内的 useMemo，
 * 不应在 Store 的 state 字段中存储该对象。
 *
 * @param angleRad 当前角度（弧度，任意实数）
 * @param radius   向量模长（正数）
 * @returns MathDerivedSnapshot
 */
export function computeDerivedSnapshot(
  angleRad: number,
  radius: number,
): MathDerivedSnapshot {
  const trig = computeTrig(angleRad);
  const unit: Vector2 = { x: trig.cos, y: trig.sin };
  const tip: Vector2 = { x: trig.cos * radius, y: trig.sin * radius };

  return {
    trig,
    vector: { tip, unit },
  };
}

// ─────────────────────────────────────────────
// § 辅助：从向量反推三角函数值（向量 → trig，反向路径）
// ─────────────────────────────────────────────

/**
 * 从向量反推三角函数派生值。
 * 先取方向角，再调用 computeTrig，保持唯一计算路径。
 *
 * @param v 二维向量（数学坐标系）
 * @returns TrigDerived
 */
export function computeTrigFromVector(v: Vector2): TrigDerived {
  const mag = magnitude(v);
  if (mag === 0) return { sin: 0, cos: 1, tan: 0 };
  const rad = vectorToAngle(v);
  return computeTrig(rad);
}

// ─────────────────────────────────────────────
// § 辅助：角度单位转换（仅作工具，核心计算始终用弧度）
// ─────────────────────────────────────────────

/** 角度 → 弧度（用于 UI 输入层，不在数学核心层使用） */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 弧度 → 角度（用于 UI 显示层，不在数学核心层使用） */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
