import { useState, useCallback } from 'react';
import { parseLinkedInPdf } from './pdfParser';
import { auditProfile } from './auditor';
import { AuditResult, ParsedProfile } from './types';
import AuditReport from './AuditReport';
import './App.css';

export default function App() {
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    setLoading(true);
    setError(null);
    setProfile(null);
    setResult(null);
    try {
      const parsed = await parseLinkedInPdf(selectedFile);
      setProfile(parsed);
      const auditResult = auditProfile(parsed);
      setResult(auditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = '';
    if (selectedFile) await processFile(selectedFile);
  }, [processFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (!droppedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    await processFile(droppedFile);
  }, [processFile]);

  return (
    <div className="app-shell min-h-screen">
      <header className="site-header sticky top-0 z-10">
        <div className="site-header-inner max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
          </svg>
          <h1 className="text-xl font-semibold text-gray-900">Profile Signal</h1>
          <span className="brand-caption">LINKEDIN PROFILE AUDIT</span>
        </div>
      </header>

      <main className="page-content max-w-5xl mx-auto px-6 py-8">
        {!result && !loading ? (
          <div className="space-y-8">
            <section className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow"><span className="eyebrow-dot" /> A clearer picture of your profile</span>
                <h2>Make your next<br /><em>first impression</em> count.</h2>
                <p>Get a thoughtful, practical review of your LinkedIn profile. Find what’s working, what’s missing, and what to improve next.</p>
                <div className="hero-proof"><span>01 <b>Profile strengths</b></span><span>02 <b>Prioritized actions</b></span><span>03 <b>Suggested wording</b></span></div>
              </div>
              <div className="upload-card">
                <div className="upload-heading">
                  <div className="upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 16V4m0 0L7 9m5-5 5 5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" /></svg>
                  </div>
                  <div><h3>Start your profile audit</h3><p>Upload your LinkedIn PDF export</p></div>
                </div>
                <label className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} />
                <span className="drop-file-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M7 3.75h6l5 5v11.5H7a2 2 0 01-2-2v-12.5a2 2 0 012-2zM13 4v5h5M8.5 14h7m-7 3h7" /></svg></span>
                <strong>Drop your PDF here</strong>
                <span className="drop-hint">or <span className="browse-link">browse files</span> on your device</span>
              </label>
              <div className="privacy-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9 2 2 4-4" /></svg> Your profile is analyzed privately in your browser.</div>
              </div>
            </section>

            <div className="feature-grid grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="feature-card">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Benchmarked against hiring standards</h3>
                <p className="text-xs text-gray-500">Scores are based on what recruiters and hiring systems look for in current market conditions.</p>
              </div>
              <div className="feature-card">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Actionable improvements</h3>
                <p className="text-xs text-gray-500">Get prioritized recommendations ranked by potential score impact and time investment.</p>
              </div>
              <div className="feature-card">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Suggested wording</h3>
                <p className="text-xs text-gray-500">Receive headline and About section rewrite suggestions based on your actual profile data.</p>
              </div>
            </div>
          </div>
        ) : null}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-gray-600 font-medium">Analyzing your profile...</span>
            </div>
          </div>
        )}

        {result && profile && <AuditReport profile={profile} result={result} onReset={() => { setProfile(null); setResult(null); setError(null); }} />}

        {error && (
          <div className="analysis-error mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3" role="alert" aria-live="assertive">
            <svg className="analysis-error-icon text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-800">Analysis error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
