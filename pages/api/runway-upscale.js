// /pages/api/runway-upscale.js
// This file handles 4K upscale requests to RunwayML API

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

    // Use the RunwayML upscale_v1 endpoint
    const requestBody = {
      taskId: taskId
    };

    console.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

    // Make request to RunwayML upscale API
    const response = await fetch('https://api.dev.runwayml.com/v1/upscale_v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('RunwayML upscale API response status:', response.status);
    console.log('RunwayML upscale API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse upscale response as JSON:', parseError);
      return res.status(502).json({
        error: 'Invalid response from RunwayML upscale API',
        rawResponse: responseText.substring(0, 300)
      });
    }

    // Handle API errors
    if (!response.ok) {
      console.error('RunwayML upscale API error:', response.status, data);
      
      return res.status(response.status).json({
        error: `RunwayML Upscale API Error (${response.status}): ${data.error || data.message || 'Unknown error'}`,
        details: data,
        rawResponse: responseText.substring(0, 500)
      });
    }

    console.log('4K upscale request successful');
    res.status(200).json(data);

  } catch (error) {
    console.error('Upscale proxy error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}