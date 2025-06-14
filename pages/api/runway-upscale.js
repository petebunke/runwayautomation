// /pages/api/runway-upscale.js
// This file handles 4K upscale requests to RunwayML API using the new video_upscale endpoint

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, payload } = req.body;

    // Validate required fields
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!payload || !payload.promptVideo) {
      return res.status(400).json({ error: 'Video URL is required for upscaling' });
    }

    console.log('Starting 4K upscale for video:', payload.promptVideo);

    // Use the new video_upscale endpoint format
    const requestBody = {
      promptVideo: payload.promptVideo
    };

    console.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/video_upscale', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('RunwayML upscale API response status:', response.status);
      console.log('RunwayML upscale API response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse upscale response as JSON:', parseError);
        return res.status(502).json({
          error: 'Invalid response from RunwayML upscale API',
          rawResponse: responseText.substring(0, 300)
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML upscale API error:', response.status, data);
        
        // Provide specific error handling for common issues
        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'You have exceeded your tier\'s concurrent generation limit. Please wait for current generations to complete.',
            retryAfter: '30'
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: `RunwayML server error (${response.status})`,
            message: 'RunwayML API is experiencing issues. This is usually temporary.',
            retryable: true
          });
        }
        
        // Return the actual error from RunwayML
        return res.status(response.status).json({
          error: `RunwayML Upscale API Error (${response.status}): ${data.error || data.message || 'Unknown error'}`,
          details: data,
          rawResponse: responseText.substring(0, 500)
        });
      }

      console.log('4K upscale request successful');
      res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Upscale request timeout',
          message: 'RunwayML API took too long to respond (60s)',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Upscale proxy error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}