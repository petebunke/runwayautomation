// /pages/api/runway-upscale.js
// Corrected implementation based on official RunwayML API documentation

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
    const { apiKey, taskId, videoUrl } = req.body;

    // Validate required fields
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // We need either taskId (to fetch video URL) or direct videoUrl
    if (!taskId && !videoUrl) {
      return res.status(400).json({ error: 'Task ID or video URL is required' });
    }

    console.log('Starting 4K upscale for task:', taskId);

    let videoUri = videoUrl;

    // If we have taskId but no videoUrl, we need to fetch the completed video URL first
    if (taskId && !videoUrl) {
      console.log('Fetching video URL from task:', taskId);
      
      try {
        const taskResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Runway-Version': '2024-11-06'
          }
        });

        if (!taskResponse.ok) {
          return res.status(taskResponse.status).json({
            error: 'Failed to fetch task details',
            message: `Could not retrieve video URL for task ${taskId}`
          });
        }

        const taskData = await taskResponse.json();
        
        if (taskData.status !== 'SUCCEEDED') {
          return res.status(400).json({
            error: 'Video not ready for upscaling',
            message: `Task ${taskId} has status: ${taskData.status}. Only completed videos can be upscaled.`
          });
        }

        if (!taskData.output || !taskData.output[0]) {
          return res.status(400).json({
            error: 'No video URL found',
            message: `Task ${taskId} completed but no video URL available`
          });
        }

        videoUri = taskData.output[0];
        console.log('Retrieved video URL:', videoUri.substring(0, 50) + '...');
        
      } catch (fetchError) {
        return res.status(500).json({
          error: 'Failed to fetch task details',
          message: fetchError.message
        });
      }
    }

    // Create the upscale request payload according to official API docs
    const requestBody = {
      videoUri: videoUri,
      model: "upscale_v1"
    };

    console.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      // Make request to official RunwayML video_upscale API with correct parameters
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
      console.log('RunwayML upscale API response:', responseText.substring(0, 500));

      // Check if response is HTML (indicates server error or non-JSON response)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Received HTML response instead of JSON:', responseText.substring(0, 300));
        return res.status(502).json({
          error: 'RunwayML upscale API returned an HTML page instead of JSON',
          message: 'This usually indicates a server error or maintenance on RunwayML\'s side.',
          videoUri: videoUri.substring(0, 50) + '...'
        });
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Received empty response from RunwayML upscale API');
        return res.status(502).json({
          error: 'Empty response from RunwayML upscale API',
          message: 'The upscale API returned an empty response'
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse upscale response as JSON:', parseError);
        console.log('Raw response causing parse error:', responseText.substring(0, 500));
        
        return res.status(502).json({
          error: 'Invalid response from RunwayML upscale API',
          message: 'The API returned an unexpected response format',
          rawResponse: responseText.substring(0, 200),
          parseError: parseError.message
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML upscale API error:', response.status, data);
        
        // Provide more specific error messages
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again'
          });
        }
        
        if (response.status === 404) {
          return res.status(404).json({
            error: 'Upscale endpoint not found',
            message: 'The 4K upscale endpoint may not be available for your account tier'
          });
        }

        if (response.status === 400) {
          let errorMessage = data.error || data.message || 'Bad request';
          
          if (errorMessage.includes('credits') || errorMessage.includes('insufficient')) {
            return res.status(400).json({
              error: 'Insufficient credits',
              message: 'You do not have enough credits to perform 4K upscaling (~500 credits required)',
              details: data
            });
          }
          
          if (errorMessage.includes('duration') || errorMessage.includes('40 seconds')) {
            return res.status(400).json({
              error: 'Video too long for upscaling',
              message: 'Videos longer than 40 seconds cannot be upscaled to 4K',
              details: data
            });
          }

          if (errorMessage.includes('4096px') || errorMessage.includes('resolution')) {
            return res.status(400).json({
              error: 'Video resolution too large',
              message: 'Videos larger than 4096px on any side cannot be upscaled',
              details: data
            });
          }
          
          return res.status(400).json({
            error: 'Upscale request invalid',
            message: errorMessage,
            details: data
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many upscale requests. Please wait before trying again.',
            retryAfter: response.headers.get('Retry-After') || '60'
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: 'RunwayML server error',
            message: 'RunwayML upscale API is experiencing issues. This is usually temporary.',
            status: response.status,
            retryable: true
          });
        }

        return res.status(response.status).json({
          error: `RunwayML Upscale API Error (${response.status})`,
          message: data.error || data.message || 'Unknown error',
          details: data
        });
      }

      console.log('4K upscale request successful, task ID:', data.id);
      res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Request timeout',
          message: 'RunwayML upscale API took too long to respond (60s)',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to RunwayML upscale API',
          message: 'Network error while starting upscale process',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Upscale proxy error:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to RunwayML upscale API',
        message: 'Please check your internet connection and try again',
        retryable: true
      });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'RunwayML upscale API took too long to respond'
      });
    }

    // Handle other errors
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred while processing the upscale request',
      retryable: true
    });
  }
}