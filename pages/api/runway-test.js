// /pages/api/runway-test.js (Test endpoint to debug API issues)

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

    console.log('=== RUNWAY API TEST ===');
    console.log('Testing API key:', apiKey.substring(0, 10) + '...');

    // Test 1: Check account/me endpoint
    console.log('Test 1: Checking account endpoint...');
    try {
      const accountResponse = await fetch('https://api.dev.runwayml.com/v1/account/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        }
      });

      const accountText = await accountResponse.text();
      console.log('Account endpoint status:', accountResponse.status);
      console.log('Account endpoint response:', accountText.substring(0, 500));

      if (accountResponse.ok) {
        const accountData = JSON.parse(accountText);
        console.log('✅ Account endpoint working');
        
        // Test 2: Try a minimal image-to-video request with a test image
        console.log('Test 2: Testing minimal generation request...');
        
        const testRequestBody = {
          promptText: "Test video generation",
          promptImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", // Public test image
          model: "gen3a_turbo",
          ratio: "1280:768",
          duration: 5
        };

        console.log('Test request body:', JSON.stringify(testRequestBody, null, 2));

        const testResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Runway-Version': '2024-11-06'
          },
          body: JSON.stringify(testRequestBody)
        });

        const testText = await testResponse.text();
        console.log('Test generation status:', testResponse.status);
        console.log('Test generation response:', testText.substring(0, 1000));

        // Analyze the response
        let analysisResult = {
          accountEndpoint: {
            status: accountResponse.status,
            working: true,
            credits: accountData.credits || 0,
            tier: accountData.tier || 'unknown'
          },
          generationEndpoint: {
            status: testResponse.status,
            responseType: 'unknown',
            working: testResponse.ok,
            error: null
          }
        };

        // Analyze generation response
        if (testText.startsWith('<!DOCTYPE') || testText.startsWith('<html')) {
          analysisResult.generationEndpoint.responseType = 'HTML';
          analysisResult.generationEndpoint.error = 'Received HTML instead of JSON';
        } else if (testText.charCodeAt(0) === 0 || testText.charCodeAt(0) > 127) {
          analysisResult.generationEndpoint.responseType = 'Binary';
          analysisResult.generationEndpoint.error = 'Received binary data instead of JSON';
        } else if (!testText.trim()) {
          analysisResult.generationEndpoint.responseType = 'Empty';
          analysisResult.generationEndpoint.error = 'Received empty response';
        } else {
          try {
            const testData = JSON.parse(testText);
            analysisResult.generationEndpoint.responseType = 'JSON';
            analysisResult.generationEndpoint.data = testData;
            if (testResponse.ok) {
              analysisResult.generationEndpoint.working = true;
              console.log('✅ Generation endpoint working');
            } else {
              analysisResult.generationEndpoint.error = testData.error || testData.message || 'API error';
            }
          } catch (parseError) {
            analysisResult.generationEndpoint.responseType = 'Invalid JSON';
            analysisResult.generationEndpoint.error = 'Could not parse response as JSON';
            analysisResult.generationEndpoint.parseError = parseError.message;
          }
        }

        return res.status(200).json({
          success: true,
          message: 'API test completed',
          analysis: analysisResult,
          debug: {
            accountResponsePreview: accountText.substring(0, 200),
            generationResponsePreview: testText.substring(0, 200)
          }
        });

      } else {
        console.log('❌ Account endpoint failed');
        return res.status(accountResponse.status).json({
          success: false,
          error: 'Account endpoint failed',
          status: accountResponse.status,
          response: accountText.substring(0, 500)
        });
      }

    } catch (error) {
      console.error('Test error:', error);
      return res.status(500).json({
        success: false,
        error: 'Test failed with exception',
        message: error.message
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