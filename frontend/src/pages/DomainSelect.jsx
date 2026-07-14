import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { fetchDomains, fetchDomainsWithTemplates } from '../lib/roadmapQueries';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Code, Server, Layers, Smartphone, GitBranch, Cloud, ShieldCheck, Lock, 
  BarChart2, Cpu, BrainCircuit, Database, Gamepad2, Box, Link2, Workflow,
  PenTool, Palette, Video, Compass, TrendingUp, Briefcase, Megaphone, 
  DollarSign, Users, Activity, Presentation, Settings, Zap, Home, Sparkles, ArrowLeft, ArrowRight
} from 'lucide-react';

const ICON_MAP = {
  Code, Server, Layers, Smartphone, GitBranch, Cloud, ShieldCheck, Lock, 
  BarChart2, Cpu, BrainCircuit, Database, Gamepad2, Box, Link2, Workflow,
  Figma: PenTool, Palette, Video, Compass, TrendingUp, Briefcase, Megaphone, 
  DollarSign, Users, Activity, Presentation, Settings, Zap, Home
};

import { CONFIG } from '../config';

const CATEGORIES = ['Technology', 'Design', 'Management', 'Core Engineering'];

export default function DomainSelect() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Technology');
  const [isCurrentCompleted, setIsCurrentCompleted] = useState(true);

  useEffect(() => {
    async function loadDomains() {
      try {
        const [allDomains, publishedDomainIds] = await Promise.all([
          fetchDomains(),
          fetchDomainsWithTemplates(),
        ]);
        const readyDomains = allDomains.filter(d => publishedDomainIds.includes(d.id));
        setDomains(readyDomains);
        
        // Try to match profile selected domain, or fallback to onboarding goal
        if (profile?.selected_domain_id) {
          setSelectedId(profile.selected_domain_id);
          // Set active category to matching domain's category
          const match = readyDomains?.find(d => d.id === profile.selected_domain_id);
          if (match?.category) {
            setActiveCategory(match.category);
          }

          // Fetch progress of currently selected domain
          const [templateRes, progressRes] = await Promise.all([
            supabase
              .from('roadmap_templates')
              .select('roadmap_json')
              .eq('domain_id', profile.selected_domain_id)
              .eq('status', 'published')
              .maybeSingle(),
            supabase
              .from('roadmap_progress')
              .select('status')
              .eq('profile_id', user.id)
              .eq('domain_id', profile.selected_domain_id)
          ]);

          if (templateRes.data?.roadmap_json?.nodes) {
            const subtopics = templateRes.data.roadmap_json.nodes.filter(n => n.parent);
            const total = subtopics.length;
            const completed = (progressRes.data || []).filter(p => p.status === 'done').length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            setIsCurrentCompleted(percent === 100);
          } else {
            setIsCurrentCompleted(true);
          }
        } else if (profile?.domain_goal && readyDomains?.length > 0) {
          const match = readyDomains.find(d => d.name.toLowerCase() === profile.domain_goal.toLowerCase());
          if (match) {
            setSelectedId(match.id);
            if (match.category) {
              setActiveCategory(match.category);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching domains:', err);
        toast.error('Failed to load learning domains.');
      } finally {
        setLoading(false);
      }
    }
    loadDomains();
  }, [profile, user]);

  const handleSelectDomain = async () => {
    if (!selectedId) {
      return toast.error('Please select a domain track to continue.');
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_domain_id: selectedId })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Preparation domain track selected!');
      await refreshProfile();
      navigate('/roadmap');
    } catch (err) {
      console.error('Error selecting domain:', err);
      toast.error('Failed to save selected track.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-border-color border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter domains by active category
  const filteredDomains = domains.filter(d => d.category?.toLowerCase() === activeCategory.toLowerCase());

  // Group filtered domains by subcategory
  const groupedDomains = filteredDomains.reduce((acc, domain) => {
    const sub = domain.subcategory || 'General';
    if (!acc[sub]) {
      acc[sub] = [];
    }
    acc[sub].push(domain);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in relative text-left">
      {profile?.selected_domain_id && (
        <Link
          to="/roadmap"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition duration-150"
        >
          <ArrowLeft size={14} />
          Back to Roadmap
        </Link>
      )}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-[11px] font-semibold text-accent uppercase tracking-wider mb-3">
          <Sparkles size={12} />
          Choose Your Preparation Path
        </div>
        <h2 className="text-3xl font-bold font-heading text-text-primary mb-2">Select Your Placement Domain</h2>
        <p className="text-sm text-text-secondary max-w-xl mx-auto leading-relaxed text-center">
          Pick a target domain to generate a curated placement preparation roadmap, track your node progress, and access curated resources.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-border-color mb-8 overflow-x-auto gap-2">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2.5 text-sm font-semibold font-heading transition duration-200 cursor-pointer border-b-2 outline-none select-none whitespace-nowrap
                ${isActive 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-secondary'}`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Subcategory Groups and Domain Cards */}
      <div className="space-y-8 mb-8">
        {Object.keys(groupedDomains).length === 0 ? (
          <div className="text-center p-8 bg-bg-card border border-border-color rounded-xl text-text-secondary text-sm">
            No tracks found under this category.
          </div>
        ) : (
          Object.keys(groupedDomains).map((subcategory) => (
            <div key={subcategory} className="space-y-4">
              <div className="flex items-center gap-1.5 text-accent font-heading font-bold text-xs uppercase tracking-wider">
                <Sparkles size={12} />
                <span>{subcategory}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {groupedDomains[subcategory].map((dom) => {
                  const IconComponent = ICON_MAP[dom.icon] || Compass;
                  const isSelected = selectedId === dom.id;
                  const isSuggested = !profile?.selected_domain_id && profile?.domain_goal?.toLowerCase() === dom.name.toLowerCase();
                  const isActiveTrack = profile?.selected_domain_id === dom.id;
                  const isLocked = CONFIG.ENFORCE_TRACK_COMPLETION_LOCK && profile?.selected_domain_id && !isCurrentCompleted && dom.id !== profile.selected_domain_id;

                  return (
                    <div
                      key={dom.id}
                      onClick={() => {
                        if (isLocked) {
                          toast.error("Please complete your current active track to 100% to unlock other domains.");
                          return;
                        }
                        setSelectedId(dom.id);
                      }}
                      className={`relative transition-all duration-300 rounded-xl p-5 border text-left flex flex-col items-start min-h-[200px] select-none group
                        ${isLocked 
                          ? 'bg-bg-card/50 border-border-color opacity-50 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-accent/5 border-accent shadow-md shadow-accent/5 cursor-pointer' 
                            : 'bg-bg-card border-border-color hover:border-accent hover:bg-white/[0.01] cursor-pointer'}`}
                    >
                      {isActiveTrack && (
                        <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-success/15 text-success border border-success/30 z-10">
                          Active Track
                        </span>
                      )}

                      {isLocked && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-error/15 text-error border border-error/25 z-10">
                          <Lock size={10} /> Locked
                        </div>
                      )}

                      {isSuggested && !isActiveTrack && !isLocked && (
                        <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 z-10 animate-pulse">
                          Suggested
                        </span>
                      )}

                      <div className={`w-9.5 h-9.5 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 border
                        ${isSelected && !isLocked
                          ? 'bg-accent border-transparent text-black font-bold' 
                          : 'bg-bg-secondary border-border-color text-accent group-hover:scale-105'}`}
                      >
                        <IconComponent size={18} />
                      </div>

                      <h4 className={`text-base font-bold font-heading text-text-primary mb-2 transition duration-150 ${!isLocked && 'group-hover:text-accent'}`}>
                        {dom.name}
                      </h4>
                      
                      <p className="text-xs text-text-secondary leading-relaxed mb-4 flex-1 line-clamp-3">
                        {dom.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center border-t border-border-color pt-8">
        <button
          type="button"
          onClick={handleSelectDomain}
          disabled={saving || !selectedId}
          className="px-6 py-3 font-heading font-semibold text-sm text-black bg-accent hover:bg-accent-hover disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed rounded-lg transition duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/10"
        >
          {saving ? 'Setting up Track...' : 'Confirm and Open Roadmap'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
