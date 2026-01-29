export const getSiteUrl = () => {
    // 1. Check if VITE_SITE_URL is set (Production/Vercel)
    const envUrl = import.meta.env.VITE_SITE_URL;
    if (envUrl) return envUrl;

    // 2. Fallback to window.location.origin (Client-side)
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // 3. Absolute fallback (should rarely be hit in client-side app)
    return 'http://localhost:3000';
};
