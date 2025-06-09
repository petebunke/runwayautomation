import React, { useState } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Key, ExternalLink, CreditCard } from 'lucide-react';
import Head from 'next/head';

export default function RunwayAutomationApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [runwayApiKey, setRunwayApiKey] = useState('');
  const [prompts, setPrompts] = useState(['A serene lake with mountains in the background at sunset']);
  const [images, setImages] = useState(['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720']);
  const [model, setModel] = useState('gen3a_turbo');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [concurrency, setConcurrency] = useState(1);
  const [minWait, setMinWait] = useState(5);
  const [maxWait, setMaxWait] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [generationProgress, setGenerationProgress] = useState({});

  // Auto-adjust prompts and images when concurrency changes
  const handleConcurrencyChange = (newConcurrency) => {
    setConcurrency(newConcurrency);
    
    // Adjust prompts to match concurrency
    if (prompts.length < newConcurrency) {
      // Add more prompts if needed
      const promptsToAdd = newConcurrency - prompts.length;
      const newPrompts = [...prompts];
      for (let i = 0; i < promptsToAdd; i++) {
        newPrompts.push('');
      }
      setPrompts(newPrompts);
    } else if (prompts.length > newConcurrency) {
      // Keep only the first 'newConcurrency' prompts
      setPrompts(prompts.slice(0, newConcurrency));
    }
    
    // Adjust images to match concurrency - fixed logic
    if (images.length < newConcurrency) {
      // Add more image slots if needed
      const imagesToAdd = newConcurrency - images.length;
      const newImages = [...images];
      for (let i = 0; i < imagesToAdd; i++) {
        newImages.push('');
      }
      setImages(newImages);
    } else if (images.length > newConcurrency) {
      // Remove extra image slots when reducing concurrency
      setImages(images.slice(0, newConcurrency));
    }
  };

  // Autofill all prompts with the value from Prompt 1
  const autofillPrompts = () => {
    if (prompts[0] && prompts[0].trim()) {
      const firstPrompt = prompts[0];
      const newPrompts = prompts.map(() => firstPrompt);
      setPrompts(newPrompts);
      addLog('✅ Autofilled all prompts with: "' + firstPrompt.substring(0, 30) + '..."', 'success');
    } else {
      addLog('❌ Cannot autofill - Prompt 1 is empty', 'error');
    }
  };

  // Autofill all images with the value from Image 1
  const autofillImages = () => {
    if (images[0] && images[0].trim()) {
      const firstImage = images[0];
      const newImages = images.map(() => firstImage);
      setImages(newImages);
      addLog('✅ Autofilled all images with: "' + firstImage.substring(0, 40) + '..."', 'success');
    } else {
      addLog('❌ Cannot autofill - Image 1 is empty', 'error');
    }
  };

  const modelOptions = [
    { value: 'gen4_turbo', label: 'Gen-4 Turbo (Newest, highest quality)' },
    { value: 'gen3a_turbo', label: 'Gen-3 Alpha Turbo (Fast, reliable)' }
  ];

  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '1:1', label: '1:1 (Square)' }
  ];

  const addPrompt = () => {
    setPrompts([...prompts, '']);
  };

  const removePrompt = (index) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index, value) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const addImage = () => {
    setImages([...images, '']);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const API_BASE = '/api';

  const generateVideo = async (prompt, imageUrl = null, jobIndex = 0) => {
    const jobId = 'job_' + jobIndex + '_' + Date.now();
    
    try {
      // Check if image is provided (required for current API)
      if (!imageUrl || !imageUrl.trim()) {
        const errorMsg = 'Image URL is required for video generation. The current RunwayML API only supports image-to-video generation.';
        addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { status: 'failed', progress: 0, error: errorMsg }
        }));
        
        throw new Error(errorMsg);
      }

      addLog('Starting generation for job ' + (jobIndex + 1) + ': "' + prompt.substring(0, 50) + '..." with image', 'info');
      
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'starting', progress: 0 }
      }));

      const payload = {
        text_prompt: prompt,
        image_prompt: imageUrl.trim(),
        model: model,
        aspect_ratio: aspectRatio,
        duration: duration,
        seed: Math.floor(Math.random() * 1000000)
      };

      console.log('🐛 DEBUG: Sending request for job', jobIndex + 1, payload);

      const response = await fetch(API_BASE + '/runway-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: runwayApiKey,
          payload: payload
        })
      });

      console.log('🐛 DEBUG: Response status for job', jobIndex + 1, response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('🐛 DEBUG: Error response for job', jobIndex + 1, errorData);
        throw new Error(errorData.error || 'API Error: ' + response.status);
      }

      const task = await response.json();
      console.log('🐛 DEBUG: Task created for job', jobIndex + 1, task);
      
      addLog('✓ Generation started for job ' + (jobIndex + 1) + ' (Task ID: ' + task.id + ') - Initial Status: ' + (task.status || 'unknown'), 'success');
      
      return await pollTaskCompletion(task.id, jobId, prompt, imageUrl, jobIndex);
      
    } catch (error) {
      addLog('✗ Job ' + (jobIndex + 1) + ' failed: ' + error.message, 'error');
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'failed', progress: 0, error: error.message }
      }));
      throw error;
    }
  };

  const pollTaskCompletion = async (taskId, jobId, prompt, imageUrl, jobIndex) => {
    // Increased timeouts for throttled jobs - they can take much longer
    const maxPolls = Math.floor(1800 / 8); // 30 minutes max, 8 second intervals
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // More tolerance for network issues
    let isThrottled = false;
    let throttledStartTime = null;

    while (pollCount < maxPolls) {
      try {
        const response = await fetch(API_BASE + '/runway-status?taskId=' + taskId + '&apiKey=' + encodeURIComponent(runwayApiKey), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Longer timeout for better reliability
          signal: AbortSignal.timeout(25000) // 25 second timeout
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Polling failed: ' + response.status);
        }

        const task = await response.json();
        
        // Reset consecutive errors on successful response
        consecutiveErrors = 0;
        
        // Handle throttled status specifically
        if (task.status === 'THROTTLED') {
          if (!isThrottled) {
            isThrottled = true;
            throttledStartTime = Date.now();
            addLog('⏸️ Job ' + (jobIndex + 1) + ' is queued (throttled) - waiting for available slot...', 'info');
          }
          
          const throttledDuration = Math.floor((Date.now() - throttledStartTime) / 1000);
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { 
              status: 'throttled', 
              progress: 5, // Small progress to show it's active
              message: `Queued for ${throttledDuration}s` 
            }
          }));
          
          // Log periodic updates for very long waits
          if (throttledDuration > 0 && throttledDuration % 60 === 0) {
            addLog('⏸️ Job ' + (jobIndex + 1) + ' still queued after ' + Math.floor(throttledDuration / 60) + ' minute(s)', 'info');
          }
          
          // Use longer polling interval for throttled jobs to reduce API load
          await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds for throttled
          pollCount++;
          continue;
        }
        
        // If we were throttled but now have a different status, log the transition
        if (isThrottled && task.status !== 'THROTTLED') {
          const queueTime = Math.floor((Date.now() - throttledStartTime) / 1000);
          addLog('▶️ Job ' + (jobIndex + 1) + ' started processing after ' + queueTime + 's in queue', 'info');
          isThrottled = false;
        }
        
        // Calculate progress based on status and time
        let progress = 10;
        if (task.status === 'PENDING') {
          progress = 20;
        } else if (task.status === 'RUNNING') {
          // More dynamic progress for running jobs
          const runningTime = Math.max(0, pollCount - 5); // Assume it started running after 5 polls
          progress = Math.min(30 + (runningTime * 3), 90);
        } else if (task.status === 'SUCCEEDED') {
          progress = 100;
        }
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { 
            status: task.status.toLowerCase(), 
            progress: progress,
            message: task.status === 'RUNNING' ? 'Processing...' : task.status.toLowerCase()
          }
        }));

        if (task.status === 'SUCCEEDED') {
          addLog('✓ Job ' + (jobIndex + 1) + ' completed successfully', 'success');
          
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'completed', progress: 100 }
          }));

          const completedVideo = {
            id: taskId,
            prompt: prompt,
            video_url: task.output && task.output[0] ? task.output[0] : null,
            thumbnail_url: task.output && task.output[1] ? task.output[1] : null,
            image_url: imageUrl,
            status: 'completed',
            created_at: new Date().toISOString()
          };

          // Add completed video to results immediately for real-time display
          setResults(prev => [...prev, completedVideo]);

          return completedVideo;
        }

        if (task.status === 'FAILED') {
          throw new Error(task.failure_reason || 'Generation failed');
        }

        // Normal polling interval for active jobs
        await new Promise(resolve => setTimeout(resolve, 8000)); // 8 seconds
        pollCount++;
        
      } catch (error) {
        consecutiveErrors++;
        
        // More specific error handling
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' polling timeout, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' network error, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' rate limited, waiting longer... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
          // Extra delay for rate limits
          await new Promise(resolve => setTimeout(resolve, 15000));
        } else {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' error: ' + error.message + ' (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        }
        
        // If we've had too many consecutive errors, fail the task
        if (consecutiveErrors >= maxConsecutiveErrors) {
          const finalError = 'Failed after ' + maxConsecutiveErrors + ' consecutive errors. Last error: ' + error.message;
          addLog('✗ Job ' + (jobIndex + 1) + ' ' + finalError, 'error');
          throw new Error(finalError);
        }
        
        // Progressive backoff - wait longer after each error
        const backoffDelay = Math.min(10000 + (consecutiveErrors * 5000), 30000); // 10s to 30s
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        pollCount++;
      }
    }

    const totalTime = Math.floor((pollCount * 8) / 60);
    throw new Error('Generation timeout after ' + totalTime + ' minutes');
  };

  const generateVideos = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    setGenerationProgress({});
    
    addLog('🚀 Starting Runway video generation...', 'info');
    addLog('Configuration: ' + model + ', ' + aspectRatio + ', ' + duration + 's', 'info');
    
    const activePrompts = prompts.filter(p => p.trim());
    const activeImages = images.filter(img => img.trim());
    
    if (activePrompts.length === 0) {
      addLog('❌ No prompts provided!', 'error');
      setIsRunning(false);
      return;
    }

    // IMPORTANT: Validate that images are provided
    if (activeImages.length === 0) {
      addLog('❌ Images are required! The current RunwayML API only supports image-to-video generation. Please add at least one image URL.', 'error');
      setIsRunning(false);
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('❌ RunwayML API key is required!', 'error');
      setIsRunning(false);
      return;
    }

    const totalJobs = Math.max(activePrompts.length, activeImages.length);
    addLog('📊 Processing ' + totalJobs + ' video generations...', 'info');
    addLog('💳 Note: Each generation requires credits from your API account', 'info');

    const results = [];
    const errors = [];

    for (let i = 0; i < totalJobs; i += concurrency) {
      const batch = [];
      
      for (let j = 0; j < concurrency && (i + j) < totalJobs; j++) {
        const jobIndex = i + j;
        const promptIndex = jobIndex % activePrompts.length;
        const imageIndex = jobIndex % activeImages.length; // Always use an image
        
        const prompt = activePrompts[promptIndex];
        const imageUrl = activeImages[imageIndex]; // Required
        
        if (jobIndex > 0) {
          // Longer wait time to prevent API rate limiting
          const waitTime = Math.random() * (maxWait - minWait) + minWait + 2; // Add 2 seconds base
          addLog('⏱️ Waiting ' + waitTime.toFixed(1) + 's before next job to prevent rate limiting...', 'info');
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        batch.push(generateVideo(prompt, imageUrl, jobIndex));
      }

      try {
        const batchResults = await Promise.allSettled(batch);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            // Don't add to setResults here since it's already added in pollTaskCompletion
          } else {
            errors.push(result.reason);
          }
        });
        
      } catch (error) {
        addLog('❌ Batch processing error: ' + error.message, 'error');
        errors.push(error);
      }
    }

    addLog('🎬 Generation completed! ✅ ' + results.length + ' videos generated, ❌ ' + errors.length + ' failed', 
           results.length > 0 ? 'success' : 'error');
    
    if (errors.length > 0) {
      addLog('⚠️ Failed jobs: ' + errors.map(e => e.message).join(', '), 'warning');
    }

    setIsRunning(false);
  };

  const stopGeneration = () => {
    setIsRunning(false);
    addLog('🛑 Generation stopped by user', 'warning');
  };

  const downloadVideo = async (videoUrl, filename) => {
    try {
      addLog('📥 Downloading ' + filename + '...', 'info');
      
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog('✅ Downloaded ' + filename, 'success');
    } catch (error) {
      addLog('❌ Download failed: ' + error.message, 'error');
    }
  };

  const exportResults = () => {
    const exportData = {
      generated_at: new Date().toISOString(),
      total_videos: results.length,
      configuration: {
        model,
        aspect_ratio: aspectRatio,
        duration
      },
      videos: results.map(result => ({
        id: result.id,
        prompt: result.prompt,
        video_url: result.video_url,
        thumbnail_url: result.thumbnail_url,
        image_url: result.image_url,
        created_at: result.created_at
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runway_generation_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    window.URL.revokeObjectURL(url);
    
    addLog('📊 Results exported to JSON', 'success');
  };

  return (
    <>
      <Head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
        />
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          defer
        ></script>
      </Head>

      <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container-fluid py-4">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold text-white mb-3">
              🎬 Runway Automation Pro
            </h1>
            <p className="lead text-white-50 mx-auto" style={{ maxWidth: '600px' }}>
              Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="row justify-content-center mb-4">
            <div className="col-auto">
              <ul className="nav nav-pills nav-fill shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '8px' }}>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'setup' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('setup')}
                    style={{ borderRadius: '10px', fontWeight: '600' }}
                  >
                    <Settings size={20} className="me-2" />
                    Configuration
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'generation' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('generation')}
                    style={{ borderRadius: '10px', fontWeight: '600' }}
                  >
                    <Film size={20} className="me-2" />
                    Generation
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'results' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('results')}
                    style={{ borderRadius: '10px', fontWeight: '600' }}
                  >
                    <Download size={20} className="me-2" />
                    Results
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Configuration Tab */}
          {activeTab === 'setup' && (
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="row g-4">
                  {/* API Configuration Card */}
                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-primary bg-gradient rounded-circle p-3 me-3">
                            <Key className="text-white" size={24} />
                          </div>
                          <h3 className="card-title mb-0 fw-bold">API Configuration</h3>
                        </div>

                        {/* API Key Input */}
                        <div className="mb-4">
                          <label className="form-label fw-bold">RunwayML API Key *</label>
                          <input
                            type="password"
                            className="form-control form-control-lg"
                            value={runwayApiKey}
                            onChange={(e) => setRunwayApiKey(e.target.value)}
                            placeholder="rml_xxx..."
                            style={{ borderRadius: '12px' }}
                          />
                          <div className="form-text">
                            <ExternalLink size={14} className="me-1" />
                            <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              Get your API key from RunwayML Developer Portal
                            </a>
                          </div>
                        </div>

                        {/* Billing Information Alert */}
                        <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <CreditCard size={20} className="text-warning me-2" />
                            <strong>Credits Required</strong>
                          </div>
                          <p className="mb-2 small">The RunwayML API requires credits for all video generations.</p>
                          <ul className="small mb-0 ps-3">
                            <li>Purchase credits at <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-bold">dev.runwayml.com</a></li>
                            <li>Minimum $10 (1000 credits)</li>
                            <li>~25-50 credits per 5-10 second video ($0.25-$0.50)</li>
                            <li>Credits are separate from web app credits</li>
                          </ul>
                        </div>

                        {/* Model and Settings */}
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label fw-bold">Model</label>
                            <select
                              className="form-select"
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              style={{ borderRadius: '12px' }}
                            >
                              {modelOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-bold">Aspect Ratio</label>
                            <select
                              className="form-select"
                              value={aspectRatio}
                              onChange={(e) => setAspectRatio(e.target.value)}
                              style={{ borderRadius: '12px' }}
                            >
                              {aspectRatioOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-bold">Duration (seconds)</label>
                            <select
                              className="form-select"
                              value={duration}
                              onChange={(e) => setDuration(parseInt(e.target.value))}
                              style={{ borderRadius: '12px' }}
                            >
                              <option value={5}>5 seconds</option>
                              <option value={10}>10 seconds</option>
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-bold">Concurrency (Auto-creates prompts)</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              className="form-control"
                              value={concurrency}
                              onChange={(e) => handleConcurrencyChange(parseInt(e.target.value) || 1)}
                              style={{ borderRadius: '12px' }}
                            />
                            <div className="form-text small">
                              <div>Setting this to {concurrency} will create {concurrency} prompt field{concurrency !== 1 ? 's' : ''}</div>
                              <div className="text-primary fw-bold">API Limits: Tier 1=1, Tier 2=3, Tier 3=5, Tier 4=10, Tier 5=20 concurrent</div>
                            </div>
                            
                            {/* API Limits Table */}
                            <div className="mt-3 p-3 bg-light rounded border">
                              <p className="small fw-bold mb-2">🎯 RunwayML API Concurrency Limits by Tier:</p>
                              <div className="table-responsive">
                                <table className="table table-sm table-bordered border-dark mb-0">
                                  <thead className="table-secondary">
                                    <tr>
                                      <th className="fw-bold border-dark">Tier</th>
                                      <th className="fw-bold border-dark">Max Concurrent</th>
                                      <th className="fw-bold border-dark">Criteria</th>
                                    </tr>
                                  </thead>
                                  <tbody className="small">
                                    <tr>
                                      <td className="border-dark">1</td>
                                      <td className="border-dark">1</td>
                                      <td className="border-dark">Default (new accounts)</td>
                                    </tr>
                                    <tr>
                                      <td className="border-dark">2</td>
                                      <td className="border-dark">3</td>
                                      <td className="border-dark">1 day after $50 purchased</td>
                                    </tr>
                                    <tr>
                                      <td className="border-dark">3</td>
                                      <td className="border-dark">5</td>
                                      <td className="border-dark">7 days after $100 purchased</td>
                                    </tr>
                                    <tr>
                                      <td className="border-dark">4</td>
                                      <td className="border-dark">10</td>
                                      <td className="border-dark">14 days after $1,000 purchased</td>
                                    </tr>
                                    <tr>
                                      <td className="border-dark">5</td>
                                      <td className="border-dark">20</td>
                                      <td className="border-dark">7 days after $5,000 purchased</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Configuration Card */}
                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
                      <div className="card-body p-4">
                        <h3 className="card-title fw-bold mb-4">Content Configuration</h3>

                        {/* Video Prompts */}
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <label className="form-label fw-bold mb-0">
                              Video Prompts * ({prompts.length} prompt{prompts.length !== 1 ? 's' : ''})
                            </label>
                            <div className="btn-group" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={autofillPrompts}
                                disabled={!prompts[0] || !prompts[0].trim() || prompts.length <= 1}
                                title="Copy Prompt 1 to all other prompts"
                              >
                                📝 Autofill All
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={addPrompt}
                              >
                                <Plus size={14} className="me-1" />
                                Add
                              </button>
                              {prompts.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => setPrompts(prompts.slice(0, -1))}
                                >
                                  <Trash2 size={14} className="me-1" />
                                  Remove Last
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="alert alert-info border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                            <small>
                              💡 <strong>Tip:</strong> Concurrency is set to {concurrency}, so you have {prompts.length} prompt field{prompts.length !== 1 ? 's' : ''}. 
                              Change concurrency above to auto-adjust the number of prompts, or use "Autofill All" to copy Prompt 1 to all fields.
                            </small>
                          </div>

                          {prompts.map((prompt, index) => (
                            <div key={index} className="mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <span className="badge bg-secondary me-2">Prompt {index + 1}</span>
                                {prompts.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm ms-auto"
                                    onClick={() => removePrompt(index)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              <textarea
                                className="form-control"
                                rows="2"
                                value={prompt}
                                onChange={(e) => updatePrompt(index, e.target.value)}
                                placeholder={`Describe video ${index + 1}... (e.g., "gentle waves flowing, peaceful water movement")`}
                                style={{ borderRadius: '12px' }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Image URLs */}
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <label className="form-label fw-bold mb-0">
                              Image URLs (Required) * ({images.length} image{images.length !== 1 ? 's' : ''})
                            </label>
                            <div className="btn-group" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={autofillImages}
                                disabled={!images[0] || !images[0].trim() || images.length <= 1}
                                title="Copy Image 1 to all other image fields"
                              >
                                🖼️ Autofill All
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={addImage}
                              >
                                <Plus size={14} className="me-1" />
                                Add Image URL
                              </button>
                            </div>
                          </div>

                          <div className="alert alert-primary border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                            <small>
                              <strong>Important:</strong> The RunwayML API only supports image-to-video generation. 
                              Each video starts with your provided image and animates according to your text prompt.
                              Use "Autofill All" to copy Image 1 to all fields for consistent starting frames.
                            </small>
                          </div>

                          {images.map((image, index) => (
                            <div key={index} className="mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <span className="badge bg-success me-2">Image {index + 1}</span>
                                {images.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm ms-auto"
                                    onClick={() => removeImage(index)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              <input
                                type="url"
                                className="form-control"
                                value={image}
                                onChange={(e) => updateImage(index, e.target.value)}
                                placeholder={`https://example.com/image${index + 1}.jpg`}
                                style={{ borderRadius: '12px' }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Wait Times */}
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label fw-bold">Min Wait (seconds)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              className="form-control"
                              value={minWait}
                              onChange={(e) => setMinWait(parseFloat(e.target.value) || 0)}
                              style={{ borderRadius: '12px' }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-bold">Max Wait (seconds)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              className="form-control"
                              value={maxWait}
                              onChange={(e) => setMaxWait(parseFloat(e.target.value) || 0)}
                              style={{ borderRadius: '12px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generation Tab */}
          {activeTab === 'generation' && (
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
                  <div className="card-body p-4">
                    <h2 className="card-title fw-bold mb-4">Video Generation Control</h2>

                    {/* Status Card */}
                    <div className="card bg-gradient text-white mb-4" style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', borderRadius: '15px' }}>
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div>
                            <h4 className="card-title text-white mb-2">Generation Status</h4>
                            <p className="card-text text-white-50 mb-0">Monitor and control your video generation process</p>
                          </div>
                          <div>
                            {!isRunning ? (
                              <button
                                className="btn btn-success btn-lg shadow"
                                onClick={generateVideos}
                                disabled={!runwayApiKey || prompts.filter(p => p.trim()).length === 0 || images.filter(img => img.trim()).length === 0}
                                style={{ borderRadius: '15px' }}
                              >
                                <Play size={24} className="me-2" />
                                Start Generation
                              </button>
                            ) : (
                              <button
                                className="btn btn-danger btn-lg shadow"
                                onClick={stopGeneration}
                                style={{ borderRadius: '15px' }}
                              >
                                <AlertCircle size={24} className="me-2" />
                                Stop Generation
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="row g-3 text-center">
                          <div className="col-md-3">
                            <div className="d-flex align-items-center justify-content-center">
                              <div className={`me-2 rounded-circle ${isRunning ? 'bg-success' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}>
                                {isRunning && <div className="w-100 h-100 rounded-circle bg-success" style={{ animation: 'pulse 1s infinite' }}></div>}
                              </div>
                              <span className="fw-bold">{isRunning ? 'Running' : 'Idle'}</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <span>API: {runwayApiKey ? '✓ Connected' : '✗ Missing'}</span>
                          </div>
                          <div className="col-md-3">
                            <span>Prompts: {prompts.filter(p => p.trim()).length}</span>
                          </div>
                          <div className="col-md-3">
                            <span>Images: {images.filter(img => img.trim()).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Cards */}
                    {Object.keys(generationProgress).length > 0 && (
                      <div className="mb-4">
                        <h4 className="fw-bold mb-3">Generation Progress</h4>
                        <div className="row g-3">
                          {Object.entries(generationProgress).map(([jobId, progress]) => (
                            <div key={jobId} className="col-md-6 col-lg-4">
                              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold small">{jobId}</span>
                                    <span className={`badge ${
                                      progress.status === 'completed' ? 'bg-success' :
                                      progress.status === 'failed' ? 'bg-danger' :
                                      progress.status === 'throttled' ? 'bg-warning' :
                                      'bg-primary'
                                    }`}>
                                      {progress.status}
                                    </span>
                                  </div>
                                  <div className="progress mb-2" style={{ height: '8px' }}>
                                    <div 
                                      className={`progress-bar ${
                                        progress.status === 'completed' ? 'bg-success' :
                                        progress.status === 'failed' ? 'bg-danger' :
                                        progress.status === 'throttled' ? 'bg-warning' :
                                        'bg-primary'
                                      }`}
                                      style={{ width: progress.progress + '%' }}
                                    ></div>
                                  </div>
                                  <small className="text-muted">
                                    {progress.message || progress.status}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Log */}
                    <div className="card bg-dark text-light border-0 shadow" style={{ borderRadius: '15px' }}>
                      <div className="card-header bg-transparent border-0 pb-0">
                        <h5 className="text-success fw-bold mb-0">🔥 Live Generation Log</h5>
                      </div>
                      <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        {logs.map((log, index) => (
                          <div key={index} className={`small mb-1 ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-success' :
                            log.type === 'warning' ? 'text-warning' :
                            'text-light'
                          }`}>
                            <span className="text-muted">[{log.timestamp}]</span> {log.message}
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="text-muted small">
                            Ready to start generation... Configure your settings and click "Start Generation"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="row justify-content-center">
              <div className="col-lg-11">
                <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h2 className="card-title fw-bold mb-2">Generated Videos</h2>
                        <p className="text-muted mb-0">{results.length} videos generated</p>
                      </div>
                      {results.length > 0 && (
                        <button
                          className="btn btn-primary shadow"
                          onClick={exportResults}
                          style={{ borderRadius: '12px' }}
                        >
                          <Download size={20} className="me-2" />
                          Export Results
                        </button>
                      )}
                    </div>

                    {results.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="mb-4">
                          <Film size={80} className="text-muted" />
                        </div>
                        <h4 className="text-muted mb-3">No videos generated yet</h4>
                        <p className="text-muted mb-4">Start a generation process to see your AI-generated videos here</p>
                        <button
                          className="btn btn-primary btn-lg shadow"
                          onClick={() => setActiveTab('setup')}
                          style={{ borderRadius: '15px' }}
                        >
                          Get Started
                        </button>
                      </div>
                    ) : (
                      <div className="row g-4">
                        {results.map((result, index) => (
                          <div key={index} className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow h-100" style={{ borderRadius: '15px' }}>
                              <div className="position-relative" style={{ borderRadius: '15px 15px 0 0', overflow: 'hidden', aspectRatio: '16/9' }}>
                                {result.video_url ? (
                                  <video
                                    src={result.video_url}
                                    poster={result.thumbnail_url}
                                    controls
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                    preload="metadata"
                                  >
                                    Your browser does not support video playback.
                                  </video>
                                ) : result.thumbnail_url ? (
                                  <img 
                                    src={result.thumbnail_url}
                                    alt={'Thumbnail for: ' + result.prompt}
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                                    <div className="text-center">
                                      <Film size={48} className="text-primary mb-3" />
                                      <div className="fw-bold text-muted">Processing...</div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="position-absolute top-0 start-0 m-3">
                                  <span className={`badge ${
                                    result.status === 'completed' ? 'bg-success' : 'bg-warning'
                                  } shadow-sm`}>
                                    {result.status === 'completed' ? '✅ Complete' : '⏳ Processing'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="card-body p-3">
                                <h6 className="card-title fw-bold text-truncate mb-3" title={result.prompt}>
                                  {result.prompt}
                                </h6>
                                
                                <div className="small text-muted mb-3">
                                  <div className="d-flex justify-content-between mb-1">
                                    <span>Task ID:</span>
                                    <span className="font-monospace small">{result.id}</span>
                                  </div>
                                  <div className="d-flex justify-content-between mb-1">
                                    <span>Created:</span>
                                    <span>{new Date(result.created_at).toLocaleString()}</span>
                                  </div>
                                  {result.image_url && (
                                    <div className="d-flex justify-content-between">
                                      <span>Source Image:</span>
                                      <span className="text-primary">✓ Provided</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="d-grid gap-2">
                                  {result.video_url && (
                                    <div className="btn-group" role="group">
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => downloadVideo(result.video_url, 'video_' + result.id + '.mp4')}
                                      >
                                        <Download size={16} className="me-1" />
                                        Download
                                      </button>
                                      <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => window.open(result.video_url, '_blank')}
                                      >
                                        <ExternalLink size={16} className="me-1" />
                                        View
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-5">
            <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <AlertCircle size={24} className="text-success me-3" />
                  <h5 className="fw-bold text-success mb-0">✅ Production-Ready Solution</h5>
                </div>
                <p className="mb-2">
                  <strong>🚀 Complete full-stack application</strong> with serverless backend for RunwayML API integration.
                </p>
                <p className="small text-muted mb-0">
                  Features professional UI, batch processing, progress tracking, and video management with credits-based billing.
                </p>
              </div>
            </div>
            
            <div className="d-flex align-items-center justify-content-center text-white-50">
              <CreditCard size={16} className="me-2" />
              <small>Purchase credits at dev.runwayml.com to start generating videos. Monitor your API usage and costs.</small>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .nav-pills .nav-link.active {
            background: linear-gradient(45deg, #667eea, #764ba2) !important;
            border: none;
          }
          
          .nav-pills .nav-link:not(.active):hover {
            background: rgba(255,255,255,0.2);
          }
          
          .card {
            transition: transform 0.2s ease-in-out;
          }
          
          .card:hover {
            transform: translateY(-2px);
          }
          
          .btn {
            transition: all 0.2s ease-in-out;
          }
          
          .btn:hover {
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    </>
  );
}
                