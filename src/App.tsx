/**
 * @file src/App.tsx
 * @description 应用根组件（当前阶段：挂载单位圆最小集成切片）
 *
 * 未来路由/页面框架将在此扩展，目前只验证核心数据流闭环。
 */

import { UnitCircleSlice } from '@/features/unit-circle/UnitCircleSlice';
import './App.css';

function App() {
  return (
    <div id="app-root">
      <UnitCircleSlice />
    </div>
  );
}

export default App;
