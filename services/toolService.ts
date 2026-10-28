
import { DynamicTool, ApiKeyConfig } from '../types';
import { db } from './db';

export const parseRapidApiSnippet = (name: string, description: string, snippet: string) => {
    const urlRegex = /xhr\.open\(['"]GET['"],\s*['"]([^'"]+)['"]\)/;
    const hostRegex = /xhr\.setRequestHeader\(['"]x-rapidapi-host['"],\s*['"]([^'"]+)['"]\)/;
    const keyRegex = /xhr\.setRequestHeader\(['"]x-rapidapi-key['"],\s*['"]([^'"]+)['"]\)/;

    const urlMatch = snippet.match(urlRegex);
    const hostMatch = snippet.match(hostRegex);
    const keyMatch = snippet.match(keyRegex);

    if (!urlMatch || !hostMatch) {
        throw new Error("স্নিপেট পার্স করা সম্ভব হয়নি। অনুগ্রহ করে সঠিক XHR কোড দিন।");
    }

    const fullUrl = urlMatch[1];
    const host = hostMatch[1];
    const extractedKey = keyMatch ? keyMatch[1] : null;

    const urlParts = fullUrl.split('?');
    const baseUrl = urlParts[0];
    const params: string[] = [];

    if (urlParts.length > 1) {
        const searchParams = new URLSearchParams(urlParts[1]);
        searchParams.forEach((_, key) => {
            if (!params.includes(key)) params.push(key);
        });
    }

    const tool: DynamicTool = {
        id: `tool-${Date.now()}`,
        name,
        description,
        baseUrl,
        host,
        queryParams: params,
        lastStatus: 'idle'
    };

    return { tool, extractedKey };
};

export const executeDynamicTool = async (tool: DynamicTool, params: Record<string, string>) => {
    const keys = await db.getAll<ApiKeyConfig>('api_keys');
    const apiKey = keys.find(k => k.status === 'active')?.key;

    if (!apiKey) {
        throw new Error("কোনো সচল API Key পাওয়া যায়নি। অনুগ্রহ করে সেটিংস থেকে Key যোগ করুন।");
    }

    const queryString = new URLSearchParams(params).toString();
    const finalUrl = `${tool.baseUrl}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': tool.host
        }
    });

    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("image/")) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "এপিআই রিকোয়েস্ট ব্যর্থ হয়েছে।");
    }

    return data;
};
