// /api/runway-generate.js (Vercel serverless function)
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

    if (!payload) {
      return res.status(400).json({ error: 'Payload is required' });
    }

    // Validate payload structure
    if (!payload.text_prompt) {
      return res.status(400).json({ error: 'Text prompt is required in payload' });
    }

    console.log('Generating video with payload:', {
      ...payload,
      text_prompt: payload.text_prompt.substring(0, 50) + '...'
    });

    // Make request to RunwayML API
    const response = await fetch('https://api.runwayml.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error('RunwayML API error:', response.status, data);
      return res.status(response.status).json({
        error: data.error || 'RunwayML API error',
        details: data,
        status: response.status
      });
    }

    console.log('Video generation started successfully:', data.id);

    // Return successful response
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to RunwayML API',
        message: 'Please check your internet connection and try again'
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
      message: error.message 
    });
  }
}