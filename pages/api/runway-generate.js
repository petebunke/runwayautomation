// /pages/api/runway-generate.js (Vercel serverless function)
// This file handles video generation requests to RunwayML API

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

    console.log('Generating video with prompt:', payload.text_prompt.substring(0, 50) + '...');

    // Use the correct RunwayML API format based on latest documentation
    const requestBody = {
      promptText: payload.text_prompt
    };

    // Add optional parameters
    if (payload.image_prompt) {
      requestBody.promptImage = payload.image_prompt;
    }

    // Make request to RunwayML's current API endpoint
    const response = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
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
        400: 'Invalid request parameters',
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