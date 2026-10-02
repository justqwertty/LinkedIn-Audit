import { ParsedProfile } from './types';

interface Props {
  headlineSuggestions: string[];
  aboutOutline: string;
  profile: ParsedProfile;
}

export default function Suggestions({ headlineSuggestions, aboutOutline, profile }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 suggestions-panel">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Suggested profile wording</h3>
      <p className="text-sm text-gray-500 mb-6">These ideas use only information the audit could read. Check every detail before publishing.</p>
      
      <div className="mb-8 suggestion-section">
        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-3">Headline ideas</h4>
        <div className="space-y-2 headline-list">
          {headlineSuggestions.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group headline-card">
              <span className="text-gray-400 text-sm w-4 headline-number">{i + 1}</span>
              <p className="text-sm text-gray-700 flex-1 font-mono headline-text">{s}</p>
              <button
                onClick={() => navigator.clipboard.writeText(s)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-opacity px-2 py-1 copy-button"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8 suggestion-section">
        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-3">About section outline</h4>
        <div className="p-4 bg-gray-50 rounded-lg about-outline-card">
          <p className="text-sm text-gray-700 leading-relaxed">{aboutOutline}</p>
        </div>
      </div>
      
      <div className="mb-8 suggestion-section">
        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-3">Profile images and recent activity</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 profile-image-grid">
          <div className="p-4 bg-gray-50 rounded-lg profile-note-card">
            <p className="text-sm font-medium text-gray-700 mb-1">Your profile photo</p>
            <p className="text-xs text-gray-500">Photo presence affects the audit score. Visual guidance is separate and never judges appearance, identity, or protected traits.</p>
            <p className="text-xs text-gray-400 mt-2 availability-note">Could not check photo · Image not available</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg profile-note-card">
            <p className="text-sm font-medium text-gray-700 mb-1">Your banner</p>
            <p className="text-xs text-gray-500">Banner presence affects the audit score. Image-usability guidance is separate from the score.</p>
            <p className="text-xs text-gray-400 mt-2 availability-note">Could not check banner · Image not available</p>
          </div>
        </div>
      </div>
      
      <div className="suggestion-section">
        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-3">Profile topics compared with recent posts</h4>
        <div className="p-4 bg-gray-50 rounded-lg recent-topic-card">
          <p className="text-sm text-gray-700">Topics in your profile compared with public, dated posts from the last 30 days. This is not scored.</p>
          <p className="text-sm text-gray-500 mt-2">Recent public post data was unavailable. This does not mean there was no activity.</p>
          <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
            Open LinkedIn share task {"→"}
          </button>
        </div>
      </div>
    </div>
  );
}
