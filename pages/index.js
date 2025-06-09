import React, { useState, useEffect } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Key, ExternalLink, CreditCard } from 'lucide-react';
import Head from 'next/head';

export default function RunwayAutomationApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [runwayApiKey, setRunwayApiKey] = useState('');
  const [prompt, setPrompt] = useState('A serene lake with mountains in the background at sunset');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720');
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

  // Initialize Bootstrap tooltips
  useEffect(() => {
    if (typeof window !== 'undefined' && window.bootstrap) {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new window.bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }, []);

  // Auto-adjust prompts and images when concurrency changes - REMOVED
  // Now using single prompt and image for all concurrent generations

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
    // No longer needed - using single prompt
  };

  const removePrompt = (index) => {
    // No longer needed - using single prompt
  };

  const updatePrompt = (index, value) => {
    // No longer needed - using single prompt
  };

  const addImage = () => {
    // No longer needed - using single image
  };

  const removeImage = (index) => {
    // No longer needed - using single image
  };

  const updateImage = (index, value) => {
    // No longer needed - using single image
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const API_BASE = '/api';

  const generateVideo = async (promptText, imageUrlText, jobIndex = 0) => {
    const jobId = 'job_' + jobIndex + '_' + Date.now();
    
    try {
      if (!imageUrlText || !imageUrlText.trim()) {
        const errorMsg = 'Image URL is required for video generation. The current RunwayML API only supports image-to-video generation.';
        addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { status: 'failed', progress: 0, error: errorMsg }
        }));
        
        throw new Error(errorMsg);
      }

      addLog('Starting generation for job ' + (jobIndex + 1) + ': "' + promptText.substring(0, 50) + '..." with image', 'info');
      
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'starting', progress: 0 }
      }));

      const payload = {
        text_prompt: promptText,
        image_prompt: imageUrlText.trim(),
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
      
      return await pollTaskCompletion(task.id, jobId, promptText, imageUrlText, jobIndex);
      
    } catch (error) {
      addLog('✗ Job ' + (jobIndex + 1) + ' failed: ' + error.message, 'error');
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'failed', progress: 0, error: error.message }
      }));
      throw error;
    }
  };

  const pollTaskCompletion = async (taskId, jobId, promptText, imageUrlText, jobIndex) => {
    const maxPolls = Math.floor(1800 / 8);
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;
    let isThrottled = false;
    let throttledStartTime = null;

    while (pollCount < maxPolls) {
      try {
        const response = await fetch(API_BASE + '/runway-status?taskId=' + taskId + '&apiKey=' + encodeURIComponent(runwayApiKey), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(25000)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Polling failed: ' + response.status);
        }

        const task = await response.json();
        consecutiveErrors = 0;
        
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
              progress: 5,
              message: `Queued for ${throttledDuration}s` 
            }
          }));
          
          if (throttledDuration > 0 && throttledDuration % 60 === 0) {
            addLog('⏸️ Job ' + (jobIndex + 1) + ' still queued after ' + Math.floor(throttledDuration / 60) + ' minute(s)', 'info');
          }
          
          await new Promise(resolve => setTimeout(resolve, 12000));
          pollCount++;
          continue;
        }
        
        if (isThrottled && task.status !== 'THROTTLED') {
          const queueTime = Math.floor((Date.now() - throttledStartTime) / 1000);
          addLog('▶️ Job ' + (jobIndex + 1) + ' started processing after ' + queueTime + 's in queue', 'info');
          isThrottled = false;
        }
        
        let progress = 10;
        if (task.status === 'PENDING') {
          progress = 20;
        } else if (task.status === 'RUNNING') {
          const runningTime = Math.max(0, pollCount - 5);
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
            prompt: promptText,
            video_url: task.output && task.output[0] ? task.output[0] : null,
            thumbnail_url: task.output && task.output[1] ? task.output[1] : null,
            image_url: imageUrlText,
            status: 'completed',
            created_at: new Date().toISOString()
          };

          setResults(prev => [...prev, completedVideo]);
          return completedVideo;
        }

        if (task.status === 'FAILED') {
          throw new Error(task.failure_reason || 'Generation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 8000));
        pollCount++;
        
      } catch (error) {
        consecutiveErrors++;
        
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' polling timeout, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' network error, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' rate limited, waiting longer... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
          await new Promise(resolve => setTimeout(resolve, 15000));
        } else {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' error: ' + error.message + ' (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        }
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          const finalError = 'Failed after ' + maxConsecutiveErrors + ' consecutive errors. Last error: ' + error.message;
          addLog('✗ Job ' + (jobIndex + 1) + ' ' + finalError, 'error');
          throw new Error(finalError);
        }
        
        const backoffDelay = Math.min(10000 + (consecutiveErrors * 5000), 30000);
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
    
    if (!prompt.trim()) {
      addLog('❌ No prompt provided!', 'error');
      setIsRunning(false);
      return;
    }

    if (!imageUrl.trim()) {
      addLog('❌ Image URL is required! The current RunwayML API only supports image-to-video generation. Please add an image URL.', 'error');
      setIsRunning(false);
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('❌ RunwayML API key is required!', 'error');
      setIsRunning(false);
      return;
    }

    const totalJobs = concurrency;
    addLog('📊 Processing ' + totalJobs + ' video generations using the same prompt and image...', 'info');
    addLog('💳 Note: Each generation requires credits from your API account', 'info');

    const results = [];
    const errors = [];

    for (let i = 0; i < totalJobs; i += concurrency) {
      const batch = [];
      
      for (let j = 0; j < concurrency && (i + j) < totalJobs; j++) {
        const jobIndex = i + j;
        
        if (jobIndex > 0) {
          const waitTime = Math.random() * (maxWait - minWait) + minWait + 2;
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
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" 
          rel="stylesheet" 
        />
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        />
      </Head>

      <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container-fluid py-4">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold text-white mb-3">
              🎬 Runway Automation Pro
            </h1>
            <p className="lead text-white-50 mx-auto" style={{ maxWidth: '800px' }}>
              Professional-grade video generation automation for RunwayML.<br />Generate multiple AI videos with advanced batch processing.<br />Based on <a href="https://apify.com/igolaizola/runway-automation" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Runway Automation for Apify</a> by <a href="https://igolaizola.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Iñigo Garcia Olaizola</a>.
            </p>
          </div>

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

          {activeTab === 'setup' && (
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-primary bg-grad