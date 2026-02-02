// Logic-based ATS Scoring Engine
// Replaces Gemini for basic ATS score calculation
// AI is optional for improvement suggestions only

export interface ATSScoreResult {
    overallScore: number;
    sectionScores: {
        keywords: number;      // 0-30
        impact: number;        // 0-30
        formatting: number;    // 0-20
        completeness: number;  // 0-20
    };
    issues: ATSIssue[];
    recommendations: string[];
}

export interface ATSIssue {
    title: string;
    location: string;
    description: string;
    highlight: string;
    suggestion: string;
    severity: 'critical' | 'warning' | 'info';
}

// Common ATS keywords by category
const COMMON_SKILLS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'react', 'angular', 'vue',
    'node', 'express', 'django', 'flask', 'spring', 'sql', 'nosql', 'mongodb',
    'postgresql', 'mysql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
    'agile', 'scrum', 'leadership', 'communication', 'problem-solving', 'teamwork'
];

const ACTION_VERBS = [
    'achieved', 'built', 'created', 'delivered', 'developed', 'designed', 'enhanced',
    'established', 'executed', 'generated', 'implemented', 'improved', 'increased',
    'launched', 'led', 'managed', 'optimized', 'reduced', 'resolved', 'streamlined',
    'spearheaded', 'transformed', 'upgraded', 'accelerated', 'automated', 'consolidated'
];

const REQUIRED_SECTIONS = [
    { name: 'contact', keywords: ['email', 'phone', 'linkedin', 'address', 'location'] },
    { name: 'experience', keywords: ['experience', 'work', 'employment', 'professional'] },
    { name: 'education', keywords: ['education', 'degree', 'university', 'college', 'bachelor', 'master'] },
    { name: 'skills', keywords: ['skills', 'technologies', 'proficiencies', 'competencies'] }
];

/**
 * Calculate ATS score using pure logic (no AI required)
 */
export function calculateATSScore(
    resumeText: string,
    jobDescription: string = ''
): ATSScoreResult {
    const resumeLower = resumeText.toLowerCase();
    const jdLower = jobDescription.toLowerCase();
    const issues: ATSIssue[] = [];
    const recommendations: string[] = [];

    // 1. Keyword Matching Score (0-30)
    const keywordScore = calculateKeywordScore(resumeLower, jdLower, issues, recommendations);

    // 2. Impact & Experience Score (0-30)
    const impactScore = calculateImpactScore(resumeLower, issues, recommendations);

    // 3. Formatting & Structure Score (0-20)
    const formattingScore = calculateFormattingScore(resumeText, issues, recommendations);

    // 4. Completeness Score (0-20)
    const completenessScore = calculateCompletenessScore(resumeLower, issues, recommendations);

    // Calculate overall score
    const overallScore = keywordScore + impactScore + formattingScore + completenessScore;

    return {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        sectionScores: {
            keywords: keywordScore,
            impact: impactScore,
            formatting: formattingScore,
            completeness: completenessScore
        },
        issues: issues.slice(0, 5), // Return top 5 issues
        recommendations: recommendations.slice(0, 5)
    };
}

function calculateKeywordScore(
    resumeLower: string,
    jdLower: string,
    issues: ATSIssue[],
    recommendations: string[]
): number {
    let score = 15; // Base score

    // If job description provided, match against it
    if (jdLower.length > 50) {
        const jdWords = jdLower.split(/\s+/).filter(w => w.length > 3);
        const matchedJdWords = jdWords.filter(word => resumeLower.includes(word));
        const matchRatio = matchedJdWords.length / Math.max(jdWords.length, 1);
        score = Math.round(30 * matchRatio);

        if (matchRatio < 0.3) {
            issues.push({
                title: 'Low Keyword Match',
                location: 'Overall Resume',
                description: 'Your resume matches less than 30% of job description keywords.',
                highlight: 'Consider tailoring your resume to the specific job posting.',
                suggestion: 'Add relevant keywords from the job description to your summary and skills.',
                severity: 'critical'
            });
        }
    } else {
        // Match against common skills
        const matchedSkills = COMMON_SKILLS.filter(skill => resumeLower.includes(skill));
        score = Math.min(30, 10 + matchedSkills.length * 2);

        if (matchedSkills.length < 5) {
            recommendations.push('Add more industry-standard skills to improve ATS matching.');
        }
    }

    return Math.min(30, score);
}

function calculateImpactScore(
    resumeLower: string,
    issues: ATSIssue[],
    recommendations: string[]
): number {
    let score = 10; // Base score

    // Check for action verbs
    const usedVerbs = ACTION_VERBS.filter(verb => resumeLower.includes(verb));
    score += Math.min(10, usedVerbs.length);

    if (usedVerbs.length < 3) {
        issues.push({
            title: 'Weak Action Verbs',
            location: 'Experience Section',
            description: 'Resume lacks strong action verbs that demonstrate impact.',
            highlight: 'Use verbs like "achieved", "delivered", "implemented", "led".',
            suggestion: 'Start each bullet point with a powerful action verb.',
            severity: 'warning'
        });
    }

    // Check for quantifiable results (numbers, percentages)
    const numberMatches = resumeLower.match(/\d+%|\$\d+|\d+\+?\s*(users|customers|clients|projects|team|years)/g);
    const hasMetrics = numberMatches && numberMatches.length >= 3;

    if (hasMetrics) {
        score += 10;
    } else {
        issues.push({
            title: 'Missing Quantifiable Results',
            location: 'Experience Section',
            description: 'Resume lacks specific numbers and metrics.',
            highlight: 'Add percentages, dollar amounts, team sizes, or user counts.',
            suggestion: 'Quantify your achievements: "Increased sales by 25%" instead of "Improved sales".',
            severity: 'critical'
        });
    }

    return Math.min(30, score);
}

function calculateFormattingScore(
    resumeText: string,
    issues: ATSIssue[],
    recommendations: string[]
): number {
    let score = 15; // Base score
    const lines = resumeText.split('\n').filter(l => l.trim());

    // Check for reasonable length
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount < 200) {
        score -= 5;
        issues.push({
            title: 'Resume Too Short',
            location: 'Overall Resume',
            description: 'Resume appears to be too brief.',
            highlight: 'Aim for 400-800 words for optimal ATS parsing.',
            suggestion: 'Expand on your experience and add more relevant details.',
            severity: 'warning'
        });
    } else if (wordCount > 1500) {
        score -= 3;
        recommendations.push('Consider condensing your resume - aim for 1-2 pages.');
    }

    // Check for section headers
    const hasHeaders = /^(experience|education|skills|summary|objective|certifications|projects)/im.test(resumeText);
    if (hasHeaders) {
        score += 5;
    } else {
        issues.push({
            title: 'Missing Section Headers',
            location: 'Structure',
            description: 'Cannot detect clear section headers.',
            highlight: 'Use standard headers: Experience, Education, Skills, Summary.',
            suggestion: 'Add clear, standard section headers for better ATS parsing.',
            severity: 'warning'
        });
    }

    return Math.min(20, score);
}

function calculateCompletenessScore(
    resumeLower: string,
    issues: ATSIssue[],
    recommendations: string[]
): number {
    let score = 5; // Base score
    const missingSections: string[] = [];

    // Check for required sections
    REQUIRED_SECTIONS.forEach(section => {
        const hasSection = section.keywords.some(keyword => resumeLower.includes(keyword));
        if (hasSection) {
            score += 4;
        } else {
            missingSections.push(section.name);
        }
    });

    if (missingSections.length > 0) {
        issues.push({
            title: 'Missing Required Sections',
            location: 'Resume Structure',
            description: `Missing sections: ${missingSections.join(', ')}`,
            highlight: 'ATS systems expect these standard sections.',
            suggestion: `Add ${missingSections.join(' and ')} sections to your resume.`,
            severity: missingSections.length > 1 ? 'critical' : 'warning'
        });
    }

    // Check for email
    if (!resumeLower.includes('@')) {
        score -= 3;
        issues.push({
            title: 'Missing Email Address',
            location: 'Contact Information',
            description: 'No email address detected.',
            highlight: 'Recruiters need a way to contact you.',
            suggestion: 'Add your professional email address at the top of your resume.',
            severity: 'critical'
        });
    }

    return Math.min(20, Math.max(0, score));
}

/**
 * Extract keywords from job description for matching
 */
export function extractKeywords(jobDescription: string): string[] {
    const words = jobDescription.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);

    // Get unique words with frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Return top keywords by frequency
    return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
}
