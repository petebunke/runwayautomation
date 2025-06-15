// /pages/api/runway-status.js (Fixed version with better error handling)
// This file handles task status polling requests to RunwayML API

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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskId, apiKey } = req.query;

    // Validate required parameters
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    console.log('Checking status for task:', taskId);

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Get the response as text first to handle potential issues
      const responseText = await response.text();
      console.log('Status response (first 300 chars):', responseText.substring(0, 300));

      // Check if response is HTML (indicates server error or non-JSON response)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Received HTML response instead of JSON:', responseText.substring(0, 300));
        return res.status(502).json({
          error: 'RunwayML API returned an HTML page instead of JSON',
          message: 'This usually indicates a server error or maintenance on RunwayML\'s side.',
          taskId: taskId
        });
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Received empty response from RunwayML status API');
        return res.status(502).json({
          error: 'Empty response from RunwayML API',
          message: 'The status API returned an empty response',
          taskId: taskId
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse status response as JSON:', parseError);
        console.log('Raw response causing parse error:', responseText.substring(0, 500));
        
        // Check if it's a binary response
        if (responseText.charCodeAt(0) === 0 || responseText.includes('\u0000')) {
          return res.status(502).json({
            error: 'Binary response received instead of JSON',
            message: 'RunwayML status API returned binary data instead of expected JSON response',
            taskId: taskId
          });
        }

        return res.status(502).json({
          error: 'Invalid response from RunwayML API',
          message: 'The API returned an unexpected response format',
          rawResponse: responseText.substring(0, 200),
          taskId: taskId,
          parseError: parseError.message
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML status API error:', response.status, data);
        
        // Provide more specific error messages
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again'
          });
        }
        
        if (response.status === 404) {
          return res.status(404).json({
            error: 'Task not found',
            message: 'The requested task ID does not exist'
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please wait before trying again.',
            retryAfter: response.headers.get('Retry-After') || '60'
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: 'RunwayML server error',
            message: 'RunwayML API is experiencing issues. This is usually temporary.',
            status: response.status,
            retryable: true
          });
        }

        return res.status(response.status).json({
          error: data.error || 'RunwayML API error',
          details: data,
          status: response.status
        });
      }

      console.log('Task status retrieved:', taskId, data.status);

      // Return successful response
      res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Request timeout',
          message: 'RunwayML API took too long to respond (30s)',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to RunwayML API',
          message: 'Network error while checking task status',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Status polling error:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to RunwayML API',
        message: 'Please check your internet connection and try again',
        retryable: true
      });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'RunwayML API took too long to respond'
      });
    }

    // Handle other errors
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      retryable: true
    });
  }
}