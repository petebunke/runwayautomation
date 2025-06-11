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

    // First, get the video URL from the completed task
    const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      }
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json();
      throw new Error(`Failed to get task details: ${errorData.error || statusResponse.status}`);
    }

    const taskData = await statusResponse.json();
    
    if (taskData.status !== 'SUCCEEDED' || !taskData.output || !taskData.output[0]) {
      throw new Error('Task must be completed successfully before upscaling');
    }

    const videoUrl = taskData.output[0];
    console.log('Video URL for upscaling:', videoUrl);

    // Now call the upscale endpoint with the video URL
    const requestBody = {
      model: 'upscale_v1',
      promptVideo: videoUrl
    };

    console.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

    // Make request to RunwayML upscale API using the same pattern as other endpoints
    const response = await fetch('https://api.dev.runwayml.com/v1/video_to_video', {
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
}.log('Upscale request body:', JSON.stringify(requestBody, null, 2));

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