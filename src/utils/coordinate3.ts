/**
 * @file src/utils/coordinate3.ts
 * @description 坐标转换工具 — 3D 数学坐标系 ↔ 2D SVG 屏幕坐标系 (等轴测投影)
 *
 * 坐标系约定：
 *   - 3D 数学坐标系 (Math Space 3D)：
 *       z 轴向上，y 轴向右下 (与水平呈 30°)，x 轴向左下 (与水平呈 30°)
 *       原点 (0,0,0) 对应投影后的容器中心
 *
 *   - 2D SVG 屏幕坐标系 (Screen Space 2D)：
 *       x 轴向右，y 轴向下 (SVG 原点在左上角)
 *
 *   - 投影方式：等轴测投影 (Isometric Projection)
 *       z 轴垂直向上
 *       x 轴和 y 轴在 2D 平面上与水平线的夹角为 30 度向下方延伸
 *
 * ⚠️ 严禁：
 *   - 在本文件引入 React 状态 / Zustand Store
 *   - 把 DOM 元素或 canvas context 传入本函数
 */

import type { Vector3 } from '@/types/vector3';
import type { Vector2 } from '@/types/math';
import type { CoordParams } from './coordinate';

// ─────────────────────────────────────────────
// § 常量
// ─────────────────────────────────────────────

const COS_30 = Math.sqrt(3) / 2;
const SIN_30 = 0.5;

// ─────────────────────────────────────────────
// § 投影核心函数
// ─────────────────────────────────────────────

/**
 * 将 3D 数学坐标等轴测投影到 2D SVG 屏幕坐标。
 *
 * 投影逻辑：
 *   1. 基础投影 (坐标系转换，z向上，y向右下，x向左下)：
 *      projX = (y - x) * cos(30)
 *      projY = z - (x + y) * sin(30)
 *   2. 适配 SVG 坐标 (y翻转，平移到中心并缩放)：
 *      screenX = cx + projX * unitPx
 *      screenY = cy - projY * unitPx
 *
 * @param v3     3D 数学坐标 (z向上, y向右下, x向左下)
 * @param params 容器尺寸与缩放参数 (与 2D coordinate 共享 CoordParams)
 * @returns      2D 屏幕坐标 (原点左上角, x向右, y向下)
 */
export function math3DToScreen(v3: Vector3, params: CoordParams): Vector2 {
  const cx = params.width / 2;
  const cy = params.height / 2;
  
  const projX = (v3.y - v3.x) * COS_30;
  const projY = v3.z - (v3.x + v3.y) * SIN_30;

  return {
    x: cx + projX * params.unitPx,
    y: cy - projY * params.unitPx,
  };
}

/**
 * (实验性) 将 2D SVG 屏幕坐标转换为 3D 数学坐标。
 *
 * 注意：由于 3D 到 2D 投影丢失了深度信息，直接从 2D 反推 3D 有无穷多解。
 * 此函数仅在假定 z = 0 的情况下有效，主要用于平面拖拽交互的近似计算。
 * 
 * 反推逻辑 (假设 z=0):
 *   projX = (y - x) * cos(30)  => y - x = projX / cos(30)
 *   projY = -(x + y) * sin(30) => x + y = -projY / sin(30) = -2 * projY
 * 
 *   两式相加: 2y = projX / cos(30) - 2 * projY => y = projX / (2 * cos(30)) - projY
 *   两式相减: 2x = -2 * projY - projX / cos(30) => x = -projY - projX / (2 * cos(30))
 *
 * @param screen 2D 屏幕坐标
 * @param params 容器参数
 * @returns      3D 坐标 (假定 z=0)
 */
export function screenToMath3D_Z0(screen: Vector2, params: CoordParams): Vector3 {
  const cx = params.width / 2;
  const cy = params.height / 2;

  const projX = (screen.x - cx) / params.unitPx;
  const projY = (cy - screen.y) / params.unitPx;

  const x = -projY - projX / (2 * COS_30);
  const y = -projY + projX / (2 * COS_30);

  return { x, y, z: 0 };
}
