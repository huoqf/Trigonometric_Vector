import { describe, it, expect } from 'vitest';
import {
  add3, sub3, scale3, negate3, magnitude3, magnitudeSq3, normalize3,
  dot3, cross3, angleBetween3,
  areParallel3, arePerpendicular3, areCoplanar3,
  scalarProjection3, vectorProjection3,
  distance3, signedPointToPlane, pointToPlaneDistance,
  pointToLineDistance, skewLinesDistance,
  directionCosines, midpoint3, divisionPoint3, planeNormal, dihedralAngle
} from '@/math/vector3';
import type { Vector3, Plane3, Line3 } from '@/types/vector3';

const PI = Math.PI;

describe('基础运算', () => {
  it('add3', () => {
    expect(add3({x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6})).toEqual({x: 5, y: 7, z: 9});
  });
  it('sub3', () => {
    expect(sub3({x: 4, y: 5, z: 6}, {x: 1, y: 2, z: 3})).toEqual({x: 3, y: 3, z: 3});
  });
  it('scale3', () => {
    expect(scale3({x: 1, y: 2, z: 3}, 2)).toEqual({x: 2, y: 4, z: 6});
  });
  it('negate3', () => {
    expect(negate3({x: 1, y: -2, z: 3})).toEqual({x: -1, y: 2, z: -3});
  });
  it('magnitude3 & magnitudeSq3', () => {
    const v = {x: 3, y: 4, z: 0};
    expect(magnitude3(v)).toBe(5);
    expect(magnitudeSq3(v)).toBe(25);
  });
  it('normalize3', () => {
    const v = {x: 3, y: 4, z: 0};
    expect(normalize3(v)).toEqual({x: 0.6, y: 0.8, z: 0});
  });
  it('零向量 normalize3 应该返回零向量', () => {
    expect(normalize3({x: 0, y: 0, z: 0})).toEqual({x: 0, y: 0, z: 0});
  });
});

describe('点积与叉积', () => {
  it('dot3', () => {
    expect(dot3({x: 1, y: 2, z: 3}, {x: 4, y: -5, z: 6})).toBe(12);
  });
  it('cross3', () => {
    expect(cross3({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0})).toEqual({x: 0, y: 0, z: 1});
  });
  it('angleBetween3', () => {
    expect(angleBetween3({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0})).toBeCloseTo(PI / 2);
    expect(angleBetween3({x: 1, y: 0, z: 0}, {x: 1, y: 0, z: 0})).toBeCloseTo(0);
    expect(angleBetween3({x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0})).toBeCloseTo(PI);
  });
});

describe('判定函数', () => {
  it('areParallel3', () => {
    expect(areParallel3({x: 1, y: 2, z: 3}, {x: 2, y: 4, z: 6})).toBe(true);
    expect(areParallel3({x: 1, y: 2, z: 3}, {x: -1, y: -2, z: -3})).toBe(true);
    expect(areParallel3({x: 1, y: 2, z: 3}, {x: 1, y: 2, z: 4})).toBe(false);
  });
  it('arePerpendicular3', () => {
    expect(arePerpendicular3({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0})).toBe(true);
    expect(arePerpendicular3({x: 1, y: 1, z: 0}, {x: 1, y: -1, z: 0})).toBe(true);
  });
  it('areCoplanar3', () => {
    expect(areCoplanar3({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0})).toBe(true);
    expect(areCoplanar3({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 0, z: 1})).toBe(false);
  });
});

describe('投影', () => {
  it('scalarProjection3', () => {
    expect(scalarProjection3({x: 3, y: 4, z: 0}, {x: 1, y: 0, z: 0})).toBe(3);
  });
  it('vectorProjection3', () => {
    expect(vectorProjection3({x: 3, y: 4, z: 0}, {x: 1, y: 0, z: 0})).toEqual({x: 3, y: 0, z: 0});
  });
});

describe('距离计算', () => {
  it('distance3', () => {
    expect(distance3({x: 0, y: 0, z: 0}, {x: 1, y: 2, z: 2})).toBe(3);
  });
  it('pointToPlaneDistance', () => {
    const plane: Plane3 = { normal: {x: 0, y: 0, z: 1}, point: {x: 0, y: 0, z: 0} };
    expect(pointToPlaneDistance({x: 1, y: 1, z: 5}, plane)).toBe(5);
    expect(signedPointToPlane({x: 1, y: 1, z: 5}, plane)).toBe(5);
    expect(signedPointToPlane({x: 1, y: 1, z: -5}, plane)).toBe(-5);
  });
  it('pointToLineDistance', () => {
    const line: Line3 = { dir: {x: 1, y: 0, z: 0}, point: {x: 0, y: 0, z: 0} };
    expect(pointToLineDistance({x: 0, y: 3, z: 4}, line)).toBe(5);
  });
  it('skewLinesDistance', () => {
    const l1: Line3 = { dir: {x: 1, y: 0, z: 0}, point: {x: 0, y: 0, z: 0} };
    const l2: Line3 = { dir: {x: 0, y: 1, z: 0}, point: {x: 0, y: 0, z: 1} };
    expect(skewLinesDistance(l1, l2)).toBeCloseTo(1);
    
    // 平行直线退化为点到直线距离
    const l3: Line3 = { dir: {x: 1, y: 0, z: 0}, point: {x: 0, y: 1, z: 0} };
    expect(skewLinesDistance(l1, l3)).toBeCloseTo(1);
  });
});

describe('中点与法向量等其他工具', () => {
  it('midpoint3', () => {
    expect(midpoint3({x: 0, y: 0, z: 0}, {x: 2, y: 4, z: 6})).toEqual({x: 1, y: 2, z: 3});
  });
  it('divisionPoint3', () => {
    expect(divisionPoint3({x: 0, y: 0, z: 0}, {x: 3, y: 6, z: 9}, 1, 2)).toEqual({x: 1, y: 2, z: 3});
  });
  it('directionCosines', () => {
    const dc = directionCosines({x: 1, y: 1, z: 1});
    const expected = 1 / Math.sqrt(3);
    expect(dc[0]).toBeCloseTo(expected);
    expect(dc[1]).toBeCloseTo(expected);
    expect(dc[2]).toBeCloseTo(expected);
  });
  it('planeNormal', () => {
    const n = planeNormal({x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0});
    expect(normalize3(n)).toEqual({x: 0, y: 0, z: 1});
  });
  it('dihedralAngle', () => {
    const plane1: Plane3 = { normal: {x: 0, y: 0, z: 1}, point: {x: 0, y: 0, z: 0} };
    const plane2: Plane3 = { normal: {x: 0, y: 1, z: 0}, point: {x: 0, y: 0, z: 0} };
    expect(dihedralAngle(plane1, plane2)).toBeCloseTo(PI / 2);
  });
});
