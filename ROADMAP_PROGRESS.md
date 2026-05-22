# MathVision 项目开发进度报告 (ROADMAP_PROGRESS)

> 最后更新：2026-05-22（新增本地持久化错题复盘系统、重构渐进式阶梯提示面板，至此真题与错题回收系统核心功能全部交付）

## 当前整体状态

项目处于 **里程碑 3：真题训练与错题回收系统** 的核心完备阶段。

底层数学纯函数库、全局 Zustand Store、坐标转换工具已全部完成并通过测试（48 个测试用例）。单位圆最小集成切片、自由向量交互组件、加法合成交互实验以及点积投影与余弦波形图已实现，且在应用根部进行了 Tab 流畅切换集成，数据流闭环已验证。针对中大屏的分辨率自适应分栏重构已经全部通过。诱导公式对称实验、三角函数图像参数变换实验、辅助角波形叠加实验，以及全新高精度的"解三角形动态调整与正余弦定理实时演算实验"均已实现高分交付。**里程碑 3 核心功能已交付**：除原先题库系统和答题卡 UI 外，新增基于本地持久化的错题复盘功能和阶梯锁渐进式提示面板，大幅提升了系统的复习备考实用性。

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

- [x] **8.5. 多设备自适应与排版极致优化**
  - **宽屏大显示器 (>= 1280px)**：采用标准三栏并排（操作区 290px | SVG 图像画布最大 600px | 演算看板自适应 >= 320px），极致利用宽屏空间。
  - **中屏笔记本/平板横屏 (960px - 1279px)**：首创三屏组件双栏网格化（`grid-template-areas`）。SVG 画布独占左侧一整列，操作区和演算看板在右侧垂直叠放，既能保持几何图形以最大尺寸高清晰渲染，又完美规避了常规三分栏造成的视觉拥挤。
  - **移动端/平板竖屏 (< 960px)**：移除限制，容器最大宽度放宽至 680px，支持全尺寸画面展示；通过 CSS `order` 重新调整层级流——将 **SVG 图像画布（Center Panel）强制提升至页面最顶部**，操控板居中，数据看板置底，保障移动端用户免去下滑，即可“首屏秒见交互图形”。
  - **导航标签重构**：剥离全部 inline style，统一由 `App.css` 流式网格接管。支持流式自动换行（`flex-wrap`）并优雅居中，搭配渐进式 hover 背景切换与亮色阴影微动画，兼具玻璃态轻量质感。

- [x] **9. 诱导公式对称实验**
  - 已完成：新建 `src/features/unit-circle/InductionSymmetry.tsx`，支持对 $-α$、$\pi \pm α$、$2\pi - α$、$\frac{\pi}{2} \pm α$ 六组经典诱导公式几何对称特征的可视化交互渲染。具备自由拖动的参考角端点 P 与联动点 Q，辅以正交投影和对称连接虚线显式阐明坐标的镜像关联。配有 LaTeX 式公式看板、实时三角函数对照表、以及折叠式“奇变偶不变，符号看象限”经典几何物理口诀拆解牌。

### 里程碑 2：高阶组件与综合动态模型 (第二优先级)
- [x] 1. 三屏联动 UI 框架
  - 已完成：在 `src/App.css` 中设计 `.lab-center-panel` 并新增 `src/components/common/ThreeScreenLayout.tsx` 响应式组件，提供“左侧操作区、中间图像区、右侧数值区”标准并排结构。
- [x] 2. 三角函数图像与参数变换
  - 已完成：基于 `ThreeScreenLayout` 构建了 `TrigFunctionGraph.tsx`。实现了 $y = A\sin(\omega x + \varphi) + b$ 与对应余弦、正切变换的高效渲染。左侧提供 $A, \omega, \varphi, b$ 范围滑块实时操控；中屏通过高精度纯数学映射函数 `mathToScreen` 绘制覆盖 $-3\pi$ 到 $3\pi$ 的平滑 SVG `<path>`（已对正切函数的渐近线进行断点处理）；右侧应用 LaTeX 呈现动态公式与周期、最值的自动换算面板（对正切自动识别并适配其周期公式与极值“无”）。
- [x] 3. 辅助角波形叠加实验
  - 已完成：基于 `ThreeScreenLayout` 构建了 `AuxiliaryAngle.tsx`。实现了正余弦分量及其高度实时叠加的可视化，在所选 $x$ 处呈现极其直观的垂线及代数高度叠加箭头（$y_1 + y_2 = y_3$）。右侧除了 LaTeX 公式之外，专门设计了以振幅 $(A, B)$ 为坐标的“极坐标终边几何圆”，深度打通了波形相位移动与圆周轴线旋转的物理/几何关联，展现出卓越的教学直觉。
- [x] 4. 解三角形动态调整
  - 已完成：基于 `ThreeScreenLayout` 构建了 `SolvingTriangle.tsx`。中屏实现了支持鼠标/触控拖拽的三角形 $A, B, C$ 顶点自然形变交互，内置基于叉积的防退化保护，可选择绘制几何外接圆及圆心半径辅助虚线。右侧提供高精度的 LaTeX 代数代入验算，直观印证了正弦定理比值等于 $2R$，以及余弦定理在直角三角形下的勾股定理退化特征。
- [x] 5. 奔驰定理实验
  - 已完成：基于 `ThreeScreenLayout` 构建了 `BenzTheorem.tsx`。实现了拖拽三角形顶点与内部动点 P，实时计算子三角形有向面积并可视化面积权重下的向量线性组合，直观验证奔驰定理 $S_A \\vec{PA} + S_B \\vec{PB} + S_C \\vec{PC} = \\vec{0}$。

### 里程碑 3：真题训练与错题回收系统 (第三优先级)
- [x] 1. 题库系统搭建
  - `src/types/exam.ts`：题目、选项、知识点标签、难度、提示、做题记录完整类型定义。
  - `src/features/exam_training/questionBank.ts`：9 道覆盖 6 大知识点的静态题库，含逐步提示与详细解析。
  - `src/store/useExamStore.ts`：答题会话 Zustand Store，管理题目列表、答案提交、提示消费与得分统计。
  - `src/features/exam_training/ExamTraining.tsx`：完整答题卡 UI，含知识点筛选、进度条、题号导航、选项正误高亮、渐进提示、解析展开与结果统计页。已接入主导航 Tab。
- [x] 2. 渐进式提示面板
  - 重构提示区域，引入“阶梯锁”渐进提示组件。在卡片中清晰展示总提示数与解锁状态，避开一次性全部呈现，支持逐级解锁并以优雅微动画渐现提示内容，提升解题引导体验。
- [x] 3. 错题复盘系统
  - 在 `useExamStore` 中引入错题库持久化（通过 `localStorage` 同步）。错题在常规练习中答错时自动录入，并提供手动“收藏/取消”标记。在复盘模式下，若用户答对会自动从错题本移出。
  - 在未开始页面添加高颜值错题本控制面板（支持数量显示、一键清空、复盘入口），并在结果统计页提供新增错题警示和一键复盘快捷链接。
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

1. **错题复盘系统**：统计答错题目，按知识点筛选重练，增加错题标注功能。
2. **题库扩容**：每个知识点补充至 5～10 道题，覆盖难、中、易三个梯度。
3. **题目变式引擎**：对同一核心题型生成参数随机化的变式题，防止刷题记忆。
