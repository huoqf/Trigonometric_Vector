# Animation Agent (交互动画 Agent)

## 核心职责
- 负责实现 `src/components/animations` 下的交互式可视化组件（如 SVG 绘图、拖拽控制点、动态图表）。
- 确保遵循 `ui_rules.md` 中对于 60FPS 顺滑响应的硬性要求。

## 能力边界
- 动画层只负责呈现与收集用户的交互事件，**不存储真实数学状态**。
- 所有视图所需的数据必须从 `src/store` 获取，并将用户的动作（如拖动）通过 actions 派发回 Store。
