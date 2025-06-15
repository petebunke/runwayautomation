// /pages/api/runway-generate.js (Debug version with enhanced logging)

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

    console.log('=== RUNWAY API REQUEST DEBUG ===');
    console.log('Model:', payload.model);
    console.log('Aspect ratio input:', payload.aspect_ratio);
    console.log('Duration:', payload.duration);
    console.log('Image URL length:', payload.image_prompt.length);
    console.log('Image URL starts with:', payload.image_prompt.substring(0, 50));
    console.log('Prompt:', payload.text_prompt.substring(0, 100));

    // FIXED: Use the correct ratio format for API version 2024-11-06
    // The new API version requires exact resolutions, not ratios
    let ratio;
    if (payload.model === 'gen4_turbo') {
      // Gen-4 Turbo uses exact resolutions
      switch (payload.aspect_ratio) {
        case '1280:720':
          ratio = '1280:720';
          break;
        case '720:1280':
          ratio = '720:1280';
          break;
        case '960:960':
          ratio = '960:960';
          break;
        case '1104:832':
          ratio = '1104:832';
          break;
        case '832:1104':
          ratio = '832:1104';
          break;
        case '1584:672':
          ratio = '1584:672';
          break;
        default:
          ratio = '1280:720'; // Default to landscape
      }
    } else {
      // Gen-3 Alpha Turbo
      ratio = payload.aspect_ratio === '768:1280' ? '768:1280' : '1280:768';
    }

    console.log('Calculated ratio for API:', ratio);

    // FIXED: Use the correct request format according to API docs
    const requestBody = {
      promptText: payload.text_prompt,
      promptImage: payload.image_prompt.trim(),
      model: payload.model || 'gen3a_turbo',
      ratio: ratio,
      duration: payload.duration || 5,
      seed: payload.seed || Math.floor(Math.random() * 1000000)
    };

    console.log('Final request body:', JSON.stringify(requestBody, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      console.log('Making request to RunwayML API...');
      
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

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Get response as text first to handle potential HTML/non-JSON responses
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));
      console.log('Response text (last 200 chars):', responseText.substring(Math.max(0, responseText.length - 200)));

      // Enhanced response type detection
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html') || responseText.includes('<body>')) {
        console.error('Received HTML response instead of JSON');
        return res.status(502).json({
          error: 'RunwayML API returned HTML instead of JSON',
          message: 'This usually indicates a server error, maintenance, or authentication issue.',
          statusCode: response.status,
          responsePreview: responseText.substring(0, 200)
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

      // Check for binary data (common indicators)
      const firstChar = responseText.charCodeAt(0);
      if (firstChar === 0 || firstChar > 127 || responseText.includes('\u0000')) {
        console.error('Received binary response, first char code:', firstChar);
        return res.status(502).json({
          error: 'Binary response received instead of JSON',
          message: 'RunwayML API returned binary data instead of expected JSON response',
          statusCode: response.status,
          firstCharCode: firstChar,
          responsePreview: responseText.substring(0, 100).split('').map(c => c.charCodeAt(0)).join(',')
        });
      }

      // Check for other non-JSON indicators
      if (responseText.startsWith('PK') || responseText.startsWith('\x89PNG') || responseText.startsWith('\xFF\xD8\xFF')) {
        console.error('Received file data instead of JSON');
        return res.status(502).json({
          error: 'File data received instead of JSON',
          message: 'RunwayML API returned file data (possibly image/video) instead of expected JSON response',
          statusCode: response.status
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Successfully parsed JSON response');
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.log('Parse error details:', parseError.message);
        
        return res.status(502).json({
          error: 'Invalid response from RunwayML API',
          message: 'Could not parse response as JSON',
          statusCode: response.status,
          parseError: parseError.message,
          responsePreview: responseText.substring(0, 300)
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML API error:', response.status, data);
        
        // Provide specific error handling for common issues
        if (response.status === 400) {
          return res.status(400).json({
            error: 'Bad Request',
            message: data.error || data.message || 'Invalid request parameters',
            details: data,
            statusCode: response.status
          });
        }

        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again',
            statusCode: response.status
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'You have exceeded your tier\'s concurrent generation limit. Please wait for current generations to complete.',
            retryAfter: response.headers.get('Retry-After') || '30',
            statusCode: response.status
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: `RunwayML server error (${response.status})`,
            message: 'RunwayML API is experiencing issues. This is usually temporary.',
            retryable: true,
            statusCode: response.status
          });
        }
        
        // Return the actual error from RunwayML
        return res.status(response.status).json({
          error: `RunwayML API Error (${response.status})`,
          message: data.error || data.message || 'Unknown error',
          details: data,
          statusCode: response.status
        });
      }

      console.log('Video generation request successful, returning data');
      res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Generation request timeout',
          message: 'RunwayML API took too long to respond (45s)',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to RunwayML API',
          message: 'Network error while processing generation request',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Proxy error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      retryable: true
    });
  }
}