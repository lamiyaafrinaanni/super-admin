
import { GoogleGenAI, Type } from "@google/genai";
import { Product, User, ApiKeyConfig, AppSetting, AILog, AIKnowledge } from '../types';
import { db } from './db';

// --- METRICS ---
class MetricsCollector {
    private static requestTimestamps: number[] = [];
    private static providerStats: Record<string, { requests: number, errors: number }> = { google: { requests: 0, errors: 0 } };

    static async logRequest(model: string, provider: 'google', success: boolean, latency: number, userId?: string, prompt?: string, response?: string) {
        const now = Date.now();
        this.requestTimestamps.push(now);
        const log: AILog = { id: `log-${now}-${Math.random()}`, userId, model, provider, latency, success, timestamp: new Date().toISOString(), prompt, response };
        await db.add('ai_logs', log);
    }
    static getStats() {
        return { rpm: this.requestTimestamps.length, providerStatus: { google: 'ONLINE' } };
    }
}

export const getLiveHealthStats = () => MetricsCollector.getStats();

class AIProviderLayer {
    static async execute(modelId: string, systemInstruction: string, userPrompt: string, userId?: string, config: any = {}): Promise<string> {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return `AI Service Error: No API Key found in environment.`;
        
        const startTime = Date.now();
        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const response = await ai.models.generateContent({
                model: modelId,
                contents: userPrompt,
                config: {
                    systemInstruction,
                    temperature: 0.4,
                    ...config
                }
            });
            
            const text = response.text || "";
            MetricsCollector.logRequest(modelId, 'google', true, Date.now() - startTime, userId, userPrompt, text);
            return text;
        } catch (e: any) {
            MetricsCollector.logRequest(modelId, 'google', false, Date.now() - startTime, userId, userPrompt, e.message);
            return `AI Service Error: ${e.message}`;
        }
    }
}

export const fetchGoogleModels = async () => [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.0-flash'
];

export const fetchOpenRouterModels = async (): Promise<any[]> => [];

export const initKnowledgeBase = async (userId: string, user: User) => {
    await db.put('ai_knowledge', { userId, identitySummary: `User: ${user.name}`, businessProfile: "", marketingStrategy: "Growth", lastUpdated: new Date().toISOString(), insights: [] });
};

export const updateKnowledgeBase = async (userId: string, source: string, content: string) => {
    const kb = await db.get<AIKnowledge>('ai_knowledge', userId);
    if (kb) { kb.businessProfile = content; kb.lastUpdated = new Date().toISOString(); await db.put('ai_knowledge', kb); }
};

export const generateAudienceTargeting = async (content: any, pageInfo: any, userId?: string): Promise<any> => {
    const prompt = `Analyze this business/product and generate a precise Meta Ads targeting strategy.
    
    PRODUCT/CONTENT: ${JSON.stringify(content)}
    PAGE INFO: ${JSON.stringify(pageInfo)}
    
    Requirements:
    1. Demographics: Life stages, education, job titles relevant to the product.
    2. Interests: Specific high-intent keywords for Meta's interest field.
    3. Behaviours: Buying habits, device usage, or seasonal activities.
    4. Expert Note: A short marketing tip in Bengali.`;

    const systemInstruction = "You are a Meta Ads Specialist. Provide targeting data optimized for high conversion in the Bangladesh/South Asian market.";

    const resp = await AIProviderLayer.execute('gemini-3-flash-preview', systemInstruction, prompt, userId, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                age_min: { type: Type.NUMBER },
                age_max: { type: Type.NUMBER },
                gender: { type: Type.STRING, enum: ["Both", "Men", "Women"] },
                demographics: { type: Type.ARRAY, items: { type: Type.STRING } },
                interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                behaviours: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggested_daily_budget: { type: Type.NUMBER },
                suggested_duration_days: { type: Type.NUMBER },
                expert_note: { type: Type.STRING }
            },
            required: ["age_min", "age_max", "gender", "demographics", "interests", "behaviours", "expert_note"]
        }
    });

    try { 
        return JSON.parse(resp); 
    } catch { 
        return { 
            age_min: 18, age_max: 65, gender: "Both",
            demographics: ["Online Shoppers"], interests: ["Digital Marketing"], behaviours: ["Frequent Travelers"],
            expert_note: "Error generating specific strategy. Standard targeting applied." 
        }; 
    }
};

export const generateChatResponse = async (userPrompt: string, context: any): Promise<string> => {
    const isAdmin = context.user?.role === 'ADMIN';
    const forcedModel = context.user?.forcedModel;
    
    const modelToUse = forcedModel || (isAdmin ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview');
    
    const systemInstruction = isAdmin 
        ? `You are 'Admin Copilot'. Respond in JSON for actions, otherwise use Bengali.`
        : `You are Trendify AI Expert. Respond in Bengali. Use knowledge base: ${JSON.stringify(context.knowledge || {})}`;

    const history = (context.history || []).slice(-5).map((h: any) => `${h.role}: ${h.content}`).join('\n');
    const prompt = `${history}\nuser: ${userPrompt}`;

    return await AIProviderLayer.execute(modelToUse, systemInstruction, prompt, context.user?.id);
};
