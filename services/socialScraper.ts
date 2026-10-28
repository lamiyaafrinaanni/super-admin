
import { SocialPlatform, AppSetting, DynamicTool, ScraperAssignment } from '../types';
import { db } from './db';

interface ScrapedContent {
    description: string;
    image?: string;
    url: string;
    type: 'video' | 'image' | 'text';
    likes: number;
    comments: number;
}

const getMappedTool = async (task: 'PAGE_DETAILS' | 'PAGE_POSTS'): Promise<DynamicTool | null> => {
    try {
        const mappingSetting = await db.get<AppSetting>('settings', 'fb_scraper_assignments');
        if (!mappingSetting || !mappingSetting.value) return null;
        
        const assignments: ScraperAssignment[] = mappingSetting.value;
        const assignment = assignments.find(a => a.task === task);
        if (!assignment || !assignment.toolId) return null;

        const tools = await db.getAll<DynamicTool>('dynamic_tools' as any);
        return tools.find(t => t.id === assignment.toolId) || null;
    } catch (e) {
        console.warn(`[Scraper] Error loading mapping for ${task}:`, e);
        return null;
    }
};

const executeToolRequest = async (tool: DynamicTool, params: Record<string, string>) => {
    const savedKeys = localStorage.getItem('RAPID_API_KEYS');
    const keys = savedKeys ? JSON.parse(savedKeys) : [];
    const apiKey = keys.length > 0 ? keys[0] : null;

    if (!apiKey) throw new Error("No RapidAPI Key available in system.");

    const queryString = new URLSearchParams(params).toString();
    const finalUrl = `${tool.baseUrl.replace(/\/$/, '')}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': tool.host
        }
    });

    if (!response.ok) throw new Error(`API provider responded with status ${response.status}`);
    return await response.json();
};

export const fetchPageDetails = async (pageUrl: string) => {
    const tool = await getMappedTool('PAGE_DETAILS');
    
    if (tool) {
        try {
            // RapidAPI Facebook scraper usually expects 'url' parameter
            const data = await executeToolRequest(tool, { url: pageUrl });
            return data;
        } catch (error) {
            console.error("[Scraper] Tool execution failed for page details:", error);
        }
    }

    // Fallback: Return empty results so Admin can manually fill in AdminSocialRequests
    console.warn("[Scraper] No tool mapped for PAGE_DETAILS or execution failed. Admin must fill manually.");
    
    // Extract a clean name from URL for better UI even in fallback
    let cleanName = "New Business Page";
    try {
        const parts = pageUrl.replace(/\/$/, '').split('/');
        cleanName = parts[parts.length - 1] || "New Business Page";
        cleanName = cleanName.replace(/[-_.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } catch(e) {}

    return {
        results: {
            name: cleanName,
            is_manual_entry: true, // Hint for admin UI
            page_id: `page-${Date.now()}`,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`,
            about: "Scraper not connected. Please fill details manually."
        }
    };
};

export const fetchPageContent = async (pageId: string): Promise<ScrapedContent[]> => {
    let cleanId = pageId;
    if (pageId.includes('facebook.com/')) {
        const parts = pageId.replace(/\/$/, '').split('/');
        cleanId = parts[parts.length - 1] || parts[parts.length - 2];
    }

    const tool = await getMappedTool('PAGE_POSTS');
    
    if (tool) {
        try {
            // RapidAPI Facebook scraper usually expects 'page_id' or 'id'
            const data = await executeToolRequest(tool, { page_id: cleanId });
            const results = data.results || [];
            
            if (results.length > 0) {
                return results.map((item: any) => {
                    let imageUrl = item.full_picture || item.picture || item.thumbnail_uri || item.image;
                    if ((item.type === 'video' || item.type === 'reel') && item.video_thumbnail) {
                        imageUrl = item.video_thumbnail;
                    }
                    return {
                        description: item.message || item.description || 'Post Content',
                        image: imageUrl || "https://via.placeholder.com/300",
                        url: item.url || `https://facebook.com/${item.post_id}`,
                        type: (item.type === 'video' || item.type === 'reel') ? 'video' : 'image',
                        likes: item.reactions_count || 0,
                        comments: item.comments_count || 0
                    };
                });
            }
        } catch (error) {
            console.error("[Scraper] Tool execution failed for page posts:", error);
        }
    }

    return getSimulatedFallback(cleanId);
};

const getSimulatedFallback = (pageId: string): ScrapedContent[] => {
    return [
        {
            description: `Latest updates from ${pageId}. (Real-time data requires scraper integration)`,
            image: `https://images.unsplash.com/photo-1557821552-17105176677c?w=400&q=80`,
            url: `https://facebook.com/${pageId}/posts/sim-1`,
            type: 'image',
            likes: 0,
            comments: 0
        }
    ];
};

export const findMatchingContent = (contents: ScrapedContent[], userUrl: string): ScrapedContent | null => {
    if (!userUrl) return contents[0] || null;
    return contents.find(c => c.url.includes(userUrl) || userUrl.includes(c.url)) || contents[0] || null;
};
