import React, { useState } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { useSpaceVectorStore } from '@/store/useSpaceVectorStore';
import { math3DToScreen } from '@/utils/coordinate3';
import { add3, sub3, scale3, areParallel3, magnitude3, formatVector3 } from '@/math/vector3';
import type { Vector3 } from '@/types/vector3';

export function SpaceVectorBasic() {
  const { vectors, setVector } = useSpaceVectorStore();

  // Initialize a and b if they don't exist
  const a: Vector3 = vectors['a'] || { x: 3, y: 4, z: 2 };
  const b: Vector3 = vectors['b'] || { x: 2, y: 1, z: 4 };

  const [scalar, setScalar] = useState(2);
  const [operation, setOperation] = useState<'add' | 'sub' | 'scale'>('add');

  const handleVectorChange = (id: string, axis: 'x' | 'y' | 'z', value: number) => {
    const v = vectors[id] || (id === 'a' ? { x: 3, y: 4, z: 2 } : { x: 2, y: 1, z: 4 });
    setVector(id, { ...v, [axis]: value });
  };

  // Center SVG params
  const svgParams = { width: 600, height: 600, unitPx: 30 };

  const originScreen = math3DToScreen({ x: 0, y: 0, z: 0 }, svgParams);
  const xAxisScreen = math3DToScreen({ x: 10, y: 0, z: 0 }, svgParams);
  const yAxisScreen = math3DToScreen({ x: 0, y: 10, z: 0 }, svgParams);
  const zAxisScreen = math3DToScreen({ x: 0, y: 0, z: 10 }, svgParams);

  const aScreen = math3DToScreen(a, svgParams);
  const bScreen = math3DToScreen(b, svgParams);

  let result: Vector3;
  if (operation === 'add') result = add3(a, b);
  else if (operation === 'sub') result = sub3(a, b);
  else result = scale3(a, scalar);

  const resultScreen = math3DToScreen(result, svgParams);

  const isCollinear = areParallel3(a, b);

  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="control-group">
        <h3 className="control-title">空间向量线性运算</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
          体验三维空间中向量的加法（平行四边形法则）、减法法则与数乘，观察在等轴测投影下的几何意义。
        </p>

        <label className="control-label">操作类型</label>
        <select 
          value={operation} 
          onChange={e => setOperation(e.target.value as any)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', marginBottom: '16px' }}
        >
          <option value="add">加法 (a + b)</option>
          <option value="sub">减法 (a - b)</option>
          <option value="scale">数乘 (s * a)</option>
        </select>
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

      {operation !== 'scale' && (
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
      )}

      {operation === 'scale' && (
        <div className="control-group">
          <h4 className="control-title" style={{ color: '#c084fc' }}>标量 s = {scalar}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="range" min="-5" max="5" step="0.5" 
              value={scalar} 
              onChange={e => setScalar(parseFloat(e.target.value))} 
              style={{ flex: 1 }}
            />
          </div>
        </div>
      )}
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
          <marker id="arrow-result" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#fbbf24" />
          </marker>
        </defs>

        {/* 坐标轴 */}
        <line x1={originScreen.x} y1={originScreen.y} x2={xAxisScreen.x} y2={xAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-x)" />
        <line x1={originScreen.x} y1={originScreen.y} x2={yAxisScreen.x} y2={yAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-y)" />
        <line x1={originScreen.x} y1={originScreen.y} x2={zAxisScreen.x} y2={zAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-z)" />
        
        <text x={xAxisScreen.x + 10} y={xAxisScreen.y} fill="#94a3b8" fontSize="14" fontWeight="bold">x</text>
        <text x={yAxisScreen.x} y={yAxisScreen.y - 10} fill="#94a3b8" fontSize="14" fontWeight="bold">y</text>
        <text x={zAxisScreen.x - 15} y={zAxisScreen.y + 10} fill="#94a3b8" fontSize="14" fontWeight="bold">z</text>

        {/* 辅助线 - 平行四边形法则 */}
        {operation === 'add' && (
          <>
            <line x1={aScreen.x} y1={aScreen.y} x2={resultScreen.x} y2={resultScreen.y} stroke="#34d399" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
            <line x1={bScreen.x} y1={bScreen.y} x2={resultScreen.x} y2={resultScreen.y} stroke="#60a5fa" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
          </>
        )}

        {/* 辅助线 - 减法法则 (a - b) */}
        {operation === 'sub' && (
          <>
            <line x1={bScreen.x} y1={bScreen.y} x2={aScreen.x} y2={aScreen.y} stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
          </>
        )}

        {/* 向量 a */}
        <line x1={originScreen.x} y1={originScreen.y} x2={aScreen.x} y2={aScreen.y} stroke="#60a5fa" strokeWidth="3" markerEnd="url(#arrow-a)" />
        <text x={aScreen.x + 10} y={aScreen.y} fill="#60a5fa" fontSize="14" fontWeight="bold">a</text>

        {/* 向量 b */}
        {operation !== 'scale' && (
          <>
            <line x1={originScreen.x} y1={originScreen.y} x2={bScreen.x} y2={bScreen.y} stroke="#34d399" strokeWidth="3" markerEnd="url(#arrow-b)" />
            <text x={bScreen.x + 10} y={bScreen.y} fill="#34d399" fontSize="14" fontWeight="bold">b</text>
          </>
        )}

        {/* 结果向量 */}
        <line x1={originScreen.x} y1={originScreen.y} x2={resultScreen.x} y2={resultScreen.y} stroke="#fbbf24" strokeWidth="3" markerEnd="url(#arrow-result)" />
        <text x={resultScreen.x + 10} y={resultScreen.y + 10} fill="#fbbf24" fontSize="14" fontWeight="bold">
          {operation === 'add' ? 'a+b' : operation === 'sub' ? 'a-b' : 's·a'}
        </text>

      </svg>
    </div>
  );

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="math-card">
        <h4 className="math-card-title">向量属性</h4>
        <div className="math-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#60a5fa' }}>|a| =</span>
            <span>{magnitude3(a).toFixed(2)}</span>
          </div>
          {operation !== 'scale' && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#34d399' }}>|b| =</span>
              <span>{magnitude3(b).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="math-card">
        <h4 className="math-card-title" style={{ color: '#fbbf24' }}>
          运算结果: {operation === 'add' ? 'a + b' : operation === 'sub' ? 'a - b' : `s × a`}
        </h4>
        <div className="math-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>坐标:</span>
            <span>{formatVector3(result)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>模长:</span>
            <span>{magnitude3(result).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {operation !== 'scale' && (
        <div className="math-card">
          <h4 className="math-card-title">几何共线判定</h4>
          <div className="math-card-content">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>a // b (平行):</span>
              <span style={{ color: isCollinear ? '#34d399' : '#ef4444' }}>{isCollinear ? '是' : '否'}</span>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              通过判定外积 |a × b| ≈ 0 验证
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />
  );
}
