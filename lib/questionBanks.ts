// Static Interview Question Banks
// Replaces live conversational AI with pre-built questions
// AI is only used for post-interview feedback

export interface InterviewQuestion {
    id: string;
    question: string;
    category: 'technical' | 'behavioral' | 'situational';
    level: 'fresher' | 'mid' | 'senior';
    followUp?: string[];
    expectedTopics?: string[];
}

export interface QuestionBank {
    roleType: string;
    displayName: string;
    questions: InterviewQuestion[];
}

// Software Developer Questions
const SOFTWARE_DEVELOPER_QUESTIONS: InterviewQuestion[] = [
    // Freshers
    {
        id: 'sd_f_1',
        question: 'Tell me about yourself and why you want to work in software development.',
        category: 'behavioral',
        level: 'fresher',
        expectedTopics: ['background', 'motivation', 'career goals']
    },
    {
        id: 'sd_f_2',
        question: 'Explain a project you worked on during your studies. What was your role and what did you learn?',
        category: 'behavioral',
        level: 'fresher',
        expectedTopics: ['project details', 'technical skills', 'learning']
    },
    {
        id: 'sd_f_3',
        question: 'What programming languages are you most comfortable with? Can you describe a problem you solved using one of them?',
        category: 'technical',
        level: 'fresher',
        expectedTopics: ['languages', 'problem-solving', 'coding']
    },
    {
        id: 'sd_f_4',
        question: 'How do you approach debugging when your code is not working as expected?',
        category: 'situational',
        level: 'fresher',
        expectedTopics: ['debugging', 'methodology', 'problem-solving']
    },
    {
        id: 'sd_f_5',
        question: 'What do you know about version control systems like Git?',
        category: 'technical',
        level: 'fresher',
        expectedTopics: ['git', 'collaboration', 'best practices']
    },

    // Mid-level
    {
        id: 'sd_m_1',
        question: 'Describe a challenging technical problem you solved in your previous role. What was your approach?',
        category: 'technical',
        level: 'mid',
        expectedTopics: ['problem-solving', 'technical depth', 'methodology']
    },
    {
        id: 'sd_m_2',
        question: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
        category: 'behavioral',
        level: 'mid',
        expectedTopics: ['teamwork', 'conflict resolution', 'communication']
    },
    {
        id: 'sd_m_3',
        question: 'How do you ensure code quality in your projects? What practices do you follow?',
        category: 'technical',
        level: 'mid',
        expectedTopics: ['code review', 'testing', 'best practices']
    },
    {
        id: 'sd_m_4',
        question: 'Explain the architecture of a system you designed or contributed significantly to.',
        category: 'technical',
        level: 'mid',
        expectedTopics: ['system design', 'architecture', 'trade-offs']
    },
    {
        id: 'sd_m_5',
        question: 'How do you prioritize tasks when you have multiple deadlines approaching?',
        category: 'situational',
        level: 'mid',
        expectedTopics: ['time management', 'prioritization', 'organization']
    },

    // Senior
    {
        id: 'sd_s_1',
        question: 'Describe a time when you had to make a critical technical decision with incomplete information. What was the outcome?',
        category: 'situational',
        level: 'senior',
        expectedTopics: ['decision-making', 'risk assessment', 'leadership']
    },
    {
        id: 'sd_s_2',
        question: 'How do you mentor junior developers and help them grow?',
        category: 'behavioral',
        level: 'senior',
        expectedTopics: ['mentoring', 'leadership', 'team development']
    },
    {
        id: 'sd_s_3',
        question: 'Tell me about a time you improved a significant business metric through your technical work.',
        category: 'behavioral',
        level: 'senior',
        expectedTopics: ['impact', 'business value', 'metrics']
    },
    {
        id: 'sd_s_4',
        question: 'How would you design a system that needs to handle millions of requests per day?',
        category: 'technical',
        level: 'senior',
        expectedTopics: ['scalability', 'architecture', 'performance']
    },
    {
        id: 'sd_s_5',
        question: 'Describe a situation where you had to push back on stakeholder requirements. How did you handle it?',
        category: 'situational',
        level: 'senior',
        expectedTopics: ['stakeholder management', 'communication', 'negotiation']
    }
];

// Data Analyst Questions
const DATA_ANALYST_QUESTIONS: InterviewQuestion[] = [
    {
        id: 'da_f_1',
        question: 'What tools and technologies have you used for data analysis?',
        category: 'technical',
        level: 'fresher',
        expectedTopics: ['excel', 'sql', 'python', 'visualization']
    },
    {
        id: 'da_f_2',
        question: 'Explain a data analysis project you completed. What insights did you discover?',
        category: 'behavioral',
        level: 'fresher',
        expectedTopics: ['methodology', 'insights', 'presentation']
    },
    {
        id: 'da_m_1',
        question: 'How do you handle missing or inconsistent data in your analysis?',
        category: 'technical',
        level: 'mid',
        expectedTopics: ['data cleaning', 'methodology', 'best practices']
    },
    {
        id: 'da_m_2',
        question: 'Describe a time when your analysis led to a significant business decision.',
        category: 'behavioral',
        level: 'mid',
        expectedTopics: ['impact', 'communication', 'business value']
    },
    {
        id: 'da_s_1',
        question: 'How do you design dashboards that effectively communicate insights to stakeholders?',
        category: 'technical',
        level: 'senior',
        expectedTopics: ['visualization', 'stakeholder needs', 'design']
    }
];

// Product Manager Questions
const PRODUCT_MANAGER_QUESTIONS: InterviewQuestion[] = [
    {
        id: 'pm_f_1',
        question: 'How do you prioritize features when building a product roadmap?',
        category: 'situational',
        level: 'fresher',
        expectedTopics: ['prioritization', 'frameworks', 'stakeholder input']
    },
    {
        id: 'pm_m_1',
        question: 'Tell me about a product you launched. What metrics did you use to measure success?',
        category: 'behavioral',
        level: 'mid',
        expectedTopics: ['metrics', 'launch', 'iteration']
    },
    {
        id: 'pm_m_2',
        question: 'How do you balance user needs with business objectives?',
        category: 'situational',
        level: 'mid',
        expectedTopics: ['trade-offs', 'user research', 'business goals']
    },
    {
        id: 'pm_s_1',
        question: 'Describe a time when you had to pivot a product strategy. What led to the decision?',
        category: 'behavioral',
        level: 'senior',
        expectedTopics: ['strategy', 'data-driven', 'leadership']
    }
];

// Generic/General Questions (applicable to all roles)
const GENERAL_QUESTIONS: InterviewQuestion[] = [
    {
        id: 'gen_1',
        question: 'What interests you about our company and this role?',
        category: 'behavioral',
        level: 'fresher',
        expectedTopics: ['company research', 'motivation', 'fit']
    },
    {
        id: 'gen_2',
        question: 'Where do you see yourself in 5 years?',
        category: 'behavioral',
        level: 'fresher',
        expectedTopics: ['career goals', 'ambition', 'planning']
    },
    {
        id: 'gen_3',
        question: 'Describe a time when you failed at something. What did you learn?',
        category: 'behavioral',
        level: 'mid',
        expectedTopics: ['failure', 'learning', 'growth mindset']
    },
    {
        id: 'gen_4',
        question: 'How do you handle feedback that you disagree with?',
        category: 'situational',
        level: 'mid',
        expectedTopics: ['feedback', 'communication', 'professionalism']
    },
    {
        id: 'gen_5',
        question: 'What is your greatest professional achievement?',
        category: 'behavioral',
        level: 'senior',
        expectedTopics: ['achievement', 'impact', 'leadership']
    }
];

// All question banks
export const QUESTION_BANKS: Record<string, QuestionBank> = {
    software_developer: {
        roleType: 'software_developer',
        displayName: 'Software Developer',
        questions: SOFTWARE_DEVELOPER_QUESTIONS
    },
    data_analyst: {
        roleType: 'data_analyst',
        displayName: 'Data Analyst',
        questions: DATA_ANALYST_QUESTIONS
    },
    product_manager: {
        roleType: 'product_manager',
        displayName: 'Product Manager',
        questions: PRODUCT_MANAGER_QUESTIONS
    },
    general: {
        roleType: 'general',
        displayName: 'General',
        questions: GENERAL_QUESTIONS
    }
};

/**
 * Get questions for a specific role and level
 */
export function getQuestionsForInterview(
    roleType: string,
    level: 'fresher' | 'mid' | 'senior',
    count: number = 5
): InterviewQuestion[] {
    const roleLower = roleType.toLowerCase();

    // Find matching bank or default to general
    let bank = Object.values(QUESTION_BANKS).find(b =>
        roleLower.includes(b.roleType.replace('_', ' ')) ||
        roleLower.includes(b.displayName.toLowerCase())
    );

    if (!bank) {
        // Try to match by keywords
        if (roleLower.includes('developer') || roleLower.includes('engineer') || roleLower.includes('programming')) {
            bank = QUESTION_BANKS.software_developer;
        } else if (roleLower.includes('data') || roleLower.includes('analyst')) {
            bank = QUESTION_BANKS.data_analyst;
        } else if (roleLower.includes('product') || roleLower.includes('manager')) {
            bank = QUESTION_BANKS.product_manager;
        } else {
            bank = QUESTION_BANKS.general;
        }
    }

    // Filter by level (include lower levels for higher levels)
    const levelOrder = ['fresher', 'mid', 'senior'];
    const maxLevelIndex = levelOrder.indexOf(level);

    const eligibleQuestions = bank.questions.filter(q =>
        levelOrder.indexOf(q.level) <= maxLevelIndex
    );

    // Mix in general questions
    const generalQuestions = GENERAL_QUESTIONS.filter(q =>
        levelOrder.indexOf(q.level) <= maxLevelIndex
    );

    // Combine and shuffle
    const allQuestions = [...eligibleQuestions, ...generalQuestions];
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count);
}

/**
 * Detect role type from job title string
 */
export function detectRoleType(jobTitle: string): string {
    const title = jobTitle.toLowerCase();

    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
        return 'software_developer';
    }
    if (title.includes('data') && (title.includes('analyst') || title.includes('scientist'))) {
        return 'data_analyst';
    }
    if (title.includes('product') && title.includes('manager')) {
        return 'product_manager';
    }

    return 'general';
}

/**
 * Detect experience level from job title
 */
export function detectLevel(jobTitle: string): 'fresher' | 'mid' | 'senior' {
    const title = jobTitle.toLowerCase();

    if (title.includes('senior') || title.includes('lead') || title.includes('principal') || title.includes('staff')) {
        return 'senior';
    }
    if (title.includes('junior') || title.includes('fresher') || title.includes('entry') || title.includes('graduate')) {
        return 'fresher';
    }

    return 'mid';
}
