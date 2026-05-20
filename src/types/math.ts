/**
 * @file src/types/math.ts
 * @description 全局数学状态类型定义
 *
 * 设计原则（向量优先律）：
 *   - Store 的「基础状态」仅持有产生所有几何量的最小真值基底：angleRad + radius
 *   - sin/cos/tan 及向量坐标 (x, y) 均为「派生状态」，禁止在 Store 中直接存储
 *   - 所有派生量由纯函数动态计算，保持单一数据源
 *
 * 坐标系约定（数学坐标系）：
 *   - 原点居中
 *   - 单位长度标准化（radius = 1 时对应单位圆）
 *   - 逆时针为角度正方向
 *   - 弧度制优先；角度区间规范化为 [0, 2π)
 */

// ─────────────────────────────────────────────
// § 基本几何类型
// ─────────────────────────────────────────────

/** 数学坐标系中的二维向量（不含像素坐标语义） */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

// ─────────────────────────────────────────────
// § 基础状态（Store 真值基底）
//   ⚠️ 严禁在此处添加 sin / cos / tan / x / y 等派生字段
// ─────────────────────────────────────────────

/** 描述三角函数图像变换状态 */
export interface TrigGraphState {
  readonly A: number;
  readonly omega: number;
  readonly phi: number;
  readonly b: number;
  readonly funcType: 'sin' | 'cos';
}

/** useMathState Store 允许持有的最小真值集合 */
export interface MathBaseState {
  /** 当前角度，弧度制，规范化区间 [0, 2π) */
  readonly angleRad: number;

  /** 向量模长（单位长度 = 1，对应标准单位圆） */
  readonly radius: number;

  /** 图像变换参数状态 */
  readonly graphParams: TrigGraphState;

  /** 是否处于动画播放状态（控制标记，非数学真值） */
  readonly isAnimating: boolean;

  /** 是否锁定角度（题库注入约束时使用，核心控制标记） */
  readonly isAngleLocked: boolean;
}

// ─────────────────────────────────────────────
// § 派生状态（只读，由纯函数计算，不存入 Store）
//   这些类型仅用于组件 props 与函数返回值的类型标注
// ─────────────────────────────────────────────

/** 从 angleRad 派生的标准三角函数值 */
export interface TrigDerived {
  readonly sin: number;
  readonly cos: number;
  /** tan 在 π/2 + kπ 处未定义，使用 null 明确表达 */
  readonly tan: number | null;
}

/**
 * 从 angleRad + radius 派生的单位圆端点向量
 * 向量优先：所有几何位置以 Vector2 表达，不直接使用标量坐标对
 */
export interface VectorDerived {
  /** 单位圆/半径圆上对应角度的终点向量 */
  readonly tip: Vector2;
  /** 单位向量（radius = 1 时与 tip 相同） */
  readonly unit: Vector2;
}

/** 完整派生状态快照（供需要一次性消费多个派生量的组件使用） */
export interface MathDerivedSnapshot {
  readonly trig: TrigDerived;
  readonly vector: VectorDerived;
}

// ─────────────────────────────────────────────
// § 动作接口（Store Actions）
// ─────────────────────────────────────────────

/** useMathState Store 对外暴露的动作集合 */
export interface MathActions {
  /**
   * 设置当前角度（弧度）。
   * 实现层负责将输入规范化到 [0, 2π)，调用方无需预处理。
   */
  setAngle(rad: number): void;

  /** 设置向量模长（必须为正数，否则忽略） */
  setRadius(r: number): void;

  /** 启动/停止角度动画 */
  setAnimating(active: boolean): void;

  /** 锁定/解锁角度（供题库模块调用） */
  setAngleLocked(locked: boolean): void;

  /** 重置为初始状态（angleRad = 0, radius = 1, 停止动画） */
  reset(): void;

  /** 更新三角函数图像变换参数 */
  updateGraphParam<K extends keyof TrigGraphState>(key: K, value: TrigGraphState[K]): void;
}

// ─────────────────────────────────────────────
// § Store 完整类型（基础状态 + 动作）
// ─────────────────────────────────────────────

/** Zustand Store 的完整类型签名（不含派生状态，派生量在外部由纯函数计算） */
export type MathStore = MathBaseState & MathActions;
