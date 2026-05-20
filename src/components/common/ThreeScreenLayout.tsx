import React from 'react';
import './../../App.css';

interface ThreeScreenLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

/**
 * 三屏联动 UI 框架
 * 
 * 为高阶综合动态模型提供标准的左、中、右分栏响应式布局。
 * @param left 左侧操作区（如：单位圆交互控制）
 * @param center 中间图像区（如：平面向量展示、函数波形图像）
 * @param right 右侧数值区（如：参数状态看板、实时数据图表）
 */
export function ThreeScreenLayout({ left, center, right }: ThreeScreenLayoutProps) {
  return (
    <div className="lab-container three-screen">
      <div className="lab-layout-grid">
        <div className="lab-left-panel">{left}</div>
        <div className="lab-center-panel">{center}</div>
        <div className="lab-right-panel">{right}</div>
      </div>
    </div>
  );
}
