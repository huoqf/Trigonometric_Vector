# MathVision 项目开发进度报告 (ROADMAP_PROGRESS)

> 最后更新：2026-05-19（核心层验收 + 坐标转换工具 + 单位圆最小集成）

## 当前整体状态

项目处于 **里程碑 1：基础图形与向量交互引擎** 的核心验收阶段。

底层数学纯函数库、全局 Zustand Store、坐标转换工具已全部完成并通过测试（43 个测试用例）。单位圆最小集成切片已可运行，数据流闭环已验证。

---

## 各里程碑完成情况对比

### 里程碑 1：基础图形与向量交互引擎 (第一优先级)

- [x] **1. 基础架构与 Store 初始化**
  - `src/math/vector.ts`：向量纯函数库，含 `angleToVector`、`vectorToAngle`（区间 [0, 2π)）、加减乘、点积、叉积、夹角等。严格无副作用。
  - `src/math/trigonometry.ts`：三角函数派生计算、奇异点 null 处理、`computeDerivedSnapshot` 快照函数、角度规范化。向量优先律体现：cos/sin 从向量分量读取。
  - `src/types/math.ts`：`Vector2 / TrigDerived / VectorDerived / MathDerivedSnapshot / MathBaseState / MathStore` 完整类型定义。
  - `src/store/useMathState.ts`：Zustand Store，只持有 `angleRad + radius + 控制标记`，**严禁**缓存派生量。单向数据流已建立。

- [x] **2. 坐标转换工具**
  - `src/utils/coordinate.ts`：数学坐标 ↔ 屏幕像素的纯函数转换（`mathToScreen` / `screenToMath` / `containerCenter`）。
  - 约定显式文档化：数学原点居中，y 轴向上正；屏幕原点左上角，y 轴向下正；翻转逻辑集中于此文件。
  - 严格禁止数学模块 `src/math/` 中包含像素坐标逻辑。

- [x] **3. 测试框架与核心验收（43 tests passed）**
  - `tests/math/vector.test.ts`（15 tests）：`angleToVector`、`vectorToAngle` 区间验证、往返一致性、零向量安全。
  - `tests/store/useMathState.test.ts`（15 tests）：Store 无缓存派生量、`setAngle` 规范化、`setRadius` 防御、`reset`、改变角度后派生量实时更新。
  - `tests/utils/coordinate.test.ts`（13 tests）：正向/逆向坐标转换、y 轴翻转、往返一致性、`containerCenter`。
  - 测试框架：Vitest（jsdom 环境）。

- [x] **4. 单位圆最小集成切片（数据流闭环）**
  - `src/features/unit-circle/UnitCircleSlice.tsx`：最小可运行切片。
  - 角度滑块/数字输入 → `setAngle` Action → Store 更新 → `useMemo` 派生 `snapshot` → SVG 端点联动 + sin/cos/tan/(x,y) 只读展示。
  - 无 `useState` 保存数学真值，无派生量写入 Store。

- [x] **5. 完整单位圆交互组件（可拖拽端点）**
  - 已完成：在 SVG 端点添加拖拽手势（`onPointerDown/Move/Up`），通过 `screenToMath` 获取坐标 → `vectorToAngle` 得到角度 → 触发 `setAngle` 实现交互闭环。

- [ ] **6. 向量基础组件**
  - 待办：可拖动首尾的向量组件 UI，实时显示长度与方向。

- [ ] **7. 向量加法与分解**
  - 待办：三角形法则与平行四边形法则交互动画。

- [ ] **8. 点积与投影实验**
  - 待办：投影与变化曲线动态图表。

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

1. **向量组件骨架**：新建 `src/features/vector/VectorDisplay.tsx`，用于可拖动向量展示，实时显示长度与方向。
2. **CSS 设计系统**：建立 `src/index.css` 的 CSS 变量设计 token，为后续多组件提供一致样式基础。
3. **路由框架**：当有多个 feature 切片后，引入 `react-router-dom` 建立页面导航。
4. **向量加法交互**：实现三角形法则与平行四边形法则。
