/**
 * @file src/types/vector3.ts
 * @description 三维空间向量相关类型定义
 *
 * 设计原则（与 types/math.ts 一致的向量优先律）：
 *   - Store 的基础状态仅持有命名向量的直角坐标真值（x, y, z）
 *   - 夹角、法向量、距离等均为「派生状态」，禁止在 Store 中存储
 *   - 所有派生量由 src/math/vector3.ts 中的纯函数动态计算
 *
 * 与 types/math.ts 的关系：
 *   - 本文件只新增 3D 相关类型，不修改也不依赖 types/math.ts
 *   - 两套类型完全独立，对应两个完全隔离的 Store
 */

// ─────────────────────────────────────────────
// § 基本几何类型
// ─────────────────────────────────────────────

/** 数学坐标系中的三维向量（不含像素坐标语义） */
export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

// ─────────────────────────────────────────────
// § 空间几何体辅助类型
// ─────────────────────────────────────────────

/**
 * 空间中的平面，由法向量 n 和平面上一点 point 确定。
 * 平面方程：n·(r - point) = 0
 */
export interface Plane3 {
  /** 法向量（不要求单位向量，计算时内部归一化） */
  readonly normal: Vector3;
  /** 平面上任意一点 */
  readonly point: Vector3;
}

/**
 * 空间中的直线，由方向向量 dir 和直线上一点 point 确定。
 * 参数方程：r = point + t * dir
 */
export interface Line3 {
  /** 方向向量（不要求单位向量） */
  readonly dir: Vector3;
  /** 直线上任意一点 */
  readonly point: Vector3;
}

// ─────────────────────────────────────────────
// § Store 基础状态（真值基底）
//   ⚠️ 严禁在此处添加夹角、法向量、距离等派生字段
// ─────────────────────────────────────────────

/**
 * useSpaceVectorStore 允许持有的最小真值集合。
 *
 * vectors 是以字符串 ID 为键的命名向量字典，例如：
 *   { "a": {x:1,y:0,z:0}, "b": {x:0,y:1,z:0}, "n": {x:0,y:0,z:1} }
 *
 * 命名规范（建议）：
 *   - 单字母小写：向量本身（"a", "b", "c"）
 *   - 带下标：顶点坐标向量（"OA", "OB", "OC"）
 *   - 法向量：前缀 "n_"（"n_alpha", "n_beta"）
 */
export interface SpaceVectorBaseState {
  /** 命名向量字典（唯一真值，所有派生量从此计算） */
  readonly vectors: Record<string, Vector3>;
  /** 当前选中的向量 ID，null 表示无选中 */
  readonly selectedId: string | null;
}

// ─────────────────────────────────────────────
// § 动作接口（Store Actions）
// ─────────────────────────────────────────────

/** useSpaceVectorStore 对外暴露的动作集合 */
export interface SpaceVectorActions {
  /** 添加或更新一个命名向量 */
  setVector(id: string, v: Vector3): void;

  /** 批量添加或更新向量（原子操作，避免多次触发重渲染） */
  setVectors(entries: Record<string, Vector3>): void;

  /** 删除指定 ID 的向量（若不存在则静默忽略） */
  removeVector(id: string): void;

  /** 清空所有向量并重置选中状态 */
  clearAll(): void;

  /** 设置当前选中的向量 ID（null 表示取消选中） */
  select(id: string | null): void;
}

// ─────────────────────────────────────────────
// § Store 完整类型
// ─────────────────────────────────────────────

/** useSpaceVectorStore 的完整类型签名（基础状态 + 动作） */
export type SpaceVectorStore = SpaceVectorBaseState & SpaceVectorActions;
