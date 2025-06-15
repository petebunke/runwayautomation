// /pages/api/runway-generate.js (Fixed deployment version)

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

    if (!payload || !payload.text_prompt) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    // Check for image
    const hasImage = payload.image_prompt && payload.image_prompt.trim();
    
    if (!hasImage) {
      return res.status(400).json({ 
        error: 'Image required for video generation',
        message: 'The current RunwayML API only supports image-to-video generation.'
      });
    }

    console.log('Generating video with prompt:', payload.text_prompt.substring(0, 50) + '...');
    console.log('Using image:', payload.image_prompt);
    console.log('Aspect ratio received:', payload.aspect_ratio);

    // Use the EXACT format from RunwayML documentation
    const requestBody = {
      promptText: payload.text_prompt,
      promptImage: payload.image_prompt.trim(),
      model: payload.model || 'gen3a_turbo',
      ratio: payload.aspect_ratio,
      duration: payload.duration || 5,
      seed: payload.seed || Math.floor(Math.random() * 1000000)
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
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

      console.log('RunwayML API response status:', response.status);
      console.log('RunwayML API response headers:', Object.fromEntries(response.headers.entries()));

      // Get the response as text first to handle potential issues
      const responseText = await response.text();
      console.log('RunwayML API response (first 500 chars):', responseText.substring(0, 500));

      // Check if response is HTML (indicates server error or non-JSON response)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Received HTML response instead of JSON:', responseText.substring(0, 300));
        return res.status(502).json({
          error: 'RunwayML API returned an HTML page instead of JSON',
          message: 'This usually indicates a server error or maintenance on RunwayML\'s side.',
          statusCode: response.status
        });
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Received empty response from RunwayML API');
        return res.status(502).json({
          error: 'Empty response from RunwayML API',
          message: 'The API returned an empty response',
          statusCode: response.status
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Raw response causing parse error:', responseText);
        
        // Check if it's a binary response (like a file download)
        if (responseText.charCodeAt(0) === 0 || responseText.includes('\u0000')) {
          return res.status(502).json({
            error: 'Binary response received instead of JSON',
            message: 'RunwayML API returned binary data instead of expected JSON response',
            statusCode: response.status
          });
        }

        return res.status(502).json({
          error: 'Invalid JSON response from RunwayML API',
          message: 'The API returned a response that could not be parsed as JSON',
          rawResponse: responseText.substring(0, 300),
          parseError: parseError.message,
          statusCode: response.status
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML API error:', response.status, data);
        
        // Provide specific error handling for common issues
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again'
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'You have exceeded your tier\'s concurrent generation limit. Please wait for current generations to complete.',
            retryAfter: response.headers.get('Retry-After') || '30'
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
          error: `RunwayML API Error (${response.status}): ${data.error || data.message || 'Unknown error'}`,
          details: data,
          rawResponse: responseText.substring(0, 500)
        });
      }

      console.log('Video generation request successful, task ID:', data.id);
      res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Generation request timeout',
          message: 'RunwayML API took too long to respond (45s)',
          retryable: true
        });
      }
      
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      });
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Handle network errors gracefully
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to RunwayML API',
        message: 'Network error while processing generation request',
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
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      retryable: true
    });
  }
}