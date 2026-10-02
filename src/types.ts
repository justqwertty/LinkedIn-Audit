export interface Criterion {
  id: string;
  category: AuditCategory;
  weight: number;
  status: 'pass' | 'warn' | 'fail' | 'unchecked';
  score: number;
  maxScore: number;
  finding: string;
  action: string;
  couldNotCheck?: boolean;
}

export type AuditCategory = 
  | 'search-visibility'
  | 'skills'
  | 'completeness'
  | 'writing'
  | 'proof-of-work'
  | 'activity';

export interface AuditResult {
  overallScore: number;
  totalChecked: number;
  totalPossible: number;
  checkedPercent: number;
  categories: AuditCategory[];
  criteria: Criterion[];
  topActions: TopAction[];
  headlineSuggestions: string[];
  aboutOutline: string;
}

export interface TopAction {
  rank: number;
  title: string;
  potentialIncrease: number;
  timeEstimate: string;
  reason: string;
}

export interface ParsedProfile {
  name: string;
  headline: string;
  about: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  projects: Project[];
  hasPhoto: boolean;
  hasBanner: boolean;
  hasCustomUrl: boolean;
  hasVerification: boolean;
  location: string;
  industry: string;
  currentRole: string;
  recentPosts: number;
  connectionCount: number;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  years: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}
