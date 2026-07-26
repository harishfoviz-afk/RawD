// src/lib/socialSync.ts

/**
 * Extracts the video ID from a YouTube Shorts URL or TikTok Video URL.
 */
export function extractVideoId(url: string): { platform: "YOUTUBE" | "TIKTOK" | null; videoId: string | null } {
  try {
    const ytRegex = /(?:youtube\.com\/shorts\/|youtu\.be\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const ttRegex = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;

    const ytMatch = url.match(ytRegex);
    if (ytMatch) {
      return { platform: "YOUTUBE", videoId: ytMatch[1] };
    }

    const ttMatch = url.match(ttRegex);
    if (ttMatch) {
      return { platform: "TIKTOK", videoId: ttMatch[1] };
    }

    return { platform: null, videoId: null };
  } catch (error) {
    console.error("Error parsing video URL:", error);
    return { platform: null, videoId: null };
  }
}

/**
 * Mock YouTube API call for statistics.likeCount
 */
async function mockFetchYouTubeLikes(videoId: string): Promise<number> {
  // Simulates call to https://www.googleapis.com/youtube/v3/videos?part=statistics&id=VIDEO_ID&key=API_KEY
  console.log(`[socialSync] Simulating YouTube Data API v3 request for video ID: ${videoId}...`);
  // Deterministic like count based on character codes of the videoId
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const likes = Math.abs(hash % 350) + 50; // Returns between 50 and 400 likes
  return likes;
}

/**
 * Mock TikTok Display API call for organic likes
 */
async function mockFetchTikTokLikes(videoId: string): Promise<number> {
  // Simulates call to TikTok Display API /video/query/ to retrieve video statistics
  console.log(`[socialSync] Simulating TikTok Display API request for video ID: ${videoId}...`);
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const likes = Math.abs(hash % 450) + 30; // Returns between 30 and 480 likes
  return likes;
}

/**
 * Fetches the social likes count for a given dance video URL.
 */
export async function syncSocialLikes(url: string): Promise<number> {
  const { platform, videoId } = extractVideoId(url);
  if (!platform || !videoId) {
    console.log(`[socialSync] Unable to resolve platform or video ID for: ${url}. Defaulting to 0 likes.`);
    return 0;
  }

  try {
    if (platform === "YOUTUBE") {
      return await mockFetchYouTubeLikes(videoId);
    } else {
      return await mockFetchTikTokLikes(videoId);
    }
  } catch (error) {
    console.error("[socialSync] Failed to sync likes:", error);
    return 0;
  }
}
