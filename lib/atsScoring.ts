import { ResumeData } from '../types';

// Logic-based ATS Scoring Engine
// Replaces Gemini for basic ATS score calculation
// AI is optional for improvement suggestions only

export interface ATSScoreResult {
    overallScore: number;
    sectionScores: {
        keywords: number;      // 0-30
        impact: number;        // 0-30 or 40
        formatting: number;    // 0-20
        completeness: number;  // 0-10 or part of Presence
    };
    breakdown: {
        presence: number;    // 40
        keywords: number;    // 30
        formatting: number;  // 20
        hygiene: number;     // 10
    };
    issues: ATSIssue[];
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

/**
 * Metadata Marker Constants
 * Used to inject and extract hidden data from PDF text
 */
export const METADATA_START_MARKER = "###NXT_DATA_START###";
export const METADATA_END_MARKER = "###NXT_DATA_END###";

/**
 * Extract hidden metadata from PDF text
 */
function extractMetadata(text: string): ResumeData | null {
    try {
        // Attempt 1: Look for markers
        const start = text.indexOf(METADATA_START_MARKER);
        const end = text.indexOf(METADATA_END_MARKER);

        if (start !== -1 && end !== -1 && end > start) {
            let encodedStr = text.substring(start + METADATA_START_MARKER.length, end).trim();
            // Sanitize: PDF extraction might insert newlines or spaces into the base64 string
            encodedStr = encodedStr.replace(/\s/g, '');

            try {
                // Robust Unicode Decoding:
                // 1. Try standard binary-to-string (works if platform supports TextDecoder)
                // 2. Fallback to escape/decodeURIComponent pattern (Browser legacy)

                const decodedStr = (() => {
                    try {
                        const binaryParams = atob(encodedStr);
                        const bytes = new Uint8Array(binaryParams.length);
                        for (let i = 0; i < binaryParams.length; i++) {
                            bytes[i] = binaryParams.charCodeAt(i);
                        }
                        return new TextDecoder().decode(bytes);
                    } catch (innerE) {
                        // console.log("TextDecoder failed, trying legacy escape", innerE);
                        // Legacy/Browser fallback
                        // @ts-ignore
                        return decodeURIComponent(escape(atob(encodedStr)));
                    }
                })();

                return JSON.parse(decodedStr);
            } catch (e) {
                console.error("Base64 decode/parse failed", e);
                // Last resort: maybe it wasn't encoded?
                return JSON.parse(encodedStr);
            }
        }
    } catch (e) {
        // console.error("Metadata extraction failed", e);
    }
    return null;
}
/**
 * Main Entry Point: Calculate ATS Score
 * Can accept raw text OR structured ResumeData
 */
export function calculateATSScore(
    input: string | ResumeData,
    jobDescription: string = ''
): ATSScoreResult {
    let data: ResumeData | null = null;
    let text = '';
    let isBuilder = false;

    // 1. Determine Input Type
    if (typeof input === 'string') {
        text = input;
        // Try to extract metadata
        const metadata = extractMetadata(text);
        if (metadata) {
            data = metadata;
            isBuilder = true;
        }
    } else {
        data = input;
        isBuilder = true;
        // Generate pseudo-text for keyword matching if needed
        text = JSON.stringify(input).toLowerCase();
    }

    const issues: ATSIssue[] = [];

    // 2. Calculate Scores

    // A. Section Presence (40 points)
    const presenceScore = calculatePresenceScore(data, text, issues);

    // B. Keyword Match (30 points)
    const keywordScore = calculateKeywordScore(data, text, jobDescription, issues);

    // C. Formatting & Readability (20 points)
    // If builder, we guarantee full points here
    const formattingScore = isBuilder ? 20 : calculateFormattingScore(text, issues);

    // D. ATS Hygiene (10 points)
    // If builder, we guarantee full points here
    const hygieneScore = isBuilder ? 10 : calculateHygieneScore(text, issues);

    let overallScore = presenceScore + keywordScore + formattingScore + hygieneScore;

    // 3. BUILDER GUARANTEE
    // If source is builder and essential sections are present, guarantee >= 90
    if (isBuilder && presenceScore >= 30) {
        overallScore = Math.max(90, overallScore);

        // Remove critical issues if we are boosting score
        if (overallScore >= 90) {
            // Keep only warnings/info
            // Assuming builder output is structurally sound
        }
    }

    return {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        sectionScores: {
            // Mapping back to the UI expected keys if they differ, 
            // but let's encourage using the new 'breakdown' for clarity
            keywords: keywordScore,
            impact: presenceScore * 0.75, // Approx mapping for legacy UI
            formatting: formattingScore,
            completeness: hygieneScore * 2 // Approx mapping for legacy UI
        },
        breakdown: {
            presence: presenceScore,
            keywords: keywordScore,
            formatting: formattingScore,
            hygiene: hygieneScore
        },
        issues: issues.slice(0, 5)
    };
}

/**
 * Score A: Section Presence (40 points)
 */
function calculatePresenceScore(data: ResumeData | null, text: string, issues: ATSIssue[]): number {
    let score = 0;
    const missing: string[] = [];

    // Helper to check
    const has = (keyword: string, sectionData?: any) => {
        if (data) {
            if (keyword === 'contact') return !!(data.email || data.phone);
            if (keyword === 'experience') return data.experience && data.experience.length > 0;
            if (keyword === 'education') return data.education && data.education.length > 0;
            if (keyword === 'skills') return !!data.hardSkills;
            return false;
        } else {
            const lower = text.toLowerCase();
            // Simple heuristic
            return lower.includes(keyword) || lower.includes(keyword === 'contact' ? 'email' : keyword);
        }
    };

    if (has('contact')) score += 10; else missing.push('Contact Info');
    if (has('experience')) score += 10; else missing.push('Experience');
    if (has('education')) score += 10; else missing.push('Education');
    if (has('skills')) score += 10; else missing.push('Skills');

    if (missing.length > 0) {
        issues.push({
            title: 'Missing Sections',
            location: 'structure',
            description: `Missing: ${missing.join(', ')}`,
            highlight: 'Add these standard sections.',
            suggestion: `Include ${missing.join(', ')} to pass ATS filters.`,
            severity: 'critical'
        });
    }

    return score;
}

/**
 * Score B: Keyword Match (30 points)
 */
function calculateKeywordScore(
    data: ResumeData | null,
    text: string,
    jd: string,
    issues: ATSIssue[]
): number {
    let score = 0;
    const resumeTextLowercase = data
        ? (JSON.stringify(data.experience) + " " + data.hardSkills + " " + data.summary).toLowerCase() // Targeted text
        : text.toLowerCase();

    // 1. If Job Description exists -> Smart Match
    if (jd && jd.length > 50) {
        const jdLower = jd.toLowerCase();
        // Extract nouns/keywords from JD (simple approach without NLP lib)
        // We actally want to check if resume contains words from JD.
        const jdWords = jdLower.split(/\W+/).filter(w => w.length > 4);
        const uniqueJdWords = [...new Set(jdWords)];

        let matchCount = 0;
        const totalToCheck = Math.min(uniqueJdWords.length, 20); // Check top 20 unique long words

        for (const word of uniqueJdWords.slice(0, 20)) {
            if (resumeTextLowercase.includes(word)) matchCount++;
        }

        // 30 points max
        // If we match 50% of substantial JD words, we get full points?
        // Let's say matching 10 unique keywords is excellent
        score = Math.min(30, (matchCount / 10) * 30);
    }
    // 2. No JD -> General Competency Check
    else {
        // If it's a builder resume, we assume they selected a role which implies some relevance.
        // We'll give 25 points baseline if skills are populated.
        if (data && data.hardSkills && data.hardSkills.length > 5) {
            score = 25;
        } else {
            // Fallback for raw text
            const matchedCommon = COMMON_SKILLS.filter(s => resumeTextLowercase.includes(s));
            score = Math.min(30, 10 + (matchedCommon.length * 2));
        }
    }

    // Bonus: Action Verbs
    // Only check if score < 30
    if (score < 30) {
        const actionVerbs = ['managed', 'led', 'developed', 'created', 'built', 'designed'];
        if (resumeTextLowercase.match(new RegExp(actionVerbs.join('|'), 'i'))) {
            score = Math.min(30, score + 5);
        }
    }

    return Math.floor(score);
}

/**
 * Score C: Formatting (20 points)
 * Builder resumes automatically get 20.
 */
function calculateFormattingScore(text: string, issues: ATSIssue[]): number {
    let score = 20;

    // Check length
    const words = text.split(/\s+/).length;
    if (words < 100) {
        score -= 10;
        issues.push({
            title: 'Too Short',
            location: 'overall',
            description: 'Resume is too short.',
            highlight: 'Expand your content.',
            suggestion: 'Add more details.',
            severity: 'warning'
        });
    }

    // Check caps
    // This is hard on raw extracted text as PDF extraction might lose casing
    // Ignoring complex checks for MVP to ensure stability

    return Math.max(0, score);
}

/**
 * Score D: Hygiene (10 points)
 */
function calculateHygieneScore(text: string, issues: ATSIssue[]): number {
    let score = 10;

    if (text.includes('$$$') || text.includes('???')) { // Garbage chars
        score -= 5;
    }

    return Math.max(0, score);
}
