
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { useSpaceVectorStore } from '@/store/useSpaceVectorStore';
import { math3DToScreen } from '@/utils/coordinate3';
import { magnitude3, directionCosines, dot3, formatVector3 } from '@/math/vector3';
import type { Vector3 } from '@/types/vector3';

export function SpaceVectorCoord() {
  const { vectors, setVector } = useSpaceVectorStore();

  // Initialize a and b if they don't exist
  const a: Vector3 = vectors['a'] || { x: 3, y: 4, z: 2 };
  const b: Vector3 = vectors['b'] || { x: 2, y: 1, z: 4 };

  const handleVectorChange = (id: string, axis: 'x' | 'y' | 'z', value: number) => {
    const v = vectors[id] || (id === 'a' ? { x: 3, y: 4, z: 2 } : { x: 2, y: 1, z: 4 });
    setVector(id, { ...v, [axis]: value });
  };

  // Center SVG params
  const svgParams = { width: 600, height: 600, unitPx: 30 };

  const originScreen = math3DToScreen({ x: 0, y: 0, z: 0 }, svgParams);
  const xAxisScreen = math3DToScreen({ x: 8.5, y: 0, z: 0 }, svgParams);
  const yAxisScreen = math3DToScreen({ x: 0, y: 8.5, z: 0 }, svgParams);
  const zAxisScreen = math3DToScreen({ x: 0, y: 0, z: 8.5 }, svgParams);

  const aScreen = math3DToScreen(a, svgParams);
  const bScreen = math3DToScreen(b, svgParams);

  // Projections for vector a to show coordinates
  const aXProj = math3DToScreen({ x: a.x, y: 0, z: 0 }, svgParams);
  const aYProj = math3DToScreen({ x: 0, y: a.y, z: 0 }, svgParams);
  const aZProj = math3DToScreen({ x: 0, y: 0, z: a.z }, svgParams);
  const aXYProj = math3DToScreen({ x: a.x, y: a.y, z: 0 }, svgParams);
  const aXZProj = math3DToScreen({ x: a.x, y: 0, z: a.z }, svgParams);

  const aMag = magnitude3(a);
  const aDirCosines = directionCosines(a);
  const abDot = dot3(a, b);

  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="control-group">
        <h3 className="control-title">空间向量坐标表示</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
          通过改变向量的 x, y, z 坐标，观察其在三维空间中的位置变化。同时展示模长、方向余弦和点积运算。
        </p>
      </div>

      <div className="control-group">
        <h4 className="control-title" style={{ color: '#60a5fa' }}>向量 a {formatVector3(a)}</h4>
        {['x', 'y', 'z'].map(axis => (
          <div key={`a-${axis}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '20px', color: '#94a3b8' }}>{axis.toUpperCase()}</span>
            <input 
              type="range" min="-10" max="10" step="1" 
              value={(a as any)[axis]} 
              onChange={e => handleVectorChange('a', axis as any, parseFloat(e.target.value))} 
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>

      <div className="control-group">
        <h4 className="control-title" style={{ color: '#34d399' }}>向量 b {formatVector3(b)}</h4>
        {['x', 'y', 'z'].map(axis => (
          <div key={`b-${axis}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '20px', color: '#94a3b8' }}>{axis.toUpperCase()}</span>
            <input 
              type="range" min="-10" max="10" step="1" 
              value={(b as any)[axis]} 
              onChange={e => handleVectorChange('b', axis as any, parseFloat(e.target.value))} 
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const centerPanel = (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${svgParams.width} ${svgParams.height}`} 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arrow-x" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#334155" />
          </marker>
          <marker id="arrow-y" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#334155" />
          </marker>
          <marker id="arrow-z" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#334155" />
          </marker>
          <marker id="arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#60a5fa" />
          </marker>
          <marker id="arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#34d399" />
          </marker>
        </defs>

        {/* 坐标轴 */}
        <line x1={originScreen.x} y1={originScreen.y} x2={xAxisScreen.x} y2={xAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-x)" />
        <line x1={originScreen.x} y1={originScreen.y} x2={yAxisScreen.x} y2={yAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-y)" />
        <line x1={originScreen.x} y1={originScreen.y} x2={zAxisScreen.x} y2={zAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-z)" />
        
        <text x={xAxisScreen.x - 15} y={xAxisScreen.y + 15} fill="#94a3b8" fontSize="14" fontWeight="bold">x</text>
        <text x={yAxisScreen.x + 15} y={yAxisScreen.y + 15} fill="#94a3b8" fontSize="14" fontWeight="bold">y</text>
        <text x={zAxisScreen.x} y={zAxisScreen.y - 10} fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">z</text>

        {/* 辅助线 - 向量 a 的坐标投影长方体 */}
        <path 
          d={`M ${originScreen.x} ${originScreen.y} L ${aXProj.x} ${aXProj.y} L ${aXZProj.x} ${aXZProj.y} L ${aZProj.x} ${aZProj.y} Z`} 
          fill="transparent" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" 
        />
        <line x1={aXZProj.x} y1={aXZProj.y} x2={aScreen.x} y2={aScreen.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <line x1={aXProj.x} y1={aXProj.y} x2={aXYProj.x} y2={aXYProj.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <line x1={originScreen.x} y1={originScreen.y} x2={aYProj.x} y2={aYProj.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <line x1={aYProj.x} y1={aYProj.y} x2={aXYProj.x} y2={aXYProj.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <line x1={aXYProj.x} y1={aXYProj.y} x2={aScreen.x} y2={aScreen.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <line x1={aZProj.x} y1={aZProj.y} x2={aScreen.x} y2={aScreen.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

        {/* 向量 a */}
        <line x1={originScreen.x} y1={originScreen.y} x2={aScreen.x} y2={aScreen.y} stroke="#60a5fa" strokeWidth="3" markerEnd="url(#arrow-a)" />
        <text x={aScreen.x + 10} y={aScreen.y} fill="#60a5fa" fontSize="14" fontWeight="bold">a</text>

        {/* 向量 b */}
        <line x1={originScreen.x} y1={originScreen.y} x2={bScreen.x} y2={bScreen.y} stroke="#34d399" strokeWidth="3" markerEnd="url(#arrow-b)" />
        <text x={bScreen.x + 10} y={bScreen.y} fill="#34d399" fontSize="14" fontWeight="bold">b</text>

      </svg>
    </div>
  );

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="math-card">
        <h4 className="math-card-title">向量 a 的模长</h4>
        <div className="math-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#60a5fa' }}>|a| = √(x² + y² + z²)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
            <span style={{ color: '#f8fafc' }}>{aMag.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <div className="math-card">
        <h4 className="math-card-title">向量 a 的方向余弦</h4>
        <div className="math-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>cos α (与 x 轴):</span>
            <span style={{ color: '#f8fafc' }}>{aDirCosines[0].toFixed(3)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>cos β (与 y 轴):</span>
            <span style={{ color: '#f8fafc' }}>{aDirCosines[1].toFixed(3)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>cos γ (与 z 轴):</span>
            <span style={{ color: '#f8fafc' }}>{aDirCosines[2].toFixed(3)}</span>
          </div>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #334155', paddingTop: '8px' }}>
            验证: cos²α + cos²β + cos²γ = 1
          </p>
        </div>
      </div>

      <div className="math-card">
        <h4 className="math-card-title" style={{ color: '#fbbf24' }}>点积 a · b</h4>
        <div className="math-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>x₁x₂ + y₁y₂ + z₁z₂:</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
            <span style={{ color: '#fbbf24' }}>{abDot.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />
  );
}
