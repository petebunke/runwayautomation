// /pages/api/runway-debug.js (Debug endpoint to test API connectivity)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required for testing' });
    }

    console.log('=== RUNWAY API DEBUG TEST ===');
    console.log('Testing API key:', apiKey.substring(0, 10) + '...');

    // Test 1: Check account endpoint
    console.log('Test 1: Checking account endpoint...');
    try {
      const accountResponse = await fetch('https://api.dev.runwayml.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        }
      });

      const accountText = await accountResponse.text();
      console.log('Account response status:', accountResponse.status);
      console.log('Account response headers:', Object.fromEntries(accountResponse.headers.entries()));
      console.log('Account response body:', accountText.substring(0, 500));

      let accountData = null;
      if (accountText) {
        try {
          accountData = JSON.parse(accountText);
        } catch (e) {
          console.log('Account response is not JSON');
        }
      }

      // Test 2: Try a minimal generation request  
      console.log('Test 2: Testing minimal generation request...');
      
      const testPayload = {
        promptText: "A simple test video",
        promptImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        model: "gen4_turbo",
        ratio: "1280:720",
        duration: 5
      };

      console.log('Test payload:', JSON.stringify(testPayload, null, 2));

      const genResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify(testPayload)
      });

      const genText = await genResponse.text();
      console.log('Generation response status:', genResponse.status);
      console.log('Generation response headers:', Object.fromEntries(genResponse.headers.entries()));
      console.log('Generation response body:', genText.substring(0, 1000));

      // Analyze the responses
      const results = {
        accountTest: {
          status: accountResponse.status,
          ok: accountResponse.ok,
          contentType: accountResponse.headers.get('content-type'),
          isJson: accountText.startsWith('{') || accountText.startsWith('['),
          isHtml: accountText.startsWith('<!DOCTYPE') || accountText.startsWith('<html'),
          isEmpty: !accountText.trim(),
          firstChar: accountText.length > 0 ? accountText.charCodeAt(0) : null,
          preview: accountText.substring(0, 100)
        },
        generationTest: {
          status: genResponse.status,
          ok: genResponse.ok,
          contentType: genResponse.headers.get('content-type'),
          isJson: genText.startsWith('{') || genText.startsWith('['),
          isHtml: genText.startsWith('<!DOCTYPE') || genText.startsWith('<html'),
          isEmpty: !genText.trim(),
          firstChar: genText.length > 0 ? genText.charCodeAt(0) : null,
          preview: genText.substring(0, 100)
        }
      };

      return res.status(200).json({
        success: true,
        message: 'Debug test completed',
        results: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Test error:', error);
      return res.status(500).json({
        success: false,
        error: 'Test failed with exception',
        message: error.message,
        stack: error.stack
      });
    }

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}