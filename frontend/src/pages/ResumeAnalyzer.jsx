import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FileUp, Loader2, RotateCcw, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ResumeScoreCard from '../components/ResumeScoreCard';
import ResumeFeedbackList from '../components/ResumeFeedbackList';

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
const ACCEPTED_EXT = '.pdf,.docx,.doc';

/** Resume upload page — file → score + LLM feedback, saved to resume_analyses. */
export default function ResumeAnalyzer() {
  const { session } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function submitFile(file) {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only PDF and DOCX files are supported.');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token ?? session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analyze-resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Analysis failed');
      }

      setResult(await res.json());
    } catch (err) {
      toast.error(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleInputChange(e) {
    submitFile(e.target.files[0]);
    e.target.value = '';          // reset so the same file can be resubmitted
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    submitFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-text-primary mb-1">Resume Analyzer</h1>
        <p className="text-sm text-text-secondary">
          Upload your resume for an instant ATS-readiness score and personalised feedback.
        </p>
      </div>

      {/* Upload zone — hidden when result is shown */}
      {!result && (
        <label
          htmlFor="resume-input"
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-200"
          style={{
            borderColor: dragOver ? 'var(--accent)' : 'var(--border-color)',
            background: dragOver ? 'rgba(249,115,22,0.04)' : 'transparent',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {analyzing ? (
            <>
              <Loader2 size={32} className="text-accent animate-spin" />
              <span className="text-sm font-medium text-text-primary">Analyzing your resume…</span>
              <span className="text-xs text-text-secondary">This takes a few seconds</span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileUp size={24} className="text-accent" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-text-primary">Drop your resume here</span>
                <p className="text-xs text-text-secondary mt-1">or click to browse · PDF or DOCX · max 5 MB</p>
              </div>
            </>
          )}
          <input
            id="resume-input"
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT}
            onChange={handleInputChange}
            disabled={analyzing}
            className="hidden"
          />
        </label>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* File meta pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <FileText size={13} />
              <span>Analysis complete</span>
            </div>
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <RotateCcw size={12} />
              Analyze another
            </button>
          </div>

          <ResumeScoreCard
            score={result.overall_score}
            sectionScores={result.section_scores}
            wordCount={result.word_count}
          />
          <ResumeFeedbackList feedback={result.feedback} />
        </div>
      )}
    </div>
  );
}
