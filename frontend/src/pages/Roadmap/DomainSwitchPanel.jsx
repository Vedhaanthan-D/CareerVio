/**
 * Slide-in domain switcher panel rendered inside the Roadmap page.
 * Shows all domains grouped by category; indicates which have a generated roadmap.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { X, Compass, CheckCircle2, AlertCircle, Loader2, ChevronRight,
  Code, Server, Layers, Smartphone, GitBranch, Cloud, ShieldCheck, Lock,
  BarChart2, Cpu, BrainCircuit, Database, Gamepad2, Box, Link2, Workflow,
  PenTool, Palette, Video, TrendingUp, Briefcase, Megaphone,
  DollarSign, Users, Activity, Presentation, Settings, Zap, Home, Network,
  LayoutDashboard,
} from 'lucide-react';
import { fetchDomains, fetchDomainsWithTemplates } from '../../lib/roadmapQueries';
import { toast } from 'react-hot-toast';

const ICON_MAP = {
  Code, Server, Layers, Smartphone, GitBranch, Cloud, ShieldCheck, Lock,
  BarChart2, Cpu, BrainCircuit, Database, Gamepad2, Box, Link2, Workflow,
  Figma: PenTool, Palette, Video, Compass, TrendingUp, Briefcase, Megaphone,
  DollarSign, Users, Activity, Presentation, Settings, Zap, Home,
  Network, LayoutDashboard,
};

import { CONFIG } from '../../config';

const CATEGORIES = ['Technology', 'Design', 'Management', 'Core Engineering'];

/** Slide-in overlay panel that lets the user switch their active roadmap domain. */
export default function DomainSwitchPanel({ currentDomainId, isCurrentCompleted, onSwitch, onClose }) {
  const [domains, setDomains]               = useState([]);
  const [generatedIds, setGeneratedIds]     = useState(new Set());
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState('Technology');
  const [pendingId, setPendingId]           = useState(currentDomainId);
  const [switching, setSwitching]           = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allDomains, templateDomainIds] = await Promise.all([
        fetchDomains(),
        fetchDomainsWithTemplates(),
      ]);
      setDomains(allDomains || []);
      setGeneratedIds(new Set(templateDomainIds));

      // Auto-focus the category of the current domain
      const current = allDomains?.find(d => d.id === currentDomainId);
      if (current?.category) setActiveCategory(current.category);
    } catch (err) {
      console.error('[DomainSwitchPanel] Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDomainId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleConfirm = async () => {
    if (!pendingId || pendingId === currentDomainId) { onClose(); return; }
    setSwitching(true);
    await onSwitch(pendingId);
    setSwitching(false);
  };

  const filteredDomains = domains.filter(
    d => d.category?.toLowerCase() === activeCategory.toLowerCase()
  );

  const grouped = filteredDomains.reduce((acc, d) => {
    const sub = d.subcategory || 'General';
    (acc[sub] ??= []).push(d);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          zIndex: 200, backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px',
        background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
        animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid var(--border-color)', flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: '11px', color: '#f97316', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
              Switch Domain
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
              Select a Learning Track
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid var(--border-color)',
          padding: '0 20px', flexShrink: 0, overflowX: 'auto',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '10px 14px', fontSize: '11px', fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: activeCategory === cat ? '2px solid #f97316' : '2px solid transparent',
                color: activeCategory === cat ? '#f97316' : 'var(--text-secondary)',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Domain List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', height: '200px', color: 'var(--text-secondary)' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12px' }}>Loading domains…</span>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
              No tracks found.
            </p>
          ) : (
            Object.entries(grouped).map(([sub, subDomains]) => (
              <div key={sub} style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#f97316',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  {sub}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {subDomains.map(dom => {
                    const IconComp   = ICON_MAP[dom.icon] || Compass;
                    const isSelected = pendingId === dom.id;
                    const isCurrent  = currentDomainId === dom.id;
                    const hasRoadmap = generatedIds.has(dom.id);
                    const isLocked   = CONFIG.ENFORCE_TRACK_COMPLETION_LOCK && !isCurrentCompleted && dom.id !== currentDomainId;

                    return (
                      <DomainRow
                        key={dom.id}
                        dom={dom}
                        Icon={IconComp}
                        isSelected={isSelected}
                        isCurrent={isCurrent}
                        hasRoadmap={hasRoadmap}
                        isLocked={isLocked}
                        onSelect={() => {
                          if (isLocked) {
                            toast.error("Please complete your current active track to 100% to unlock other domains.");
                            return;
                          }
                          if (hasRoadmap) {
                            setPendingId(dom.id);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--border-color)', flexShrink: 0,
          display: 'flex', gap: '10px',
        }}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={switching || !pendingId || (pendingId === currentDomainId)}
            style={{
              ...confirmBtnStyle,
              opacity: (switching || !pendingId || pendingId === currentDomainId) ? 0.4 : 1,
              cursor:  (switching || !pendingId || pendingId === currentDomainId) ? 'not-allowed' : 'pointer',
            }}
          >
            {switching ? (
              <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Switching…</>
            ) : (
              <><ChevronRight size={13} /> Switch Roadmap</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

/** Single domain row inside the panel. */
function DomainRow({ dom, Icon, isSelected, isCurrent, hasRoadmap, isLocked, onSelect }) {
  return (
    <div
      onClick={onSelect}
      title={isLocked ? 'Please complete your current active track to 100% to unlock' : !hasRoadmap ? 'No roadmap generated yet for this domain' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', borderRadius: '8px',
        border: isSelected ? '1px solid #f97316' : '1px solid var(--border-color)',
        background: isSelected ? 'rgba(249,115,22,0.06)' : 'transparent',
        cursor: isLocked ? 'not-allowed' : hasRoadmap ? 'pointer' : 'not-allowed',
        opacity: isLocked ? 0.35 : hasRoadmap ? 1 : 0.45,
        transition: 'all 0.15s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0,
        background: isSelected ? '#f97316' : 'var(--bg-secondary)',
        border: '1px solid ' + (isSelected ? 'transparent' : 'var(--border-color)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isSelected ? '#000' : '#f97316',
        transition: 'all 0.15s',
      }}>
        <Icon size={15} />
      </div>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {dom.name}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.3,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {dom.description}
        </p>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {isCurrent && (
          <span style={badgeStyle('#f97316')}>Active</span>
        )}
        {isLocked ? (
          <Lock size={13} color="#ef4444" />
        ) : hasRoadmap ? (
          <CheckCircle2 size={14} color="#22c55e" />
        ) : (
          <AlertCircle  size={14} color="var(--text-secondary)"    title="No roadmap yet" />
        )}
      </div>
    </div>
  );
}

// ── Style atoms ────────────────────────────────────────────────────────────────
const closeBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '28px', height: '28px', borderRadius: '7px',
  border: '1px solid var(--border-color)', background: 'transparent',
  color: 'var(--text-secondary)', cursor: 'pointer',
};

const cancelBtnStyle = {
  flex: 1, padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
  border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
};

const confirmBtnStyle = {
  flex: 2, padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
  border: 'none', background: '#f97316', color: '#000', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  transition: 'opacity 0.15s',
};

const badgeStyle = (color) => ({
  fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', padding: '2px 6px', borderRadius: '99px',
  background: `${color}18`, border: `1px solid ${color}44`, color,
});
