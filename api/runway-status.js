// /api/runway-status.js (Vercel serverless function)
// This file handles task status polling requests to RunwayML API

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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskId, apiKey } = req.query;

    // Validate required parameters
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    console.log('Checking status for task:', taskId);

    // Make request to RunwayML API with correct endpoint
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error('RunwayML status API error:', response.status, data);
      
      // Provide more specific error messages
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'Please check your RunwayML API key and try again'
        });
      }
      
      if (response.status === 404) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The requested task ID does not exist'
        });
      }

      return res.status(response.status).json({
        error: data.error || 'RunwayML API error',
        details: data,
        status: response.status
      });
    }

    console.log('Task status retrieved:', taskId, data.status);

    // Return successful response
    res.status(200).json(data);

  } catch (error) {
    console.error('Status polling error:', error);
    
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