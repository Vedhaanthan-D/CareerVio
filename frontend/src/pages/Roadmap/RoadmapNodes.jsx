/** Custom React Flow node components for the roadmap canvas. */
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { MILESTONE_W, MILESTONE_H, SUBTOPIC_W, SUBTOPIC_H, ROOT_W, ROOT_H } from './roadmapLayout';

// ── Level → border color (milestone) ─────────────────────────────────────────
const LEVEL_COLOR = {
  beginner:     '#60a5fa',   // blue
  intermediate: '#f97316',   // orange
  advanced:     '#a78bfa',   // violet
};

const statusIcon = (s) => ({ done: CheckCircle2, in_progress: Clock, not_started: Circle }[s]);
const statusColor = (s) => ({ done: '#22c55e', in_progress: '#f97316', not_started: 'var(--text-secondary)' }[s]);

// ─── Milestone Node ────────────────────────────────────────────────────────────
/** Focal spine node. Orange/level-tinted border, expand/collapse on click. */
export function MilestoneNode({ data }) {
  const { status = 'not_started', title, level, selected, expanded, onExpandToggle } = data;

  const borderColor = selected ? '#f97316' : (LEVEL_COLOR[level] ?? '#f97316');
  const bgColor     = expanded ? 'rgba(249,115,22,0.10)' : 'rgba(249,115,22,0.04)';
  const StatusIcon  = statusIcon(status);
  const sColor      = statusColor(status);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onExpandToggle?.(); }}
      style={{
        background:   bgColor,
        border:       `2px solid ${borderColor}`,
        boxShadow:    expanded
          ? `0 0 0 3px ${borderColor}30, 0 8px 32px rgba(0,0,0,0.6)`
          : `0 0 0 1px ${borderColor}20, 0 4px 16px rgba(0,0,0,0.4)`,
        borderRadius: '10px',
        padding:      '12px 18px',
        width:        `${MILESTONE_W}px`,
        height:       `${MILESTONE_H}px`,
        cursor:       'pointer',
        display:      'flex',
        flexDirection:'column',
        justifyContent:'center',
        gap:          '5px',
        transition:   'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      {/* All 4 handles — used for fan edges (left/right) and spine edges (top/bottom) */}
      <Handle id="top"    type="target" position={Position.Top}    style={hiddenHandle} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle id="left"   type="source" position={Position.Left}   style={hiddenHandle} />
      <Handle id="right"  type="source" position={Position.Right}  style={hiddenHandle} />

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em',
          textTransform:'uppercase', color: borderColor }}>
          {level || 'milestone'}
        </span>
        <StatusIcon size={12} color={sColor} />
      </div>

      {/* Title */}
      <p style={{ fontSize:'14px', fontWeight:700, color:'var(--text-primary)', lineHeight:'1.3',
        margin:0, overflow:'hidden', display:'-webkit-box',
        WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {title}
      </p>

      {/* Expand hint */}
      <span style={{ fontSize:'9px', color: borderColor, fontWeight:600, letterSpacing:'0.05em',
        opacity: 0.8 }}>
        {expanded ? '▲ collapse' : '▼ expand subtopics'}
      </span>
    </div>
  );
}

// ─── Subtopic Node ─────────────────────────────────────────────────────────────
/** Leaf node in the fan. Level-colored left border; source/target handles on sides. */
export function SubtopicNode({ data }) {
  const { status = 'not_started', title, level, selected, side } = data;

  const levelAccent = LEVEL_COLOR[level] ?? '#6b7280';
  const sColor      = statusColor(status);
  const StatusIcon  = statusIcon(status);
  const borderSide  = side === 'left' ? { borderRight: `3px solid ${levelAccent}` }
                                      : { borderLeft:  `3px solid ${levelAccent}` };

  return (
    <div
      style={{
        background:   selected ? 'var(--bg-secondary)' : 'var(--bg-card)',
        border:       `1.5px solid ${selected ? '#f97316' : 'var(--border-color)'}`,
        ...borderSide,
        boxShadow:    selected
          ? '0 0 0 2px rgba(249,115,22,0.2), 0 4px 14px rgba(0,0,0,0.5)'
          : '0 2px 10px rgba(0,0,0,0.35)',
        borderRadius: '8px',
        padding:      '9px 12px',
        width:        `${SUBTOPIC_W}px`,
        height:       `${SUBTOPIC_H}px`,
        cursor:       'pointer',
        display:      'flex',
        flexDirection:'column',
        justifyContent:'center',
        gap:          '4px',
        transition:   'border-color 0.15s, background 0.15s',
      }}
    >
      <Handle id="left"  type="target" position={Position.Left}  style={hiddenHandle} />
      <Handle id="right" type="target" position={Position.Right} style={hiddenHandle} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'8px', fontWeight:700, letterSpacing:'0.08em',
          textTransform:'uppercase', color: levelAccent }}>{level || 'topic'}</span>
        <StatusIcon size={11} color={sColor} />
      </div>

      <p style={{ fontSize:'12px', fontWeight:600, color:'var(--text-primary)', lineHeight:'1.35',
        margin:0, overflow:'hidden', display:'-webkit-box',
        WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {title}
      </p>
    </div>
  );
}

// ─── Root / Domain Node ───────────────────────────────────────────────────────
/** Central anchor node representing the domain — the most visually prominent element. */
export function RootNode({ data }) {
  return (
    <div
      style={{
        background:   'rgba(249,115,22,0.12)',
        border:       '2.5px solid #f97316',
        boxShadow:    '0 0 0 5px rgba(249,115,22,0.18), 0 0 40px rgba(249,115,22,0.25), 0 8px 32px rgba(0,0,0,0.7)',
        borderRadius: '14px',
        padding:      '12px 22px',
        width:        `${ROOT_W}px`,
        height:       `${ROOT_H}px`,
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        justifyContent:'center',
        gap:          '4px',
        cursor:       'default',
        userSelect:   'none',
      }}
    >
      <Handle id="top"    type="source" position={Position.Top}    style={hiddenHandle} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle id="left"   type="source" position={Position.Left}   style={hiddenHandle} />
      <Handle id="right"  type="source" position={Position.Right}  style={hiddenHandle} />

      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: '#f97316', opacity: 0.8 }}>Domain</span>
      <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0,
        textAlign: 'center', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
        {data.title}
      </p>
    </div>
  );
}

export const nodeTypes = {
  rootNode:      RootNode,
  milestoneNode: MilestoneNode,
  subtopicNode:  SubtopicNode,
};

const hiddenHandle = { opacity: 0, width: 6, height: 6 };
