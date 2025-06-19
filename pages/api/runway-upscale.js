// /pages/api/runway-upscale.js
// Updated to use the Gen-4 upscale endpoint from the useapi.net guide

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
      return res.status(400).json({ error: 'Video URL (promptVideo) is required for upscaling' });
    }

    console.log('Starting 4K upscale for video:', payload.promptVideo);

    // Use the Gen-4 upscale endpoint from the useapi.net guide
    const requestBody = {
      promptVideo: payload.promptVideo
    };

    console.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/gen4_upscale', {
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
      console.log('RunwayML Gen-4 upscale API response status:', response.status);
      console.log('RunwayML Gen-4 upscale API response:', responseText.substring(0, 500)); // Limit log size

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse upscale response as JSON:', parseError);
        return res.status(502).json({
          error: 'Invalid response from RunwayML Gen-4 upscale API',
          message: 'The API returned an unexpected response format',
          rawResponse: responseText.substring(0, 300)
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML Gen-4 upscale API error:', response.status, data);
        
        // Provide specific error handling for common issues
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again'
          });
        }

        if (response.status === 400 && data.error && data.error.includes('credits')) {
          return res.status(400).json({
            error: 'Insufficient credits',
            message: 'You do not have enough credits to perform 4K upscaling. Gen-4 upscale requires approximately 100-200 credits per video.'
          });
        }

        if (response.status === 400 && data.error && data.error.includes('video')) {
          return res.status(400).json({
            error: 'Invalid video',
            message: 'The provided video URL is invalid or the video cannot be upscaled. Please ensure the video was generated using a compatible model.'
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'You have exceeded your tier\'s rate limit. Please wait before trying again.',
            retryAfter: response.headers.get('Retry-After') || '60'
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
          error: `RunwayML Gen-4 Upscale API Error (${response.status}): ${data.error || data.message || 'Unknown error'}`,
          details: data,
          rawResponse: responseText.substring(0, 500)
        });
      }

      console.log('4K upscale request successful - Task ID:', data.id);
      
      // Return the successful response with task information
      res.status(200).json({
        id: data.id,
        status: data.status || 'PENDING',
        message: '4K upscale initiated successfully',
        taskId: data.id,
        estimatedTime: '5-15 minutes',
        credits: data.credits || 'Unknown',
        ...data
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Upscale request timeout',
          message: 'RunwayML Gen-4 upscale API took too long to respond (60s)',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to RunwayML API',
          message: 'Network error while processing upscale request',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Upscale proxy error:', error);
    
    // Return error details for debugging while maintaining security
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred during upscaling',
      retryable: true
    });
  }
}