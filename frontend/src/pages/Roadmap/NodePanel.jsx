import { X, CheckCircle2, Circle, Clock, ExternalLink, BookOpen, Video, ListTodo, Award, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../lib/roadmapQueries';

export default function NodePanel({ node, status, onStatusChange, onClose, saving }) {
  const { user } = useAuth();
  if (!node) return null;

  const subtopics = node.subtopics || [];
  const resources = node.resources || [];
  const levelColors = {
    beginner: 'border-text-secondary text-text-secondary bg-text-secondary/5',
    intermediate: 'border-accent text-accent bg-accent/5',
    advanced: 'border-success text-success bg-success/5'
  };

  return (
    <div className="w-full lg:w-[400px] h-[350px] lg:h-full bg-bg-card border-t lg:border-t-0 lg:border-l border-border-color flex flex-col shadow-2xl animate-slide-in shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-border-color flex justify-between items-start">
        <div>
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${levelColors[node.level || 'beginner']} mb-2`}>
            {node.level || 'beginner'}
          </span>
          <h3 className="text-xl font-bold font-heading text-text-primary leading-tight">
            {node.title}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-border-color text-text-secondary hover:text-text-primary transition duration-150 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status Section */}
        <div className="bg-bg-secondary border border-border-color rounded-xl p-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary block mb-3">
            Your Progress
          </span>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onStatusChange('done')}
              disabled={saving}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold font-heading flex items-center justify-between border cursor-pointer transition duration-150
                ${status === 'done'
                  ? 'bg-success/10 border-success text-success'
                  : 'bg-transparent border-border-color text-text-secondary hover:border-text-primary hover:text-text-primary'}`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Completed
              </span>
              {status === 'done' && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
            </button>

            <button
              onClick={() => onStatusChange('in_progress')}
              disabled={saving}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold font-heading flex items-center justify-between border cursor-pointer transition duration-150
                ${status === 'in_progress'
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-transparent border-border-color text-text-secondary hover:border-text-primary hover:text-text-primary'}`}
            >
              <span className="flex items-center gap-2">
                <Clock size={16} />
                In Progress
              </span>
              {status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
            </button>

            <button
              onClick={() => onStatusChange('not_started')}
              disabled={saving}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold font-heading flex items-center justify-between border cursor-pointer transition duration-150
                ${status === 'not_started'
                  ? 'bg-white/5 border-border-color text-text-primary'
                  : 'bg-transparent border-border-color text-text-secondary hover:border-text-primary hover:text-text-primary'}`}
            >
              <span className="flex items-center gap-2">
                <Circle size={16} />
                Not Started
              </span>
              {status === 'not_started' && <span className="w-1.5 h-1.5 rounded-full bg-text-secondary" />}
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary block mb-2">
            Description
          </span>
          <p className="text-sm text-text-secondary leading-relaxed">
            {node.description || 'No description provided for this topic.'}
          </p>
        </div>

        {/* Subtopics Checklist */}
        {subtopics.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary block mb-3 flex items-center gap-1.5">
              <ListTodo size={14} className="text-accent" />
              Key Concepts & Subtopics
            </span>
            <div className="space-y-2">
              {subtopics.map((sub, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-bg-secondary/50 border border-border-color/60 text-xs text-text-primary"
                >
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  <span className="leading-relaxed">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary block mb-3 flex items-center gap-1.5">
              <Award size={14} className="text-accent" />
              Curated Study Resources
            </span>
            <div className="space-y-3">
              {resources.map((res, idx) => {
                const isVideo = res.type === 'video' || res.type === 'youtube';
                const isDocs = res.type === 'documentation';
                const videoId = isVideo && res.url?.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1];
                return (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => user?.id && logActivity(user.id, { resourceViewed: true })}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary border border-border-color hover:border-accent/40 hover:bg-white/[0.01] transition duration-150 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center border border-border-color
                        ${isVideo ? 'text-error bg-error/5 border-error/20' : isDocs ? 'text-success bg-success/5' : 'text-accent bg-accent/5'}`}
                      >
                        {isVideo ? <Video size={16} /> : isDocs ? <FileText size={16} /> : <BookOpen size={16} />}
                      </div>
                      <div className="text-left pr-4">
                        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                          {res.type === 'youtube' ? 'YouTube' : res.type || 'article'}
                        </span>
                        <h5 className="text-xs font-semibold text-text-primary line-clamp-1 group-hover:text-accent transition duration-150">
                          {res.title || 'Learning Resource'}
                        </h5>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-text-secondary group-hover:text-accent transition duration-150 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
