import { ParsedProfile, Experience, Education, Certification, Project } from './types';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

let pdfjsPromise: ReturnType<typeof importPdfJs> | undefined;

function importPdfJs() {
  return import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjsLib) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    return pdfjsLib;
  });
}

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
  const pdfjsLib = await (pdfjsPromise ??= importPdfJs());
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => `${item.str}${item.hasEOL ? '\n' : ' '}`)
      .join('')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n');
    fullText += strings + '\n';
  }

  if (!fullText.trim()) {
    throw new Error('This PDF has no selectable text. Export your profile from LinkedIn as a text PDF and try again.');
  }
  
  return extractProfileData(fullText);
}

function extractProfileData(text: string): ParsedProfile {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const sectionNames = new Set([
    'contact', 'top skills', 'skills', 'certifications', 'summary', 'about',
    'experience', 'education', 'projects', 'volunteer experience', 'volunteer',
    'honors & awards', 'languages', 'publications', 'organizations',
  ]);
  const normalized = (value: string) => value.toLocaleLowerCase().replace(/:$/, '').trim();
  const isSection = (value: string) => sectionNames.has(normalized(value));
  const section = (names: string[]) => {
    const wanted = new Set(names.map(normalized));
    const start = lines.findIndex(line => wanted.has(normalized(line)));
    if (start < 0) return [];
    let end = start + 1;
    const profileBoundary = nameIdx >= 0 && start < nameIdx ? nameIdx : lines.length;
    while (end < profileBoundary && !isSection(lines[end])) end++;
    return lines.slice(start + 1, end);
  };
  const isContactLine = (line: string) => /@|linkedin\.com|https?:\/\/|^www\./i.test(line);
  const isLocationLine = (line: string) =>
    !isContactLine(line) && ((line.match(/,/g) || []).length >= 2 || /,\s*(?:Egypt|United States|United Kingdom|Canada|India|Australia|Germany|France|Netherlands|United Arab Emirates)$/i.test(line));
  const looksLikeHeadline = (line: string) =>
    line.length > 28 && (line.includes('|') || /\b(enthusiast|engineer|scientist|analyst|developer|manager|intern|student|consultant|researcher|founder|specialist)\b/i.test(line));

  // LinkedIn exports can put contact details and sidebar sections before the person's name.
  // Prefer a name-shaped line immediately followed by a recognizable headline.
  const namePattern = /^[\p{L}][\p{L}\s.'’\-]{1,58}$/u;
  let nameIdx = lines.findIndex((line, index) => {
    if (!namePattern.test(line) || isSection(line) || isContactLine(line)) return false;
    return lines.slice(index + 1, index + 4).some(looksLikeHeadline);
  });
  if (nameIdx < 0) {
    nameIdx = lines.findIndex(line => namePattern.test(line) && !isSection(line) && !isContactLine(line));
  }
  const name = nameIdx >= 0 ? lines[nameIdx] : '';

  const headlineLines: string[] = [];
  if (nameIdx >= 0) {
    for (const line of lines.slice(nameIdx + 1)) {
      if (headlineLines.length >= 3 || isSection(line) || isLocationLine(line) || isContactLine(line)) break;
      headlineLines.push(line);
    }
  }
  const headline = headlineLines.join(' ').replace(/\s+/g, ' ').trim();
  const about = section(['summary', 'about']).join('\n').trim();

  const experience: Experience[] = [];
  const experienceLines = section(['experience']);
  const dateLine = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s*(?:-|–|—|to)\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|Present)\b|\b\d{4}\s*(?:-|–|—|to)\s*(?:\d{4}|Present)\b/i;
  const dateIndexes = experienceLines.map((line, index) => dateLine.test(line) ? index : -1).filter(index => index >= 0);
  for (let item = 0; item < dateIndexes.length; item++) {
    const dateIndex = dateIndexes[item];
    const nextDateIndex = dateIndexes[item + 1] ?? experienceLines.length;
    const company = experienceLines[dateIndex - 2] || '';
    const title = experienceLines[dateIndex - 1] || '';
    const detailLines = experienceLines.slice(dateIndex + 1, nextDateIndex).filter(line => !isLocationLine(line));
    const dates = experienceLines[dateIndex].match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\b\d{4}\b|Present/gi) || [];
    experience.push({
      title,
      company,
      duration: experienceLines[dateIndex],
      description: detailLines.join(' ').trim(),
      startDate: dates[0] || '',
      endDate: dates[1] || '',
    });
  }

  const education: Education[] = [];
  const educationLines = section(['education']);
  const yearRangeIndex = educationLines.findIndex(line => /\b\d{4}\s*(?:-|–|—|to)\s*\d{4}\b/.test(line));
  if (educationLines.length) {
    const schoolIndex = yearRangeIndex >= 0 ? yearRangeIndex - 1 : 0;
    const school = educationLines[Math.max(0, schoolIndex)] || educationLines[0];
    const degree = educationLines.slice(0, yearRangeIndex >= 0 ? yearRangeIndex : educationLines.length)
      .filter((line, index) => index !== Math.max(0, schoolIndex))
      .join(' ');
    education.push({ school, degree, field: '', years: yearRangeIndex >= 0 ? educationLines[yearRangeIndex] : '' });
  }

  const skills = section(['top skills', 'skills'])
    .filter(line => line.length > 1 && line.length < 60 && !/^show all/i.test(line));
  const certifications = section(['certifications'])
    .filter(line => line.length > 1)
    .map(name => ({ name, issuer: '', date: '' } as Certification));
  const projects: Project[] = section(['projects']).map(name => ({ name, description: '', technologies: [] }));

  const location = lines.slice(Math.max(0, nameIdx + 1), lines.findIndex(line => normalized(line) === 'summary') >= 0
    ? lines.findIndex(line => normalized(line) === 'summary')
    : lines.length).find(isLocationLine) || '';
  const locationMatch = text.match(/Location:\s*([^\n]+)/i);
  const industryMatch = text.match(/Industry:\s*([^\n]+)/i);

  return {
    name, headline, about, experience, education, skills, certifications, projects,
    hasPhoto: false,
    hasBanner: false,
    hasCustomUrl: /linkedin\.com\/in\//i.test(text),
    hasVerification: false,
    location: locationMatch ? locationMatch[1].trim() : location,
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
