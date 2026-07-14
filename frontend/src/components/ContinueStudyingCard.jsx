import React, { useState } from 'react';
import { CheckCircle2, FileText, BookOpen, ExternalLink, Compass, PlayCircle, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateNodeProgress, logActivity } from '../lib/roadmapQueries';
import { useStreak } from '../context/StreakContext';
import { toast } from 'react-hot-toast';

/** Returns the correct icon component for a resource type. */
function ResourceIcon({ type }) {
  if (type === 'video' || type === 'youtube') return <Video size={14} className="shrink-0 text-error" />;
  if (type === 'documentation') return <FileText size={14} className="shrink-0 text-success" />;
  return <BookOpen size={14} className="shrink-0 text-accent" />;
}

/** Extracts a YouTube video ID from a URL, or null if not a YouTube link. */
function getYouTubeId(url) {
  return url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1] ?? null;
}

/** Renders a clickable resource row (link) with icon, label, and external arrow. */
function ResourceLink({ res, userId, refreshStreak }) {
  return (
    <a
      href={res.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => { logActivity(userId, { resourceViewed: true }); refreshStreak(); }}
      className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-secondary border border-border-color text-xs text-text-primary hover:border-accent/40 transition-colors duration-150"
    >
      <ResourceIcon type={res.type} />
      <span className="flex-1 truncate">{res.title}</span>
      <ExternalLink size={12} className="text-text-secondary shrink-0" />
    </a>
  );
}

/**
 * Study card with three states: empty, next-topic preview, and active in-progress view.
 * Auto-advances to nextItem after marking the current item done.
 */
export default function ContinueStudyingCard({ item, nextItem, userId, domainId, onMarkedDone, onStartTopic }) {
  const [saving, setSaving] = useState(false);
  const { refreshStreak } = useStreak();

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!item && !nextItem) {
    return (
      <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md text-center h-full flex flex-col justify-center items-center">
        <Compass size={32} className="text-accent mb-3" />
        <h3 className="text-base font-bold font-heading text-text-primary mb-2">Nothing in progress yet</h3>
        <p className="text-xs text-text-secondary mb-4">Start a topic from your roadmap to begin studying.</p>
        <Link to="/roadmap" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg text-xs font-semibold">
          Open Roadmap
        </Link>
      </div>
    );
  }

  // ── Preview state: shows next topic with clickable resources + YT embed ────
  if (!item && nextItem) {
    const previewVideo = nextItem.resources?.find(r => r.type === 'video' || r.type === 'youtube');
    const previewOthers = nextItem.resources?.filter(r => r !== previewVideo) || [];
    const previewVideoId = getYouTubeId(previewVideo?.url);

    return (
      <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md h-full flex flex-col text-left">
        <div className="mb-3">
          <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block mb-1">
            Up Next · {nextItem.milestoneTitle || 'Start Here'}
          </span>
          <h3 className="text-lg font-bold font-heading text-text-primary break-words leading-tight">{nextItem.title}</h3>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">{nextItem.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 mb-4">
          {previewOthers.length > 0 && (
            <>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Resources</span>
              {previewOthers.map((res, idx) => (
                <ResourceLink key={idx} res={res} userId={userId} refreshStreak={refreshStreak} />
              ))}
            </>
          )}
          {previewVideoId && (
            <div className="rounded-lg overflow-hidden aspect-video border border-border-color bg-black mt-2">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${previewVideoId}`}
                title={previewVideo.title || 'Study Video'} frameBorder="0" allowFullScreen />
            </div>
          )}
        </div>

        <button
          onClick={() => onStartTopic?.(nextItem.id)}
          className="px-4 py-2 bg-accent text-black rounded-lg text-xs font-semibold flex items-center gap-2 self-start mt-auto cursor-pointer"
        >
          <PlayCircle size={14} /> Start Learning
        </button>
      </div>
    );
  }

  // ── Active state: in-progress topic ───────────────────────────────────────
  const handleMarkDone = async () => {
    setSaving(true);
    try {
      await updateNodeProgress(userId, domainId, item.id, 'done');
      await logActivity(userId, { subtopicCompleted: true });
      if (nextItem?.id) {
        await updateNodeProgress(userId, domainId, nextItem.id, 'in_progress');
      }
      await refreshStreak();
      toast.success('Marked as done!');
      onMarkedDone?.();
    } catch {
      toast.error('Failed to update progress.');
    } finally {
      setSaving(false);
    }
  };

  const videoResource = item.resources?.find(r => r.type === 'video' || r.type === 'youtube');
  const otherResources = item.resources?.filter(r => r !== videoResource) || [];
  const videoId = getYouTubeId(videoResource?.url);

  return (
    <div className="bg-bg-card border border-accent rounded-xl p-6 shadow-md h-full flex flex-col justify-between text-left">
      <div>
        <span className="text-[10px] text-accent font-semibold uppercase tracking-wider block mb-1">
          Continue Studying {item.milestoneTitle ? `· ${item.milestoneTitle}` : ''}
        </span>
        <h3 className="text-lg font-bold font-heading text-text-primary break-words leading-tight">{item.title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 my-3.5 space-y-3.5 min-h-0 text-left">
        <p className="text-xs text-text-secondary leading-relaxed">{item.description}</p>

        {otherResources.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Resources</span>
            {otherResources.map((res, idx) => (
              <ResourceLink key={idx} res={res} userId={userId} refreshStreak={refreshStreak} />
            ))}
          </div>
        )}

        {videoId && (
          <div className="rounded-lg overflow-hidden aspect-video border border-border-color bg-black">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`}
              title={videoResource.title || 'Study Video'} frameBorder="0" allowFullScreen />
          </div>
        )}
      </div>

      <button onClick={handleMarkDone} disabled={saving}
        className="px-4 py-2 bg-success/10 border border-success text-success rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start mt-1"
      >
        <CheckCircle2 size={14} />
        {saving ? 'Saving...' : nextItem ? 'Done → Next Topic' : 'Mark as Done'}
      </button>
    </div>
  );
}
