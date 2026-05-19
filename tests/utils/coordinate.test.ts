/**
 * @file tests/utils/coordinate.test.ts
 * @description coordinate.ts 坐标转换最小测试
 *
 * 关键验证点：
 *   ✅ mathToScreen 正确将数学坐标映射到屏幕像素
 *   ✅ y 轴翻转正确（数学 y↑ 对应屏幕 y↓）
 *   ✅ screenToMath 是 mathToScreen 的精确逆变换
 *   ✅ containerCenter 返回容器中心点
 */

import { describe, it, expect } from 'vitest';
import { mathToScreen, screenToMath, containerCenter } from '@/utils/coordinate';

// 测试用容器参数：200×200，1 数学单位 = 80px
const params = { width: 200, height: 200, unitPx: 80 };
// 容器中心：(100, 100)

describe('mathToScreen', () => {
  it('数学原点 (0,0) → 容器中心 (100,100)', () => {
    const s = mathToScreen({ x: 0, y: 0 }, params);
    expect(s.x).toBeCloseTo(100, 10);
    expect(s.y).toBeCloseTo(100, 10);
  });

  it('(1, 0) → (180, 100)：x 方向正确', () => {
    const s = mathToScreen({ x: 1, y: 0 }, params);
    expect(s.x).toBeCloseTo(180, 10); // 100 + 1*80
    expect(s.y).toBeCloseTo(100, 10);
  });

  it('(-1, 0) → (20, 100)：x 负方向', () => {
    const s = mathToScreen({ x: -1, y: 0 }, params);
    expect(s.x).toBeCloseTo(20, 10); // 100 - 80
    expect(s.y).toBeCloseTo(100, 10);
  });

  it('(0, 1) → (100, 20)：y 轴向上（屏幕 y 减小）', () => {
    const s = mathToScreen({ x: 0, y: 1 }, params);
    expect(s.x).toBeCloseTo(100, 10);
    expect(s.y).toBeCloseTo(20, 10); // 100 - 1*80 = 20 ← y 翻转！
  });

  it('(0, -1) → (100, 180)：y 轴向下（数学负 y）', () => {
    const s = mathToScreen({ x: 0, y: -1 }, params);
    expect(s.x).toBeCloseTo(100, 10);
    expect(s.y).toBeCloseTo(180, 10); // 100 - (-1)*80 = 180
  });

  it('(1, 1) → (180, 20)：右上角', () => {
    const s = mathToScreen({ x: 1, y: 1 }, params);
    expect(s.x).toBeCloseTo(180, 10);
    expect(s.y).toBeCloseTo(20, 10);
  });
});

describe('screenToMath — mathToScreen 的精确逆变换', () => {
  it('容器中心 (100,100) → 数学原点 (0,0)', () => {
    const m = screenToMath({ x: 100, y: 100 }, params);
    expect(m.x).toBeCloseTo(0, 10);
    expect(m.y).toBeCloseTo(0, 10);
  });

  it('(180, 100) → 数学 (1, 0)', () => {
    const m = screenToMath({ x: 180, y: 100 }, params);
    expect(m.x).toBeCloseTo(1, 10);
    expect(m.y).toBeCloseTo(0, 10);
  });

  it('(100, 20) → 数学 (0, 1)：y 轴翻转恢复', () => {
    const m = screenToMath({ x: 100, y: 20 }, params);
    expect(m.x).toBeCloseTo(0, 10);
    expect(m.y).toBeCloseTo(1, 10);
  });

  it('(100, 180) → 数学 (0, -1)', () => {
    const m = screenToMath({ x: 100, y: 180 }, params);
    expect(m.x).toBeCloseTo(0, 10);
    expect(m.y).toBeCloseTo(-1, 10);
  });

  it('往返一致性：math → screen → math', () => {
    const originals = [
      { x: 0.5, y: 0.5 },
      { x: -0.8, y: 0.3 },
      { x: 1, y: -1 },
    ];
    for (const orig of originals) {
      const screen = mathToScreen(orig, params);
      const back = screenToMath(screen, params);
      expect(back.x).toBeCloseTo(orig.x, 10);
      expect(back.y).toBeCloseTo(orig.y, 10);
    }
  });
});

describe('containerCenter', () => {
  it('200×200 → (100, 100)', () => {
    const c = containerCenter({ width: 200, height: 200 });
    expect(c.x).toBe(100);
    expect(c.y).toBe(100);
  });

  it('非正方形 300×180 → (150, 90)', () => {
    const c = containerCenter({ width: 300, height: 180 });
    expect(c.x).toBe(150);
    expect(c.y).toBe(90);
  });
});
