// /pages/api/runway-generate.js (Enhanced timeout version)

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

    // Make request using exact format from docs with increased timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

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

    const responseText = await response.text();
    console.log('RunwayML API response status:', response.status);
    console.log('RunwayML API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return res.status(502).json({
        error: 'Invalid response from RunwayML API',
        rawResponse: responseText.substring(0, 300)
      });
    }

    // Handle API errors
    if (!response.ok) {
      console.error('RunwayML API error:', response.status, data);
      
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
        error: `RunwayML API Error (${response.status}): ${data.error || data.message || 'Unknown error'}`,
        details: data,
        rawResponse: responseText.substring(0, 500)
      });
    }

    console.log('Video generation request successful');
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'Generation request timeout',
        message: 'RunwayML API took too long to respond (45s)',
        retryable: true
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}