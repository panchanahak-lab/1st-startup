// Interview Scoring Engine - Rule-Based (NO AI)
// Scores interview responses on 5 dimensions without any Gemini calls

export interface ScoreDimension {
    name: string;
    score: number; // 0-5
    feedback: string;
}

export interface InterviewScore {
    totalScore: number; // Out of 25
    percentage: number;
    dimensions: ScoreDimension[];
    strengths: string[];
    improvements: string[];
    overallFeedback: string;
}

interface ScoringConfig {
    jobRole: string;
    cvKeywords: string[];
    expectedSkills: string[];
}

// Common filler words to penalize
const FILLER_WORDS = [
    'um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally',
    'sort of', 'kind of', 'i mean', 'right', 'so yeah', 'i guess'
];

// Action verbs that indicate strong answers
const ACTION_VERBS = [
    'led', 'managed', 'developed', 'created', 'implemented', 'designed',
    'built', 'improved', 'increased', 'reduced', 'achieved', 'delivered',
    'launched', 'optimized', 'streamlined', 'coordinated', 'analyzed',
    'established', 'generated', 'negotiated', 'resolved', 'trained'
];

// Quantitative indicators
const QUANTITATIVE_PATTERNS = [
    /\d+%/, /\d+ percent/, /\$[\d,]+/, /₹[\d,]+/, /\d+ (users|customers|clients)/i,
    /\d+ (months|years|weeks)/, /\d+x/, /doubled|tripled|halved/i
];

/**
 * Score CLARITY (0-5)
 * Measures: sentence structure, coherence, conciseness
 */
function scoreClarity(answer: string): ScoreDimension {
    let score = 2.5; // Base score

    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = answer.length / Math.max(sentences.length, 1);

    // Ideal sentence length is 15-25 words (~75-150 chars)
    if (avgSentenceLength > 50 && avgSentenceLength < 180) {
        score += 1;
    } else if (avgSentenceLength > 200) {
        score -= 0.5; // Too long, rambling
    }

    // Check for logical connectors
    const connectors = ['because', 'therefore', 'however', 'for example', 'specifically', 'firstly', 'secondly', 'finally'];
    const connectorCount = connectors.filter(c => answer.toLowerCase().includes(c)).length;
    if (connectorCount >= 2) score += 0.5;
    if (connectorCount >= 4) score += 0.5;

    // Penalize excessive filler words
    const fillerCount = FILLER_WORDS.filter(f =>
        answer.toLowerCase().includes(f)
    ).length;
    if (fillerCount > 3) score -= 1;
    if (fillerCount > 6) score -= 0.5;

    // Length check - too short is unclear
    if (answer.length < 50) score -= 1;

    score = Math.max(0, Math.min(5, score));

    let feedback = '';
    if (score >= 4) feedback = 'You explained things clearly and concisely';
    else if (score >= 3) feedback = 'Good clarity - try to be a bit more direct';
    else if (score >= 2) feedback = 'Try organizing your thoughts before speaking';
    else feedback = 'Focus on giving shorter, clearer answers';

    return { name: 'Clarity', score: Math.round(score * 10) / 10, feedback };
}

/**
 * Score RELEVANCE (0-5)
 * Measures: alignment with role, use of relevant keywords
 */
function scoreRelevance(answer: string, config: ScoringConfig): ScoreDimension {
    let score = 2; // Base score

    const lowerAnswer = answer.toLowerCase();

    // Check for CV keywords
    const cvKeywordMatches = config.cvKeywords.filter(k =>
        lowerAnswer.includes(k.toLowerCase())
    ).length;
    score += Math.min(cvKeywordMatches * 0.3, 1.5);

    // Check for expected skills
    const skillMatches = config.expectedSkills.filter(s =>
        lowerAnswer.includes(s.toLowerCase())
    ).length;
    score += Math.min(skillMatches * 0.4, 1);

    // Check for role-specific context
    if (lowerAnswer.includes(config.jobRole.toLowerCase().split(' ')[0])) {
        score += 0.5;
    }

    // Penalize completely off-topic (very short or generic)
    if (answer.length < 30) score -= 1;

    score = Math.max(0, Math.min(5, score));

    let feedback = '';
    if (score >= 4) feedback = 'Great job connecting your experience to the role';
    else if (score >= 3) feedback = 'Mostly on target - add more role-specific details';
    else if (score >= 2) feedback = 'Try mentioning skills from your CV more';
    else feedback = 'Link your answers more directly to the job';

    return { name: 'Relevance', score: Math.round(score * 10) / 10, feedback };
}

/**
 * Score CONFIDENCE (0-5)
 * Measures: assertive language, lack of hedging, direct answers
 */
function scoreConfidence(answer: string): ScoreDimension {
    let score = 3; // Base score

    const lowerAnswer = answer.toLowerCase();

    // Hedging words reduce confidence
    const hedgingWords = ['maybe', 'perhaps', 'i think', 'i believe', 'probably', 'might', 'could be', 'not sure', 'i guess'];
    const hedgeCount = hedgingWords.filter(h => lowerAnswer.includes(h)).length;
    score -= hedgeCount * 0.4;

    // Action verbs increase confidence
    const actionCount = ACTION_VERBS.filter(v => lowerAnswer.includes(v)).length;
    score += Math.min(actionCount * 0.3, 1);

    // First-person ownership shows confidence
    const ownershipPatterns = ['i led', 'i managed', 'i built', 'i created', 'my responsibility', 'i was responsible'];
    const ownershipCount = ownershipPatterns.filter(p => lowerAnswer.includes(p)).length;
    score += Math.min(ownershipCount * 0.4, 1);

    // Direct opening is confident
    if (!lowerAnswer.startsWith('um') && !lowerAnswer.startsWith('so') && !lowerAnswer.startsWith('well')) {
        score += 0.3;
    }

    score = Math.max(0, Math.min(5, score));

    let feedback = '';
    if (score >= 4) feedback = 'You sounded confident and sure of yourself';
    else if (score >= 3) feedback = 'Good confidence - try fewer "maybes" and "I thinks"';
    else if (score >= 2) feedback = 'Be more direct - own your accomplishments';
    else feedback = 'Project more confidence in your answers';

    return { name: 'Confidence', score: Math.round(score * 10) / 10, feedback };
}

/**
 * Score STRUCTURE (0-5)
 * Measures: STAR method usage, logical flow, examples
 */
function scoreStructure(answer: string): ScoreDimension {
    let score = 2; // Base score

    const lowerAnswer = answer.toLowerCase();

    // Check for STAR-like structure indicators
    const situationWords = ['situation', 'context', 'background', 'when i was', 'at my previous'];
    const taskWords = ['task', 'goal', 'objective', 'needed to', 'had to', 'was asked to'];
    const actionWords = ['action', 'approach', 'decided to', 'implemented', 'started by'];
    const resultWords = ['result', 'outcome', 'achieved', 'led to', 'resulted in', 'impact'];

    if (situationWords.some(w => lowerAnswer.includes(w))) score += 0.5;
    if (taskWords.some(w => lowerAnswer.includes(w))) score += 0.5;
    if (actionWords.some(w => lowerAnswer.includes(w))) score += 0.5;
    if (resultWords.some(w => lowerAnswer.includes(w))) score += 0.5;

    // Check for concrete examples
    if (lowerAnswer.includes('for example') || lowerAnswer.includes('for instance') || lowerAnswer.includes('specifically')) {
        score += 0.5;
    }

    // Check for quantitative data (shows impact)
    const hasQuantitative = QUANTITATIVE_PATTERNS.some(p => p.test(answer));
    if (hasQuantitative) score += 1;

    // Logical sequencing
    const sequenceWords = ['first', 'then', 'next', 'after that', 'finally', 'as a result'];
    const sequenceCount = sequenceWords.filter(w => lowerAnswer.includes(w)).length;
    if (sequenceCount >= 2) score += 0.5;

    score = Math.max(0, Math.min(5, score));

    let feedback = '';
    if (score >= 4) feedback = 'Great storytelling with clear examples';
    else if (score >= 3) feedback = 'Good structure - add more numbers and results';
    else if (score >= 2) feedback = 'Try the STAR format: Situation, Task, Action, Result';
    else feedback = 'Use specific examples to tell your story';

    return { name: 'Structure', score: Math.round(score * 10) / 10, feedback };
}

/**
 * Score ROLE ALIGNMENT (0-5)
 * Measures: seniority match, responsibility level, skill depth
 */
function scoreRoleAlignment(answer: string, config: ScoringConfig): ScoreDimension {
    let score = 2.5; // Base score

    const lowerAnswer = answer.toLowerCase();
    const roleLower = config.jobRole.toLowerCase();

    // Senior role indicators
    const seniorIndicators = ['led a team', 'managed', 'mentored', 'strategic', 'architecture', 'stakeholders', 'cross-functional'];
    // Junior role indicators
    const juniorIndicators = ['learned', 'assisted', 'helped', 'supported', 'participated'];

    const isSeniorRole = roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('manager') || roleLower.includes('principal');

    if (isSeniorRole) {
        const seniorMatches = seniorIndicators.filter(i => lowerAnswer.includes(i)).length;
        score += seniorMatches * 0.5;

        const juniorMatches = juniorIndicators.filter(i => lowerAnswer.includes(i)).length;
        score -= juniorMatches * 0.3;
    } else {
        // For junior roles, growth mindset is good
        if (lowerAnswer.includes('learn') || lowerAnswer.includes('grow') || lowerAnswer.includes('develop')) {
            score += 0.5;
        }
    }

    // Technical depth for technical roles
    if (roleLower.includes('developer') || roleLower.includes('engineer')) {
        const techTerms = ['api', 'database', 'algorithm', 'performance', 'testing', 'deployment', 'architecture'];
        const techCount = techTerms.filter(t => lowerAnswer.includes(t)).length;
        score += Math.min(techCount * 0.3, 1);
    }

    score = Math.max(0, Math.min(5, score));

    let feedback = '';
    if (score >= 4) feedback = 'Your experience fits this role really well';
    else if (score >= 3) feedback = 'Good fit - highlight leadership if senior role';
    else if (score >= 2) feedback = 'Show more experience relevant to this level';
    else feedback = 'Emphasize skills that match this role';

    return { name: 'Role Fit', score: Math.round(score * 10) / 10, feedback };
}

/**
 * Extract keywords from CV text
 */
export function extractCVKeywords(cvText: string): string[] {
    if (!cvText) return [];

    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

    // Extract potential keywords (words 4+ characters, not common)
    const words = cvText.toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !commonWords.has(w));

    // Count frequency and get top keywords
    const frequency: Record<string, number> = {};
    words.forEach(w => { frequency[w] = (frequency[w] || 0) + 1; });

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
}

/**
 * Extract expected skills from job role
 */
export function extractExpectedSkills(jobRole: string): string[] {
    const roleLower = jobRole.toLowerCase();

    const skillMaps: Record<string, string[]> = {
        'developer': ['javascript', 'python', 'java', 'react', 'node', 'sql', 'api', 'git'],
        'engineer': ['system', 'design', 'testing', 'deployment', 'architecture', 'performance'],
        'manager': ['leadership', 'team', 'stakeholder', 'strategy', 'planning', 'budget'],
        'analyst': ['data', 'analysis', 'excel', 'sql', 'reporting', 'insights'],
        'designer': ['design', 'user', 'ux', 'ui', 'figma', 'prototype', 'research'],
        'product': ['roadmap', 'user', 'stakeholder', 'metrics', 'agile', 'sprint'],
    };

    const skills: string[] = [];
    Object.entries(skillMaps).forEach(([role, roleSkills]) => {
        if (roleLower.includes(role)) {
            skills.push(...roleSkills);
        }
    });

    return [...new Set(skills)];
}

/**
 * Main scoring function - scores all answers
 */
export function scoreInterview(
    answers: string[],
    config: ScoringConfig
): InterviewScore {
    if (answers.length === 0 || answers.every(a => a.trim().length === 0)) {
        return {
            totalScore: 0,
            percentage: 0,
            dimensions: [],
            strengths: ['Unable to assess - no responses provided'],
            improvements: ['Provide complete answers to interview questions'],
            overallFeedback: 'Interview incomplete - please answer all questions.'
        };
    }

    // Combine all answers for aggregate scoring
    const combinedAnswers = answers.filter(a => a.trim().length > 0 && a !== '[Skipped]').join(' ');

    // Score each dimension
    const dimensions: ScoreDimension[] = [
        scoreClarity(combinedAnswers),
        scoreRelevance(combinedAnswers, config),
        scoreConfidence(combinedAnswers),
        scoreStructure(combinedAnswers),
        scoreRoleAlignment(combinedAnswers, config)
    ];

    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
    const percentage = Math.round((totalScore / 25) * 100);

    // Determine strengths (top 2 scores)
    const sortedByScore = [...dimensions].sort((a, b) => b.score - a.score);
    const strengths = sortedByScore
        .slice(0, 2)
        .filter(d => d.score >= 3)
        .map(d => d.feedback);

    if (strengths.length === 0) {
        strengths.push('Completed the interview questions');
    }

    // Determine improvements (lowest score that's < 4)
    const improvements = sortedByScore
        .reverse()
        .slice(0, 1)
        .filter(d => d.score < 4)
        .map(d => d.feedback);

    // Overall feedback based on total
    let overallFeedback = '';
    if (percentage >= 80) {
        overallFeedback = 'Excellent! You communicated clearly and made a strong impression.';
    } else if (percentage >= 60) {
        overallFeedback = 'Good interview! Try adding more specific examples next time.';
    } else if (percentage >= 40) {
        overallFeedback = 'Nice effort! Practice using the STAR format for clearer answers.';
    } else {
        overallFeedback = 'Keep practicing! Focus on clear, confident answers with examples.';
    }

    return {
        totalScore: Math.round(totalScore * 10) / 10,
        percentage,
        dimensions,
        strengths,
        improvements,
        overallFeedback
    };
}
