import { useState, useCallback } from 'react';
import { parseLinkedInPdf } from './pdfParser';
import { auditProfile } from './auditor';
import { AuditResult, ParsedProfile } from './types';
import AuditReport from './AuditReport';
import './App.css';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile || !droppedFile.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    setLoading(true);
    setError(null);
    setProfile(null);
    setResult(null);
    try {
      const parsed = await parseLinkedInPdf(droppedFile);
      setProfile(parsed);
      const auditResult = auditProfile(parsed);
      setResult(auditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
          </svg>
          <h1 className="text-xl font-semibold text-gray-900">LinkedIn Profile Auditor</h1>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Beta</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!result && !loading ? (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload your LinkedIn profile PDF</h2>
              <p className="text-gray-500 mb-6 text-sm">Export your LinkedIn profile as PDF and upload it here for a comprehensive audit.</p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Choose PDF file
                <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
              </label>
              <div className="mt-4 text-xs text-gray-400">or drag and drop</div>
              <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <p className="text-sm text-gray-500">Drag your LinkedIn profile PDF here</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Benchmarked against hiring standards</h3>
                <p className="text-xs text-gray-500">Scores are based on what recruiters and hiring systems look for in current market conditions.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Actionable improvements</h3>
                <p className="text-xs text-gray-500">Get prioritized recommendations ranked by potential score impact and time investment.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
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

        {result && <AuditReport profile={profile!} result={result} onReset={() => { setFile(null); setProfile(null); setResult(null); setError(null); }} />}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
