import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStreak } from '../context/StreakContext';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, AlertTriangle, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchStudyActivity, getContinueStudyingItem, fetchRoadmapTemplate, fetchRoadmapProgress, updateNodeProgress, logActivity } from '../lib/roadmapQueries';
import ContinueStudyingCard from '../components/ContinueStudyingCard';
import UpNextList from '../components/UpNextList';
import AnalyticsCharts from '../components/AnalyticsCharts';

import StudyTrendSparkline from '../components/StudyTrendSparkline';
import StreakCalendar from '../components/StreakCalendar';

/** Renders the CAREERVIO Student Dashboard with charts, next queued topics, and progress metrics. */
export default function Dashboard() {
  const { user, profile } = useAuth();
  const { current: streakCurrent } = useStreak();
  const [skills, setSkills] = useState([]);
  const [progressInfo, setProgressInfo] = useState({ percent: 0, completed: 0, total: 0, activeDomainName: '' });
  const [activityData, setActivityData] = useState([]);
  const [continueItem, setContinueItem] = useState(null);
  const [upNextItems, setUpNextItems] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [milestoneProgress, setMilestoneProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [domainProgress, setDomainProgress] = useState([]);

  const toggleMilestone = (id) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getWeeklyDomainCompletedCount = (progressList) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return progressList.filter(p => {
      if (p.status !== 'done') return false;
      if (!p.updated_at) return false;
      const completedDate = new Date(p.updated_at);
      return completedDate >= startOfWeek;
    }).length;
  };

  const getWeeklyCompletedCount = (activityList) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return activityList
      .filter(a => new Date(a.activity_date) >= startOfWeek)
      .reduce((sum, a) => sum + (a.subtopics_completed || 0), 0);
  };

  const getWeeklyChartData = (activityList) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const record = activityList.find(a => a.activity_date === ds);
      return {
        day: days[d.getDay()],
        completed: record ? record.subtopics_completed || 0 : 0,
        viewed: record ? record.resources_viewed || 0 : 0
      };
    });
  };

  const calculateMilestoneProgress = (template, progress) => {
    if (!template?.roadmap_json?.nodes) return [];
    const nodes = template.roadmap_json.nodes;
    const milestones = nodes.filter(n => !n.parent);
    return milestones.map(m => {
      const children = nodes.filter(n => n.parent === m.id);
      const total = children.length;
      if (total === 0) return { id: m.id, name: m.title, percent: 0, subtopics: [] };
      const completed = children.filter(c => progress.some(p => p.node_id === c.id && p.status === 'done')).length;
      
      const subtopics = children.map(c => {
        const prog = progress.find(p => p.node_id === c.id);
        return {
          id: c.id,
          title: c.title,
          status: prog ? prog.status : 'not_started'
        };
      });

      return {
        id: m.id,
        name: m.title,
        percent: Math.round((completed / total) * 100),
        subtopics
      };
    });
  };

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [skillsRes, activityRes] = await Promise.all([
        supabase.from('skill_assessment').select('*').eq('profile_id', user.id),
        fetchStudyActivity(user.id)
      ]);
      setSkills(skillsRes.data || []);
      setActivityData(activityRes);
      setWeeklyActivity(getWeeklyChartData(activityRes));

      if (profile?.selected_domain_id) {
        const [template, progress] = await Promise.all([
          fetchRoadmapTemplate(profile.selected_domain_id),
          fetchRoadmapProgress(user.id, profile.selected_domain_id)
        ]);
        setDomainProgress(progress);

        if (template?.roadmap_json?.nodes) {
          const nodes = template.roadmap_json.nodes;
          const subtopics = nodes.filter(n => n.parent);
          const total = subtopics.length;
          const completedList = progress.filter(p => p.status === 'done');
          const percent = total > 0 ? Math.round((completedList.length / total) * 100) : 0;

          setProgressInfo({
            percent,
            completed: completedList.length,
            total,
            activeDomainName: template.roadmap_json.title || 'Learning Roadmap'
          });

          setMilestoneProgress(calculateMilestoneProgress(template, progress));

          const activeItem = await getContinueStudyingItem(user.id, profile.selected_domain_id);
          setContinueItem(activeItem);

          // Fetch 4: upNextItems[0] is used as card preview, remaining 3 go to UpNextList
          const currentInProgressId = activeItem?.id;
          const upcoming = subtopics.filter(s => s.id !== currentInProgressId && !progress.some(p => p.node_id === s.id && (p.status === 'done' || p.status === 'in_progress')));
          setUpNextItems(upcoming.slice(0, 4).map(s => ({
            ...s,
            milestoneTitle: nodes.find(n => n.id === s.parent)?.title || ''
          })));
        }
      } else {
        setDomainProgress([]);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.selected_domain_id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleStartTopic = async (topicId) => {
    if (!user || !profile?.selected_domain_id) return;
    try {
      if (continueItem) {
        await updateNodeProgress(user.id, profile.selected_domain_id, continueItem.id, 'not_started');
      }
      await updateNodeProgress(user.id, profile.selected_domain_id, topicId, 'in_progress');
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasActivityToday = activityData.some(a => a.activity_date === todayStr && (a.subtopics_completed > 0 || a.resources_viewed > 0));
  const isStreakAtRisk = streakCurrent > 0 && !hasActivityToday;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-10 h-10 border-3 border-border-color border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in w-full space-y-8">
      {isStreakAtRisk && (
        <div className="bg-error/10 border border-error text-error rounded-xl p-4 flex items-center gap-3 text-left">
          <AlertTriangle className="shrink-0" size={20} />
          <p className="text-xs font-semibold">
            Streak at Risk! Complete 1 subtopic or view a resource today to keep your {streakCurrent}-day learning streak alive!
          </p>
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-5 border-b border-border-color pb-6 text-left">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-primary mb-1">Prep Dashboard</h1>
          <p className="text-sm text-text-secondary">Welcome back. Track your preparation journey.</p>
        </div>
      </div>

      {/* Top Row Grid: Left (2 Stacked Stats Cards) & Right (Monthly Activity Calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6 items-stretch">
        {/* Left side: 2 stacked stats boxes */}
        <div className="flex flex-col gap-6 justify-between">
          {/* Box 1: Readiness Card */}
          <div className="bg-bg-card border border-border-color rounded-xl p-5 shadow-md flex items-center gap-4 text-left flex-1">
            <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
              <Compass className="text-accent" size={24} />
            </div>
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block mb-0.5">Readiness Score</span>
              <span className="text-2xl font-bold font-heading text-text-primary block leading-none mb-1">{progressInfo.percent}%</span>
              <span className="text-xs text-text-secondary">Overall placement readiness score.</span>
            </div>
          </div>
          
          {/* Box 2: Weekly Goal Card */}
          <div className="bg-bg-card border border-border-color rounded-xl p-5 shadow-md flex items-center gap-4 text-left flex-1">
            <div className="w-12 h-12 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
              <Flame className="text-success animate-pulse" size={24} />
            </div>
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block mb-0.5">Weekly Goal</span>
              <span className="text-2xl font-bold font-heading text-text-primary block leading-none mb-1">
                {getWeeklyDomainCompletedCount(domainProgress)} <span className="text-sm font-normal text-text-secondary">/ {profile?.weekly_goal || 5} subtopics</span>
              </span>
              <span className="text-xs text-text-secondary">
                {getWeeklyDomainCompletedCount(domainProgress) >= (profile?.weekly_goal || 5) ? 'Goal reached! Keep it up.' : `Complete ${(profile?.weekly_goal || 5) - getWeeklyDomainCompletedCount(domainProgress)} more to hit goal.`}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Monthly Calendar Box with stock-style study trend */}
        <div className="bg-bg-card border border-border-color rounded-xl p-5 shadow-md text-left flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-center mb-3 border-b border-border-color pb-2">
            <span className="text-[10px] font-bold font-heading text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={12} className="text-accent" />
              Activity & Performance Heatmap
            </span>
            <span className="text-[10px] text-text-secondary">
              Streak: <strong className="text-accent">{streakCurrent}d</strong>
            </span>
          </div>
          
          <div className="flex flex-row items-center justify-between gap-6 flex-wrap lg:flex-nowrap flex-1">
            {/* Left side sparkline chart */}
            <StudyTrendSparkline weeklyActivity={weeklyActivity} />

            {/* Right side calendar aligned to right end */}
            <div className="shrink-0 ml-auto self-center">
              <StreakCalendar activityData={activityData} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Side-by-side Active Track and Continue Studying Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-bg-secondary border border-accent rounded-xl p-6 shadow-md relative overflow-hidden text-left flex flex-col justify-between h-[460px]">
          <div className="absolute top-4 right-4 border border-accent px-2.5 py-1 rounded-full text-[10px] font-semibold text-accent flex items-center gap-1 bg-bg-secondary">
            <Sparkles size={12} /> AI Prep Roadmap
          </div>
          
          {profile?.selected_domain_id ? (
            <div className="flex-1 flex flex-col justify-between pt-4 min-h-0">
              <div>
                <span className="text-[10px] text-accent font-semibold uppercase tracking-wider block mb-1">Active track</span>
                <h3 className="text-xl font-bold font-heading text-text-primary mb-2">{progressInfo.activeDomainName}</h3>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  You completed <strong className="text-text-primary">{progressInfo.completed}</strong> of <strong className="text-text-primary">{progressInfo.total}</strong> placement preparation topics.
                </p>
              </div>
              
              {milestoneProgress && milestoneProgress.length > 0 && (
                <div className="my-3 border-t border-b border-border-color/30 py-3 min-h-0 flex flex-col">
                  <span className="text-[9px] font-bold text-accent uppercase tracking-wider block mb-2">Roadmap Milestones</span>
                  <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 text-xs text-text-secondary">
                    {milestoneProgress.map((m, idx) => {
                      const isExpanded = !!expandedMilestones[m.id];
                      return (
                        <div key={m.id || idx} className="border border-border-color/20 rounded-lg overflow-hidden bg-bg-card/40">
                          {/* Milestone Header */}
                           <button
                             onClick={() => toggleMilestone(m.id)}
                             className="w-full flex justify-between items-center px-3 py-2 hover:bg-white/5 transition duration-200 text-left font-medium text-xs cursor-pointer"
                           >
                             <div className="flex items-center gap-2 min-w-0 flex-1">
                               {isExpanded ? <ChevronDown size={14} className="text-accent shrink-0" /> : <ChevronRight size={14} className="text-text-secondary shrink-0" />}
                               <span className="text-text-primary font-medium break-words leading-tight">{m.name}</span>
                             </div>
                             <span className="text-[10px] font-bold text-success bg-success/15 px-1.5 py-0.5 rounded shrink-0 ml-2">
                               {m.percent}%
                             </span>
                           </button>

                           {/* Sub-branches Dropdown */}
                           {isExpanded && m.subtopics && m.subtopics.length > 0 && (
                             <div className="bg-black/20 border-t border-border-color/10 px-3 py-2 space-y-1.5 text-[11px] max-h-[150px] overflow-y-auto">
                               {m.subtopics.map(sub => (
                                 <div key={sub.id} className="flex justify-between items-center py-1 border-b border-border-color/5 last:border-b-0 pl-4">
                                   <span className="text-text-secondary truncate pr-3">{sub.title}</span>
                                   <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider ${
                                     sub.status === 'done' ? 'text-success bg-success/10 border border-success/20' :
                                     sub.status === 'in_progress' ? 'text-accent bg-accent/10 border border-accent/20' :
                                     'text-text-secondary/60 bg-bg-secondary/40'
                                   }`}>
                                     {sub.status === 'in_progress' ? 'studying' : sub.status.replace('_', ' ')}
                                   </span>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-heading">
                  <span className="text-text-secondary font-semibold">Track Completion</span>
                  <span className="text-success font-bold">{progressInfo.percent}%</span>
                </div>
                <div className="h-2.5 bg-bg-card border border-border-color rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-success rounded-full transition-all duration-300" style={{ width: `${progressInfo.percent}%` }} />
                </div>
                <Link to="/roadmap" className="px-5 py-2.5 font-heading font-semibold text-xs text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/10">
                  <Compass size={14} /> View Visual Roadmap
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between pt-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-text-primary mb-2">Your AI Prep Roadmap</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  We are ready to assemble a learning path based on your goal: <strong className="text-text-primary">{profile?.domain_goal}</strong>. Please select your placement preparation domain track to view the interactive map.
                </p>
              </div>
              <Link to="/roadmap" className="px-5 py-2.5 font-heading font-semibold text-xs text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/10 self-start">
                Choose Domain Track
              </Link>
            </div>
          )}
        </div>

        <div className="h-[460px]">
        <ContinueStudyingCard
            item={continueItem}
            nextItem={upNextItems[0] || null}
            userId={user?.id}
            domainId={profile?.selected_domain_id}
            onMarkedDone={loadDashboardData}
            onStartTopic={handleStartTopic}
          />
        </div>
      </div>

      {/* Row 2: Analytics Charts (Full Row View) */}
      <div className="w-full">
        <AnalyticsCharts weeklyData={weeklyActivity} milestoneData={milestoneProgress} />
      </div>

      {/* Row 3: Up Next Queue */}
      <div className="w-full">
        <UpNextList items={continueItem ? upNextItems : upNextItems.slice(1)} onStartTopic={handleStartTopic} />
      </div>
    </div>
  );
}
