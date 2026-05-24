/**
 * @file src/math/trigIdentity.ts
 * @description 三角恒等变换与化简计算纯函数库
 *
 * 规范：
 *   - 纯函数设计，无副作用，不依赖全局状态。
 *   - 处理 tan 等函数的奇异点（π/2 + kπ），返回 null。
 *   - 复用 vector.ts 和 trigonometry.ts 中的运算。
 */

import { computeTrig, normalizeAngle, isTanSingularity } from '@/math/trigonometry';

// ─────────────────────────────────────────────
// § 1. 两角和差公式派生计算
// ─────────────────────────────────────────────

export interface SumDifferenceDerived {
  // 两角和
  readonly sinSum: number;
  readonly cosSum: number;
  readonly tanSum: number | null;
  // 两角差
  readonly sinDiff: number;
  readonly cosDiff: number;
  readonly tanDiff: number | null;
}

/**
 * 计算两角和差派生值。
 *
 * 根据两角和差公式：
 *   sin(α ± β) = sin α cos β ± cos α sin β
 *   cos(α ± β) = cos α cos β ∓ sin α sin β
 *   tan(α ± β) = (tan α ± tan β) / (1 ∓ tan α tan β)
 *
 * @param alpha 弧度角 α
 * @param beta  弧度角 β
 */
export function computeSumDifference(alpha: number, beta: number): SumDifferenceDerived {
  const trigA = computeTrig(alpha);
  const trigB = computeTrig(beta);

  // 代数和差公式计算（直接用公式算，用于验证或图像画线）
  const sinSumVal = trigA.sin * trigB.cos + trigA.cos * trigB.sin;
  const cosSumVal = trigA.cos * trigB.cos - trigA.sin * trigB.sin;

  const sinDiffVal = trigA.sin * trigB.cos - trigA.cos * trigB.sin;
  const cosDiffVal = trigA.cos * trigB.cos + trigA.sin * trigB.sin;

  // 处理 tan(α + β) 奇异点
  const sumAngle = normalizeAngle(alpha + beta);
  const tanSumVal = isTanSingularity(sumAngle) ? null : sinSumVal / cosSumVal;

  // 处理 tan(α - β) 奇异点
  const diffAngle = normalizeAngle(alpha - beta);
  const tanDiffVal = isTanSingularity(diffAngle) ? null : sinDiffVal / cosDiffVal;

  return {
    sinSum: sinSumVal,
    cosSum: cosSumVal,
    tanSum: tanSumVal,
    sinDiff: sinDiffVal,
    cosDiff: cosDiffVal,
    tanDiff: tanDiffVal,
  };
}

// ─────────────────────────────────────────────
// § 2. 二倍角公式派生计算
// ─────────────────────────────────────────────

export interface DoubleAngleDerived {
  readonly sin2: number;
  readonly cos2: number;
  readonly tan2: number | null;
}

/**
 * 计算二倍角公式。
 *
 * 公式：
 *   sin(2α) = 2 sin α cos α
 *   cos(2α) = cos²α - sin²α = 2 cos²α - 1 = 1 - 2 sin²α
 *   tan(2α) = 2 tan α / (1 - tan²α)
 *
 * @param alpha 弧度角 α
 */
export function computeDoubleAngle(alpha: number): DoubleAngleDerived {
  const trig = computeTrig(alpha);

  const sin2Val = 2 * trig.sin * trig.cos;
  const cos2Val = trig.cos * trig.cos - trig.sin * trig.sin;

  // 奇异点判断
  const doubleAngle = normalizeAngle(2 * alpha);
  const tan2Val = isTanSingularity(doubleAngle) ? null : sin2Val / cos2Val;

  return {
    sin2: sin2Val,
    cos2: cos2Val,
    tan2: tan2Val,
  };
}

// ─────────────────────────────────────────────
// § 3. 降次公式派生计算
// ─────────────────────────────────────────────

export interface PowerReductionDerived {
  readonly sinSq: number;       // sin²α
  readonly cosSq: number;       // cos²α
  readonly sinSqReduced: number; // (1 - cos(2α)) / 2
  readonly cosSqReduced: number; // (1 + cos(2α)) / 2
}

/**
 * 计算降次公式对应关系。
 *
 * @param alpha 弧度角 α
 */
export function computePowerReduction(alpha: number): PowerReductionDerived {
  const trig = computeTrig(alpha);
  const doubleAngle = computeDoubleAngle(alpha);

  const sinSqVal = trig.sin * trig.sin;
  const cosSqVal = trig.cos * trig.cos;

  const sinSqReducedVal = (1 - doubleAngle.cos2) / 2;
  const cosSqReducedVal = (1 + doubleAngle.cos2) / 2;

  return {
    sinSq: sinSqVal,
    cosSq: cosSqVal,
    sinSqReduced: sinSqReducedVal,
    cosSqReduced: cosSqReducedVal,
  };
}
