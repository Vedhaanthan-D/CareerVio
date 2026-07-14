import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStreak } from '../../context/StreakContext';
import { fetchRoadmapTemplate, fetchRoadmapProgress, updateNodeProgress, logActivity } from '../../lib/roadmapQueries';
import { supabase } from '../../lib/supabaseClient';
import { Navigate } from 'react-router-dom';
import NodePanel from './NodePanel';
import DomainSwitchPanel from './DomainSwitchPanel';
import { toast } from 'react-hot-toast';
import {
  ReactFlow, Background, Controls,
  useNodesState, useEdgesState, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CheckCircle2, Clock, Circle, RefreshCw, Compass, Crosshair, Layers } from 'lucide-react';
import { nodeTypes } from './RoadmapNodes';
import { buildLayout } from './roadmapLayout';

// Default zoom level — fills the viewport comfortably on load
const DEFAULT_ZOOM = 1.2;

// ── CenterOnRoot — positions the root node near the top of the viewport ───────
// Must live INSIDE <ReactFlow> to access its context.
// centerKey: incrementing integer — any change triggers a re-position animation.
function CenterOnRoot({ centerKey, hasNodes }) {
  const { setViewport } = useReactFlow();

  useEffect(() => {
    if (!hasNodes) return;
    // Small delay so React Flow has finished positioning nodes
    const t = setTimeout(() => {
      // Place world x=0 at horizontal center, world y=0 ~60px from the top edge
      setViewport(
        { x: window.innerWidth / 2, y: 60, zoom: DEFAULT_ZOOM },
        { duration: 500 },
      );
    }, 120);
    return () => clearTimeout(t);
  // centerKey intentionally drives every re-center, including initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey, hasNodes]);

  return null;
}

// ── RoadmapCanvas — mounts ReactFlow; CenterOnRoot is a child inside it ───────
function RoadmapCanvas({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick, recenterKey }) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      minZoom={0.06}
      maxZoom={2.5}
      defaultViewport={{ x: 0, y: 0, zoom: DEFAULT_ZOOM }}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'var(--bg-primary)' }}
      nodesDraggable={false}
      panOnDrag
      panOnScroll
      panOnScrollMode="free"
      zoomOnScroll={false}
      zoomOnPinch
      zoomOnDoubleClick={false}
    >
      <CenterOnRoot centerKey={recenterKey} hasNodes={nodes.length > 0} />
      <Background color="var(--bg-grid)" gap={28} size={1} />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────
export default function RoadmapView() {
  const { user, profile, refreshProfile } = useAuth();
  const { refreshStreak } = useStreak();
  const [template, setTemplate]            = useState(null);
  const [progress, setProgress]            = useState([]);
  const [loading, setLoading]              = useState(true);
  const [saving, setSaving]                = useState(false);
  const [selectedNodeId, setSelectedNodeId]= useState(null);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);

  // Set of milestone IDs that are individually collapsed (default: none → all expanded)
  const [collapsedMilestones, setCollapsedMilestones] = useState(new Set());

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Incrementing key → tells the canvas to snap back to root
  const [recenterKey, setRecenterKey] = useState(0);

  // ── Data load ────────────────────────────────────────────────────────────
  const loadRoadmap = useCallback(async () => {
    if (!profile?.selected_domain_id) return;
    setLoading(true);
    try {
      const [tmpl, prog] = await Promise.all([
        fetchRoadmapTemplate(profile.selected_domain_id),
        fetchRoadmapProgress(user.id, profile.selected_domain_id),
      ]);
      setTemplate(tmpl);
      setProgress(prog || []);
      // Reset to all-expanded on fresh load
      setCollapsedMilestones(new Set());
      setSelectedNodeId(null);
      setRecenterKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load roadmap.');
    } finally {
      setLoading(false);
    }
  }, [profile?.selected_domain_id, user?.id]);

  useEffect(() => {
    if (profile?.selected_domain_id) loadRoadmap();
    else setLoading(false);
  }, [profile?.selected_domain_id]);

  // ── Switch domain: update profile then reload ─────────────────────────────
  const handleDomainSwitch = useCallback(async (newDomainId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_domain_id: newDomainId })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setShowSwitchPanel(false);
      toast.success('Roadmap domain switched!');
    } catch (err) {
      console.error('[RoadmapView] Domain switch failed:', err);
      toast.error('Failed to switch domain.');
    }
  }, [user?.id, refreshProfile]);

  // ── Toggle individual milestone collapse ─────────────────────────────────
  const toggleMilestone = useCallback((milestoneId) => {
    setSelectedNodeId(null);
    setCollapsedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) next.delete(milestoneId);
      else next.add(milestoneId);
      return next;
    });
  }, []);

  // ── Recompute layout whenever collapse state or data changes ─────────────
  useEffect(() => {
    if (!template?.roadmap_json?.nodes) return;
    const domainTitle = template.roadmap_json.title || 'Learning Roadmap';
    const { flowNodes, flowEdges } = buildLayout(
      template.roadmap_json.nodes,
      progress,
      collapsedMilestones,
      selectedNodeId,
      toggleMilestone,
      domainTitle,
    );
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [template, progress, collapsedMilestones, selectedNodeId, toggleMilestone]);

  // ── Node click: open detail panel ────────────────────────────────────────
  const handleNodeClick = useCallback((_evt, node) => {
    if (node.type === 'rootNode') {
      setRecenterKey((k) => k + 1);
      return;
    }
    if (node.type === 'milestoneNode') {
      const isCollapsed = collapsedMilestones.has(node.id);
      if (isCollapsed) {
        // Expand first — don't open panel yet
        toggleMilestone(node.id);
        return;
      }
      // Already expanded: toggle the detail panel open/closed
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
      return;
    }
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, [collapsedMilestones, toggleMilestone]);

  // ── Status update ────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (!selectedNodeId || !profile?.selected_domain_id) return;
    setSaving(true);
    try {
      await updateNodeProgress(user.id, profile.selected_domain_id, selectedNodeId, newStatus);
      setProgress((prev) => [
        ...prev.filter((p) => p.node_id !== selectedNodeId),
        { node_id: selectedNodeId, status: newStatus },
      ]);
      if (newStatus === 'done') {
        await logActivity(user.id, { subtopicCompleted: true });
        await refreshStreak();
      }
      toast.success('Progress updated!');
    } catch {
      toast.error('Failed to save progress.');
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allNodes   = template?.roadmap_json?.nodes ?? [];
    const subtopics  = allNodes.filter((n) => n.parent);
    const total      = subtopics.length;
    const completed  = progress.filter((p) => p.status === 'done').length;
    const inProgress = progress.filter((p) => p.status === 'in_progress').length;
    const percent    = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percent, completed, inProgress, total };
  }, [template, progress]);

  const selectedNodeData   = useMemo(() =>
    template?.roadmap_json?.nodes?.find((n) => n.id === selectedNodeId) ?? null,
    [selectedNodeId, template]);

  const selectedNodeStatus = useMemo(() =>
    progress.find((p) => p.node_id === selectedNodeId)?.status ?? 'not_started',
    [selectedNodeId, progress]);

  if (!profile?.selected_domain_id) return <Navigate to="/dashboard" replace />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Canvas column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 20px', background:'var(--bg-secondary)',
          borderBottom:'1px solid var(--border-color)', flexShrink:0, flexWrap:'wrap', gap:'12px',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text-primary)', lineHeight:1.3 }}>
                {template?.roadmap_json?.title || 'Learning Roadmap'}
              </div>
              <div style={{ fontSize:'10px', color:'var(--text-secondary)', marginTop:'1px' }}>
                Click a milestone to expand · Click again to open details · Drag to pan
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ display:'flex', gap:'6px' }}>
              <span style={pillStyle('#22c55e')}><CheckCircle2 size={11} /> {stats.completed} done</span>
              <span style={pillStyle('#f97316')}><Clock size={11} /> {stats.inProgress} active</span>
              <span style={pillStyle('var(--text-secondary)')}><Circle size={11} /> {stats.total - stats.completed - stats.inProgress} left</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'3px' }}>
              <span style={{ fontSize:'10px', fontWeight:600, color:'var(--text-secondary)' }}>{stats.percent}%</span>
              <div style={{ width:'100px', height:'4px', background:'var(--border-color)', borderRadius:'99px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${stats.percent}%`,
                  background:'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius:'99px', transition:'width 0.4s' }} />
              </div>
            </div>
            {/* Switch Domain button */}
            <button
              id="btn-switch-domain"
              onClick={() => setShowSwitchPanel(true)}
              title="Switch domain"
              style={{ ...iconBtnStyle, width: 'auto', padding: '0 10px', gap: '5px',
                display: 'flex', alignItems: 'center', color: '#f97316',
                border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)' }}
            >
              <Layers size={13} />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>Switch Domain</span>
            </button>
            {/* Center-view button */}
            <button
              onClick={() => setRecenterKey((k) => k + 1)}
              title="Center on root"
              style={iconBtnStyle}
            >
              <Crosshair size={13} />
            </button>
            <button onClick={loadRoadmap} disabled={loading} style={iconBtnStyle} title="Refresh">
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* React Flow canvas */}
        <div style={{ flex:1, position:'relative', minHeight:0 }}>
          {loading ? (
            <div style={centerStyle}>
              <div style={spinnerStyle} />
              <span style={{ fontSize:'12px', color:'var(--text-secondary)', fontWeight:500 }}>Assembling roadmap…</span>
            </div>
          ) : nodes.length === 0 ? (
            <div style={{ ...centerStyle, flexDirection:'column', gap:'10px', textAlign:'center' }}>
              <Compass size={40} color="#f97316" />
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-primary)' }}>No Roadmap Found</div>
              <div style={{ fontSize:'12px', color:'var(--text-secondary)', maxWidth:'260px', lineHeight:1.6 }}>
                This domain hasn't been seeded yet.
              </div>
            </div>
          ) : (
            <RoadmapCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              recenterKey={recenterKey}
            />
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNodeId && selectedNodeData && (
        <NodePanel
          node={selectedNodeData}
          status={selectedNodeStatus}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedNodeId(null)}
          saving={saving}
        />
      )}

      {/* Domain switch panel */}
      {showSwitchPanel && (
        <DomainSwitchPanel
          currentDomainId={profile?.selected_domain_id}
          isCurrentCompleted={stats.percent === 100}
          onSwitch={handleDomainSwitch}
          onClose={() => setShowSwitchPanel(false)}
        />
      )}
    </div>
  );
}

// ─── Style atoms ──────────────────────────────────────────────────────────────
const pillStyle = (color) => ({
  display:'inline-flex', alignItems:'center', gap:'4px',
  fontSize:'10px', fontWeight:600, color,
  background:`${color}14`, border:`1px solid ${color}33`,
  borderRadius:'99px', padding:'3px 8px',
});

const iconBtnStyle = {
  display:'flex', alignItems:'center', justifyContent:'center',
  width:'28px', height:'28px', borderRadius:'7px',
  border:'1px solid var(--border-color)', background:'transparent',
  color:'var(--text-secondary)', cursor:'pointer', transition:'all 0.15s', flexShrink:0,
};

const centerStyle = {
  position:'absolute', inset:0,
  display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
};

const spinnerStyle = {
  width:'26px', height:'26px',
  border:'2.5px solid var(--border-color)',
  borderTop:'2.5px solid #f97316',
  borderRadius:'50%',
  animation:'spin 0.8s linear infinite',
};
