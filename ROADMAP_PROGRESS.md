# MathVision 项目开发进度报告 (ROADMAP_PROGRESS)

> 最后更新：2026-05-20（核心层验收 + 坐标转换工具 + 单位圆最小集成 + 向量基础首尾交互组件完成 + 全屏模式支持 + 向量加法与点积投影实验完成 + 多分辨率与大屏分栏自适应优化）

## 当前整体状态

项目处于 **里程碑 1：基础图形与向量交互引擎** 的开发与验收阶段。

底层数学纯函数库、全局 Zustand Store、坐标转换工具已全部完成并通过测试（43 个测试用例）。单位圆最小集成切片、自由向量交互组件、加法合成交互实验以及点积投影与余弦波形图已实现，且在应用根部进行了 Tab 流畅切换集成，数据流闭环已验证。针对中大屏（如 3072*1920, 1920*1080）的分辨率自适应分栏重构已经全部通过静态编译和单元测试。

---

## 各里程碑完成情况对比

### 里程碑 1：基础图形与向量交互引擎 (第一优先级)

- [x] **1. 基础架构与 Store 初始化**
  - `src/math/vector.ts`：向量纯函数库，含 `angleToVector`、`vectorToAngle`（区间 [0, 2π)）、加减乘、点积、叉积、夹角等。严格无副作用。
  - `src/math/trigonometry.ts`：三角函数派生计算、奇异点 null 处理、`computeDerivedSnapshot`快照函数、角度规范化。向量优先律体现：cos/sin 从向量分量读取。
  - `src/types/math.ts`：`Vector2 / TrigDerived / VectorDerived / MathDerivedSnapshot / MathBaseState / MathStore` 完整类型定义。
  - `src/store/useMathState.ts`：Zustand Store，只持有 `angleRad + radius + 控制标记`，**严禁**缓存派生量。单向数据流已建立。

- [x] **2. 坐标转换工具**
  - `src/utils/coordinate.ts`：数学坐标 ↔ 屏幕像素的纯函数转换（`mathToScreen` / `screenToMath` / `containerCenter`）。
  - 约定显式文档化：数学原点居中，y 轴向上正；屏幕原点左上角，y 轴向下正；翻转逻辑集中于此文件。
  - 严格禁止数学模块 `src/math/` 中包含像素坐标逻辑。

- [x] **3. 测试框架与核心验收（43 tests passed）**
  - `tests/math/vector.test.ts`（15 tests）：`angleToVector`、`vectorToAngle` 区间验证、往返一致性、零向量安全。
  - `tests/store/useMathState.test.ts`（15 tests）：Store 无缓存派生量、`setAngle` 规范化、`setRadius` 防御、`reset`、改变角度后派生量实时更新。
  - `tests/utils/coordinate.test.ts` (13 tests)：正向/逆向坐标转换、y 轴翻转、往返一致性、`containerCenter`。
  - 测试框架：Vitest（jsdom 环境）。

- [x] **4. 单位圆最小集成切片（数据流闭环）**
  - `src/features/unit-circle/UnitCircleSlice.tsx`：最小可运行切片。
  - 角度滑块/数字输入 → `setAngle` Action → Store 更新 → `useMemo` 派生 `snapshot` → SVG 端点联动 + sin/cos/tan/(x,y) 只读展示。
  - 无 `useState` 保存数学真值，无派生量写入 Store。

- [x] **5. 完整单位圆交互组件（可拖拽端点）**
  - 已完成：在 SVG 端点添加拖拽手势（`onPointerDown/Move/Up`），通过 `screenToMath` 获取坐标 → `vectorToAngle` 得到角度 → 触发 `setAngle` 实现交互闭环。

- [x] **6. 向量基础组件**
  - 已完成：新建 `src/features/vector/VectorDisplay.tsx`，支持拖拽首（起点 A）与尾（终点 B）的自由向量展示，带有正交分解投影（dx 和 dy 虚线构建直角三角形），并提供平移到原点以强化对“自由向量”的数学直觉理解。实时展示首尾坐标、分量值、模长和方向夹角。

- [x] **7. 向量加法与分解**
  - 已完成：新建 `src/features/vector/VectorAddition.tsx`，支持三角形法则与平行四边形法则的动态切换与联动。在平行四边形法则下可拖拽各分向量端点，在三角形法则下可直接拖拽首向量端点和合向量终点，直观呈现了向量平移相加的等价性。

- [x] **8. 点积与投影实验**
  - 已完成：新建 `src/features/vector/VectorDotProduct.tsx`，支持两个共起点向量的自由拖拽，并向被投影向量方向绘制正反向的带箭头正交投影向量（点积为正时呈绿色，为负时呈红色）。在下方设计了余弦动态波形图，振幅根据两个向量模长乘积实时缩放，并在 $[-180^\circ, 180^\circ]$ 范围内实时高亮当前夹角所对应的动点，配以三维点积公式看板对比。

- [x] **8.5. 多分辨率与大屏分栏自适应优化**
  - 已完成：针对 `3072*1920`、`1920*1080` 等宽屏/高清笔记本分辨率进行深度排版适配。在 `App.css` 中引入了 `.lab-container` 和 `.lab-layout-grid` 自适应分栏机制。将 `UnitCircleSlice.tsx`、`VectorDisplay.tsx`、`VectorAddition.tsx`、`VectorDotProduct.tsx` 四大核心实验室组件全部重构为左右布局（左侧交互画板与控制、右侧数值状态与看板），在大屏幕下通过媒体查询引入 `transform: scale(1.15)` 的等比放大，最大化利用了宽屏与高清屏的视觉空间。

- [ ] **9. 诱导公式对称实验**
  - 待办：π ± α 对称映射交互。

### 里程碑 2：高阶组件与综合动态模型 (第二优先级)
- [ ] 1. 三屏联动 UI 框架
- [ ] 2. 三角函数图像与参数变换
- [ ] 3. 辅助角波形叠加实验
- [ ] 4. 解三角形动态调整
- [ ] 5. 奔驰定理实验

### 里程碑 3：真题训练与错题回收系统 (第三优先级)
- [ ] 1. 题库系统搭建
- [ ] 2. 渐进式提示面板
- [ ] 3. 错题复盘系统
- [ ] 4. 题目变式与迁移题引擎

---

## 架构约束备忘（向量优先律 + 单向数据流）

| 规则 | 说明 |
|------|------|
| **真值唯一性** | `angleRad + radius` 是唯一真值，存于 Store |
| **派生量禁入 Store** | `sin/cos/tan/(x,y)` 只在组件内用 `useMemo` 派生 |
| **向量优先** | `cos/sin` 从向量分量读取（`angleToVector` 先行） |
| **坐标隔离** | 像素转换只在 `src/utils/coordinate.ts` 中发生 |
| **路径别名** | 全部使用 `@/` 别名，严禁 `../` 相对路径 |
| **奇异点** | `tan` 在 π/2+kπ 处返回 `null`，不用 `Infinity` |

---

## 下一步行动建议 (Next Steps)

1. **诱导公式对称实验**：开发 `src/features/unit-circle/InductionSymmetry.tsx`，以支持 $\pi \pm \alpha$ 的对称映射交互。
2. **三屏联动 UI 框架**：在里程碑 2 中建立“单位圆—向量—函数图像”三屏动态联动框架。
