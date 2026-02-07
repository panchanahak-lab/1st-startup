// Interview Engine - Human-Like Interview Logic
// Decouples transcription from AI, uses static questions, adds natural delays
// Supports HYBRID MODEL ROUTING: Gemini Pro for opening, Flash for rest

import { getQuestionsForInterview, detectRoleType, detectLevel, InterviewQuestion } from './questionBanks';
import { GoogleGenerativeAI } from "@google/generative-ai";

export type InterviewStage = 'setup' | 'initializing' | 'asking' | 'listening' | 'thinking' | 'processing_feedback' | 'feedback';

export interface InterviewSession {
    questions: InterviewQuestion[];
    currentIndex: number;
    answers: string[];
    cvSummary: string;
    jobRole: string;
    language: string;
    persona: string;
    startTime: number;
    // Hybrid model routing: Pro for opening, Flash for rest
    usedProForOpening: boolean;
    proOpeningQuestion?: string;
    translatedQuestions?: string[];
    translatedGreeting?: string;
}

export interface InterviewConfig {
    jobRole: string;
    language: string;
    persona: string;
    cvSummary?: string;
    questionCount?: number;
}

/**
 * Generate interview questions based on job role and CV
 * Uses static question banks - NO Gemini call
 */
export function generateInterviewQuestions(config: InterviewConfig): InterviewQuestion[] {
    const { jobRole, questionCount = 5 } = config;

    // Detect role type and level from job title
    const roleType = detectRoleType(jobRole);
    const level = detectLevel(jobRole);

    // Get questions from static bank
    const questions = getQuestionsForInterview(roleType, level, questionCount);

    return questions;
}

/**
 * Create a new interview session
 */
export function createInterviewSession(config: InterviewConfig): InterviewSession {
    const questions = generateInterviewQuestions(config);

    return {
        questions,
        currentIndex: 0,
        answers: [],
        cvSummary: config.cvSummary || '',
        jobRole: config.jobRole,
        language: config.language,
        persona: config.persona,
        startTime: Date.now(),
        usedProForOpening: false  // Will be set to true when Pro generates opening
    };
}

/**
 * Get current question
 */
export function getCurrentQuestion(session: InterviewSession): InterviewQuestion | null {
    if (session.currentIndex >= session.questions.length) {
        return null;
    }
    return session.questions[session.currentIndex];
}

/**
 * Record answer and move to next question
 */
export function recordAnswer(session: InterviewSession, answer: string): InterviewSession {
    return {
        ...session,
        answers: [...session.answers, answer],
        currentIndex: session.currentIndex + 1
    };
}

/**
 * Check if interview is complete
 */
export function isInterviewComplete(session: InterviewSession): boolean {
    return session.currentIndex >= session.questions.length;
}

/**
 * Human-like thinking delay (1.5-3 seconds)
 */
export function thinkingDelay(): Promise<void> {
    const delay = 1500 + Math.random() * 1500; // 1.5-3 seconds
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Generate opening greeting based on persona
 */
export function getOpeningGreeting(config: InterviewConfig): string {
    const { language, persona, jobRole } = config;

    const greetings: Record<string, Record<string, string>> = {
        mentor: {
            English: `Hi there! Thanks for joining me today. I'm excited to learn about your experience. Let's have a casual conversation about your background and the ${jobRole} role. Don't worry, this is a friendly chat!`,
            Hindi: `नमस्ते! आज मुझसे मिलने के लिए धन्यवाद। मैं आपके अनुभव के बारे में जानने के लिए उत्साहित हूं। चलिए ${jobRole} के बारे में बातचीत करते हैं।`,
        },
        recruiter: {
            English: `Hello! Thank you for your time today. I'm looking forward to discussing your qualifications for the ${jobRole} position. Let's get started, shall we?`,
            Hindi: `नमस्ते! आज समय देने के लिए धन्यवाद। ${jobRole} पद के लिए आपकी योग्यता पर चर्चा करने के लिए उत्सुक हूं।`,
        },
        stress: {
            English: `Let's get straight to business. I've reviewed your profile and I have some pointed questions about your experience for the ${jobRole} role. Convince me you're the right fit.`,
            Hindi: `चलिए सीधे मुद्दे पर आते हैं। मैंने आपकी प्रोफाइल देखी है और ${jobRole} के लिए कुछ सीधे सवाल हैं।`,
        }
    };

    return greetings[persona]?.[language] || greetings[persona]?.English || greetings.recruiter.English;
}

/**
 * Generate transition phrases based on persona
 * These are used between questions to sound more natural
 */
export function getTransitionPhrase(persona: string, language: string): string {
    const transitions: Record<string, string[]> = {
        mentor: [
            "That's really interesting, thank you for sharing.",
            "I appreciate the detail there.",
            "Got it, that helps me understand better.",
            "Nice, let me ask you about something else.",
        ],
        recruiter: [
            "Thank you for that.",
            "Alright, moving on.",
            "I see, let me ask you this.",
            "Understood.",
        ],
        stress: [
            "Hmm.",
            "Okay.",
            "Let's see about that.",
            "Right.",
        ]
    };

    const phrases = transitions[persona] || transitions.recruiter;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Format question with natural phrasing
 */
export function formatQuestionNaturally(question: InterviewQuestion, persona: string): string {
    // Add slight variations to make it sound more natural
    const prefixes: Record<string, string[]> = {
        mentor: ["I'm curious about this - ", "Tell me about ", "I'd love to hear - ", ""],
        recruiter: ["", "Could you tell me, ", "Let me ask you - ", ""],
        stress: ["", "Explain ", "Tell me directly - ", ""]
    };

    const personaPrefixes = prefixes[persona] || prefixes.recruiter;
    const prefix = personaPrefixes[Math.floor(Math.random() * personaPrefixes.length)];

    return prefix + question.question;
}

/**
 * Build feedback prompt for Gemini (used only at end of interview)
 */
export function buildFeedbackPrompt(session: InterviewSession): string {
    const transcript = session.questions.map((q, i) => {
        const answer = session.answers[i] || '[No answer provided]';
        return `INTERVIEWER: ${q.question}\nCANDIDATE: ${answer}`;
    }).join('\n\n');

    return `You are evaluating an interview that just concluded. Do NOT summarize what the candidate said.
Focus on: communication clarity, specific examples, confidence, and areas for improvement.

INTERVIEW CONTEXT:
- Role: ${session.jobRole}
- Interviewer Style: ${session.persona}
- CV Summary: ${session.cvSummary || 'Not provided'}

TRANSCRIPT:
${transcript}

Provide honest, constructive feedback in JSON format with:
- score (0-100)
- summary (2-3 sentences)
- strengths (2-3 items)
- weaknesses (2-3 items)
- suggestions (2-3 actionable tips)
- idealResponseTip (one specific tip for their weakest answer)`;
}

/**
 * PERSONA ANCHOR - Kept under 60 tokens for cost efficiency
 * Used in all Gemini prompts for consistent interviewer personality
 */
export const PERSONA_ANCHOR = `You are a real human interviewer.
You do not summarize answers.
You ask one natural follow-up question.
You speak casually, like a recruiter.`;

// Helper for raw v1 access to bypass SDK v1beta defaults
async function callGeminiV1Fallback(apiKey: string, prompt: string, modelName: string = 'gemini-pro'): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 150
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Raw API v1 failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generate opening question using Gemini Pro (ONE TIME per interview)
 * Sets tone, personality, and realism for the entire session
 * 
 * HYBRID MODEL ROUTING:
 * - Pro: Opening question only (temperature 0.7 for natural speech)
 * - Flash: All follow-ups and feedback
 */
export async function generateProOpeningQuestion(config: {
    jobRole: string;
    persona: string;
    cvSummary: string;
    apiKey: string;
    language: string;
}): Promise<string> {
    const genAI = new GoogleGenerativeAI(config.apiKey);

    // SDK models (v1beta) - 2026 Compatible
    const sdkModels = [
        'gemini-2.5-pro',
        'gemini-2.5-flash'
    ];

    // Raw fallback models (v1)
    const rawModels = ['gemini-2.5-pro', 'gemini-pro-latest'];

    let lastError;

    // 1. Try SDK (v1beta)
    for (const modelName of sdkModels) {
        try {
            console.log(`[HYBRID] Attempting opening with SDK model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 150 }
            });

            // Prompt construction (same as before)
            const styleGuide = config.persona === 'stress'
                ? 'Direct and challenging, gets straight to the point'
                : config.persona === 'mentor'
                    ? 'Warm, encouraging, puts candidate at ease'
                    : 'Professional but friendly, conversational';

            const languageInstruction = config.language !== 'English'
                ? `LANGUAGE: You MUST respond entirely in ${config.language}. Do NOT use English.\n\n`
                : '';

            const prompt = `${languageInstruction}${PERSONA_ANCHOR}

Generate ONE opening interview question for a ${config.jobRole} role.
${config.cvSummary ? `Brief context from resume: ${config.cvSummary.substring(0, 200)}` : ''}

Style: ${styleGuide}

Rules:
- Ask only ONE question
- Avoid formal phrases like "Tell me about yourself" or "Walk me through your resume"
- Sound like a real recruiter starting a conversation
- Keep under 30 words
- Use natural language: "What got you into...", "I noticed...", "So you've been..."`;

            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (e: any) {
            console.warn(`[HYBRID] SDK Model ${modelName} failed:`, e.message);
            lastError = e;
        }
    }

    // 2. Try Raw Fetch (v1) - The Prompt must be reconstructed locally here or shared
    // To share the prompt logic, I'll duplicate it briefly for safety or refactor if needed.
    // Given the tool limitations, duplication is safer to ensure it works NOW.

    const styleGuide = config.persona === 'stress'
        ? 'Direct and challenging, gets straight to the point'
        : config.persona === 'mentor'
            ? 'Warm, encouraging, puts candidate at ease'
            : 'Professional but friendly, conversational';

    const languageInstruction = config.language !== 'English'
        ? `LANGUAGE: You MUST respond entirely in ${config.language}. Do NOT use English.\n\n`
        : '';

    const fullPrompt = `${languageInstruction}${PERSONA_ANCHOR}

Generate ONE opening interview question for a ${config.jobRole} role.
${config.cvSummary ? `Brief context from resume: ${config.cvSummary.substring(0, 200)}` : ''}

Style: ${styleGuide}

Rules:
- Ask only ONE question
- Keep under 30 words`;
    // Simplified prompt for fallback to avoid complexity

    for (const modelName of rawModels) {
        try {
            console.log(`[HYBRID] Attempting opening with RAW v1 model: ${modelName}`);
            return await callGeminiV1Fallback(config.apiKey, fullPrompt, modelName);
        } catch (e: any) {
            console.warn(`[HYBRID] Raw Model ${modelName} failed:`, e.message);
            lastError = e;
        }
    }

    // If all failed, throw
    throw lastError || new Error("All models (SDK and Raw) failed");
}
