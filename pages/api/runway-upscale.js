// /pages/api/runway-upscale.js
// Corrected 4K upscale endpoint based on official RunwayML API

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
    const { apiKey, taskId } = req.body;

    // Validate required fields
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    console.log('Starting 4K upscale for task:', taskId);

    // Create the upscale request payload - trying different possible formats
    // Based on the RunwayML API pattern, it might expect a "task" or "taskId" field
    const requestBody = {
      task: taskId  // Try "task" instead of "taskId"
    };

    console.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      // Make request to official RunwayML video_upscale API
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
      console.log('RunwayML upscale API response (first 500 chars):', responseText.substring(0, 500));

      // If we get HTML, the endpoint might not exist or the request format is wrong
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Received HTML response instead of JSON:', responseText.substring(0, 300));
        
        // Try alternative request format
        console.log('Trying alternative request format...');
        
        const alternativeBody = {
          taskId: taskId  // Try "taskId" format
        };
        
        const altResponse = await fetch('https://api.dev.runwayml.com/v1/video_upscale', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Runway-Version': '2024-11-06'
          },
          body: JSON.stringify(alternativeBody),
          signal: controller.signal
        });
        
        const altResponseText = await altResponse.text();
        console.log('Alternative request response status:', altResponse.status);
        console.log('Alternative request response (first 500 chars):', altResponseText.substring(0, 500));
        
        if (altResponseText.startsWith('<!DOCTYPE') || altResponseText.startsWith('<html')) {
          return res.status(501).json({
            error: '4K upscale endpoint not available',
            message: 'The 4K upscale feature may not be available in your API tier or the endpoint format has changed. Please use the web interface for 4K upscaling.',
            taskId: taskId,
            suggestion: 'Visit runwayml.com to upscale videos to 4K through the web interface'
          });
        }
        
        // Use alternative response if it worked
        responseText = altResponseText;
        response = altResponse;
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Received empty response from RunwayML upscale API');
        return res.status(502).json({
          error: 'Empty response from RunwayML upscale API',
          message: 'The upscale API returned an empty response',
          taskId: taskId
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse upscale response as JSON:', parseError);
        console.log('Raw response causing parse error:', responseText.substring(0, 500));
        
        // Check if it's a binary response
        if (responseText.charCodeAt(0) === 0 || responseText.includes('\u0000')) {
          return res.status(502).json({
            error: 'Binary response received instead of JSON',
            message: 'RunwayML upscale API returned binary data instead of expected JSON response',
            taskId: taskId
          });
        }

        return res.status(502).json({
          error: 'Invalid response from RunwayML upscale API',
          message: 'The API returned an unexpected response format',
          rawResponse: responseText.substring(0, 200),
          taskId: taskId,
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
            error: 'Upscale endpoint or task not found',
            message: 'The 4K upscale endpoint may not be available for your account tier, or the task ID is invalid',
            suggestion: 'Try using the web interface at runwayml.com for 4K upscaling'
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
          
          if (errorMessage.includes('not eligible') || errorMessage.includes('cannot be upscaled')) {
            return res.status(400).json({
              error: 'Video not eligible for upscaling',
              message: 'This video cannot be upscaled. Only completed videos can be upscaled to 4K.',
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
          details: data,
          rawResponse: responseText.substring(0, 500)
        });
      }

      console.log('4K upscale request successful, task ID:', data.id || data.taskId);
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