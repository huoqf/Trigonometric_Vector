import { useState, useMemo, useRef } from 'react';
import { ThreeScreenLayout } from '@/components/common/ThreeScreenLayout';
import { mathToScreen, screenToMath } from '@/utils/coordinate';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { Vector2 } from '@/types/math';

const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 400;
const UNIT_PX = 30;

function crossProduct(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.y - v1.y * v2.x;
}

export function BenzTheorem() {
  const [ptA, setPtA] = useState<Vector2>({ x: 0.0, y: 4.0 });
  const [ptB, setPtB] = useState<Vector2>({ x: -4.0, y: -2.0 });
  const [ptC, setPtC] = useState<Vector2>({ x: 4.0, y: -2.0 });
  const [ptP, setPtP] = useState<Vector2>({ x: 0.0, y: 0.0 });

  const [draggedVertex, setDraggedVertex] = useState<'A' | 'B' | 'C' | 'P' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const coordParams = { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, unitPx: UNIT_PX };

  const pxA = useMemo(() => mathToScreen(ptA, coordParams), [ptA]);
  const pxB = useMemo(() => mathToScreen(ptB, coordParams), [ptB]);
  const pxC = useMemo(() => mathToScreen(ptC, coordParams), [ptC]);
  const pxP = useMemo(() => mathToScreen(ptP, coordParams), [ptP]);

  const geom = useMemo(() => {
    const AB = { x: ptB.x - ptA.x, y: ptB.y - ptA.y };
    const AC = { x: ptC.x - ptA.x, y: ptC.y - ptA.y };
    const areaABC = 0.5 * crossProduct(AB, AC);

    const PB = { x: ptB.x - ptP.x, y: ptB.y - ptP.y };
    const PC = { x: ptC.x - ptP.x, y: ptC.y - ptP.y };
    const areaPBC = 0.5 * crossProduct(PB, PC);

    const PA = { x: ptA.x - ptP.x, y: ptA.y - ptP.y };
    const areaPCA = 0.5 * crossProduct(PC, PA);

    const areaPAB = 0.5 * crossProduct(PA, PB);

    return {
      SA: areaPBC,
      SB: areaPCA,
      SC: areaPAB,
      SABC: areaABC,
      PA, PB, PC
    };
  }, [ptA, ptB, ptC, ptP]);

  const gridElements = useMemo(() => {
    const lines = [];
    const cx = CONTAINER_WIDTH / 2;
    const cy = CONTAINER_HEIGHT / 2;

    lines.push(<line key="axis-x" x1={0} y1={cy} x2={CONTAINER_WIDTH} y2={cy} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />);
    lines.push(<line key="axis-y" x1={cx} y1={0} x2={cx} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />);

    const xMax = Math.ceil(CONTAINER_WIDTH / 2 / UNIT_PX);
    for (let x = -xMax; x <= xMax; x++) {
      if (x === 0) continue;
      const pt = mathToScreen({ x, y: 0 }, coordParams);
      lines.push(<line key={`grid-x-${x}`} x1={pt.x} y1={0} x2={pt.x} y2={CONTAINER_HEIGHT} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />);
    }

    const yMax = Math.ceil(CONTAINER_HEIGHT / 2 / UNIT_PX);
    for (let y = -yMax; y <= yMax; y++) {
      if (y === 0) continue;
      const pt = mathToScreen({ x: 0, y }, coordParams);
      lines.push(<line key={`grid-y-${y}`} x1={0} y1={pt.y} x2={CONTAINER_WIDTH} y2={pt.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />);
    }
    return lines;
  }, []);

  const handlePointerDown = (vertex: 'A' | 'B' | 'C' | 'P', e: React.PointerEvent<SVGCircleElement>) => {
    e.stopPropagation();
    setDraggedVertex(vertex);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedVertex || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const mathPt = screenToMath({ x: clientX, y: clientY }, coordParams);
    const clampedX = Math.max(-9.5, Math.min(9.5, mathPt.x));
    const clampedY = Math.max(-6.2, Math.min(6.2, mathPt.y));
    const newPt = { x: clampedX, y: clampedY };

    if (draggedVertex === 'P') {
      setPtP(newPt);
    } else {
      let pts = { A: ptA, B: ptB, C: ptC };
      pts[draggedVertex] = newPt;
      
      const AB = { x: pts.B.x - pts.A.x, y: pts.B.y - pts.A.y };
      const AC = { x: pts.C.x - pts.A.x, y: pts.C.y - pts.A.y };
      const area = 0.5 * crossProduct(AB, AC);
      
      if (Math.abs(area) > 1.5) {
        if (draggedVertex === 'A') setPtA(newPt);
        else if (draggedVertex === 'B') setPtB(newPt);
        else if (draggedVertex === 'C') setPtC(newPt);
      }
    }
  };

  const handlePointerUp = () => {
    setDraggedVertex(null);
  };

  const setCenter = (type: 'centroid' | 'orthocenter' | 'circumcenter' | 'incenter') => {
    if (type === 'centroid') {
      setPtP({
        x: (ptA.x + ptB.x + ptC.x) / 3,
        y: (ptA.y + ptB.y + ptC.y) / 3
      });
    } else if (type === 'incenter') {
      const a = Math.hypot(ptB.x - ptC.x, ptB.y - ptC.y);
      const b = Math.hypot(ptA.x - ptC.x, ptA.y - ptC.y);
      const c = Math.hypot(ptA.x - ptB.x, ptA.y - ptB.y);
      const p = a + b + c;
      setPtP({
        x: (a * ptA.x + b * ptB.x + c * ptC.x) / p,
        y: (a * ptA.y + b * ptB.y + c * ptC.y) / p
      });
    }
  };

  const leftPanel = (
    <div style={styles.sidebar}>
      <h3 style={styles.panelTitle}>奔驰定理实验</h3>
      <div style={styles.controlGroup}>
        <div style={{ ...styles.labelRow, fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>
          <span>说明</span>
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
          拖动三角形顶点 A, B, C 或内部动点 P。<br/><br/>
          奔驰定理（Benz Theorem）：对于平面上任意一点 P 和非退化三角形 ABC，三个子三角形的有向面积与其对应引出的向量构成的线性组合始终为零向量。
        </div>
      </div>

      <div style={styles.controlGroup}>
        <div style={{ ...styles.labelRow, fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa' }}>
          <span>特殊点预设</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          <button onClick={() => setCenter('centroid')} style={styles.templateButton}>重心 (面积比 1:1:1)</button>
          <button onClick={() => setCenter('incenter')} style={styles.templateButton}>内心 (面积比 a:b:c)</button>
        </div>
      </div>
    </div>
  );

  const centerPanel = (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasHeader}>
        <span style={styles.canvasTitle}>动点 P 与三角形交互</span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>任意拖动 A、B、C 及 P</span>
      </div>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block', backgroundColor: '#020617', touchAction: 'none' }}
      >
        {gridElements}

        <polygon points={`${pxP.x},${pxP.y} ${pxB.x},${pxB.y} ${pxC.x},${pxC.y}`} fill="rgba(236, 72, 153, 0.2)" stroke="none" />
        <polygon points={`${pxP.x},${pxP.y} ${pxC.x},${pxC.y} ${pxA.x},${pxA.y}`} fill="rgba(56, 189, 248, 0.2)" stroke="none" />
        <polygon points={`${pxP.x},${pxP.y} ${pxA.x},${pxA.y} ${pxB.x},${pxB.y}`} fill="rgba(16, 185, 129, 0.2)" stroke="none" />

        <polygon points={`${pxA.x},${pxA.y} ${pxB.x},${pxB.y} ${pxC.x},${pxC.y}`} fill="none" stroke="#6366f1" strokeWidth={2} />

        <line x1={pxP.x} y1={pxP.y} x2={pxA.x} y2={pxA.y} stroke="#ec4899" strokeWidth={1.5} strokeDasharray="3 3"/>
        <line x1={pxP.x} y1={pxP.y} x2={pxB.x} y2={pxB.y} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3"/>
        <line x1={pxP.x} y1={pxP.y} x2={pxC.x} y2={pxC.y} stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3"/>

        <circle cx={pxA.x} cy={pxA.y} r={7} fill="#ec4899" stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onPointerDown={(e) => handlePointerDown('A', e)} />
        <circle cx={pxB.x} cy={pxB.y} r={7} fill="#38bdf8" stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onPointerDown={(e) => handlePointerDown('B', e)} />
        <circle cx={pxC.x} cy={pxC.y} r={7} fill="#10b981" stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onPointerDown={(e) => handlePointerDown('C', e)} />
        <circle cx={pxP.x} cy={pxP.y} r={8} fill="#f59e0b" stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onPointerDown={(e) => handlePointerDown('P', e)} />
        
        <text x={pxA.x} y={pxA.y - 12} fill="#ec4899" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>
        <text x={pxB.x} y={pxB.y - 12} fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">B</text>
        <text x={pxC.x} y={pxC.y - 12} fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">C</text>
        <text x={pxP.x} y={pxP.y - 12} fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle">P</text>
      </svg>
    </div>
  );

  const rightPanel = (
    <div style={styles.sidebar}>
      <h3 style={{ ...styles.panelTitle, color: '#c084fc' }}>有向面积与向量代数</h3>

      <div style={styles.card}>
        <div style={styles.cardHeader}>子三角形有向面积 (S)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={styles.calcRow}>
            <span style={{ color: '#ec4899' }}>
              <InlineMath math="S_A = S_{\triangle PBC}" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>{geom.SA.toFixed(3)}</span>
          </div>
          <div style={styles.calcRow}>
            <span style={{ color: '#38bdf8' }}>
              <InlineMath math="S_B = S_{\triangle PCA}" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>{geom.SB.toFixed(3)}</span>
          </div>
          <div style={styles.calcRow}>
            <span style={{ color: '#10b981' }}>
              <InlineMath math="S_C = S_{\triangle PAB}" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>{geom.SC.toFixed(3)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '4px 0' }} />
          <div style={styles.calcRow}>
            <span style={{ color: '#94a3b8' }}>
              <InlineMath math="S_A + S_B + S_C" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>{(geom.SA + geom.SB + geom.SC).toFixed(3)}</span>
          </div>
          <div style={styles.calcRow}>
            <span style={{ color: '#94a3b8' }}>
              <InlineMath math="S_{\triangle ABC}" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>{geom.SABC.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ ...styles.cardHeader, color: '#f59e0b' }}>奔驰定理线性组合</div>
        <div style={styles.formulaWrapper}>
          <BlockMath math={`S_A \\vec{PA} + S_B \\vec{PB} + S_C \\vec{PC} = \\vec{0}`} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginTop: '10px' }}>
          <div style={styles.calcRow}>
            <span style={{ color: '#ec4899' }}>
              <InlineMath math="S_A \vec{PA}:" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>
              ({(geom.SA * geom.PA.x).toFixed(2)}, {(geom.SA * geom.PA.y).toFixed(2)})
            </span>
          </div>
          <div style={styles.calcRow}>
            <span style={{ color: '#38bdf8' }}>
              <InlineMath math="S_B \vec{PB}:" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>
              ({(geom.SB * geom.PB.x).toFixed(2)}, {(geom.SB * geom.PB.y).toFixed(2)})
            </span>
          </div>
          <div style={styles.calcRow}>
            <span style={{ color: '#10b981' }}>
              <InlineMath math="S_C \vec{PC}:" />
            </span>
            <span style={{ fontFamily: 'monospace' }}>
              ({(geom.SC * geom.PC.x).toFixed(2)}, {(geom.SC * geom.PC.y).toFixed(2)})
            </span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '4px 0' }} />
          <div style={styles.calcRow}>
            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>向量和 :</span>
            <span style={{ fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
              ({(geom.SA * geom.PA.x + geom.SB * geom.PB.x + geom.SC * geom.PC.x).toFixed(3)}, {(geom.SA * geom.PA.y + geom.SB * geom.PB.y + geom.SC * geom.PC.y).toFixed(3)})
            </span>
          </div>
        </div>
        <div style={styles.noteBox}>
          由于计算机浮点误差，结果在 0.001 级别波动属正常现象。
        </div>
      </div>
    </div>
  );

  return <ThreeScreenLayout left={leftPanel} center={centerPanel} right={rightPanel} />;
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#60a5fa',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '8px',
  },
  controlGroup: {
    marginBottom: '16px',
    backgroundColor: '#111827',
    padding: '12px 10px',
    borderRadius: '6px',
    border: '1px solid #1e293b',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#f1f5f9',
  },
  templateButton: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    fontWeight: 600,
  },
  canvasContainer: {
    background: '#0f172a',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #1e293b',
    width: '100%',
    maxWidth: '600px',
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  canvasHeader: {
    padding: '10px 14px',
    backgroundColor: '#020617',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canvasTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #334155',
  },
  cardHeader: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  formulaWrapper: {
    backgroundColor: '#0f172a',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #1e293b',
    overflowX: 'auto',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteBox: {
    marginTop: '12px',
    padding: '8px 10px',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeft: '3px solid #f59e0b',
    borderRadius: '0 4px 4px 0',
    fontSize: '11.5px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
};
