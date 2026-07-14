import React from 'react';
import { Play, BookOpen } from 'lucide-react';

/** Renders a list of the next 3-5 upcoming subtopics in the roadmap. */
export default function UpNextList({ items, onStartTopic }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md hover:border-accent/20 transition-colors duration-200 text-left">
      <h3 className="text-sm font-bold font-heading text-text-primary mb-4 flex items-center gap-2">
        <BookOpen className="text-accent" size={16} />
        Up Next in Your Path
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-start gap-4 p-3 bg-bg-secondary border border-border-color/60 rounded-lg hover:border-border-color transition-colors duration-150"
          >
            <div className="space-y-1">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                {item.milestoneTitle || 'Subtopic'}
              </span>
              <h4 className="text-xs font-bold text-text-primary">{item.title}</h4>
              <p className="text-[11px] text-text-secondary line-clamp-1">{item.description}</p>
            </div>
            {onStartTopic && (
              <button
                onClick={() => onStartTopic(item.id)}
                className="p-2 bg-accent/10 border border-accent/20 hover:border-accent text-accent rounded-lg transition duration-200 cursor-pointer shrink-0"
                title="Start Studying Now"
              >
                <Play size={12} className="fill-accent text-accent" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
