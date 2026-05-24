/**
 * @file tests/math/trigIdentity.test.ts
 * @description trigIdentity 模块测试用例
 *
 * 关键验证点：
 *   ✅ 两角和差公式计算结果正确
 *   ✅ 二倍角公式计算结果正确，包含奇异点
 *   ✅ 降次公式与原函数值一致
 *   ✅ 边界情况及奇异点处理正确
 */

import { describe, it, expect } from 'vitest';
import {
  computeSumDifference,
  computeDoubleAngle,
  computePowerReduction,
} from '@/math/trigIdentity';

const PI = Math.PI;

describe('computeSumDifference - 两角和差公式', () => {
  it('验证和角公式正确性', () => {
    const alpha = PI / 6; // 30 deg
    const beta = PI / 4;  // 45 deg

    const res = computeSumDifference(alpha, beta);

    // sin(α+β) = sin(75°) ≈ 0.9659258
    // cos(α+β) = cos(75°) ≈ 0.2588190
    expect(res.sinSum).toBeCloseTo(Math.sin(alpha + beta), 10);
    expect(res.cosSum).toBeCloseTo(Math.cos(alpha + beta), 10);
    expect(res.tanSum).toBeCloseTo(Math.sin(alpha + beta) / Math.cos(alpha + beta), 10);
  });

  it('验证差角公式正确性', () => {
    const alpha = PI / 3; // 60 deg
    const beta = PI / 6;  // 30 deg

    const res = computeSumDifference(alpha, beta);

    // sin(α-β) = sin(30°) = 0.5
    // cos(α-β) = cos(30°) ≈ 0.8660254
    expect(res.sinDiff).toBeCloseTo(0.5, 10);
    expect(res.cosDiff).toBeCloseTo(Math.sqrt(3) / 2, 10);
    expect(res.tanDiff).toBeCloseTo(1 / Math.sqrt(3), 10);
  });

  it('奇异点判断：和角或差角为 π/2 时 tan 返回 null', () => {
    // α = π/6, β = π/3, α + β = π/2 (奇异点)
    const resSumSingular = computeSumDifference(PI / 6, PI / 3);
    expect(resSumSingular.tanSum).toBeNull();

    // α = 3π/4, β = π/4, α - β = π/2 (奇异点)
    const resDiffSingular = computeSumDifference((3 * PI) / 4, PI / 4);
    expect(resDiffSingular.tanDiff).toBeNull();
  });
});

describe('computeDoubleAngle - 二倍角公式', () => {
  it('验证二倍角公式正确性', () => {
    const alpha = PI / 8; // 22.5 deg
    const res = computeDoubleAngle(alpha);

    // sin(2α) = sin(45°) = √2/2 ≈ 0.7071
    // cos(2α) = cos(45°) = √2/2 ≈ 0.7071
    expect(res.sin2).toBeCloseTo(Math.sqrt(2) / 2, 10);
    expect(res.cos2).toBeCloseTo(Math.sqrt(2) / 2, 10);
    expect(res.tan2).toBeCloseTo(1, 10);
  });

  it('奇异点判断：2α = π/2 (即 α = π/4) 时 tan2 返回 null', () => {
    const res = computeDoubleAngle(PI / 4);
    expect(res.tan2).toBeNull();
  });

  it('奇异点判断：2α = 3π/2 (即 α = 3π/4) 时 tan2 返回 null', () => {
    const res = computeDoubleAngle((3 * PI) / 4);
    expect(res.tan2).toBeNull();
  });
});

describe('computePowerReduction - 降次公式', () => {
  it('验证降次后与原平方值的一致性', () => {
    const testAngles = [0, PI / 6, PI / 4, PI / 3, PI / 2, 2.3, 4.5, 6.0];

    for (const alpha of testAngles) {
      const res = computePowerReduction(alpha);
      // sin²α 应该等于原版，且等于降次后的公式：(1 - cos(2α)) / 2
      expect(res.sinSq).toBeCloseTo(Math.sin(alpha) * Math.sin(alpha), 10);
      expect(res.sinSqReduced).toBeCloseTo(res.sinSq, 10);

      // cos²α 应该等于原版，且等于降次后的公式：(1 + cos(2α)) / 2
      expect(res.cosSq).toBeCloseTo(Math.cos(alpha) * Math.cos(alpha), 10);
      expect(res.cosSqReduced).toBeCloseTo(res.cosSq, 10);
    }
  });
});
