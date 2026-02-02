// FAQ Database for Chatbot
// Intent-based routing to reduce AI calls
// AI is only called when FAQ cannot answer

export interface FAQEntry {
    id: string;
    keywords: string[];
    question: string;
    answer: string;
    category: 'resume' | 'interview' | 'ats' | 'pricing' | 'general';
}

export const FAQ_DATABASE: FAQEntry[] = [
    // Resume Builder FAQs
    {
        id: 'faq_resume_1',
        keywords: ['optimize', 'summary', 'improve', 'better'],
        question: 'How do I optimize my resume summary?',
        answer: `To optimize your resume summary:\n\n1. Start with your job title and years of experience\n2. Highlight 2-3 key achievements with metrics\n3. Include relevant skills matching the job description\n4. Keep it to 2-3 sentences\n\n**Tip:** Use our "Improve with AI" button for personalized suggestions!`,
        category: 'resume'
    },
    {
        id: 'faq_resume_2',
        keywords: ['bullet', 'points', 'experience', 'write'],
        question: 'How should I write bullet points for my experience?',
        answer: `Use the STAR method for impactful bullets:\n\n• **Action Verb** - Start with strong verbs (Led, Developed, Achieved)\n• **Task** - What you did\n• **Result** - Quantifiable outcome (%, $, numbers)\n\n**Example:** "Increased sales by 35% by implementing new customer outreach strategy"`,
        category: 'resume'
    },
    {
        id: 'faq_resume_3',
        keywords: ['pdf', 'export', 'download'],
        question: 'How do I export my resume as PDF?',
        answer: `To export your resume:\n\n1. Complete your resume in the Builder\n2. Click the "Export PDF" button\n3. Your resume will download automatically\n\n**Note:** PDF export is always free and doesn't use any credits!`,
        category: 'resume'
    },

    // ATS FAQs
    {
        id: 'faq_ats_1',
        keywords: ['ats', 'score', 'check', 'scan'],
        question: 'How does the ATS score work?',
        answer: `Our ATS score analyzes your resume on:\n\n• **Keywords (30%)** - Match with job description\n• **Impact (30%)** - Action verbs and metrics\n• **Formatting (20%)** - Structure and readability\n• **Completeness (20%)** - Required sections\n\nScores above 70% have higher callback rates!`,
        category: 'ats'
    },
    {
        id: 'faq_ats_2',
        keywords: ['keyword', 'match', 'job', 'description'],
        question: 'How do I improve keyword matching?',
        answer: `To improve keyword matching:\n\n1. Paste the job description in the ATS scanner\n2. Identify key skills and requirements\n3. Naturally incorporate matching terms in your resume\n4. Use exact phrases when possible\n\n**Don't:** Keyword stuff or hide text - ATS systems detect this!`,
        category: 'ats'
    },

    // Interview FAQs
    {
        id: 'faq_interview_1',
        keywords: ['interview', 'prep', 'prepare', 'practice'],
        question: 'How does the Interview Practice work?',
        answer: `Our Interview Simulator helps you practice:\n\n1. Select your target role and experience level\n2. Choose interviewer style (Mentor, Recruiter, Executive)\n3. Answer questions via voice or text\n4. Get AI-powered feedback after the session\n\n**Pro Tip:** Upload your resume for personalized questions!`,
        category: 'interview'
    },
    {
        id: 'faq_interview_2',
        keywords: ['feedback', 'score', 'improve'],
        question: 'How is interview feedback generated?',
        answer: `After your session, AI analyzes:\n\n• Communication clarity\n• Technical accuracy\n• Use of specific examples\n• Confidence and structure\n\nYou'll receive a score and actionable improvement tips!`,
        category: 'interview'
    },

    // Pricing/Credits FAQs
    {
        id: 'faq_credits_1',
        keywords: ['credit', 'cost', 'price', 'how much'],
        question: 'How do credits work?',
        answer: `Credits are used for AI-powered features:\n\n• **Resume AI:** 1 credit\n• **Interview Feedback:** 1 credit\n• **LinkedIn Optimization:** 4 credits\n\n**Free features:** ATS scanning, PDF export, practice questions\n\n**New users get 3 free credits!**`,
        category: 'pricing'
    },
    {
        id: 'faq_credits_2',
        keywords: ['free', 'earn', 'bonus'],
        question: 'How do I get free credits?',
        answer: `You can earn free credits by:\n\n• **Sign up bonus:** 3 credits\n• **Submit feedback:** 1 credit\n• **Daily login:** 1 credit\n\nStay tuned for more ways to earn credits!`,
        category: 'pricing'
    },
    {
        id: 'faq_credits_3',
        keywords: ['buy', 'purchase', 'upgrade', 'premium'],
        question: 'How do I buy more credits?',
        answer: `**Premium features coming soon!**\n\nWe're currently in early access. As an early user, you get:\n\n• Extra free credits\n• Priority access to new features\n• Exclusive early adopter pricing\n\nStay tuned for our launch!`,
        category: 'pricing'
    },

    // General FAQs
    {
        id: 'faq_general_1',
        keywords: ['help', 'support', 'contact'],
        question: 'How do I get help?',
        answer: `Need help? Here's how to reach us:\n\n• **FAQ:** Browse common questions here\n• **Chat:** Ask our AI assistant\n• **Email:** support@nextstepresume.com\n\nWe typically respond within 24 hours!`,
        category: 'general'
    },
    {
        id: 'faq_general_2',
        keywords: ['account', 'profile', 'settings'],
        question: 'How do I manage my account?',
        answer: `Manage your account in Settings:\n\n1. Click your profile icon\n2. Select "Settings"\n3. View credits, usage stats, and profile info\n\nYou can also update your preferences there!`,
        category: 'general'
    }
];

/**
 * Find matching FAQ entries based on user query
 */
export function findMatchingFAQs(query: string, limit: number = 3): FAQEntry[] {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Score each FAQ by keyword matches
    const scored = FAQ_DATABASE.map(faq => {
        let score = 0;

        // Check keyword matches
        faq.keywords.forEach(keyword => {
            if (queryLower.includes(keyword)) {
                score += 2;
            }
        });

        // Check word matches in question
        words.forEach(word => {
            if (faq.question.toLowerCase().includes(word)) {
                score += 1;
            }
        });

        return { faq, score };
    });

    // Sort by score and return top matches
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.faq);
}

/**
 * Get best FAQ answer or null if no good match
 */
export function getBestFAQAnswer(query: string): string | null {
    const matches = findMatchingFAQs(query, 1);

    if (matches.length === 0) {
        return null;
    }

    // Only return if we have a reasonable match (at least 2 keyword matches)
    const queryLower = query.toLowerCase();
    const matchCount = matches[0].keywords.filter(k => queryLower.includes(k)).length;

    if (matchCount >= 1) {
        return matches[0].answer;
    }

    return null;
}

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category: FAQEntry['category']): FAQEntry[] {
    return FAQ_DATABASE.filter(faq => faq.category === category);
}

/**
 * Quick prompts for the chatbot
 */
export const QUICK_PROMPTS = [
    { label: 'How to improve my resume?', icon: 'fa-file-alt' },
    { label: 'What is ATS score?', icon: 'fa-chart-line' },
    { label: 'Interview tips', icon: 'fa-microphone' },
    { label: 'How do credits work?', icon: 'fa-coins' }
];
