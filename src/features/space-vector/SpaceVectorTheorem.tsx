import { useState } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { useSpaceVectorStore } from '@/store/useSpaceVectorStore';
import { math3DToScreen } from '@/utils/coordinate3';
import { add3, scale3, areCoplanar3, divisionPoint3, formatVector3 } from '@/math/vector3';
import type { Vector3 } from '@/types/vector3';

export function SpaceVectorTheorem() {
  const { vectors, setVector } = useSpaceVectorStore();

  const [mode, setMode] = useState<'basis' | 'coplanar' | 'division'>('basis');

  // Vector initializations based on mode
  const v: Vector3 = vectors['v'] || { x: 4, y: 5, z: 3 }; // For basis
  
  // For coplanar
  const ca: Vector3 = vectors['ca'] || { x: 4, y: 0, z: 0 };
  const cb: Vector3 = vectors['cb'] || { x: 0, y: 4, z: 0 };
  const [scalarA, setScalarA] = useState(1);
  const [scalarB, setScalarB] = useState(1);
  // Optional arbitrary third vector to test non-coplanar
  const cc: Vector3 = vectors['cc'] || { x: 2, y: 2, z: 4 };
  const [isTestCoplanar, setIsTestCoplanar] = useState(false);

  // For division
  const pA: Vector3 = vectors['pA'] || { x: 2, y: 1, z: 1 };
  const pB: Vector3 = vectors['pB'] || { x: 6, y: 5, z: 7 };
  const [ratioM, setRatioM] = useState(1);
  const [ratioN, setRatioN] = useState(1);

  const handleVectorChange = (id: string, axis: 'x' | 'y' | 'z', value: number) => {
    let def: Vector3 = { x: 0, y: 0, z: 0 };
    if (id === 'v') def = { x: 4, y: 5, z: 3 };
    if (id === 'ca') def = { x: 4, y: 0, z: 0 };
    if (id === 'cb') def = { x: 0, y: 4, z: 0 };
    if (id === 'cc') def = { x: 2, y: 2, z: 4 };
    if (id === 'pA') def = { x: 2, y: 1, z: 1 };
    if (id === 'pB') def = { x: 6, y: 5, z: 7 };
    const curr = vectors[id] || def;
    setVector(id, { ...curr, [axis]: value });
  };

  const svgParams = { width: 600, height: 600, unitPx: 30 };
  const originScreen = math3DToScreen({ x: 0, y: 0, z: 0 }, svgParams);
  const xAxisScreen = math3DToScreen({ x: 8.5, y: 0, z: 0 }, svgParams);
  const yAxisScreen = math3DToScreen({ x: 0, y: 8.5, z: 0 }, svgParams);
  const zAxisScreen = math3DToScreen({ x: 0, y: 0, z: 8.5 }, svgParams);

  const renderAxes = () => (
    <>
      <marker id="arrow-axis" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 z" fill="#334155" />
      </marker>
      <line x1={originScreen.x} y1={originScreen.y} x2={xAxisScreen.x} y2={xAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-axis)" />
      <line x1={originScreen.x} y1={originScreen.y} x2={yAxisScreen.x} y2={yAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-axis)" />
      <line x1={originScreen.x} y1={originScreen.y} x2={zAxisScreen.x} y2={zAxisScreen.y} stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-axis)" />
      <text x={xAxisScreen.x - 15} y={xAxisScreen.y + 15} fill="#94a3b8" fontSize="14" fontWeight="bold">x</text>
      <text x={yAxisScreen.x + 15} y={yAxisScreen.y + 15} fill="#94a3b8" fontSize="14" fontWeight="bold">y</text>
      <text x={zAxisScreen.x} y={zAxisScreen.y - 10} fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">z</text>
    </>
  );

  let leftPanel, centerPanel, rightPanel;

  if (mode === 'basis') {
    const vScreen = math3DToScreen(v, svgParams);
    const vxScreen = math3DToScreen({ x: v.x, y: 0, z: 0 }, svgParams);
    const vyScreen = math3DToScreen({ x: 0, y: v.y, z: 0 }, svgParams);
    const vzScreen = math3DToScreen({ x: 0, y: 0, z: v.z }, svgParams);

    leftPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="control-group">
          <h3 className="control-title">空间向量基本定理</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            任意空间向量都可以表示为三个不共面基底向量的线性组合。在此演示中，使用标准正交基 i, j, k。
          </p>
          <label className="control-label">切换定理模式</label>
          <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', marginBottom: '16px' }}>
            <option value="basis">空间向量基底分解</option>
            <option value="coplanar">共面向量定理</option>
            <option value="division">定比分点公式</option>
          </select>
        </div>
        <div className="control-group">
          <h4 className="control-title" style={{ color: '#60a5fa' }}>目标向量 v</h4>
          {['x', 'y', 'z'].map(axis => (
            <div key={`v-${axis}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '20px', color: '#94a3b8' }}>{axis.toUpperCase()}</span>
              <input type="range" min="-8" max="8" step="1" value={(v as any)[axis]} onChange={e => handleVectorChange('v', axis as any, parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ width: '24px', textAlign: 'right' }}>{(v as any)[axis]}</span>
            </div>
          ))}
        </div>
      </div>
    );

    centerPanel = (
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${svgParams.width} ${svgParams.height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow-v" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#60a5fa" /></marker>
            <marker id="arrow-vx" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" /></marker>
            <marker id="arrow-vy" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#22c55e" /></marker>
            <marker id="arrow-vz" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#3b82f6" /></marker>
          </defs>
          {renderAxes()}
          {/* 分解虚线框 */}
          <path d={`M ${originScreen.x} ${originScreen.y} L ${vxScreen.x} ${vxScreen.y} L ${math3DToScreen({x:v.x,y:v.y,z:0}, svgParams).x} ${math3DToScreen({x:v.x,y:v.y,z:0}, svgParams).y} L ${vyScreen.x} ${vyScreen.y} Z`} fill="transparent" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={math3DToScreen({x:v.x,y:v.y,z:0}, svgParams).x} y1={math3DToScreen({x:v.x,y:v.y,z:0}, svgParams).y} x2={vScreen.x} y2={vScreen.y} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          
          <line x1={originScreen.x} y1={originScreen.y} x2={vxScreen.x} y2={vxScreen.y} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-vx)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={vyScreen.x} y2={vyScreen.y} stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrow-vy)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={vzScreen.x} y2={vzScreen.y} stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-vz)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={vScreen.x} y2={vScreen.y} stroke="#60a5fa" strokeWidth="3" markerEnd="url(#arrow-v)" />
          <text x={vScreen.x + 10} y={vScreen.y} fill="#60a5fa" fontSize="16" fontWeight="bold">v</text>
        </svg>
      </div>
    );

    rightPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="math-card">
          <h4 className="math-card-title">基底线性组合</h4>
          <div className="math-card-content">
            <div style={{ fontSize: '18px', textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#60a5fa' }}>v</span> = <span style={{ color: '#ef4444' }}>x</span> i + <span style={{ color: '#22c55e' }}>y</span> j + <span style={{ color: '#3b82f6' }}>z</span> k
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#ef4444' }}>x = {v.x}</span>
              <span style={{ color: '#22c55e' }}>y = {v.y}</span>
              <span style={{ color: '#3b82f6' }}>z = {v.z}</span>
            </div>
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
              其中 i, j, k 为 x, y, z 轴上的单位正交基底。任何空间向量都可以唯一地表示为这三个基底的线性组合。
            </p>
          </div>
        </div>
      </div>
    );
  } else if (mode === 'coplanar') {
    const coplanarResult = add3(scale3(ca, scalarA), scale3(cb, scalarB));
    const targetVector = isTestCoplanar ? cc : coplanarResult;
    const isCoplanar = areCoplanar3(ca, cb, targetVector);

    const caScreen = math3DToScreen(ca, svgParams);
    const cbScreen = math3DToScreen(cb, svgParams);
    const targetScreen = math3DToScreen(targetVector, svgParams);

    leftPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="control-group">
          <h3 className="control-title">共面向量定理</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            若 p = x·a + y·b，则 p, a, b 共面。反之，若三向量共面且 a, b 不共线，则必存在唯一实数对 (x,y)。
          </p>
          <label className="control-label">切换定理模式</label>
          <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', marginBottom: '16px' }}>
            <option value="basis">空间向量基底分解</option>
            <option value="coplanar">共面向量定理</option>
            <option value="division">定比分点公式</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={isTestCoplanar} onChange={e => setIsTestCoplanar(e.target.checked)} />
            测试任意向量 c (判定是否与 a,b 共面)
          </label>
        </div>

        {!isTestCoplanar ? (
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#fbbf24' }}>标量调节 (p = x·a + y·b)</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '20px', color: '#94a3b8' }}>x</span>
              <input type="range" min="-3" max="3" step="0.5" value={scalarA} onChange={e => setScalarA(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ width: '24px', textAlign: 'right' }}>{scalarA}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', color: '#94a3b8' }}>y</span>
              <input type="range" min="-3" max="3" step="0.5" value={scalarB} onChange={e => setScalarB(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ width: '24px', textAlign: 'right' }}>{scalarB}</span>
            </div>
          </div>
        ) : (
          <div className="control-group">
            <h4 className="control-title" style={{ color: '#fbbf24' }}>目标向量 c</h4>
            {['x', 'y', 'z'].map(axis => (
              <div key={`cc-${axis}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '20px', color: '#94a3b8' }}>{axis.toUpperCase()}</span>
                <input type="range" min="-8" max="8" step="1" value={(cc as any)[axis]} onChange={e => handleVectorChange('cc', axis as any, parseFloat(e.target.value))} style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );

    centerPanel = (
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${svgParams.width} ${svgParams.height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow-ca" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#34d399" /></marker>
            <marker id="arrow-cb" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#c084fc" /></marker>
            <marker id="arrow-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#fbbf24" /></marker>
          </defs>
          {renderAxes()}
          {!isTestCoplanar && (
            <>
              <line x1={math3DToScreen(scale3(ca, scalarA), svgParams).x} y1={math3DToScreen(scale3(ca, scalarA), svgParams).y} x2={targetScreen.x} y2={targetScreen.y} stroke="#475569" strokeDasharray="5 5" />
              <line x1={math3DToScreen(scale3(cb, scalarB), svgParams).x} y1={math3DToScreen(scale3(cb, scalarB), svgParams).y} x2={targetScreen.x} y2={targetScreen.y} stroke="#475569" strokeDasharray="5 5" />
            </>
          )}
          
          <line x1={originScreen.x} y1={originScreen.y} x2={caScreen.x} y2={caScreen.y} stroke="#34d399" strokeWidth="3" markerEnd="url(#arrow-ca)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={cbScreen.x} y2={cbScreen.y} stroke="#c084fc" strokeWidth="3" markerEnd="url(#arrow-cb)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={targetScreen.x} y2={targetScreen.y} stroke="#fbbf24" strokeWidth="3" markerEnd="url(#arrow-p)" />
          <text x={caScreen.x + 10} y={caScreen.y} fill="#34d399" fontSize="14">a</text>
          <text x={cbScreen.x + 10} y={cbScreen.y} fill="#c084fc" fontSize="14">b</text>
          <text x={targetScreen.x + 10} y={targetScreen.y} fill="#fbbf24" fontSize="14" fontWeight="bold">{isTestCoplanar ? 'c' : 'p'}</text>
        </svg>
      </div>
    );

    rightPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="math-card">
          <h4 className="math-card-title">共面判定结果</h4>
          <div className="math-card-content">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: isCoplanar ? '#34d399' : '#ef4444', textAlign: 'center', marginBottom: '8px' }}>
              {isCoplanar ? '共面' : '不共面'}
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              利用混合积 (a × b) · p 计算体积，若体积为 0 则三向量共面。
            </p>
          </div>
        </div>
        {!isTestCoplanar && (
          <div className="math-card">
            <h4 className="math-card-title">线性组合表达</h4>
            <div className="math-card-content">
              <div style={{ color: '#fbbf24', fontSize: '16px' }}>
                p = {scalarA} a + {scalarB} b
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
                p = {formatVector3(targetVector)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // Division point
    const pMid = divisionPoint3(pA, pB, ratioM, ratioN);
    const paScreen = math3DToScreen(pA, svgParams);
    const pbScreen = math3DToScreen(pB, svgParams);
    const pmScreen = math3DToScreen(pMid, svgParams);

    leftPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="control-group">
          <h3 className="control-title">定比分点公式</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            若点 P 分线段 AB 为定比 m:n，即 AP:PB = m:n，则 P = (n·A + m·B) / (m + n)。
          </p>
          <label className="control-label">切换定理模式</label>
          <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', marginBottom: '16px' }}>
            <option value="basis">空间向量基底分解</option>
            <option value="coplanar">共面向量定理</option>
            <option value="division">定比分点公式</option>
          </select>
        </div>
        <div className="control-group">
          <h4 className="control-title" style={{ color: '#fbbf24' }}>定比 m : n</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '20px', color: '#94a3b8' }}>m</span>
            <input type="range" min="1" max="5" step="1" value={ratioM} onChange={e => setRatioM(parseInt(e.target.value))} style={{ flex: 1 }} />
            <span style={{ width: '24px', textAlign: 'right' }}>{ratioM}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', color: '#94a3b8' }}>n</span>
            <input type="range" min="1" max="5" step="1" value={ratioN} onChange={e => setRatioN(parseInt(e.target.value))} style={{ flex: 1 }} />
            <span style={{ width: '24px', textAlign: 'right' }}>{ratioN}</span>
          </div>
        </div>
        <div className="control-group">
          <h4 className="control-title" style={{ color: '#34d399' }}>端点 B</h4>
          {['x', 'y', 'z'].map(axis => (
            <div key={`pB-${axis}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '20px', color: '#94a3b8' }}>{axis.toUpperCase()}</span>
              <input type="range" min="-8" max="8" step="1" value={(pB as any)[axis]} onChange={e => handleVectorChange('pB', axis as any, parseFloat(e.target.value))} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </div>
    );

    centerPanel = (
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${svgParams.width} ${svgParams.height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow-pa" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#60a5fa" /></marker>
            <marker id="arrow-pb" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#34d399" /></marker>
            <marker id="arrow-pm" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="#fbbf24" /></marker>
          </defs>
          {renderAxes()}
          {/* 线段 AB */}
          <line x1={paScreen.x} y1={paScreen.y} x2={pbScreen.x} y2={pbScreen.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
          
          <line x1={originScreen.x} y1={originScreen.y} x2={paScreen.x} y2={paScreen.y} stroke="#60a5fa" strokeWidth="2" markerEnd="url(#arrow-pa)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={pbScreen.x} y2={pbScreen.y} stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-pb)" />
          <line x1={originScreen.x} y1={originScreen.y} x2={pmScreen.x} y2={pmScreen.y} stroke="#fbbf24" strokeWidth="3" markerEnd="url(#arrow-pm)" />
          
          <circle cx={paScreen.x} cy={paScreen.y} r="4" fill="#60a5fa" />
          <text x={paScreen.x + 8} y={paScreen.y - 8} fill="#60a5fa" fontSize="14">A</text>
          
          <circle cx={pbScreen.x} cy={pbScreen.y} r="4" fill="#34d399" />
          <text x={pbScreen.x + 8} y={pbScreen.y - 8} fill="#34d399" fontSize="14">B</text>
          
          <circle cx={pmScreen.x} cy={pmScreen.y} r="5" fill="#fbbf24" />
          <text x={pmScreen.x + 8} y={pmScreen.y - 8} fill="#fbbf24" fontSize="14" fontWeight="bold">P</text>
        </svg>
      </div>
    );

    rightPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="math-card">
          <h4 className="math-card-title">定比分点位置 P</h4>
          <div className="math-card-content">
            <div style={{ color: '#fbbf24', fontSize: '16px', marginBottom: '8px' }}>
              P = {formatVector3(pMid)}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '8px' }}>
              A = {formatVector3(pA)}<br />
              B = {formatVector3(pB)}<br />
              m:n = {ratioM} : {ratioN}
            </div>
          </div>
        </div>
        <div className="math-card">
          <h4 className="math-card-title">分点公式</h4>
          <div className="math-card-content">
            <div style={{ fontSize: '14px', color: '#f8fafc', textAlign: 'center' }}>
              P = ({ratioN}·A + {ratioM}·B) / ({ratioM + ratioN})
            </div>
            {ratioM === ratioN && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#34d399', textAlign: 'center' }}>
                此时 P 为线段 AB 的中点
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />;
}
