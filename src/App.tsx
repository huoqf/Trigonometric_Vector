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
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'circle' | 'symmetry' | 'graph' | 'auxiliary' | 'triangle' | 'vector' | 'addition' | 'dot' | 'benz' | 'exam'>('circle');
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

      <nav className="lab-tab-container">
        <button
          id="tab-circle-lab"
          onClick={() => setActiveTab('circle')}
          className={`lab-tab-button ${activeTab === 'circle' ? 'active' : ''}`}
        >
          单位圆与三角定义
        </button>
        <button
          id="tab-symmetry-lab"
          onClick={() => setActiveTab('symmetry')}
          className={`lab-tab-button ${activeTab === 'symmetry' ? 'active' : ''}`}
        >
          诱导公式对称
        </button>
        <button
          id="tab-graph-lab"
          onClick={() => setActiveTab('graph')}
          className={`lab-tab-button ${activeTab === 'graph' ? 'active' : ''}`}
        >
          函数图像与变换
        </button>
        <button
          id="tab-auxiliary-lab"
          onClick={() => setActiveTab('auxiliary')}
          className={`lab-tab-button ${activeTab === 'auxiliary' ? 'active' : ''}`}
        >
          辅助角公式
        </button>
        <button
          id="tab-triangle-lab"
          onClick={() => setActiveTab('triangle')}
          className={`lab-tab-button ${activeTab === 'triangle' ? 'active' : ''}`}
        >
          解三角形
        </button>
        <button
          id="tab-vector-lab"
          onClick={() => setActiveTab('vector')}
          className={`lab-tab-button ${activeTab === 'vector' ? 'active' : ''}`}
        >
          平面向量交互
        </button>
        <button
          id="tab-addition-lab"
          onClick={() => setActiveTab('addition')}
          className={`lab-tab-button ${activeTab === 'addition' ? 'active' : ''}`}
        >
          向量加法法则
        </button>
        <button
          id="tab-dot-lab"
          onClick={() => setActiveTab('dot')}
          className={`lab-tab-button ${activeTab === 'dot' ? 'active' : ''}`}
        >
          点积与投影实验
        </button>
        <button
          id="tab-benz-lab"
          onClick={() => setActiveTab('benz')}
          className={`lab-tab-button ${activeTab === 'benz' ? 'active' : ''}`}
        >
          奔驰定理
        </button>
        <button
          id="tab-exam-lab"
          onClick={() => setActiveTab('exam')}
          className={`lab-tab-button ${activeTab === 'exam' ? 'active' : ''}`}
        >
          📝 真题训练
        </button>
      </nav>

      <main style={styles.mainContent}>
        {activeTab === 'circle' && <UnitCircleSlice />}
        {activeTab === 'symmetry' && <InductionSymmetry />}
        {activeTab === 'graph' && <TrigFunctionGraph />}
        {activeTab === 'auxiliary' && <AuxiliaryAngle />}
        {activeTab === 'triangle' && <SolvingTriangle />}
        {activeTab === 'vector' && <VectorDisplay />}
        {activeTab === 'addition' && <VectorAddition />}
        {activeTab === 'dot' && <VectorDotProduct />}
        {activeTab === 'benz' && <BenzTheorem />}
        {activeTab === 'exam' && <ExamTraining />}
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

