import { ParsedProfile, AuditResult, Criterion, AuditCategory, TopAction } from './types';
import { analyzeProfile } from './pdfParser';

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  'search-visibility': 'Search visibility',
  'skills': 'Skills recruiters can find',
  'completeness': 'Profile completeness',
  'writing': 'Profile writing',
  'proof-of-work': 'Proof of work',
  'activity': 'Recent activity and connections',
};

const CATEGORY_SUBLABELS: Record<AuditCategory, string> = {
  'search-visibility': 'Headline, relevant skills, location, and Open to Work',
  'skills': 'Relevant skills and where you show using them',
  'completeness': 'Photo, URL, education, current work, and banner',
  'writing': 'Clear, specific descriptions of your work',
  'proof-of-work': 'Projects, Featured items, recommendations, and certifications',
  'activity': 'Public posts from the last 30 days and connection information',
};

export function auditProfile(profile: ParsedProfile): AuditResult {
  const analysis = analyzeProfile(profile);
  const criteria: Criterion[] = [];
  
  // SEARCH VISIBILITY (30 pts)
  const hlScore = auditHeadline(profile.headline, analysis.mlSkillCount);
  criteria.push({ id: 'headline-target', category: 'search-visibility', weight: 8, status: hlScore.status, score: hlScore.score, maxScore: 8, finding: hlScore.finding, action: hlScore.action });
  
  const chScore = auditClearHeadline(profile.headline, profile.currentRole);
  criteria.push({ id: 'headline-clear', category: 'search-visibility', weight: 4, status: chScore.status, score: chScore.score, maxScore: 4, finding: chScore.finding, action: chScore.action });
  
  const atScore = auditAboutTerms(profile.about, analysis.techSkillCount);
  criteria.push({ id: 'about-terms', category: 'search-visibility', weight: 6, status: atScore.status, score: atScore.score, maxScore: 6, finding: atScore.finding, action: atScore.action });
  
  const siwScore = auditSkillsInWork(profile.experience, profile.projects, analysis.mlSkillCount);
  criteria.push({ id: 'skills-in-work', category: 'search-visibility', weight: 4, status: siwScore.status, score: siwScore.score, maxScore: 4, finding: siwScore.finding, action: siwScore.action });
  
  criteria.push({ id: 'location', category: 'search-visibility', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  criteria.push({ id: 'open-to-work', category: 'search-visibility', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  
  // SKILLS (15 pts)
  const esScore = auditEnoughSkills(profile.skills, analysis.techSkillCount);
  criteria.push({ id: 'enough-skills', category: 'skills', weight: 4, status: esScore.status, score: esScore.score, maxScore: 4, finding: esScore.finding, action: esScore.action });
  
  const ssScore = auditSkillsShown(profile.experience, profile.projects, profile.skills);
  criteria.push({ id: 'skills-shown', category: 'skills', weight: 2, status: ssScore.status, score: ssScore.score, maxScore: 2, finding: ssScore.finding, action: ssScore.action });
  
  const tsScore = auditTopSkills(profile.skills, analysis.techSkillCount);
  criteria.push({ id: 'top-skills', category: 'skills', weight: 6, status: tsScore.status, score: tsScore.score, maxScore: 6, finding: tsScore.finding, action: tsScore.action });
  
  const sbgScore = auditSpecificBeforeGeneral(profile.skills);
  criteria.push({ id: 'specific-before-general', category: 'skills', weight: 3, status: sbgScore.status, score: sbgScore.score, maxScore: 3, finding: sbgScore.finding, action: sbgScore.action });
  
  // COMPLETENESS (15 pts)
  criteria.push({ id: 'photo', category: 'completeness', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  criteria.push({ id: 'verification', category: 'completeness', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  criteria.push({ id: 'custom-url', category: 'completeness', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  
  const eduScore = profile.education.length >= 1 ? { status: 'pass' as const, score: 2, finding: 'An Education section was found.', action: '' } : { status: 'fail' as const, score: 0, finding: 'No Education section found.', action: 'Add your education details.' };
  criteria.push({ id: 'education', category: 'completeness', weight: 2, status: eduScore.status, score: eduScore.score, maxScore: 2, finding: eduScore.finding, action: eduScore.action });
  
  const crScore = profile.currentRole && profile.currentRole.length > 3 
    ? { status: 'warn' as const, score: 2, finding: 'A current role exists but may lack detail.', action: 'List your current internship, role, or a relevant project with a short description.' }
    : { status: 'fail' as const, score: 0, finding: 'No current position or project evidence detected.', action: 'List your current internship, role, or a relevant project with a short description.' };
  criteria.push({ id: 'current-role', category: 'completeness', weight: 4, status: crScore.status, score: crScore.score, maxScore: 4, finding: crScore.finding, action: crScore.action });
  
  criteria.push({ id: 'banner', category: 'completeness', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  
  // WRITING (25 pts)
  const adScore = auditAboutDetail(profile.about);
  criteria.push({ id: 'about-detail', category: 'writing', weight: 8, status: adScore.status, score: adScore.score, maxScore: 8, finding: adScore.finding, action: adScore.action });
  
  const coScore = auditContributions(profile.experience);
  criteria.push({ id: 'contributions', category: 'writing', weight: 6, status: coScore.status, score: coScore.score, maxScore: 6, finding: coScore.finding, action: coScore.action });
  
  const resScore = auditResults(profile.about, profile.experience, profile.projects);
  criteria.push({ id: 'results', category: 'writing', weight: 5, status: resScore.status, score: resScore.score, maxScore: 5, finding: resScore.finding, action: resScore.action });
  
  const clScore = auditClaims(profile.about, profile.experience);
  criteria.push({ id: 'claims', category: 'writing', weight: 4, status: clScore.status, score: clScore.score, maxScore: 4, finding: clScore.finding, action: clScore.action });
  
  const rdScore = auditReadability(profile.about, profile.experience);
  criteria.push({ id: 'readability', category: 'writing', weight: 2, status: rdScore.status, score: rdScore.score, maxScore: 2, finding: rdScore.finding, action: rdScore.action });
  
  // PROOF OF WORK (10 pts)
  criteria.push({ id: 'recommendations', category: 'proof-of-work', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  criteria.push({ id: 'featured', category: 'proof-of-work', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  
  const certScore = profile.certifications.length >= 1 
    ? { status: 'pass' as const, score: 2, finding: `At least one certification was found (${profile.certifications.length} total).`, action: '' }
    : { status: 'fail' as const, score: 0, finding: 'No certifications found.', action: 'Add relevant certifications to strengthen your profile.' };
  criteria.push({ id: 'certifications', category: 'proof-of-work', weight: 2, status: certScore.status, score: certScore.score, maxScore: 2, finding: certScore.finding, action: certScore.action });
  
  const pwScore = auditProofOfWork(profile.experience, profile.projects, profile.certifications);
  criteria.push({ id: 'proof-of-work', category: 'proof-of-work', weight: 3, status: pwScore.status, score: pwScore.score, maxScore: 3, finding: pwScore.finding, action: pwScore.action });
  
  // ACTIVITY (5 pts) - all unchecked for PDF
  criteria.push({ id: 'recent-posts', category: 'activity', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  criteria.push({ id: 'connections', category: 'activity', weight: 0, status: 'unchecked', score: 0, maxScore: 0, finding: '', action: '', couldNotCheck: true });
  
  let totalScore = 0, totalChecked = 0, totalPossible = 0;
  for (const c of criteria) {
    if (!c.couldNotCheck) { totalScore += c.score; totalPossible += c.maxScore; totalChecked++; }
  }
  
  const overallScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  const checkedPercent = Math.round((totalChecked / criteria.length) * 100);
  
  const topActions = generateTopActions(profile, criteria, analysis);
  const headlineSuggestions = generateHeadlineSuggestions(profile);
  const aboutOutline = generateAboutOutline(profile);
  
  return { overallScore, totalChecked, totalPossible, checkedPercent, categories: Object.keys(CATEGORY_LABELS) as AuditCategory[], criteria, topActions, headlineSuggestions, aboutOutline };
}

function auditHeadline(headline: string, mlCount: number) {
  if (!headline) return { status: 'fail' as const, score: 0, finding: 'No headline found.', action: 'Add a headline that includes your target role and key skills.' };
  const hasRole = /\b(intern|engineer|scientist|analyst|developer|manager|lead|director|specialist|consultant|researcher|founder|student)\b/i.test(headline);
  const hasSkill = /\b(machine learning|ml|ai|deep learning|data science|python|typescript|react|aws|sql|nlp|computer vision)\b/i.test(headline);
  const hasKeywordStuffing = (headline.match(/\|/g) || []).length > 5;
  if (hasRole && hasSkill && !hasKeywordStuffing) return { status: 'pass' as const, score: 8, finding: 'The headline names key skills and a role direction without excessive keyword stuffing.', action: '' };
  if (hasRole || hasSkill) return { status: 'warn' as const, score: 5, finding: 'The headline includes some relevant terms but could better highlight your target role or key skills.', action: 'Include your target role and 2-3 key skills in your headline.' };
  return { status: 'fail' as const, score: 0, finding: 'The headline lacks clear role or skill indicators.', action: 'Add your target role and relevant skills to your headline.' };
}

function auditClearHeadline(headline: string, currentRole: string) {
  if (!headline) return { status: 'fail' as const, score: 0, finding: 'No headline to evaluate.', action: 'Add a headline.' };
  const actionWords = /\b(builds?|improv(?:ed|ing)?|develops?|creates?|leads?|manages?|delivers?|designs?|architects?|solves?|transforms?|optimizes?|automates?|deploys?|operates?|scales?|drives?|enables?)\b/i;
  const hasAction = actionWords.test(headline);
  const hasRoleNearStart = /^\s*(engineer|scientist|analyst|developer|intern|researcher|student|specialist|consultant|lead|director|founder)/i.test(headline);
  let score = 0;
  if (hasRoleNearStart) score += 2;
  if (hasAction) score += 2;
  if (hasRoleNearStart && hasAction) return { status: 'pass' as const, score: 4, finding: 'The headline clearly states the role and what the person builds or improves.', action: '' };
  if (hasRoleNearStart || hasAction) return { status: 'warn' as const, score: 2, finding: 'The headline states a direction but does not clearly explain what the person builds, improves, or contributes.', action: 'Put your target role and the kind of work you contribute near the start of your headline.' };
  return { status: 'fail' as const, score: 0, finding: 'The headline does not clearly explain the role or contribution.', action: 'Start your headline with your target role and key contribution.' };
}

function auditAboutTerms(about: string, techCount: number) {
  if (!about) return { status: 'fail' as const, score: 0, finding: 'No About section found.', action: 'Add an About section with relevant technical terms.' };
  const techTerms = ['python', 'javascript', 'typescript', 'react', 'sql', 'aws', 'azure', 'machine learning', 'deep learning', 'data', 'api', 'docker', 'kubernetes', 'git', 'tensorflow', 'pytorch'];
  const foundTerms = techTerms.filter(t => about.toLowerCase().includes(t.toLowerCase()));
  let score = 0;
  if (foundTerms.length >= 5) score = 6;
  else if (foundTerms.length >= 3) score = 4;
  else if (foundTerms.length >= 1) score = 3;
  if (score >= 5) return { status: 'pass' as const, score, finding: `The About section includes ${foundTerms.length} relevant technical terms naturally integrated.`, action: '' };
  if (score >= 3) return { status: 'warn' as const, score, finding: `The About section includes ${foundTerms.length} relevant terms, but they appear mainly as a broad list.`, action: 'Work relevant terms naturally into About, supported by your profile.' };
  return { status: 'fail' as const, score, finding: 'The About section lacks relevant technical terms.', action: 'Add relevant programming and technical terms to your About section.' };
}

function auditSkillsInWork(experience: any[], projects: any[], mlCount: number) {
  const allWorkText = [...experience.map(e => e.description), ...projects.map(p => p.description)].join(' ').toLowerCase();
  const mlSkills = ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'scikit-learn', 'nlp', 'sql', 'react', 'typescript', 'aws', 'docker'];
  const foundInWork = mlSkills.filter(s => allWorkText.includes(s.toLowerCase()));
  let score = 0;
  if (foundInWork.length >= 2) score = 4;
  else if (foundInWork.length >= 1) score = 2;
  if (score >= 4) return { status: 'pass' as const, score, finding: `Found ${foundInWork.length} ML/tech skills demonstrated in role and project descriptions.`, action: '' };
  if (score >= 2) return { status: 'warn' as const, score, finding: `Only ${foundInWork.length} ML/tech skill(s) found in work descriptions.`, action: 'Add one or two relevant skills you genuinely used to a role or project description.' };
  return { status: 'fail' as const, score, finding: 'No ML/tech skills found in role or project text.', action: 'Add one or two relevant skills you genuinely used to a role or project description.' };
}

function auditEnoughSkills(skills: string[], techCount: number) {
  const count = skills.length;
  if (count >= 5) return { status: 'pass' as const, score: 4, finding: `The audit could read ${count} skills; this meets the threshold.`, action: '' };
  if (count >= 3) return { status: 'warn' as const, score: 2, finding: `Only ${count} skills were read. A LinkedIn PDF may include only the first few.`, action: 'Ensure your top skills include technical and role-relevant terms.' };
  return { status: 'fail' as const, score: 0, finding: `Only ${count} skills were read.`, action: 'Add more relevant skills to your profile.' };
}

function auditSkillsShown(experience: any[], projects: any[], skills: string[]) {
  const allWorkText = [...experience.map(e => e.description), ...projects.map(p => p.description)].join(' ').toLowerCase();
  const topSkills = skills.slice(0, 5);
  const shown = topSkills.filter(s => allWorkText.includes(s.toLowerCase()));
  let score = 0;
  if (shown.length >= 2) score = 2;
  if (score >= 2) return { status: 'pass' as const, score, finding: 'Skills are shown in role or project descriptions.', action: '' };
  return { status: 'fail' as const, score, finding: 'No examples showing where you used your strongest skills.', action: 'Show where you used your strongest skills in a role or project description.' };
}

function auditTopSkills(skills: string[], techCount: number) {
  const top8 = skills.slice(0, 8);
  const techInTop = top8.filter(s => /\b(python|javascript|typescript|react|sql|aws|docker|git|tensorflow|pytorch|machine learning|data science|node|api|kubernetes|terraform|java|c\+\+|go|rust)\b/i.test(s)).length;
  let score = 0;
  if (techInTop >= 5) score = 6;
  else if (techInTop >= 3) score = 4;
  else if (techInTop >= 1) score = 2;
  if (score >= 6) return { status: 'pass' as const, score, finding: `5+ technical skills appear in the top 8.`, action: '' };
  if (score >= 2) return { status: 'warn' as const, score, finding: `Only ${techInTop} technical skill(s) in the top 8. Generic traits lead the list.`, action: 'Move concrete tools and methods ahead of generic traits in Skills.' };
  return { status: 'fail' as const, score, finding: 'None of the first 8 skills are concrete technical tools/methods.', action: 'Move relevant technical skills closer to the top of your Skills section.' };
}

function auditSpecificBeforeGeneral(skills: string[]) {
  const genericTraits = ['communication', 'leadership', 'teamwork', 'problem-solving', 'creativity', 'adaptability', 'critical thinking', 'collaboration', 'initiative'];
  const first5 = skills.slice(0, 5);
  const genericCount = first5.filter(s => genericTraits.some(g => s.toLowerCase().includes(g))).length;
  let score = 0;
  if (genericCount === 0) score = 3;
  else if (genericCount === 1) score = 2;
  else if (genericCount <= 2) score = 1;
  if (score >= 3) return { status: 'pass' as const, score, finding: 'Specific tools and methods lead before general traits.', action: '' };
  if (score >= 1) return { status: 'warn' as const, score, finding: `${genericCount} generic trait(s) appear before specific skills.`, action: 'Move concrete tools and methods ahead of generic traits in Skills.' };
  return { status: 'fail' as const, score, finding: 'Generic traits dominate the top of the skills list.', action: 'Prioritize concrete technical skills over soft skills at the top.' };
}

function auditAboutDetail(about: string) {
  if (!about) return { status: 'fail' as const, score: 0, finding: 'No About section found.', action: 'Add an About section with direction and proof points.' };
  const hasDirection = /\b(want|seeking|aiming|focused|passionate|interested|exploring)\b/i.test(about);
  const hasProof = /\d+%|\$\d+|\d+\s*k|m|\d+\s*(users|clients|projects|teams|years)\b/i.test(about);
  const hasNextStep = /\b(next|future|goal|looking|want|seeking|aiming)\b/i.test(about);
  let score = 0;
  if (hasDirection) score += 3;
  if (hasProof) score += 3;
  if (hasNextStep) score += 2;
  if (score >= 7) return { status: 'pass' as const, score, finding: 'The About section gives clear direction, proof of work, and a specific next step.', action: '' };
  if (score >= 4) return { status: 'warn' as const, score, finding: 'The About section gives a general direction and personal principles but provides little proof of work or a specific next step.', action: 'Add your direction and one concrete proof point already present on the profile.' };
  return { status: 'fail' as const, score, finding: 'The About section lacks direction, proof, or next steps.', action: 'Add career direction, a concrete proof point, and a specific learning goal.' };
}

function auditContributions(experience: any[]) {
  const allDesc = experience.map(e => e.description).join(' ').toLowerCase();
  const actionVerbs = /\b(build|developed|created|led|managed|designed|implemented|delivered|solved|improved|reduced|increased|automated|deployed|architected|optimized|orchestrated|mentored)\b/i;
  const hasOwnership = /\b(my\s+role|led|owned|responsible|spearheaded|championed)\b/i.test(allDesc);
  const hasActions = actionVerbs.test(allDesc);
  let score = 0;
  if (hasActions) score += 3;
  if (hasOwnership) score += 3;
  if (score >= 6) return { status: 'pass' as const, score, finding: 'Experience descriptions show specific actions and ownership.', action: '' };
  if (score >= 3) return { status: 'warn' as const, score, finding: 'The experience description explains the company but lacks specific actions or ownership.', action: 'Make role descriptions show your contribution and ownership without overstating either.' };
  return { status: 'fail' as const, score, finding: 'The experience mainly explains the company and a future start rather than showing specific actions or ownership.', action: 'Make role descriptions show your contribution and ownership without overstating either.' };
}

function auditResults(about: string, experience: any[], projects: any[]) {
  const allText = [about, ...experience.map(e => e.description), ...projects.map(p => p.description)].join(' ').toLowerCase();
  const resultPatterns = [
    /\d+%/, /\$\d+/, /\d+\s*[kKmM]/,
    /\d+\s*(users|customers|clients|employees|team|members|projects|revenue|efficiency)\b/i,
    /improv(?:ed|ement|ing)\s+\w+/i, /reduced\s+\w+/i, /increased\s+\w+/i,
    /built\s+\w+/i, /developed\s+\w+/i, /launched\s+\w+/i, /delivered\s+\w+/i,
  ];
  const foundResults = resultPatterns.filter(p => p.test(allText)).length;
  let score = 0;
  if (foundResults >= 3) score = 5;
  else if (foundResults >= 2) score = 3;
  else if (foundResults >= 1) score = 1;
  if (score >= 5) return { status: 'pass' as const, score, finding: 'The profile includes concrete outcomes, scope, and measurable results.', action: '' };
  if (score >= 1) return { status: 'warn' as const, score, finding: `Only ${foundResults} result indicator(s) found. The profile provides limited outcomes or scope.`, action: 'Add truthful scope or a concrete result to one role or project when you have it.' };
  return { status: 'fail' as const, score, finding: 'The profile provides no outcomes, scope, users, reliability evidence, or other concrete results.', action: 'Add truthful scope or a concrete result to one role or project when you have it.' };
}

function auditClaims(about: string, experience: any[]) {
  const allText = about + ' ' + experience.map(e => e.description).join(' ');
  const vagueClaims = [
    /creative\s+solutions?/i, /unique\s+think/i, /benefit\s+humanit/i,
    /passionate\s+about/i, /results\s+driven/i, /self\s+starter/i,
    /go-getter/i, /detail\s+oriented/i, /hard\s+worker/i,
    /out-of-the-box/i, /innovative\s+thinker/i,
  ];
  const foundVague = vagueClaims.filter(p => p.test(allText)).length;
  let score = 0;
  if (foundVague === 0) score = 4;
  else if (foundVague === 1) score = 2;
  else if (foundVague <= 2) score = 1;
  if (score >= 4) return { status: 'pass' as const, score, finding: 'Claims are specific and supported by evidence.', action: '' };
  if (score >= 1) return { status: 'warn' as const, score, finding: `The profile relies on ${foundVague} vague claim(s) such as creative solutions, unique thinking, and benefiting humanity without supporting evidence.`, action: 'Replace a broad claim with a specific example already supported by the profile.' };
  return { status: 'fail' as const, score, finding: 'The profile relies heavily on vague claims without supporting evidence.', action: 'Replace broad claims with specific examples supported by the profile.' };
}

function auditReadability(about: string, experience: any[]) {
  const allText = about + ' ' + experience.map(e => e.description).join('');
  const issues: string[] = [];
  if (allText.match(/\s{2,}/g)) issues.push('multiple spaces');
  if (allText.match(/\n{3,}/g)) issues.push('excessive blank lines');
  if (allText.match(/[A-Z]{3,}/g)) issues.push('excessive capitalization');
  let score = 0;
  if (issues.length === 0) score = 2;
  else if (issues.length <= 2) score = 1;
  if (score >= 2) return { status: 'pass' as const, score, finding: 'Writing is clean with consistent grammar and formatting.', action: '' };
  return { status: 'fail' as const, score, finding: `The writing has ${issues.join(', ')} that reduce readability.`, action: 'Tighten wording and make tense and grammar consistent.' };
}

function auditProofOfWork(experience: any[], projects: any[], certifications: any[]) {
  const hasRole = experience.length > 0;
  const hasCerts = certifications.length > 0;
  const hasProjects = projects.length > 0;
  let score = 0;
  if (hasRole) score += 1;
  if (hasCerts) score += 1;
  if (hasProjects) score += 1;
  if (score >= 3) return { status: 'pass' as const, score, finding: 'The profile surfaces real roles, projects, and credentials with enough context.', action: '' };
  if (score >= 2) return { status: 'warn' as const, score, finding: 'The profile lists an internship and certifications but gives limited detail showing substantive work or results.', action: 'Surface one real role, project, credential, artifact, or result with enough context to verify it.' };
  return { status: 'fail' as const, score, finding: 'Limited proof of work is visible on the profile.', action: 'Add a real role, project, credential, or result with supporting context.' };
}

function generateTopActions(profile: ParsedProfile, criteria: Criterion[], analysis: any): TopAction[] {
  const actions: TopAction[] = [];
  const topSkillsCrit = criteria.find(c => c.id === 'top-skills');
  if (topSkillsCrit && topSkillsCrit.status === 'fail') {
    actions.push({ rank: 1, title: 'Move relevant skills you genuinely use closer to the top of your Skills section.', potentialIncrease: 6, timeEstimate: 'Usually a few minutes', reason: 'None of the first 8 skills matched technical comparisons.' });
  }
  const contribCrit = criteria.find(c => c.id === 'contributions');
  if (contribCrit && contribCrit.status === 'fail') {
    actions.push({ rank: 2, title: 'Make role descriptions show your contribution and ownership without overstating either.', potentialIncrease: 6, timeEstimate: 'May take about an hour', reason: 'The experience description mainly explains the company and a future start rather than showing specific actions or ownership.' });
  }
  const resultsCrit = criteria.find(c => c.id === 'results');
  if (resultsCrit && resultsCrit.status === 'fail') {
    actions.push({ rank: 3, title: 'Add truthful scope or a concrete result to one role or project when you have it.', potentialIncrease: 5, timeEstimate: 'May take about an hour', reason: 'The profile provides no outcomes, scope, users, reliability evidence, or other concrete results.' });
  }
  const clearHeadlineCrit = criteria.find(c => c.id === 'headline-clear');
  if (clearHeadlineCrit && clearHeadlineCrit.status !== 'pass') {
    actions.push({ rank: actions.length + 1, title: 'Make your headline clearly state your target role and key contribution.', potentialIncrease: 2, timeEstimate: 'Usually a few minutes', reason: 'The headline does not clearly explain what you build, improve, or contribute.' });
  }
  const aboutDetailCrit = criteria.find(c => c.id === 'about-detail');
  if (aboutDetailCrit && aboutDetailCrit.status !== 'pass') {
    actions.push({ rank: actions.length + 1, title: 'Add direction and a concrete proof point to your About section.', potentialIncrease: 4, timeEstimate: 'May take about 30 minutes', reason: 'The About section gives a general direction but provides little proof of work or a specific next step.' });
  }
  return actions.slice(0, 3);
}

function generateHeadlineSuggestions(profile: ParsedProfile): string[] {
  const suggestions: string[] = [];
  const role = profile.currentRole || 'Machine Learning';
  const skills = profile.skills.slice(0, 3);
  const edu = profile.education[0];
  suggestions.push(`${role} | ${skills.slice(0, 2).join(' | ')}`);
  suggestions.push(skills.join(' | '));
  if (edu) suggestions.push(`${edu.school ? edu.school.split(' ')[0] + ' Comp-Sci' : 'Student'} | ${role} focusing on ${skills[0] || 'Machine Learning'} | Improving my Problem Solving Skills`);
  return suggestions;
}

function generateAboutOutline(profile: ParsedProfile): string {
  const headlineWithoutEmail = profile.headline.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '').trim();
  const direction = headlineWithoutEmail || 'your target role';
  const skills = profile.skills.slice(0, 2);
  const goal = skills[0] ? `a specific learning goal in ${skills[0]}` : 'a specific learning goal';
  return `Open with the career direction you selected for this audit (${direction}). Connect two or three listed skills to work already described on the profile (${skills.join(', ')}). Close with ${goal}.`;
}
