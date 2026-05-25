/**
 * @file src/App.tsx
 * @description 应用根组件（挂载单位圆与平面向量交互实验室）
 */

import { useState, useEffect } from 'react';
import { UnitCircleSlice } from '@/features/unit-circle/UnitCircleSlice';
import { InductionSymmetry } from '@/features/unit-circle/InductionSymmetry';
import { VectorDisplay } from '@/features/vector/VectorDisplay';
import { VectorAddition } from '@/features/vector/VectorAddition';
import { VectorDotProduct } from '@/features/vector/VectorDotProduct';
import { TrigFunctionGraph } from '@/features/function-graph/TrigFunctionGraph';
import { AuxiliaryAngle } from '@/features/function-graph/AuxiliaryAngle';
import { SolvingTriangle } from '@/features/function-graph/SolvingTriangle';
import { BenzTheorem } from '@/features/vector/BenzTheorem';
import { ExamTraining } from '@/features/exam_training/ExamTraining';
import { SumDifference } from '@/features/trig-identity/SumDifference';
import { DoubleAnglePowerReduction } from '@/features/trig-identity/DoubleAnglePowerReduction';
import './App.css';

function App() {
  const [activeModule, setActiveModule] = useState<'plane' | 'space'>('plane');
  const [activePlaneTab, setActivePlaneTab] = useState<'circle' | 'symmetry' | 'graph' | 'auxiliary' | 'triangle' | 'vector' | 'addition' | 'dot' | 'benz' | 'sum-diff' | 'double-reduce' | 'exam'>('circle');
  const [activeSpaceTab, setActiveSpaceTab] = useState<'space-basic' | 'space-coord' | 'space-theorem' | 'solid-judge' | 'solid-metric' | 'solid-3d'>('space-basic');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 监听全屏状态变化（以防用户按 Esc 退出全屏后状态不同步）
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('全屏切换失败:', err);
    }
  };

  return (
    <div style={styles.appContainer}>
      <button
        id="btn-toggle-fullscreen"
        onClick={toggleFullscreen}
        style={styles.fullscreenButton}
      >
        {isFullscreen ? '退出全屏' : '全屏模式'}
      </button>

      <header style={styles.header}>
        <h1 style={styles.brandTitle}>MathVision</h1>
        <p style={styles.brandSubtitle}>高中数学三角函数与平面向量交互学习系统</p>
      </header>

      <div style={styles.moduleSelector}>
        <button
          onClick={() => setActiveModule('plane')}
          style={{ ...styles.moduleButton, ...(activeModule === 'plane' ? styles.activeModule : {}) }}
        >
          📐 平面数学
        </button>
        <button
          onClick={() => setActiveModule('space')}
          style={{ ...styles.moduleButton, ...(activeModule === 'space' ? styles.activeModule : {}) }}
        >
          🧊 空间几何
        </button>
      </div>

      {activeModule === 'plane' && (
        <nav className="lab-tab-container">
          <button
            onClick={() => setActivePlaneTab('circle')}
            className={`lab-tab-button ${activePlaneTab === 'circle' ? 'active' : ''}`}
          >
            单位圆与三角定义
          </button>
          <button
            onClick={() => setActivePlaneTab('symmetry')}
            className={`lab-tab-button ${activePlaneTab === 'symmetry' ? 'active' : ''}`}
          >
            诱导公式对称
          </button>
          <button
            onClick={() => setActivePlaneTab('graph')}
            className={`lab-tab-button ${activePlaneTab === 'graph' ? 'active' : ''}`}
          >
            函数图像与变换
          </button>
          <button
            onClick={() => setActivePlaneTab('auxiliary')}
            className={`lab-tab-button ${activePlaneTab === 'auxiliary' ? 'active' : ''}`}
          >
            辅助角公式
          </button>
          <button
            onClick={() => setActivePlaneTab('triangle')}
            className={`lab-tab-button ${activePlaneTab === 'triangle' ? 'active' : ''}`}
          >
            解三角形
          </button>
          <button
            onClick={() => setActivePlaneTab('vector')}
            className={`lab-tab-button ${activePlaneTab === 'vector' ? 'active' : ''}`}
          >
            平面向量交互
          </button>
          <button
            onClick={() => setActivePlaneTab('addition')}
            className={`lab-tab-button ${activePlaneTab === 'addition' ? 'active' : ''}`}
          >
            向量加法法则
          </button>
          <button
            onClick={() => setActivePlaneTab('dot')}
            className={`lab-tab-button ${activePlaneTab === 'dot' ? 'active' : ''}`}
          >
            点积与投影实验
          </button>
          <button
            onClick={() => setActivePlaneTab('benz')}
            className={`lab-tab-button ${activePlaneTab === 'benz' ? 'active' : ''}`}
          >
            奔驰定理
          </button>
          <button
            onClick={() => setActivePlaneTab('sum-diff')}
            className={`lab-tab-button ${activePlaneTab === 'sum-diff' ? 'active' : ''}`}
          >
            两角和差
          </button>
          <button
            onClick={() => setActivePlaneTab('double-reduce')}
            className={`lab-tab-button ${activePlaneTab === 'double-reduce' ? 'active' : ''}`}
          >
            二倍角与降次
          </button>
          <button
            onClick={() => setActivePlaneTab('exam')}
            className={`lab-tab-button ${activePlaneTab === 'exam' ? 'active' : ''}`}
          >
            📝 真题训练
          </button>
        </nav>
      )}

      {activeModule === 'space' && (
        <nav className="lab-tab-container">
          <button
            onClick={() => setActiveSpaceTab('space-basic')}
            className={`lab-tab-button ${activeSpaceTab === 'space-basic' ? 'active' : ''}`}
          >
            空间向量基础
          </button>
          <button
            onClick={() => setActiveSpaceTab('space-coord')}
            className={`lab-tab-button ${activeSpaceTab === 'space-coord' ? 'active' : ''}`}
          >
            坐标表示与运算
          </button>
          <button
            onClick={() => setActiveSpaceTab('space-theorem')}
            className={`lab-tab-button ${activeSpaceTab === 'space-theorem' ? 'active' : ''}`}
          >
            基本定理与性质
          </button>
          <button
            onClick={() => setActiveSpaceTab('solid-judge')}
            className={`lab-tab-button ${activeSpaceTab === 'solid-judge' ? 'active' : ''}`}
          >
            立体几何判定
          </button>
          <button
            onClick={() => setActiveSpaceTab('solid-metric')}
            className={`lab-tab-button ${activeSpaceTab === 'solid-metric' ? 'active' : ''}`}
          >
            空间角与距离
          </button>
          <button
            onClick={() => setActiveSpaceTab('solid-3d')}
            className={`lab-tab-button ${activeSpaceTab === 'solid-3d' ? 'active' : ''}`}
          >
            3D 综合应用
          </button>
        </nav>
      )}

      <main style={styles.mainContent}>
        {activeModule === 'plane' && (
          <>
            {activePlaneTab === 'circle' && <UnitCircleSlice />}
            {activePlaneTab === 'symmetry' && <InductionSymmetry />}
            {activePlaneTab === 'graph' && <TrigFunctionGraph />}
            {activePlaneTab === 'auxiliary' && <AuxiliaryAngle />}
            {activePlaneTab === 'triangle' && <SolvingTriangle />}
            {activePlaneTab === 'vector' && <VectorDisplay />}
            {activePlaneTab === 'addition' && <VectorAddition />}
            {activePlaneTab === 'dot' && <VectorDotProduct />}
            {activePlaneTab === 'benz' && <BenzTheorem />}
            {activePlaneTab === 'sum-diff' && <SumDifference />}
            {activePlaneTab === 'double-reduce' && <DoubleAnglePowerReduction />}
            {activePlaneTab === 'exam' && <ExamTraining />}
          </>
        )}
        {activeModule === 'space' && (
          <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px' }}>模块开发中 (里程碑 4)...</p>
            <p>即将在本区域挂载 {activeSpaceTab} 组件</p>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>© 2026 MathVision 互动实验室 · 里程碑 1 核心版</p>
      </footer>
    </div>
  );
}



const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#090d16',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    position: 'relative',
  },
  fullscreenButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },

  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  moduleSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  moduleButton: {
    padding: '8px 24px',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeModule: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderColor: '#6366f1',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
  },
  brandTitle: {
    fontSize: '32px',
    fontWeight: 800,
    margin: 0,
    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.025em',
  },
  brandSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '6px 0 0 0',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  footer: {
    marginTop: '40px',
    textAlign: 'center',
    color: '#475569',
    fontSize: '12px',
  },
};

export default App;

