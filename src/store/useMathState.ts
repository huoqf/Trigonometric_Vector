/**
 * @file src/store/useMathState.ts
 * @description 核心数学状态 Zustand Store
 *
 * 单向数据流设计：
 *   用户交互
 *     → action（setAngle / setRadius / ...）
 *       → 修改 Store 基础状态（angleRad / radius）
 *         → 组件通过 selector 消费 computeDerivedSnapshot()
 *           → 驱动 UI / 动画渲染
 *
 * 关键约束：
 *   ✅ Store 只存储 MathBaseState（angleRad + radius + 控制标记）
 *   ✅ sin / cos / tan / (x, y) 等派生量 **绝对不存入 Store**
 *   ✅ 所有组件必须通过 selector 订阅，不允许 useState 持有数学真值
 *   ✅ 所有路径引用使用 @ 别名
 */

import { create } from 'zustand';
import type { MathStore } from '@/types/math';
import { normalizeAngle } from '@/math/trigonometry';

// ─────────────────────────────────────────────
// § 初始状态（角度 0，单位半径）
// ─────────────────────────────────────────────

const INITIAL_ANGLE_RAD = 0;
const INITIAL_RADIUS = 1;

// ─────────────────────────────────────────────
// § Store 创建
// ─────────────────────────────────────────────

/**
 * useMathState — 核心数学 Store。
 *
 * 使用示例（在组件中）：
 * ```ts
 * // 订阅基础状态（精细 selector，避免全量订阅）
 * const angleRad = useMathState((s) => s.angleRad);
 * const radius   = useMathState((s) => s.radius);
 *
 * // 消费派生状态（在组件内用 useMemo 或直接调用纯函数）
 * const snapshot = useMemo(
 *   () => computeDerivedSnapshot(angleRad, radius),
 *   [angleRad, radius]
 * );
 * ```
 *
 * ⚠️ 不要这样做：
 * ```ts
 * // 错误：在组件内用 useState 保存角度
 * const [angle, setAngle] = useState(0);
 * ```
 */
export const useMathState = create<MathStore>()((set) => ({
  // ── 基础状态（真值基底） ──────────────────────
  angleRad: INITIAL_ANGLE_RAD,
  radius: INITIAL_RADIUS,
  isAnimating: false,
  isAngleLocked: false,

  // ── 动作（Actions）────────────────────────────

  /**
   * 设置角度。
   * 内部通过 normalizeAngle 确保 angleRad 始终在 [0, 2π)，
   * 即使传入负数或超过 2π 的值也能安全处理。
   */
  setAngle(rad: number) {
    set({ angleRad: normalizeAngle(rad) });
  },

  /**
   * 设置向量模长（必须 > 0，否则忽略本次调用）。
   * 保持最小正值约束，防止零向量导致派生计算异常。
   */
  setRadius(r: number) {
    if (r > 0) {
      set({ radius: r });
    }
  },

  /** 控制动画播放状态 */
  setAnimating(active: boolean) {
    set({ isAnimating: active });
  },

  /** 锁定/解锁角度（题库场景使用，禁止用户拖拽修改角度） */
  setAngleLocked(locked: boolean) {
    set({ isAngleLocked: locked });
  },

  /** 重置为初始状态 */
  reset() {
    set({
      angleRad: INITIAL_ANGLE_RAD,
      radius: INITIAL_RADIUS,
      isAnimating: false,
      isAngleLocked: false,
    });
  },
}));
