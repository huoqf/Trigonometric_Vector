/**
 * @file tests/store/useMathState.test.ts
 * @description useMathState Store 最小验收测试
 *
 * 关键验证点：
 *   ✅ Store 只持有 angleRad / radius（基础真值），不缓存 sin/cos/tan/(x,y)
 *   ✅ 改变 angleRad 后，通过纯函数派生的三角值与向量坐标实时更新
 *   ✅ setAngle 规范化到 [0, 2π)
 *   ✅ setRadius 忽略非正值
 *   ✅ reset 还原初始状态
 *
 * 注意：测试直接调用 Store 的 getState()，不依赖 React 渲染环境，
 * 在纯 JS 环境下即可运行，避免引入 @testing-library/react 的渲染开销。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMathState } from '@/store/useMathState';
import { computeDerivedSnapshot } from '@/math/trigonometry';

const PI = Math.PI;
const TWO_PI = 2 * PI;

// 每个测试前重置 Store，避免状态污染
beforeEach(() => {
  useMathState.getState().reset();
});

describe('useMathState — 基础状态结构', () => {
  it('初始 angleRad = 0', () => {
    expect(useMathState.getState().angleRad).toBe(0);
  });

  it('初始 radius = 1', () => {
    expect(useMathState.getState().radius).toBe(1);
  });

  it('Store 中不存在 sin/cos/tan 字段（派生量禁止入 Store）', () => {
    const state = useMathState.getState() as unknown as Record<string, unknown>;
    expect(state['sin']).toBeUndefined();
    expect(state['cos']).toBeUndefined();
    expect(state['tan']).toBeUndefined();
    expect(state['x']).toBeUndefined();
    expect(state['y']).toBeUndefined();
    expect(state['vector']).toBeUndefined();
    expect(state['trig']).toBeUndefined();
  });
});

describe('useMathState — setAngle', () => {
  it('设置合法角度', () => {
    useMathState.getState().setAngle(PI / 3);
    expect(useMathState.getState().angleRad).toBeCloseTo(PI / 3, 10);
  });

  it('负角度规范化到 [0, 2π)', () => {
    useMathState.getState().setAngle(-PI / 2);
    const a = useMathState.getState().angleRad;
    expect(a).toBeCloseTo((3 * PI) / 2, 10);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(TWO_PI);
  });

  it('超过 2π 的角度规范化到 [0, 2π)', () => {
    useMathState.getState().setAngle(3 * PI);
    const a = useMathState.getState().angleRad;
    expect(a).toBeCloseTo(PI, 10);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(TWO_PI);
  });

  it('恰好等于 2π 规范化为 0', () => {
    useMathState.getState().setAngle(TWO_PI);
    expect(useMathState.getState().angleRad).toBeCloseTo(0, 10);
  });
});

describe('useMathState — setRadius', () => {
  it('设置合法正数半径', () => {
    useMathState.getState().setRadius(2.5);
    expect(useMathState.getState().radius).toBe(2.5);
  });

  it('零值被忽略，radius 保持不变', () => {
    useMathState.getState().setRadius(0);
    expect(useMathState.getState().radius).toBe(1); // 初始值
  });

  it('负值被忽略，radius 保持不变', () => {
    useMathState.getState().setRadius(-5);
    expect(useMathState.getState().radius).toBe(1); // 初始值
  });
});

describe('useMathState — reset', () => {
  it('修改后 reset 还原初始状态', () => {
    useMathState.getState().setAngle(PI);
    useMathState.getState().setRadius(3);
    useMathState.getState().setAnimating(true);
    useMathState.getState().reset();

    const s = useMathState.getState();
    expect(s.angleRad).toBe(0);
    expect(s.radius).toBe(1);
    expect(s.isAnimating).toBe(false);
    expect(s.isAngleLocked).toBe(false);
  });
});

describe('useMathState — 改变 angleRad 后，派生量实时反映新值', () => {
  it('角度改为 π/2 → sin=1, cos≈0, tan=null（奇异点）', () => {
    useMathState.getState().setAngle(PI / 2);
    const { angleRad, radius } = useMathState.getState();

    // 派生量由纯函数计算，不来自 Store
    const snap = computeDerivedSnapshot(angleRad, radius);
    expect(snap.trig.sin).toBeCloseTo(1, 10);
    expect(snap.trig.cos).toBeCloseTo(0, 10);
    expect(snap.trig.tan).toBeNull(); // 奇异点
  });

  it('角度改为 π/4 → sin=cos=√2/2, tan=1', () => {
    useMathState.getState().setAngle(PI / 4);
    const { angleRad, radius } = useMathState.getState();

    const snap = computeDerivedSnapshot(angleRad, radius);
    const expected = Math.sqrt(2) / 2;
    expect(snap.trig.sin).toBeCloseTo(expected, 10);
    expect(snap.trig.cos).toBeCloseTo(expected, 10);
    expect(snap.trig.tan).toBeCloseTo(1, 10);
  });

  it('角度改为 π → sin≈0, cos=-1, tan≈0', () => {
    useMathState.getState().setAngle(PI);
    const { angleRad, radius } = useMathState.getState();

    const snap = computeDerivedSnapshot(angleRad, radius);
    expect(snap.trig.sin).toBeCloseTo(0, 10);
    expect(snap.trig.cos).toBeCloseTo(-1, 10);
    // tan 不为 null（cos 不为 0），接近 0
    expect(snap.trig.tan).not.toBeNull();
    expect(snap.trig.tan as number).toBeCloseTo(0, 8);
  });

  it('向量坐标 tip 随 angleRad 实时更新，radius=2 时 tip.x = 2*cos(θ)', () => {
    useMathState.getState().setAngle(PI / 3);
    useMathState.getState().setRadius(2);
    const { angleRad, radius } = useMathState.getState();

    const snap = computeDerivedSnapshot(angleRad, radius);
    expect(snap.vector.tip.x).toBeCloseTo(2 * Math.cos(PI / 3), 10);
    expect(snap.vector.tip.y).toBeCloseTo(2 * Math.sin(PI / 3), 10);
  });
});
