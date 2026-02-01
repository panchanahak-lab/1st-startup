import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromToken } from '../lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const user = await getUserFromToken(req.headers.authorization || null);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { prompt, context, type = 'general' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ error: 'AI service not configured' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Build the system prompt based on type
        let systemPrompt = '';

        switch (type) {
            case 'resume_bullet':
                systemPrompt = `You are a professional resume writer. Rewrite the following bullet point to be more impactful, using strong action verbs and quantifiable results where possible. Keep it concise (1-2 lines). Only return the improved bullet point, no explanations.`;
                break;
            case 'resume_summary':
                systemPrompt = `You are a professional resume writer. Generate a compelling professional summary based on the provided context. Keep it to 2-3 sentences. Only return the summary, no explanations.`;
                break;
            case 'ats_feedback':
                systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze the resume content and provide specific, actionable feedback to improve ATS compatibility. Format your response as a JSON object with: { score: number (0-100), issues: string[], suggestions: string[] }`;
                break;
            case 'interview_tip':
                systemPrompt = `You are an interview coach. Provide a brief, helpful interview tip or mock question based on the context. Keep it concise and actionable.`;
                break;
            default:
                systemPrompt = `You are a helpful career assistant. Provide concise, professional advice.`;
        }

        const fullPrompt = context
            ? `${systemPrompt}\n\nContext: ${context}\n\nRequest: ${prompt}`
            : `${systemPrompt}\n\nRequest: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text().trim();

        // For ATS feedback, try to parse as JSON
        if (type === 'ats_feedback') {
            try {
                // Extract JSON from response (in case there's extra text)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return res.status(200).json({
                        success: true,
                        data: parsed,
                        type: 'ats_feedback'
                    });
                }
            } catch (parseError) {
                // If parsing fails, return as plain text
                console.warn('Failed to parse ATS feedback as JSON:', parseError);
            }
        }

        return res.status(200).json({
            success: true,
            data: responseText,
            type
        });

    } catch (error: any) {
        console.error('Gemini API error:', error);

        // Handle specific error types
        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Invalid API key configuration' });
        }

        if (error.message?.includes('quota')) {
            return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
        }

        return res.status(500).json({
            error: 'Failed to generate AI response',
            details: error.message
        });
    }
}
