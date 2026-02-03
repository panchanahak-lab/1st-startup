// Interview State Machine Hook
// Manages strict turn-based interview flow with explicit state transitions

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Interview State Machine States
 * 
 * IDLE → ASK_QUESTION → LISTENING → PROCESSING → ASK_FOLLOW_UP → ... → END_INTERVIEW
 */
export type InterviewState =
    | 'IDLE'           // Not started
    | 'SETUP'          // Configuring interview
    | 'INITIALIZING'   // Setting up audio/permissions
    | 'ASK_QUESTION'   // AI is speaking a question
    | 'LISTENING'      // User is speaking, AI is silent
    | 'PROCESSING'     // Thinking pause (UX delay)
    | 'ASK_FOLLOW_UP'  // AI asks follow-up or next question
    | 'GENERATING_FEEDBACK' // Generating final feedback
    | 'PAUSED'         // Interview temporarily halted
    | 'COMPLETE';      // Interview finished, showing results

export interface InterviewStateContext {
    state: InterviewState;
    questionNumber: number;
    totalQuestions: number;
    canTransitionTo: (state: InterviewState) => boolean;
    isAISpeaking: boolean;
    isUserSpeaking: boolean;
    isThinking: boolean;
}

interface UseInterviewStateReturn {
    state: InterviewState;
    context: InterviewStateContext;
    transitionTo: (newState: InterviewState) => boolean;
    reset: () => void;
    setQuestionCount: (current: number, total: number) => void;
}

// Valid state transitions
const VALID_TRANSITIONS: Record<InterviewState, InterviewState[]> = {
    'IDLE': ['SETUP'],
    'SETUP': ['INITIALIZING', 'IDLE'],
    'INITIALIZING': ['ASK_QUESTION', 'SETUP', 'IDLE'],
    'ASK_QUESTION': ['LISTENING', 'PAUSED', 'IDLE'], // After speaking, listen
    'LISTENING': ['PROCESSING', 'GENERATING_FEEDBACK', 'PAUSED', 'IDLE'], // After user speaks, process
    'PROCESSING': ['ASK_FOLLOW_UP', 'GENERATING_FEEDBACK', 'IDLE'], // After thinking, ask or end
    'ASK_FOLLOW_UP': ['LISTENING', 'GENERATING_FEEDBACK', 'PAUSED', 'IDLE'], // After follow-up, listen again
    'PAUSED': ['ASK_QUESTION', 'LISTENING', 'ASK_FOLLOW_UP', 'IDLE'], // Can resume to previous state
    'GENERATING_FEEDBACK': ['COMPLETE', 'IDLE'],
    'COMPLETE': ['IDLE', 'SETUP'] // Can restart
};

/**
 * Interview State Machine Hook
 * Enforces valid state transitions and provides state context
 */
export function useInterviewState(): UseInterviewStateReturn {
    const [state, setState] = useState<InterviewState>('IDLE');
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const stateHistoryRef = useRef<InterviewState[]>(['IDLE']);

    /**
     * Check if transition to target state is valid
     */
    const canTransitionTo = useCallback((targetState: InterviewState): boolean => {
        return VALID_TRANSITIONS[state]?.includes(targetState) ?? false;
    }, [state]);

    /**
     * Transition to a new state (validates transition)
     */
    const transitionTo = useCallback((newState: InterviewState): boolean => {
        if (!canTransitionTo(newState)) {
            console.warn(`Invalid state transition: ${state} → ${newState}`);
            return false;
        }

        stateHistoryRef.current.push(newState);
        setState(newState);
        return true;
    }, [state, canTransitionTo]);

    /**
     * Reset state machine to IDLE
     */
    const reset = useCallback(() => {
        setState('IDLE');
        setQuestionNumber(0);
        setTotalQuestions(0);
        stateHistoryRef.current = ['IDLE'];
    }, []);

    /**
     * Update question progress
     */
    const setQuestionCount = useCallback((current: number, total: number) => {
        setQuestionNumber(current);
        setTotalQuestions(total);
    }, []);

    // Derived state checks
    const isAISpeaking = state === 'ASK_QUESTION' || state === 'ASK_FOLLOW_UP';
    const isUserSpeaking = state === 'LISTENING';
    const isThinking = state === 'PROCESSING';

    const context: InterviewStateContext = {
        state,
        questionNumber,
        totalQuestions,
        canTransitionTo,
        isAISpeaking,
        isUserSpeaking,
        isThinking
    };

    return {
        state,
        context,
        transitionTo,
        reset,
        setQuestionCount
    };
}

/**
 * Get UI label for current state
 */
export function getStateLabel(state: InterviewState): string {
    const labels: Record<InterviewState, string> = {
        'IDLE': 'Ready to Start',
        'SETUP': 'Setting Up',
        'INITIALIZING': 'Preparing...',
        'ASK_QUESTION': 'Interviewer Speaking',
        'LISTENING': '🎤 Listening...',
        'PROCESSING': '🤔 Interviewer is thinking...',
        'ASK_FOLLOW_UP': 'Interviewer Speaking',
        'GENERATING_FEEDBACK': 'Analyzing Performance...',
        'PAUSED': 'Interview Paused',
        'COMPLETE': 'Interview Complete'
    };
    return labels[state] || state;
}

/**
 * Get icon for current state
 */
export function getStateIcon(state: InterviewState): string {
    const icons: Record<InterviewState, string> = {
        'IDLE': 'fa-play-circle',
        'SETUP': 'fa-cog',
        'INITIALIZING': 'fa-spinner fa-spin',
        'ASK_QUESTION': 'fa-comment-dots',
        'LISTENING': 'fa-microphone',
        'PROCESSING': 'fa-brain',
        'ASK_FOLLOW_UP': 'fa-comment-dots',
        'GENERATING_FEEDBACK': 'fa-chart-line',
        'PAUSED': 'fa-pause',
        'COMPLETE': 'fa-flag-checkered'
    };
    return icons[state] || 'fa-circle';
}

/**
 * Get UI color for current state
 */
export function getStateColor(state: InterviewState): string {
    const colors: Record<InterviewState, string> = {
        'IDLE': 'slate',
        'SETUP': 'slate',
        'INITIALIZING': 'blue',
        'ASK_QUESTION': 'blue',
        'LISTENING': 'brand',
        'PROCESSING': 'yellow',
        'ASK_FOLLOW_UP': 'blue',
        'GENERATING_FEEDBACK': 'purple',
        'PAUSED': 'slate',
        'COMPLETE': 'green'
    };
    return colors[state] || 'slate';
}

/**
 * Recruiter mode personality configurations
 */
export interface RecruiterPersonality {
    name: string;
    icon: string;
    level: string;
    color: string;
    interruptionAllowed: boolean;
    questionStyle: 'encouraging' | 'neutral' | 'challenging';
    followUpDepth: 'shallow' | 'medium' | 'deep';
    praiseFrequency: 'frequent' | 'occasional' | 'rare';
    pressureLevel: number; // 1-10
    transitionPhrases: string[];
    challengePhrases: string[];
}

export const RECRUITER_PERSONALITIES: Record<string, RecruiterPersonality> = {
    mentor: {
        name: 'Supportive Mentor',
        icon: 'fa-hand-holding-heart',
        level: 'Beginner',
        color: 'emerald',
        interruptionAllowed: false,
        questionStyle: 'encouraging',
        followUpDepth: 'shallow',
        praiseFrequency: 'frequent',
        pressureLevel: 2,
        transitionPhrases: [
            "Okay, great.",
            "Got it.",
            "Thanks for that.",
            "Alright, moving on."
        ],
        challengePhrases: [
            "Can you walk me through that a bit more?",
            "Let's dig into that."
        ]
    },
    recruiter: {
        name: 'Professional Recruiter',
        icon: 'fa-user-tie',
        level: 'Standard',
        color: 'blue',
        interruptionAllowed: false,
        questionStyle: 'neutral',
        followUpDepth: 'medium',
        praiseFrequency: 'occasional',
        pressureLevel: 5,
        transitionPhrases: [
            "Understood.",
            "I see.",
            "Okay.",
            "Got it."
        ],
        challengePhrases: [
            "Can you be more specific?",
            "What was your role in that exactly?",
            "How would you quantify that?"
        ]
    },
    stress: {
        name: 'High-Pressure Executive',
        icon: 'fa-bolt',
        level: 'Advanced',
        color: 'red',
        interruptionAllowed: true,
        questionStyle: 'challenging',
        followUpDepth: 'deep',
        praiseFrequency: 'rare',
        pressureLevel: 9,
        transitionPhrases: [
            "Hmm.",
            "Okay.",
            "Right.",
            "Let's see."
        ],
        challengePhrases: [
            "That's vague. Be more specific.",
            "Why did you leave that role?",
            "Explain that in simpler terms.",
            "What was your exact contribution?",
            "Walk me through the numbers.",
            "What went wrong there?"
        ]
    }
};

/**
 * Get a transition phrase based on personality
 */
export function getTransitionPhrase(personality: RecruiterPersonality): string {
    const phrases = personality.transitionPhrases;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Get a challenge phrase for follow-ups
 */
export function getChallengePhrase(personality: RecruiterPersonality): string {
    const phrases = personality.challengePhrases;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Calculate thinking delay based on personality
 * More pressure = shorter thinking (they're always ready)
 */
export function getThinkingDelay(personality: RecruiterPersonality): number {
    const baseDelay = 1500; // 1.5 seconds
    const variability = 1500; // Up to 1.5 more seconds
    const pressureFactor = (10 - personality.pressureLevel) / 10; // Higher pressure = less delay

    return baseDelay + (Math.random() * variability * pressureFactor);
}

/**
 * Determine if follow-up should be challenging based on personality
 */
export function shouldChallenge(personality: RecruiterPersonality, answerQuality: number): boolean {
    // Higher pressure personalities challenge more often
    const challengeThreshold = 10 - personality.pressureLevel; // 1-9
    const randomFactor = Math.random() * 10;

    // More likely to challenge if answer quality is low
    const qualityFactor = answerQuality < 3 ? 2 : 0;

    return randomFactor + qualityFactor > challengeThreshold;
}
