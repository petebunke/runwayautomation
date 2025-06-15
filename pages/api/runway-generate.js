// /pages/api/runway-generate.js (Fixed for 2024-11-06 API version)

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

    if (!payload || !payload.promptText) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    // Check for promptImage - now expecting array format
    if (!payload.promptImage || !Array.isArray(payload.promptImage) || payload.promptImage.length === 0) {
      return res.status(400).json({ 
        error: 'Image required for video generation',
        message: 'The RunwayML API requires promptImage as an array of objects with uri and position properties.'
      });
    }

    // Validate promptImage array structure
    for (let i = 0; i < payload.promptImage.length; i++) {
      const image = payload.promptImage[i];
      if (!image.uri || !image.uri.trim()) {
        return res.status(400).json({
          error: 'Invalid promptImage format',
          message: `Image ${i + 1} is missing uri property`
        });
      }
      if (!image.position || !['first', 'last'].includes(image.position)) {
        return res.status(400).json({
          error: 'Invalid promptImage format',
          message: `Image ${i + 1} must have position set to "first" or "last"`
        });
      }
    }

    console.log('Generating video with prompt:', payload.promptText.substring(0, 50) + '...');
    console.log('Using images:', payload.promptImage.map(img => `${img.position}: ${img.uri.substring(0, 50)}...`));
    console.log('Aspect ratio received:', payload.ratio);

    // Use the EXACT format from RunwayML 2024-11-06 API documentation
    const requestBody = {
      promptText: payload.promptText,
      promptImage: payload.promptImage, // Now expects array format
      model: payload.model || 'gen3a_turbo',
      ratio: payload.ratio, // Now expects exact resolution like "1280:720"
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
          'X-Runway-Version': '2024-11-06' // Use the latest API version
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('RunwayML API response status:', response.status);
      console.log('RunwayML API response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.log('Raw response that failed to parse:', responseText.substring(0, 500));
        return res.status(502).json({
          error: 'Invalid response from RunwayML API',
          message: 'The API returned an unexpected response format',
          rawResponse: responseText.substring(0, 300),
          parseError: parseError.message
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

        if (response.status === 400) {
          // Handle specific 400 errors
          let errorMessage = data.error || data.message || 'Bad request';
          
          if (errorMessage.includes('credits') || errorMessage.includes('insufficient')) {
            return res.status(400).json({
              error: 'Insufficient credits',
              message: 'You do not have enough credits to generate this video. Please purchase more credits at dev.runwayml.com'
            });
          }
          
          if (errorMessage.includes('safety') || errorMessage.includes('content policy')) {
            return res.status(400).json({
              error: 'Content safety violation',
              message: 'Your prompt or image was flagged by RunwayML\'s content safety system. Please try different content.'
            });
          }
          
          if (errorMessage.includes('aspect ratio') || errorMessage.includes('invalid asset')) {
            return res.status(400).json({
              error: 'Invalid image format',
              message: 'Image aspect ratio must be between 0.5 and 2.0 (width/height). Very wide or very tall images are not supported.'
            });
          }
          
          return res.status(400).json({
            error: 'RunwayML API Error',
            message: errorMessage,
            details: data
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

      console.log('Video generation request successful');
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