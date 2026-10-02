import { ParsedProfile, Experience, Education, Certification, Project } from './types';

const ML_SKILLS = [
  'machine-learning', 'machine learning', 'ml', 'deep-learning', 'deep learning',
  'python', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'nltk', 'spacy',
  'computer-vision', 'computer vision', 'data-science', 'data science',
  'react', 'typescript', 'javascript', 'node', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'sql', 'postgresql', 'mongodb', 'git',
  'api', 'rest', 'graphql', 'fastapi', 'flask', 'django',
];

const TECH_SKILLS = [
  'python', 'javascript', 'typescript', 'java', 'c++', 'go', 'rust',
  'react', 'next.js', 'node.js', 'express', 'django', 'flask', 'fastapi',
  'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
  'git', 'github', 'gitlab', 'ci/cd', 'jenkins',
  'machine-learning', 'deep-learning', 'tensorflow', 'pytorch',
  'data-science', 'analytics', 'tableau', 'power bi',
];

const VAGUE_CLAIMS = [
  /creative\s+solution/i, /unique\s+think/i, /benefit\s+humanit/i,
  /passionate\s+about/i, /results\s+driven/i, /self\s+starter/i,
  /go-getter/i, /detail\s+oriented/i, /hard\s+worker/i,
  /out-of-the-box/i, /innovative\s+thinker/i,
];

const RESULTS_PATTERNS = [
  /\d+%/, /\$\d+/, /\d+\s*[kKmM]/, /\d+\s*(users|customers|clients|employees|team|members)/i,
  /\d+\s*(s|sec|ms|hours?|days?|weeks?|months?|years?)/i,
  /improv(?:ed|ement|ing)?\s+\w+/i, /reduced\s+\w+/i, /increased\s+\w+/i,
  /built\s+\w+/i, /developed\s+\w+/i, /launched\s+\w+/i, /deployed\s+\w+/i,
  /managed\s+\w+/i, /led\s+\w+/i, /oversaw\s+\w+/i, /delivered\s+\w+/i,
];

export async function parseLinkedInPdf(file: File): Promise<ParsedProfile> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str).join(' ');
    fullText += strings + '\n';
  }
  
  return extractProfileData(fullText);
}

function extractProfileData(text: string): ParsedProfile {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let name = '';
  for (const line of lines) {
    if (line.length > 2 && line.length < 60 && /^[A-Za-z\s\-\'.]+$/.test(line)) {
      name = line;
      break;
    }
  }
  
  let headline = '';
  const nameIdx = lines.findIndex(l => l === name);
  if (nameIdx !== -1 && nameIdx + 1 < lines.length) {
    headline = lines[nameIdx + 1];
  }
  
  const aboutMatch = text.match(/About\s*\n\s*([\s\S]{200,}?)(?=\n\s*(Experience|Education|Skills|Certifications|Projects|Volunteer)|$)/i);
  const about = aboutMatch ? aboutMatch[1].trim() : '';
  
  const experience: Experience[] = [];
  const expMatches = text.matchAll(/Experience\s*\n\s*([\s\S]*?)(?=\n\s*(Education|Skills|Certifications|Projects|Volunteer)|$)/is);
  for (const match of expMatches) {
    const expText = match[1];
    const roleMatches = expText.matchAll(/([^^\n]{3,50})\s*\n\s*([^\n]{3,50})\s*\n\s*([^\n]+)\s*\n\s*([\s\S]{50,500}?)(?=\n[^\n]{3,50}\s*\n[^\n]{3,50}\s*\n|$)/g);
    for (const rm of roleMatches) {
      experience.push({ title: rm[1].trim(), company: rm[2].trim(), duration: rm[3].trim(), description: rm[4].trim(), startDate: '', endDate: '' });
    }
  }
  
  const education: Education[] = [];
  const eduMatch = text.match(/Education\s*\n\s*([\s\S]*?)(?=\n\s*(Skills|Certifications|Projects|Experience|Volunteer)|$)/is);
  if (eduMatch) {
    const eduLines = eduMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < eduLines.length - 1; i++) {
      education.push({ school: eduLines[i], degree: eduLines[i + 1] || '', field: '', years: '' });
    }
  }
  
  const skills: string[] = [];
  const skillsMatch = text.match(/Skills\s*\n\s*([\s\S]*?)(?=\n\s*(Certifications|Projects|Experience|Education|Volunteer)|$)/is);
  if (skillsMatch) {
    const skillLines = skillsMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of skillLines) {
      if (line.length > 1 && line.length < 50 && !line.includes('Show all')) {
        skills.push(line);
      }
    }
  }
  
  const certifications: Certification[] = [];
  const certMatch = text.match(/Certifications\s*\n\s*([\s\S]*?)(?=\n\s*(Projects|Experience|Education|Skills|Volunteer)|$)/is);
  if (certMatch) {
    const certLines = certMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < certLines.length; i += 2) {
      certifications.push({ name: certLines[i] || '', issuer: certLines[i + 1] || '', date: '' });
    }
  }
  
  const projects: Project[] = [];
  const projMatch = text.match(/Projects\s*\n\s*([\s\S]*?)(?=\n\s*(Volunteer|Education|Skills|Certifications|Experience)|$)/is);
  if (projMatch) {
    const projLines = projMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < projLines.length; i += 2) {
      projects.push({ name: projLines[i] || '', description: projLines[i + 1] || '', technologies: [] });
    }
  }
  
  const locationMatch = text.match(/Location:\s*([^\n]+)/i);
  const industryMatch = text.match(/Industry:\s*([^\n]+)/i);
  
  return {
    name, headline, about, experience, education, skills, certifications, projects,
    hasPhoto: text.includes('Profile') || text.includes('photo'),
    hasBanner: text.includes('banner') || text.includes('Cover'),
    hasCustomUrl: text.includes('linkedin.com/in/') && !text.includes('linkedin.com/in/---'),
    hasVerification: false,
    location: locationMatch ? locationMatch[1].trim() : '',
    industry: industryMatch ? industryMatch[1].trim() : '',
    currentRole: experience.length > 0 ? experience[experience.length - 1].title : '',
    recentPosts: 0,
    connectionCount: 0,
  };
}

export function analyzeProfile(profile: ParsedProfile): { mlSkillCount: number; techSkillCount: number; vagueClaimCount: number; resultCount: number; grammarIssues: number; topSkills: string[] } {
  const allText = [profile.headline, profile.about, ...profile.experience.map(e => e.description), ...profile.skills].join(' ').toLowerCase();
  
  const mlSkillCount = ML_SKILLS.filter(s => allText.includes(s.toLowerCase())).length;
  const techSkillCount = TECH_SKILLS.filter(s => allText.includes(s.toLowerCase())).length;
  const vagueClaimCount = VAGUE_CLAIMS.filter(p => p.test(profile.about + ' ' + profile.experience.map(e => e.description).join(' '))).length;
  const resultCount = RESULTS_PATTERNS.filter(p => p.test(profile.about + ' ' + profile.experience.map(e => e.description).join(' '))).length;
  
  let grammarIssues = 0;
  const grammarPatterns = [/\s{2,}/g, /\n{3,}/g, /[A-Z]{3,}/g];
  for (const pat of grammarPatterns) {
    const m = (profile.about + ' ' + profile.experience.map(e => e.description).join(' ')).match(pat);
    if (m) grammarIssues += m.length;
  }
  
  return { mlSkillCount, techSkillCount, vagueClaimCount, resultCount, grammarIssues, topSkills: profile.skills.slice(0, 8) };
}
