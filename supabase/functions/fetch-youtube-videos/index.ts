const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key not configured');
      return new Response(
        JSON.stringify({ error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('query') || 'trending';
    const maxResults = url.searchParams.get('maxResults') || '24';

    console.log(`Fetching YouTube videos for query: ${query}`);

    // Fetch videos from YouTube Data API
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&order=viewCount&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(youtubeUrl);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('YouTube API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from YouTube API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Transform YouTube data to match our video card format
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      channel_name: item.snippet.channelTitle,
      created_at: item.snippet.publishedAt,
      view_count: 0, // YouTube API v3 search doesn't include view count
      isYouTubeVideo: true,
    }));

    console.log(`Successfully fetched ${videos.length} videos from YouTube`);

    return new Response(
      JSON.stringify({ videos }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
