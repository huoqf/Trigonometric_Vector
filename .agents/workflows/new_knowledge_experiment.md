# 工作流：新知识实验开发 (New Knowledge Experiment)

## 目的
规范化开发一个新的动态交互实验模块（如诱导公式对称实验、奔驰定理实验）的流程。

## 步骤
1. **理论抽象**：从 PRD 确定教学目标，并在 `src/math` 下定义基础几何与代数模型。
2. **状态定义**：在 `src/store` 中定义所需的基础变量与派生状态（遵循无状态计算优先）。
3. **动画设计**：在 `src/components/animations` 开发所需的 SVG/Canvas 交互组件，确保响应拖拽与渲染分离。
4. **UI 组装**：在 `src/features` 下创建页面视图，遵循三屏联动布局。
5. **验收标准**：必须符合 `math_rules.md` 与 `ui_rules.md` 中的硬性约束。
