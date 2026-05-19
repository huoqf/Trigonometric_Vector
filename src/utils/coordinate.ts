/**
 * @file src/utils/coordinate.ts
 * @description 坐标转换工具 — 数学坐标系 ↔ 屏幕像素坐标
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  坐标系约定（必须显式记录，不能靠调用方隐式理解）               │
 * │                                                                 │
 * │  数学坐标系（Math Space）：                                     │
 * │    - 原点在画布逻辑中心                                         │
 * │    - x 轴向右为正                                               │
 * │    - y 轴向上为正（数学惯例）                                   │
 * │    - 单位为"数学单位"，由 unitPx 参数决定对应多少像素          │
 * │                                                                 │
 * │  屏幕坐标系（Screen Space）：                                   │
 * │    - 原点在容器视图的左上角                                     │
 * │    - x 轴向右为正（与数学坐标系相同）                           │
 * │    - y 轴向下为正（⚠️ 与数学坐标系相反，此处显式翻转）         │
 * │    - 单位为像素（px）                                           │
 * │                                                                 │
 * │  容器中心 = { cx: containerWidth / 2, cy: containerHeight / 2 }│
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ⚠️ 严禁：
 *   - 在本文件引入 React 状态 / Zustand Store
 *   - 在 src/math/ 中实现屏幕坐标逻辑（方向相反）
 *   - 把 DOM 元素或 canvas context 传入本函数
 */

import type { Vector2 } from '@/types/math';

// ─────────────────────────────────────────────
// § 容器参数接口
// ─────────────────────────────────────────────

/**
 * 描述渲染容器尺寸与缩放比例的参数对象。
 * 组件层负责从 SVG viewBox 或 DOM 尺寸中计算这些值并传入。
 */
export interface CoordParams {
  /** 容器宽度（像素） */
  readonly width: number;
  /** 容器高度（像素） */
  readonly height: number;
  /**
   * 1 个数学单位对应多少像素。
   * 例如：单位圆半径为 1，显示为 100px 时 unitPx = 100。
   */
  readonly unitPx: number;
}

// ─────────────────────────────────────────────
// § 核心转换函数
// ─────────────────────────────────────────────

/**
 * 数学坐标 → 屏幕像素坐标。
 *
 * 转换步骤（显式标注每步语义）：
 *   1. 以容器中心为参考原点 → 加上 cx / cy 偏移
 *   2. y 轴翻转：数学 y 向上，屏幕 y 向下 → screenY = cy - mathY * unitPx
 *
 * @param math   数学坐标（x 向右正，y 向上正）
 * @param params 容器尺寸与缩放参数
 * @returns      屏幕像素坐标（x 向右正，y 向下正，原点在容器左上角）
 *
 * @example
 * // 单位圆，容器 200×200，unitPx=80
 * mathToScreen({ x: 1, y: 0 }, { width: 200, height: 200, unitPx: 80 })
 * // → { x: 180, y: 100 }   （中心右移 80px，y 不变）
 *
 * mathToScreen({ x: 0, y: 1 }, { width: 200, height: 200, unitPx: 80 })
 * // → { x: 100, y: 20 }    （y 轴向上，屏幕 y 减小）
 */
export function mathToScreen(math: Vector2, params: CoordParams): Vector2 {
  const cx = params.width / 2;
  const cy = params.height / 2;
  return {
    x: cx + math.x * params.unitPx,
    y: cy - math.y * params.unitPx, // ← y 轴翻转
  };
}

/**
 * 屏幕像素坐标 → 数学坐标。
 *
 * mathToScreen 的逆变换：
 *   1. 减去容器中心偏移 → 相对中心的像素偏移
 *   2. 除以 unitPx → 数学单位
 *   3. y 轴翻转：screenY 减小时 mathY 增大
 *
 * @param screen 屏幕像素坐标（原点在容器左上角）
 * @param params 容器尺寸与缩放参数
 * @returns      数学坐标（x 向右正，y 向上正，原点在容器中心）
 *
 * @example
 * // 单位圆，容器 200×200，unitPx=80
 * screenToMath({ x: 180, y: 100 }, { width: 200, height: 200, unitPx: 80 })
 * // → { x: 1, y: 0 }
 */
export function screenToMath(screen: Vector2, params: CoordParams): Vector2 {
  const cx = params.width / 2;
  const cy = params.height / 2;
  return {
    x: (screen.x - cx) / params.unitPx,
    y: (cy - screen.y) / params.unitPx, // ← y 轴翻转
  };
}

/**
 * 便捷函数：获取容器中心点的屏幕像素坐标。
 * 常用于 SVG 的 <circle cx={center.x} cy={center.y} /> 等场景。
 *
 * @param params 容器尺寸参数
 * @returns      容器中心的屏幕坐标
 */
export function containerCenter(params: Pick<CoordParams, 'width' | 'height'>): Vector2 {
  return {
    x: params.width / 2,
    y: params.height / 2,
  };
}
