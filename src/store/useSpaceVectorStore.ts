/**
 * @file src/store/useSpaceVectorStore.ts
 * @description 核心三维空间向量 Zustand Store
 *
 * 设计约束（与二维 useMathState 完全隔离）：
 *   ✅ 只存储 SpaceVectorBaseState（包含命名向量的坐标真值字典和选中状态）。
 *   ✅ 法向量、夹角、距离等派生量 **绝对不存入 Store**。
 *   ✅ 采用独立 Zustand 实例，不与平面数学逻辑混用。
 */

import { create } from 'zustand';
import type { Vector3, SpaceVectorStore } from '@/types/vector3';

// ─────────────────────────────────────────────
// § 初始状态
// ─────────────────────────────────────────────

const INITIAL_VECTORS: Record<string, Vector3> = {
  // 预置三个标准基向量
  e1: { x: 1, y: 0, z: 0 },
  e2: { x: 0, y: 1, z: 0 },
  e3: { x: 0, y: 0, z: 1 },
};

// ─────────────────────────────────────────────
// § Store 创建
// ─────────────────────────────────────────────

/**
 * 空间向量场景状态 Store。
 * 存储三维直角坐标真值。
 */
export const useSpaceVectorStore = create<SpaceVectorStore>()((set) => ({
  // ── 基础状态 ──────────────────────
  vectors: INITIAL_VECTORS,
  selectedId: null,

  // ── 动作 (Actions) ──────────────────────

  /** 添加或更新单一向量 */
  setVector: (id, v) =>
    set((state) => ({
      vectors: { ...state.vectors, [id]: v },
    })),

  /** 批量更新向量 */
  setVectors: (entries) =>
    set((state) => ({
      vectors: { ...state.vectors, ...entries },
    })),

  /** 移除指定向量 */
  removeVector: (id) =>
    set((state) => {
      const newVectors = { ...state.vectors };
      delete newVectors[id];
      return {
        vectors: newVectors,
        // 如果删除的是当前选中的向量，重置选中状态
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  /** 清空场景（可保留基底，视业务需要，此处全部清空） */
  clearAll: () => set({ vectors: {}, selectedId: null }),

  /** 选中向量 */
  select: (id) => set({ selectedId: id }),
}));
