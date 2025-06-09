// /pages/api/runway-generate.js (Vercel serverless function)
// This file handles video generation requests to RunwayML API
// NOTE: Current RunwayML API ONLY supports image-to-video, NOT text-to-video

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

    // IMPORTANT: Current RunwayML API requires an image for video generation
    const hasImage = payload.image_prompt && payload.image_prompt.trim();
    
    if (!hasImage) {
      return res.status(400).json({ 
        error: 'Image required for video generation',
        message: 'The current RunwayML API only supports image-to-video generation. Please provide an image URL in the Image URLs section.',
        userFriendly: true
      });
    }

    console.log('Generating video with prompt:', payload.text_prompt.substring(0, 50) + '...');
    console.log('Using image:', payload.image_prompt.substring(0, 50) + '...');

    // Convert aspect ratio to exact pixel dimensions as required by API
    const aspectRatioMap = {
      '16:9': '1280:720',
      '9:16': '720:1280',
      '1:1': '960:960'
    };
    
    const ratio = aspectRatioMap[payload.aspect_ratio] || '1280:720';

    // Use the correct RunwayML API format
    const requestBody = {
      promptText: payload.text_prompt,
      promptImage: payload.image_prompt,
      model: payload.model || 'gen3a_turbo',
      ratio: ratio,
      duration: payload.duration || 5
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Make request to RunwayML's image_to_video endpoint (only supported endpoint)
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('RunwayML API response status:', response.status);
    console.log('RunwayML API response:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return res.status(502).json({
        error: 'Invalid response from RunwayML API',
        message: 'The API returned an unexpected response format',
        rawResponse: responseText.substring(0, 200)
      });
    }

    // Handle API errors with detailed logging
    if (!response.ok) {
      console.error('RunwayML API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      // Map common error codes to user-friendly messages
      const errorMessages = {
        400: 'Invalid request parameters - check your image URL and prompt',
        401: 'Invalid API key - please check your RunwayML API key',
        402: 'Insufficient credits in your RunwayML account',
        403: 'Access forbidden - check your API key permissions',
        429: 'Rate limit exceeded - please wait before trying again',
        500: 'RunwayML server error - please try again later'
      };

      const userMessage = errorMessages[response.status] || `API Error (${response.status})`;

      return res.status(response.status).json({
        error: userMessage,
        details: data,
        status: response.status,
        apiResponse: responseText.substring(0, 300)
      });
    }

    console.log('Video generation request successful');
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Provide detailed error information for debugging
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}