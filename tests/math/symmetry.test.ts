/**
 * @file tests/math/symmetry.test.ts
 * @description 诱导公式数学特征数值测试
 */

import { describe, it, expect } from 'vitest';
import { computeTrig } from '@/math/trigonometry';

const PI = Math.PI;

describe('诱导公式对称数学模型数值测试', () => {
  it('公式四：π - α 诱导公式验证 (正弦相同，余弦相反)', () => {
    const alpha = PI / 6; // 30°
    const beta = PI - alpha; // 150°
    
    const trigA = computeTrig(alpha);
    const trigB = computeTrig(beta);
    
    expect(trigB.sin).toBeCloseTo(trigA.sin, 10);
    expect(trigB.cos).toBeCloseTo(-trigA.cos, 10);
    if (trigB.tan !== null && trigA.tan !== null) {
      expect(trigB.tan).toBeCloseTo(-trigA.tan, 10);
    }
  });

  it('公式三：-α 诱导公式验证 (正弦相反，余弦相同)', () => {
    const alpha = PI / 3; // 60°
    const beta = -alpha; // -60°
    
    const trigA = computeTrig(alpha);
    const trigB = computeTrig(beta);
    
    expect(trigB.sin).toBeCloseTo(-trigA.sin, 10);
    expect(trigB.cos).toBeCloseTo(trigA.cos, 10);
    if (trigB.tan !== null && trigA.tan !== null) {
      expect(trigB.tan).toBeCloseTo(-trigA.tan, 10);
    }
  });

  it('公式二：π + α 诱导公式验证 (正弦相反，余弦相反，正切相同)', () => {
    const alpha = PI / 4; // 45°
    const beta = PI + alpha; // 225°
    
    const trigA = computeTrig(alpha);
    const trigB = computeTrig(beta);
    
    expect(trigB.sin).toBeCloseTo(-trigA.sin, 10);
    expect(trigB.cos).toBeCloseTo(-trigA.cos, 10);
    if (trigB.tan !== null && trigA.tan !== null) {
      expect(trigB.tan).toBeCloseTo(trigA.tan, 10);
    }
  });

  it('公式六：π/2 - α 诱导公式验证 (正弦与余弦对称互换)', () => {
    const alpha = PI / 6; // 30°
    const beta = PI / 2 - alpha; // 60°
    
    const trigA = computeTrig(alpha);
    const trigB = computeTrig(beta);
    
    expect(trigB.sin).toBeCloseTo(trigA.cos, 10);
    expect(trigB.cos).toBeCloseTo(trigA.sin, 10);
  });

  it('公式七：π/2 + α 诱导公式验证 (正弦变正余弦，余弦变负弦)', () => {
    const alpha = PI / 6; // 30°
    const beta = PI / 2 + alpha; // 120°
    
    const trigA = computeTrig(alpha);
    const trigB = computeTrig(beta);
    
    expect(trigB.sin).toBeCloseTo(trigA.cos, 10);
    expect(trigB.cos).toBeCloseTo(-trigA.sin, 10);
  });
});
