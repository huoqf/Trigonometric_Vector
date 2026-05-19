/**
 * @file tests/math/vector.test.ts
 * @description angleToVector / vectorToAngle 核心测试
 *
 * 关键验证点：
 *   ✅ vectorToAngle 返回区间严格为 [0, 2π)（不含负值，不含 2π）
 *   ✅ angleToVector → vectorToAngle 互为逆变换（往返一致性）
 *   ✅ 零向量安全处理（不抛异常，返回 0）
 */

import { describe, it, expect } from 'vitest';
import {
  angleToVector,
  vectorToAngle,
  TWO_PI,
  magnitude,
} from '@/math/vector';

const PI = Math.PI;

// 浮点比较精度
const EPS = 1e-10;

describe('angleToVector', () => {
  it('0 → (1, 0)', () => {
    const v = angleToVector(0);
    expect(v.x).toBeCloseTo(1, 10);
    expect(v.y).toBeCloseTo(0, 10);
  });

  it('π/2 → (0, 1)', () => {
    const v = angleToVector(PI / 2);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(1, 10);
  });

  it('π → (-1, 0)', () => {
    const v = angleToVector(PI);
    expect(v.x).toBeCloseTo(-1, 10);
    expect(v.y).toBeCloseTo(0, 10);
  });

  it('3π/2 → (0, -1)', () => {
    const v = angleToVector((3 * PI) / 2);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(-1, 10);
  });

  it('任意角度返回单位向量（模长 = 1）', () => {
    const angles = [0.1, 1.0, PI / 3, PI, 5.5, TWO_PI - 0.01];
    for (const a of angles) {
      const v = angleToVector(a);
      expect(magnitude(v)).toBeCloseTo(1, 10);
    }
  });

  it('超出 [0,2π) 的角度也能正确处理（cos/sin 周期性）', () => {
    const v1 = angleToVector(TWO_PI + PI / 4);
    const v2 = angleToVector(PI / 4);
    expect(v1.x).toBeCloseTo(v2.x, 10);
    expect(v1.y).toBeCloseTo(v2.y, 10);
  });
});

describe('vectorToAngle — 返回区间严格为 [0, 2π)', () => {
  it('(1, 0) → 0', () => {
    expect(vectorToAngle({ x: 1, y: 0 })).toBeCloseTo(0, 10);
  });

  it('(0, 1) → π/2', () => {
    expect(vectorToAngle({ x: 0, y: 1 })).toBeCloseTo(PI / 2, 10);
  });

  it('(-1, 0) → π', () => {
    expect(vectorToAngle({ x: -1, y: 0 })).toBeCloseTo(PI, 10);
  });

  it('(0, -1) → 3π/2（不返回 -π/2！）', () => {
    const angle = vectorToAngle({ x: 0, y: -1 });
    expect(angle).toBeCloseTo((3 * PI) / 2, 10);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(TWO_PI);
  });

  it('(-1, -1) → 5π/4（第三象限，不为负值）', () => {
    const angle = vectorToAngle({ x: -1, y: -1 });
    expect(angle).toBeCloseTo((5 * PI) / 4, 10);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(TWO_PI);
  });

  it('(1, -1) → 7π/4（第四象限，不为负值）', () => {
    const angle = vectorToAngle({ x: 1, y: -1 });
    expect(angle).toBeCloseTo((7 * PI) / 4, 10);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(TWO_PI);
  });

  it('结果始终 >= 0', () => {
    const vectors = [
      { x: 1, y: -0.5 },
      { x: -0.5, y: -1 },
      { x: -1, y: -0.001 },
      { x: 0.001, y: -1 },
    ];
    for (const v of vectors) {
      const a = vectorToAngle(v);
      expect(a).toBeGreaterThanOrEqual(0 - EPS);
      expect(a).toBeLessThan(TWO_PI);
    }
  });

  it('零向量 → 0（约定值，不抛异常）', () => {
    expect(vectorToAngle({ x: 0, y: 0 })).toBe(0);
  });

  it('往返一致性：angleToVector → vectorToAngle ≈ 原角度', () => {
    const angles = [0, PI / 6, PI / 4, PI / 3, PI / 2, PI, (3 * PI) / 2, TWO_PI - 0.001];
    for (const a of angles) {
      const v = angleToVector(a);
      const back = vectorToAngle(v);
      expect(back).toBeCloseTo(a < TWO_PI ? a : 0, 10);
    }
  });
});
