// /pages/api/runway-generate.js (DEBUG VERSION)
// This version includes extensive logging to diagnose the exact issue

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

    console.log('=== DEBUG: Full request body ===');
    console.log(JSON.stringify(req.body, null, 2));

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
        message: 'The current RunwayML API only supports image-to-video generation. Please provide an image URL in the Image URLs section.',
        userFriendly: true
      });
    }

    console.log('=== DEBUG: Processing request ===');
    console.log('Prompt:', payload.text_prompt);
    console.log('Image URL:', payload.image_prompt);
    console.log('Model:', payload.model);
    console.log('Aspect ratio:', payload.aspect_ratio);
    console.log('Duration:', payload.duration);

    // Convert aspect ratio - ensure we use the exact values from the API docs
    const aspectRatioMap = {
      '16:9': '1280:720',   // Landscape
      '9:16': '720:1280',   // Portrait  
      '1:1': '960:960'      // Square
    };
    
    const ratio = aspectRatioMap[payload.aspect_ratio] || '1280:720';
    console.log('=== DEBUG: Mapped ratio ===', payload.aspect_ratio, '->', ratio);

    // Use the exact format from RunwayML documentation
    const requestBody = {
      promptText: payload.text_prompt,
      promptImage: payload.image_prompt.trim(),
      model: 'gen3a_turbo', // Use the exact model name from the API docs
      ratio: ratio,
      duration: parseInt(payload.duration) || 5
    };

    console.log('=== DEBUG: Final request body to RunwayML ===');
    console.log(JSON.stringify(requestBody, null, 2));

    // Make request to RunwayML API
    const apiUrl = 'https://api.dev.runwayml.com/v1/image_to_video';
    console.log('=== DEBUG: Making request to ===', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('=== DEBUG: Response status ===', response.status);
    console.log('=== DEBUG: Response headers ===', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('=== DEBUG: Raw response body ===');
    console.log(responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('=== DEBUG: JSON Parse Error ===', parseError);
      return res.status(502).json({
        error: 'Invalid response from RunwayML API',
        message: 'The API returned an unexpected response format',
        rawResponse: responseText,
        parseError: parseError.message
      });
    }

    console.log('=== DEBUG: Parsed response data ===');
    console.log(JSON.stringify(data, null, 2));

    // Handle API errors with detailed logging
    if (!response.ok) {
      console.error('=== DEBUG: API Error Details ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Data:', data);
      
      // Return detailed error information for debugging
      return res.status(response.status).json({
        error: `RunwayML API Error (${response.status})`,
        details: data,
        status: response.status,
        statusText: response.statusText,
        rawResponse: responseText,
        requestBody: requestBody, // Include what we sent for debugging
        debug: true
      });
    }

    console.log('=== DEBUG: Success! ===');
    res.status(200).json(data);

  } catch (error) {
    console.error('=== DEBUG: Server Error ===');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      debug: true
    });
  }
}