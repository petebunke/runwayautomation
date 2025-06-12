import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen } from 'lucide-react';
import Head from 'next/head';

export default function RunwayAutomationApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [runwayApiKey, setRunwayApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [model, setModel] = useState('gen3a_turbo');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [concurrency, setConcurrency] = useState(1);
  const [minWait, setMinWait] = useState(8);
  const [maxWait, setMaxWait] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [generationProgress, setGenerationProgress] = useState({});
  const [imageError, setImageError] = useState(false);
  const [videoCounter, setVideoCounter] = useState(0);
  const [generationCounter, setGenerationCounter] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [completedGeneration, setCompletedGeneration] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load API key
        const savedApiKey = localStorage.getItem('runway-automation-api-key');
        if (savedApiKey && savedApiKey.trim()) {
          console.log('Loading saved API key from localStorage');
          setRunwayApiKey(savedApiKey);
        }
        
        // Load prompt
        const savedPrompt = localStorage.getItem('runway-automation-prompt');
        if (savedPrompt && savedPrompt.trim()) {
          console.log('Loading saved prompt from localStorage');
          setPrompt(savedPrompt);
        }
        
        // Load image URL
        const savedImageUrl = localStorage.getItem('runway-automation-image-url');
        if (savedImageUrl && savedImageUrl.trim()) {
          console.log('Loading saved image URL from localStorage');
          setImageUrl(savedImageUrl);
        }
      } catch (error) {
        console.warn('Failed to load saved data from localStorage:', error);
      }
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (runwayApiKey && runwayApiKey.trim() && runwayApiKey.length > 5) {
          console.log('Saving API key to localStorage');
          localStorage.setItem('runway-automation-api-key', runwayApiKey);
        } else if (runwayApiKey === '') {
          console.log('Removing API key from localStorage');
          localStorage.removeItem('runway-automation-api-key');
        }
      } catch (error) {
        console.warn('Failed to save API key to localStorage:', error);
      }
    }
  }, [runwayApiKey]);

  // Save prompt to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (prompt && prompt.trim()) {
          localStorage.setItem('runway-automation-prompt', prompt);
        } else if (prompt === '') {
          localStorage.removeItem('runway-automation-prompt');
        }
      } catch (error) {
        console.warn('Failed to save prompt to localStorage:', error);
      }
    }
  }, [prompt]);

  // Save image URL to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (imageUrl && imageUrl.trim()) {
          localStorage.setItem('runway-automation-image-url', imageUrl);
        } else if (imageUrl === '') {
          localStorage.removeItem('runway-automation-image-url');
        }
      } catch (error) {
        console.warn('Failed to save image URL to localStorage:', error);
      }
    }
  }, [imageUrl]);

  // Clear API key function for security
  const clearStoredApiKey = () => {
    try {
      localStorage.removeItem('runway-automation-api-key');
      setRunwayApiKey('');
      addLog('🔒 API key cleared from storage', 'info');
    } catch (error) {
      console.warn('Failed to clear API key:', error);
    }
  };

  // Clear all stored data function
  const clearAllStoredData = () => {
    try {
      localStorage.removeItem('runway-automation-api-key');
      localStorage.removeItem('runway-automation-prompt');
      localStorage.removeItem('runway-automation-image-url');
      setRunwayApiKey('');
      setPrompt('');
      setImageUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      addLog('🔒 All stored data cleared', 'info');
    } catch (error) {
      console.warn('Failed to clear stored data:', error);
    }
  };

  const isValidImageUrl = (url) => {
    try {
      // Handle data URLs from uploaded files
      if (url.startsWith('data:image/')) {
        return true;
      }
      
      const urlObj = new URL(url);
      const isValidProtocol = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      const hasImageExtension = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(urlObj.pathname) || 
                               url.includes('imgur.com') || 
                               url.includes('googleusercontent.com') ||
                               url.includes('amazonaws.com') ||
                               url.includes('cloudinary.com') ||
                               url.includes('unsplash.com') ||
                               url.includes('pexels.com');
      return isValidProtocol && (hasImageExtension || url.length > 20);
    } catch {
      return false;
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image file upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addLog('❌ Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addLog('❌ Image file too large. Please use an image under 10MB', 'error');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Create a data URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setImageUrl(dataUrl);
        setImageError(false);
        addLog('✅ Image uploaded successfully', 'success');
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        addLog('❌ Failed to read image file', 'error');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      addLog('❌ Error uploading image: ' + error.message, 'error');
      setIsUploadingImage(false);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Initialize Bootstrap tooltips
  useEffect(() => {
    if (typeof window !== 'undefined' && window.bootstrap) {
      // Dispose existing tooltips first to prevent duplicates
      const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      existingTooltips.forEach(function (tooltipEl) {
        const existingTooltip = window.bootstrap.Tooltip.getInstance(tooltipEl);
        if (existingTooltip) {
          existingTooltip.dispose();
        }
      });

      // Initialize new tooltips
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new window.bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }, [activeTab, model, results]);

  const modelOptions = [
    { value: 'gen4_turbo', label: 'Gen-4 Turbo (Newest, highest quality)' },
    { value: 'gen3a_turbo', label: 'Gen-3 Alpha Turbo (Fast, reliable)' }
  ];

  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    ...(model === 'gen4_turbo' ? [
      { value: '1:1', label: '1:1 (Square)' },
      { value: '4:3', label: '4:3 (Standard)' },
      { value: '3:4', label: '3:4 (Portrait Standard)' },
      { value: '21:9', label: '21:9 (Cinematic)' }
    ] : [])
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const copyLogsToClipboard = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      addLog('📋 Logs copied to clipboard', 'info');
    }).catch(() => {
      addLog('❌ Failed to copy logs to clipboard', 'error');
    });
  };

  const API_BASE = '/api';

  // Check user's credit balance before generation
  const checkCredits = async () => {
    try {
      const response = await fetch(API_BASE + '/runway-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: runwayApiKey })
      });

      if (response.ok) {
        const data = await response.json();
        return data.credits || 0;
      }
    } catch (error) {
      console.log('Could not check credits:', error);
    }
    return null; // Return null if we can't check credits
  };

  // Improved generateVideo function with better error handling
  const generateVideo = async (promptText, imageUrlText, jobIndex = 0, generationNum, videoNum) => {
    const jobId = 'Generation ' + generationNum + ' - Video ' + videoNum;
    
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

      // Validate image URL format
      if (!isValidImageUrl(imageUrlText.trim())) {
        const errorMsg = 'Invalid image URL format. Please use a direct link to an image file (jpg, png, gif, etc.) or a supported image hosting service.';
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
        aspect_ratio: model === 'gen4_turbo' ? 
          (aspectRatio === '16:9' ? '1280:720' : 
           aspectRatio === '9:16' ? '720:1280' : 
           aspectRatio === '1:1' ? '960:960' : 
           aspectRatio === '4:3' ? '1104:832' : 
           aspectRatio === '3:4' ? '832:1104' : 
           aspectRatio === '21:9' ? '1584:672' : '1280:720') :
          (aspectRatio === '16:9' ? '1280:768' : 
           aspectRatio === '9:16' ? '768:1280' : '1280:768'),
        duration: duration,
        seed: Math.floor(Math.random() * 1000000)
      };

      // Add retry logic for initial API call
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const response = await fetch(API_BASE + '/runway-generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiKey: runwayApiKey,
              payload: payload
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = errorData.error || 'API Error: ' + response.status;
            
            // Handle retryable errors
            if (response.status === 429 || response.status >= 500) {
              if (retryCount < maxRetries) {
                const retryDelay = (retryCount + 1) * 10000;
                addLog(`⚠️ Job ${jobIndex + 1} API error (${response.status}), retrying in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`, 'warning');
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryCount++;
                continue;
              }
            }

            // Handle insufficient credits - don't retry, fail immediately
            if (response.status === 400 && errorMessage.includes('not have enough credits')) {
              throw new Error('Insufficient credits: ' + errorMessage);
            }
            
            if (errorMessage.includes('Invalid asset aspect ratio')) {
              errorMessage = 'Image aspect ratio issue: ' + errorMessage + ' Try using an image that is closer to square, landscape, or portrait format (not ultra-wide or ultra-tall).';
            }
            
            throw new Error(errorMessage);
          }

          const task = await response.json();
          
          addLog('✓ Generation started for job ' + (jobIndex + 1) + ' (Task ID: ' + task.id + ') - Initial Status: ' + (task.status || 'unknown'), 'success');
          
          return await pollTaskCompletion(task.id, jobId, promptText, imageUrlText, jobIndex);
          
        } catch (fetchError) {
          if (retryCount < maxRetries && (
            fetchError.name === 'AbortError' || 
            fetchError.message.includes('fetch') ||
            fetchError.message.includes('network')
          )) {
            const retryDelay = (retryCount + 1) * 5000;
            addLog(`⚠️ Job ${jobIndex + 1} network error, retrying in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`, 'warning');
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
            continue;
          }
          throw fetchError;
        }
      }
      
      throw new Error(`Failed to start generation after ${maxRetries} retries`);
        
    } catch (error) {
      addLog('✗ Job ' + (jobIndex + 1) + ' failed: ' + error.message, 'error');
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'failed', progress: 0, error: error.message }
      }));
      throw error;
    }
  };

  // Improved polling logic with better error handling and backoff
  const pollTaskCompletion = async (taskId, jobId, promptText, imageUrlText, jobIndex) => {
    const maxPolls = Math.floor(2400 / 12);
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    let isThrottled = false;
    let throttledStartTime = null;
    let lastKnownStatus = 'unknown';
    let stuckInPendingCount = 0;
    const maxStuckInPending = 10;

    while (pollCount < maxPolls) {
      try {
        const timeoutMs = consecutiveErrors > 0 ? 45000 : (isThrottled ? 60000 : 30000);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(API_BASE + '/runway-status?taskId=' + taskId + '&apiKey=' + encodeURIComponent(runwayApiKey), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseText = await response.text();
        
        let task;
        try {
          task = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          console.log('Raw response:', responseText.substring(0, 300));
          
          if (consecutiveErrors < maxConsecutiveErrors) {
            consecutiveErrors++;
            addLog(`⚠️ Job ${jobIndex + 1} parse error, retrying... (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 15000 + (consecutiveErrors * 5000)));
            pollCount++;
            continue;
          }
          
          throw new Error('Invalid response from RunwayML API: ' + responseText.substring(0, 100));
        }

        if (!response.ok) {
          if (response.status === 429) {
            const backoffTime = 30000 + (consecutiveErrors * 15000);
            addLog(`⚠️ Job ${jobIndex + 1} rate limited (${response.status}), backing off for ${backoffTime/1000}s...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            consecutiveErrors++;
            pollCount++;
            continue;
          } else if (response.status >= 500) {
            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
              throw new Error(`Server error after ${maxConsecutiveErrors} attempts: ${task.error || response.status}`);
            }
            addLog(`⚠️ Job ${jobIndex + 1} server error (${response.status}), retrying... (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 20000 + (consecutiveErrors * 10000)));
            pollCount++;
            continue;
          }
          
          throw new Error(task.error || 'Polling failed: ' + response.status);
        }
        
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
          
          if (throttledDuration > 0 && throttledDuration % 120 === 0) {
            addLog('⏸️ Job ' + (jobIndex + 1) + ' still queued after ' + Math.floor(throttledDuration / 60) + ' minute(s)', 'info');
          }
          
          await new Promise(resolve => setTimeout(resolve, 20000));
          pollCount++;
          continue;
        }
        
        if (isThrottled && task.status !== 'THROTTLED') {
          const queueTime = Math.floor((Date.now() - throttledStartTime) / 1000);
          addLog('▶️ Job ' + (jobIndex + 1) + ' started processing after ' + queueTime + 's in queue', 'info');
          isThrottled = false;
          stuckInPendingCount = 0;
        }
        
        if (task.status === 'PENDING') {
          if (lastKnownStatus === 'PENDING') {
            stuckInPendingCount++;
          } else {
            stuckInPendingCount = 1;
          }
          
          if (stuckInPendingCount >= maxStuckInPending) {
            addLog(`⚠️ Job ${jobIndex + 1} stuck in PENDING, using longer polling interval...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 30000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        } else {
          stuckInPendingCount = 0;
        }
        
        lastKnownStatus = task.status;
        
        let progress = 10;
        if (task.status === 'PENDING') {
          progress = 20 + Math.min(stuckInPendingCount * 2, 20);
        } else if (task.status === 'RUNNING') {
          const runningTime = Math.max(0, pollCount - 5);
          progress = Math.min(40 + (runningTime * 2), 90);
        } else if (task.status === 'SUCCEEDED') {
          progress = 100;
        }
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { 
            status: task.status.toLowerCase(), 
            progress: progress,
            message: task.status === 'RUNNING' ? 'Processing...' : 
                    task.status === 'PENDING' && stuckInPendingCount > 5 ? 'Processing (high load)...' :
                    task.status.toLowerCase()
          }
        }));

        if (task.status === 'SUCCEEDED') {
          addLog('✓ Job ' + (jobIndex + 1) + ' completed successfully', 'success');
          
          // Remove from progress tracking since it's now completed
          setGenerationProgress(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });

          const completedVideo = {
            id: taskId,
            prompt: promptText,
            video_url: task.output && task.output[0] ? task.output[0] : null,
            thumbnail_url: task.output && task.output[1] ? task.output[1] : null,
            image_url: imageUrlText,
            status: 'completed',
            created_at: new Date().toISOString(),
            jobId: jobId
          };

          setResults(prev => [...prev, completedVideo]);
          return completedVideo;
        }

        if (task.status === 'FAILED') {
          const failureReason = task.failure_reason || task.error || 'Generation failed - no specific reason provided';
          addLog('✗ Job ' + (jobIndex + 1) + ' failed on RunwayML: ' + failureReason, 'error');
          
          // Remove from progress tracking since it failed
          setGenerationProgress(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });
          
          throw new Error(failureReason);
        }

        const pollInterval = 
          task.status === 'PENDING' && stuckInPendingCount > 5 ? 25000 :
          task.status === 'RUNNING' ? 10000 :
          12000;
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollCount++;
        
      } catch (error) {
        consecutiveErrors++;
        
        if (error.message.includes('Generation failed') && 
            !error.message.includes('timeout') && 
            !error.message.includes('network') && 
            !error.message.includes('rate limit') &&
            !error.message.includes('server error')) {
          addLog('✗ Job ' + (jobIndex + 1) + ' permanently failed: ' + error.message, 'error');
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'failed', progress: 0, error: error.message }
          }));
          throw error;
        }
        
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' polling timeout, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' network error, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' rate limited, waiting longer... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
          await new Promise(resolve => setTimeout(resolve, 60000));
        } else {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' error: ' + error.message + ' (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        }
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          const finalError = 'Failed after ' + maxConsecutiveErrors + ' consecutive errors. Last error: ' + error.message;
          addLog('✗ Job ' + (jobIndex + 1) + ' ' + finalError, 'error');
          throw new Error(finalError);
        }
        
        const baseDelay = 15000;
        const maxDelay = 120000;
        const jitter = Math.random() * 5000;
        const backoffDelay = Math.min(baseDelay * Math.pow(1.5, consecutiveErrors) + jitter, maxDelay);
        
        addLog(`⏳ Job ${jobIndex + 1} waiting ${Math.round(backoffDelay/1000)}s before retry...`, 'info');
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        pollCount++;
      }
    }

    const totalTime = Math.floor((pollCount * 12) / 60);
    throw new Error('Generation timeout after ' + totalTime + ' minutes');
  };

  // Improved generation logic with safety features
  const generateVideos = async () => {
    setIsRunning(true);
    setLogs([]);
    
    const currentGeneration = generationCounter + 1;
    setGenerationCounter(currentGeneration);
    
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

    // SAFETY CHECK: Prevent massive API costs
    const requestedJobs = parseInt(concurrency) || 1;
    const MAX_CONCURRENT_JOBS = 20;
    const totalJobs = Math.min(Math.max(requestedJobs, 1), MAX_CONCURRENT_JOBS);
    
    if (requestedJobs > MAX_CONCURRENT_JOBS) {
      addLog(`❌ SAFETY BLOCK: Cannot generate more than ${MAX_CONCURRENT_JOBS} videos at once to prevent excessive costs!`, 'error');
      setIsRunning(false);
      return;
    }
    
    if (isNaN(totalJobs) || totalJobs < 1) {
      addLog('❌ SAFETY: Invalid number of videos specified. Using 1 video.', 'error');
      setIsRunning(false);
      return;
    }
    
    // Cost estimation and user confirmation for larger batches
    const estimatedCostMin = totalJobs * 0.25;
    const estimatedCostMax = totalJobs * 0.75;
    
    addLog(`💰 Estimated cost: ${estimatedCostMin.toFixed(2)} - ${estimatedCostMax.toFixed(2)} (${totalJobs} videos)`, 'info');
    
    // Extra confirmation for large batches (10+ videos) - ALWAYS show popup
    if (totalJobs >= 10) {
      const confirmLargeBatch = window.confirm(
        `⚠️ COST WARNING ⚠️\n\n` +
        `You are about to generate ${totalJobs} videos.\n` +
        `Estimated cost: ${estimatedCostMin.toFixed(2)} - ${estimatedCostMax.toFixed(2)}\n\n` +
        `This will use ${totalJobs * 25}-${totalJobs * 50} credits from your RunwayML account.\n\n` +
        `Are you sure you want to proceed?`
      );
      
      if (!confirmLargeBatch) {
        addLog('🛑 Generation cancelled by user (cost protection)', 'warning');
        setIsRunning(false);
        return;
      }
      
      addLog('✅ User confirmed large batch generation', 'info');
    }

    addLog('📊 Processing ' + totalJobs + (totalJobs === 1 ? ' video generation' : ' video generations') + ' using the same prompt and image...', 'info');
    addLog('💳 Note: Each generation requires credits from your API account', 'info');
    addLog('🔄 Jobs will process based on your RunwayML tier limits (Tier 1: 1 concurrent, Tier 2: 3, Tier 3: 5, Tier 4: 10, Tier 5: 20)', 'info');

    const batchResults = [];
    const errors = [];

    const allPromises = [];
    
    for (let i = 0; i < totalJobs; i++) {
      const jobIndex = i;
      const currentVideoNumber = i + 1;
      const staggerDelay = i * 1000;
      
      const delayedPromise = new Promise(async (resolve) => {
        if (staggerDelay > 0) {
          addLog('⏱️ Staggering job ' + (jobIndex + 1) + ' start by ' + (staggerDelay / 1000) + 's...', 'info');
          await new Promise(delayResolve => setTimeout(delayResolve, staggerDelay));
        }
        
        try {
          const result = await generateVideo(prompt, imageUrl, jobIndex, currentGeneration, currentVideoNumber);
          resolve({ status: 'fulfilled', value: result });
        } catch (error) {
          resolve({ status: 'rejected', reason: error, jobIndex });
        }
      });
      
      allPromises.push(delayedPromise);
    }

    addLog('🚀 Starting ' + totalJobs + ' concurrent video generations with 1s stagger...', 'info');
    addLog('⚡ RunwayML will automatically queue jobs beyond your tier limit', 'info');

    try {
      const allResults = await Promise.all(allPromises);
      
      allResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          batchResults.push(result.value);
        } else {
          errors.push(result.reason);
        }
      });
      
    } catch (error) {
      addLog('❌ Concurrent processing error: ' + error.message, 'error');
      errors.push(error);
    }

    setVideoCounter(prev => prev + totalJobs);

    const successCount = batchResults.length;
    addLog('🎬 Generation completed! ✅ ' + successCount + (successCount === 1 ? ' video' : ' videos') + ' generated, ❌ ' + errors.length + ' failed', 
           successCount > 0 ? 'success' : 'error');
    
    if (errors.length > 0) {
      const errorCounts = {};
      errors.forEach(e => {
        const errorType = e.message.includes('timeout') ? 'Generation timeout' :
                        e.message.includes('rate limit') ? 'Rate limit' :
                        e.message.includes('failed') ? 'Generation failed' :
                        e.message.split(':')[0] || e.message;
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });
      
      const errorSummary = Object.entries(errorCounts)
        .map(([error, count]) => `${error} (${count}x)`)
        .join(', ');
      
      addLog('⚠️ Failed jobs: ' + errorSummary, 'warning');
    }

    // Show completion message for this generation
    setCompletedGeneration(currentGeneration);
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

  const generateFilename = (jobId, taskId) => {
    if (!jobId) return 'video_' + taskId + '.mp4';
    
    const genMatch = jobId.match(/Generation (\d+)/);
    const vidMatch = jobId.match(/Video (\d+)/);
    
    if (genMatch && vidMatch) {
      const generation = genMatch[1];
      const video = vidMatch[1];
      return `gen-${generation}-video-${video}.mp4`;
    }
    
    return 'video_' + taskId + '.mp4';
  };

  const downloadAllVideos = async () => {
    setIsDownloadingAll(true);
    
    // Get ALL completed videos from ALL generations and sort them
    const videosWithUrls = results
      .filter(result => result.video_url && result.status === 'completed')
      .sort((a, b) => {
        // Parse the jobId to extract generation and video numbers for sorting
        const parseJobId = (jobId) => {
          if (!jobId) return { generation: 0, video: 0 };
          
          // Extract numbers from "Generation X - Video Y" format
          const genMatch = jobId.match(/Generation (\d+)/);
          const vidMatch = jobId.match(/Video (\d+)/);
          
          return {
            generation: genMatch ? parseInt(genMatch[1]) : 0,
            video: vidMatch ? parseInt(vidMatch[1]) : 0
          };
        };
        
        const aData = parseJobId(a.jobId);
        const bData = parseJobId(b.jobId);
        
        // Sort by generation first, then by video number
        if (aData.generation !== bData.generation) {
          return aData.generation - bData.generation;
        }
        return aData.video - bData.video;
      });
    
    if (videosWithUrls.length === 0) {
      addLog('❌ No completed videos available for download', 'error');
      setIsDownloadingAll(false);
      return;
    }

    addLog(`📦 Creating zip file with ${videosWithUrls.length} videos from all generations...`, 'info');

    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Create the "Runway Videos" folder
      const videosFolder = zip.folder("Runway Videos");
      
      // Download all videos and add to zip inside the folder
      for (let i = 0; i < videosWithUrls.length; i++) {
        const result = videosWithUrls[i];
        const filename = generateFilename(result.jobId, result.id);
        
        try {
          addLog(`📥 Adding to zip ${i + 1}/${videosWithUrls.length}: ${filename}...`, 'info');
          
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Add the video file to the "Runway Videos" folder in the zip
          videosFolder.file(filename, blob);
          
        } catch (error) {
          addLog(`❌ Failed to add ${filename} to zip: ${error.message}`, 'error');
          // Continue with next video even if one fails
          continue;
        }
      }

      // Generate the zip file
      addLog('🗜️ Generating zip file...', 'info');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download the zip file
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = zipUrl;
      a.download = 'runway-videos.zip';
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(zipUrl);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded runway-videos.zip with ${videosWithUrls.length} videos successfully!`, 'success');
      
    } catch (error) {
      addLog(`❌ Failed to create zip file: ${error.message}`, 'error');
    }

    setIsDownloadingAll(false);
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

  const upscaleVideo = async (videoId, videoTitle) => {
    try {
      addLog('🔄 Starting 4K upscale for ' + videoTitle + '...', 'info');
      addLog('⚠️ 4K upscaling is not yet implemented in the API. This feature would require RunwayML to add upscaling to their API endpoints.', 'warning');
    } catch (error) {
      addLog('❌ 4K upscale failed: ' + error.message, 'error');
    }
  };

  return (
    <>
      <Head>
        <title>Runway Automation Pro - AI Video Generation</title>
        <meta name="description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A90E2'><path d='M21 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18zM20 5H4v14h16V5zm-8 2v2h2V7h-2zm-4 0v2h2V7H8zm8 0v2h2V7h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z'/></svg>" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runway-automation.vercel.app/" />
        <meta property="og:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="og:description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://runway-automation.vercel.app/" />
        <meta property="twitter:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="twitter:description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta property="twitter:image" content="/og-image.png" />

        {/* Additional SEO tags */}
        <meta name="keywords" content="RunwayML, AI video generation, automation, video creation, artificial intelligence, machine learning" />
        <meta name="author" content="Runway Automation Pro" />
        <meta name="robots" content="index, follow" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-navbutton-color" content="#667eea" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <style>{`
          .tooltip .tooltip-inner {
            background-color: rgba(0, 0, 0, 1) !important;
          }
          .tooltip.bs-tooltip-top .tooltip-arrow::before,
          .tooltip.bs-tooltip-bottom .tooltip-arrow::before,
          .tooltip.bs-tooltip-start .tooltip-arrow::before,
          .tooltip.bs-tooltip-end .tooltip-arrow::before {
            border-color: rgba(0, 0, 0, 1) transparent !important;
          }
        `}</style>
      </Head>

      <div className="min-vh-100" style={{ background: 'black', fontFamily: 'Normal, Inter, system-ui, sans-serif' }}>
        <div className="container-fluid py-4">
          <div className="d-flex align-items-center justify-content-between mb-3" style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '12px', paddingRight: '12px' }}>
            <div className="d-flex align-items-center">
              <button 
                onClick={() => setActiveTab('setup')}
                className="btn btn-link text-white text-decoration-none p-0 d-flex align-items-center"
                style={{ fontSize: '1.75rem', fontWeight: 'bold' }}
              >
                <Clapperboard size={36} className="me-3" style={{ verticalAlign: 'middle' }} />
                Runway Automation Pro
              </button>
            </div>
            <div className="text-end">
              <p className="lead text-white-50 mb-0" style={{ maxWidth: '420px', fontSize: '1rem', lineHeight: '1.4' }}>
                A lightweight front end for the Runway API that generates up to 20 videos from one prompt, all at the same time. Download every video you generate with one button.
              </p>
            </div>
          </div>

          <div className="row justify-content-center mb-3">
            <div className="col-auto">
              <ul className="nav nav-pills nav-fill shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px' }}>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'setup' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('setup')}
                    style={{ borderRadius: '6px', fontWeight: '600' }}
                  >
                    <Settings size={20} className="me-2" />
                    Setup
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'generation' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('generation')}
                    style={{ borderRadius: '6px', fontWeight: '600' }}
                  >
                    <Video size={20} className="me-2" />
                    Generation
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'results' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('results')}
                    style={{ borderRadius: '6px', fontWeight: '600' }}
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
                    <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                      <div 
                        className="bg-primary position-relative d-flex align-items-center justify-content-center" 
                        style={{ 
                          height: '80px',
                          borderRadius: '8px 8px 0 0'
                        }}
                      >
                        <div 
                          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            left: '20px',
                            top: '40px',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: '#4dd0ff'
                          }}
                        >
                          <Key className="text-white" size={32} />
                        </div>
                        
                        <div className="text-white text-center">
                          <h3 className="mb-0 fw-bold">API Setup</h3>
                        </div>
                      </div>
                      
                      <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4">
                        </div>
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">RunwayML API Key</label>
                            {runwayApiKey && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={clearStoredApiKey}
                                title="Clear stored API key"
                                style={{ fontSize: '12px' }}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <input
                            type="password"
                            className="form-control form-control-lg"
                            value={runwayApiKey}
                            onChange={(e) => setRunwayApiKey(e.target.value)}
                            placeholder="key_xxx..."
                            style={{ borderRadius: '8px' }}
                          />
                          <div className="form-text">
                            <ExternalLink size={14} className="me-1" />
                            <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              Get your API key from RunwayML Developer Portal
                            </a>
                          </div>
                        </div>

                        <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: '8px' }}>
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

                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label fw-bold">Model</label>
                            <select
                              className="form-select"
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              style={{ borderRadius: '8px' }}
                            >
                              {modelOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-bold">
                              Aspect Ratio
                              <i 
                                className="bi bi-info-circle ms-1 text-primary" 
                                style={{ cursor: 'help' }}
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="• 16:9 (Landscape - YouTube, TV, desktop)&#10;• 9:16 (Portrait - TikTok, Instagram Stories, mobile)&#10;• 1:1 (Square - Instagram posts, profile pics)&#10;• 4:3 (Standard - Classic TV, monitors)&#10;• 3:4 (Portrait Standard - Print, documents)&#10;• 21:9 (Cinematic - Ultrawide movies)"
                              ></i>
                            </label>
                            <select
                              className="form-select"
                              value={aspectRatio}
                              onChange={(e) => setAspectRatio(e.target.value)}
                              style={{ borderRadius: '8px' }}
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
                              style={{ borderRadius: '8px' }}
                            >
                              <option value={5}>5 seconds</option>
                              <option value={10}>10 seconds</option>
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-bold">
                              # of Videos Generated
                              <i 
                                className="bi bi-info-circle ms-1 text-primary" 
                                style={{ cursor: 'help' }}
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Number of videos to generate simultaneously using the same prompt and image (20 max)."
                              ></i>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              className="form-control"
                              value={concurrency}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                const safeValue = Math.min(Math.max(value, 1), 20);
                                setConcurrency(safeValue);
                                
                                if (value > 20) {
                                  addLog('⚠️ SAFETY: Maximum 20 videos allowed to prevent excessive costs', 'warning');
                                }
                              }}
                              style={{ borderRadius: '8px' }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-light rounded border">
                          <label className="form-label fw-bold mb-2">Video Generation Limits by Tier</label>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered border-dark mb-0">
                              <thead className="table-secondary">
                                <tr>
                                  <th className="fw-bold border-dark" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid' }}>Tier</th>
                                  <th className="fw-bold border-dark" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid' }}>Videos Generated</th>
                                  <th className="fw-bold border-dark" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid' }}>Criteria</th>
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
                          <p className="small text-muted mt-2 mb-0">
                            Not sure which tier you are? Go to <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none">dev.runwayml.com</a> &gt; Usage.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                      <div 
                        className="bg-primary position-relative d-flex align-items-center justify-content-center" 
                        style={{ 
                          height: '80px',
                          borderRadius: '8px 8px 0 0'
                        }}
                      >
                        <div 
                          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            left: '20px',
                            top: '40px',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: '#4dd0ff'
                          }}
                        >
                          <Film className="text-white" size={32} />
                        </div>
                        
                        <div className="text-white text-center">
                          <h3 className="mb-0 fw-bold">Video Setup</h3>
                        </div>
                      </div>
                      
                      <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4">
                        </div>
                        <div className="mb-4">
                          <label className="form-label fw-bold">Video Prompt</label>
                          <div className="position-relative">
                            <textarea
                              className="form-control"
                              rows="3"
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder=""
                              style={{ borderRadius: '8px' }}
                            />
                            {!prompt && (
                              <div 
                                className="position-absolute" 
                                style={{ 
                                  left: '16px', 
                                  top: '12px', 
                                  pointerEvents: 'none',
                                  color: '#6c757d',
                                  fontSize: '16px'
                                }}
                              >
                                Add an image then describe your shot.{' '}
                                <a 
                                  href="https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide" 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-decoration-underline"
                                  style={{ 
                                    color: '#6c757d',
                                    pointerEvents: 'auto'
                                  }}
                                >
                                  View guide
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-bold">
                            Image
                            <i 
                              className="bi bi-info-circle ms-1 text-primary" 
                              style={{ cursor: 'help' }}
                              data-bs-toggle="tooltip" 
                              data-bs-placement="top" 
                              title="Upload an image file or paste an image URL. Image aspect ratio must be between 0.5 and 2.0 (width/height). Very wide or very tall images will be rejected by RunwayML."
                            ></i>
                          </label>
                          
                          {/* Hidden file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                          
                          {/* Upload button or URL input */}
                          {!imageUrl ? (
                            <div 
                              className="d-flex align-items-center justify-content-center border border-2 border-dashed rounded p-4 text-center"
                              style={{ 
                                borderColor: '#dee2e6', 
                                backgroundColor: '#f8f9fa',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '120px'
                              }}
                              onClick={triggerImageUpload}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#0d6efd';
                                e.target.style.backgroundColor = '#e7f3ff';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = '#dee2e6';
                                e.target.style.backgroundColor = '#f8f9fa';
                              }}
                            >
                              <div>
                                {isUploadingImage ? (
                                  <>
                                    <div className="spinner-border text-primary mb-2" role="status">
                                      <span className="visually-hidden">Uploading...</span>
                                    </div>
                                    <div className="text-muted">Uploading image...</div>
                                  </>
                                ) : (
                                  <>
                                    <FolderOpen size={48} className="text-primary mb-2" />
                                    <div className="text-primary fw-bold mb-1">Click to upload image</div>
                                    <div className="text-muted small">or paste image URL below</div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="position-relative">
                              <img 
                                src={imageUrl} 
                                alt="Uploaded image preview"
                                className="img-fluid rounded border w-100"
                                style={{ height: 'auto', maxHeight: '300px', objectFit: 'contain' }}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                              />
                              <button
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                onClick={() => {
                                  setImageUrl('');
                                  setImageError(false);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                style={{ borderRadius: '50%', width: '32px', height: '32px' }}
                              >
                                ×
                              </button>
                            </div>
                          )}
                          
                          {/* URL input as alternative */}
                          <div className="mt-3">
                            <input
                              type="url"
                              className="form-control"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="Or paste image URL here..."
                              style={{ borderRadius: '8px' }}
                            />
                          </div>
                          
                          {/* Generate Video Button */}
                          <div className="mt-4">
                            <button
                              className="btn btn-success btn-lg w-100 shadow"
                              onClick={() => {
                                setActiveTab('generation');
                                // Small delay to ensure tab switch completes before starting generation
                                setTimeout(() => {
                                  if (!isRunning) {
                                    generateVideos();
                                  }
                                }, 100);
                              }}
                              disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || concurrency < 1 || concurrency > 20 || isRunning}
                              style={{ 
                                borderRadius: '8px', 
                                fontWeight: '600',
                                backgroundColor: '#28a745',
                                borderColor: '#28a745'
                              }}
                            >
                              <Play size={20} className="me-2" />
                              Generate Video{concurrency > 1 ? 's' : ''}
                              {concurrency > 1 && (
                                <span className="ms-2 badge bg-light text-dark">
                                  {concurrency}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'generation' && (
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    className="bg-primary position-relative d-flex align-items-center justify-content-between" 
                    style={{ 
                      height: '80px',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <div 
                      className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '80px', 
                        height: '80px',
                        left: '20px',
                        top: '40px',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        backgroundColor: '#4dd0ff'
                      }}
                    >
                      <Video className="text-white" size={32} />
                    </div>
                    
                    <div className="text-white text-center" style={{ marginLeft: '105px' }}>
                      <h2 className="mb-0 fw-bold">Video Generation</h2>
                    </div>
                    
                    <div style={{ marginRight: '30px', marginTop: '10px', marginBottom: '10px' }}>
                      {!isRunning ? (
                        <button
                          className="btn btn-success btn-lg shadow"
                          onClick={generateVideos}
                          disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || concurrency < 1 || concurrency > 20}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600', 
                            marginTop: '5px', 
                            marginBottom: '5px',
                            opacity: '1',
                            transition: 'opacity 0.2s ease-in-out',
                            backgroundColor: '#28a745',
                            borderColor: '#28a745'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.6'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          <Play size={24} className="me-2" />
                          Start Generation
                          {concurrency > 1 && (
                            <span className="ms-2 badge bg-light text-dark">
                              {concurrency} videos
                            </span>
                          )}
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger btn-lg shadow"
                          onClick={stopGeneration}
                          style={{ borderRadius: '8px', fontWeight: '600', marginTop: '10px', marginBottom: '10px' }}
                        >
                          <AlertCircle size={24} className="me-2" />
                          Stop Generation
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4">
                    </div>
                    <div className="card text-white mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '8px' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark text-uppercase d-flex align-items-center" style={{ fontSize: '0.875rem', height: '100%' }}>CONNECTION STATUS</span>
                          <div className="d-flex gap-5 align-items-center text-center">
                            <span className="text-dark"><strong>API:</strong> {runwayApiKey ? '✓ Connected' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Prompt:</strong> {prompt.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Image:</strong> {imageUrl.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            <div className="d-flex align-items-center">
                              <div className={`me-2 rounded-circle ${isRunning ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}>
                                {isRunning && (
                                  <div className="w-100 h-100 rounded-circle bg-primary"></div>
                                )}
                              </div>
                              <span className="fw-bold text-dark">{isRunning ? 'Running' : 'Idle'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Always show generation status */}
                    <div className="mb-3" style={{ minHeight: '100px' }}>
                      <div className="text-center py-3">
                        <h4 className="fw-bold text-dark mb-2">
                          {(() => {
                            if (Object.keys(generationProgress).length > 0) {
                              // During generation
                              return `Generation ${generationCounter || 1} in progress`;
                            } else if (completedGeneration) {
                              // After completion
                              return `Generation ${completedGeneration} completed`;
                            } else {
                              // Initial state
                              return `Generation ${generationCounter || 1}`;
                            }
                          })()}
                        </h4>
                        <p className="text-muted mb-0">
                          {(() => {
                            if (Object.keys(generationProgress).length > 0) {
                              // During generation - show active job count
                              const count = Object.keys(generationProgress).length;
                              return `${count} video${count !== 1 ? 's' : ''} generating`;
                            } else if (completedGeneration) {
                              // After completion - show completed count from that generation
                              const count = results.filter(r => r.jobId && r.jobId.includes(`Generation ${completedGeneration}`)).length;
                              return `${count} video${count !== 1 ? 's' : ''} generated successfully`;
                            } else {
                              // Initial state
                              return '0 videos generated';
                            }
                          })()}
                        </p>
                      </div>
                    </div>

                    {Object.keys(generationProgress).length > 0 && (
                      <div className="mb-3">
                        <div className="row g-3">
                          {Object.entries(generationProgress).map(([jobId, progress]) => (
                            <div key={jobId} className="col-md-6 col-xl-3">
                              <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span className="fw-bold small" style={{ 
                                      lineHeight: '1.2',
                                      wordBreak: 'break-word',
                                      maxWidth: '120px'
                                    }}>
                                      {jobId}
                                    </span>
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

                    <div className="card bg-dark text-light border-0 shadow" style={{ borderRadius: '8px' }}>
                      <div className="card-header bg-transparent border-0 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="text-light fw-bold mb-0">Video Generation Log</h5>
                        <button 
                          className="btn btn-sm btn-outline-light" 
                          onClick={copyLogsToClipboard}
                          title="Copy all logs to clipboard"
                          style={{ borderRadius: '6px' }}
                        >
                          <i className="bi bi-clipboard" style={{ fontSize: '14px' }}></i>
                        </button>
                      </div>
                      <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        {logs.map((log, index) => (
                          <div key={index} className={`small mb-1 ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-light' :
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

          {activeTab === 'results' && (
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    className="bg-primary position-relative d-flex align-items-center justify-content-between" 
                    style={{ 
                      height: '80px',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <div 
                      className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '80px', 
                        height: '80px',
                        left: '20px',
                        top: '40px',
                        zIndex: 10,
                        backgroundColor: '#4dd0ff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Download className="text-white" size={32} />
                    </div>
                    
                    <div className="text-white text-center" style={{ marginLeft: '105px' }}>
                      <h2 className="mb-0 fw-bold">Generated Videos</h2>
                    </div>
                    
                    {results.filter(result => result.video_url && result.status === 'completed').length > 0 && (
                      <div style={{ marginRight: '30px' }}>
                        <button
                          className="btn btn-light shadow"
                          onClick={downloadAllVideos}
                          disabled={isDownloadingAll}
                          style={{ borderRadius: '8px', fontWeight: '600' }}
                        >
                          {isDownloadingAll ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download size={20} className="me-2" />
                              Download All as ZIP
                              <span className="ms-2 badge bg-primary">
                                {results.filter(result => result.video_url && result.status === 'completed').length}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4">
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
                          style={{ borderRadius: '6px' }}
                        >
                          Get Started
                        </button>
                      </div>
                    ) : (
                      <div className="row g-4">
                        {results
                          .slice()
                          .sort((a, b) => {
                            const parseJobId = (jobId) => {
                              if (!jobId) return { generation: 0, video: 0 };
                              
                              const genMatch = jobId.match(/Generation (\d+)/);
                              const vidMatch = jobId.match(/Video (\d+)/);
                              
                              return {
                                generation: genMatch ? parseInt(genMatch[1]) : 0,
                                video: vidMatch ? parseInt(vidMatch[1]) : 0
                              };
                            };
                            
                            const aData = parseJobId(a.jobId);
                            const bData = parseJobId(b.jobId);
                            
                            if (aData.generation !== bData.generation) {
                              return aData.generation - bData.generation;
                            }
                            return aData.video - bData.video;
                          })
                          .map((result, index) => (
                          <div key={index} className="col-md-6 col-lg-3">
                            <div className="card border-0 shadow h-100" style={{ borderRadius: '8px' }}>
                              <div className="position-relative" style={{ borderRadius: '8px 8px 0 0', overflow: 'hidden', aspectRatio: '16/9' }}>
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
                                
                                {result.status !== 'completed' && (
                                  <div className="position-absolute top-0 start-0 m-3">
                                    <span className="badge bg-warning shadow-sm">
                                      ⏳ Processing
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="card-body p-3">
                                <div className="fw-bold text-primary mb-2">{result.jobId}</div>
                                <h6 className="card-title mb-3" style={{ fontWeight: '400' }} title={result.prompt}>
                                  {result.prompt}
                                </h6>
                                
                                <div className="d-grid gap-2">
                                  {result.video_url && (
                                    <div className="btn-group" role="group">
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => downloadVideo(result.video_url, generateFilename(result.jobId, result.id))}
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
                                      <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => upscaleVideo(result.id, result.jobId)}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="4K upscaling API endpoints are not yet documented by RunwayML. This feature will be available when the API is officially released."
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                          <polyline points="7.5 4.21,12 6.81,16.5 4.21"/>
                                          <polyline points="7.5 19.79,7.5 14.6,3 12"/>
                                          <polyline points="21 12,16.5 14.6,16.5 19.79"/>
                                          <polyline points="12 22.81,12 17"/>
                                        </svg>
                                        4K
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

          <div className="text-center mt-5">
            <div className="d-flex align-items-center justify-content-center text-white-50">
              <small>Based on <a href="https://apify.com/igolaizola/runway-automation" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Runway Automation for Apify</a> by <a href="https://igolaizola.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Iñigo Garcia Olaizola</a>.<br />Vibe coded by <a href="https://petebunke.com" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Pete Bunke</a>. All rights reserved.<br /><a href="mailto:petebunke@gmail.com?subject=Runway%20Automation%20User%20Feedback" className="text-white-50 text-decoration-none"><strong>Got user feedback?</strong> Hit me up!</a></small>
            </div>
            <div className="d-flex align-items-center justify-content-center text-white-50 mt-3">
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer">
                <svg width="160" height="20" viewBox="0 0 160 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="14" font-family="Arial, sans-serif" font-size="12" font-weight="400" fill="white" fillOpacity="0.7">Powered by</text>
                  <g transform="translate(75, 2)">
                    <path d="M0 0h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4zM6 0h4v4H6V0zm0 6h4v4H6V6zm0 6h4v4H6v-4zM12 0h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4z" fill="white" fillOpacity="0.7"/>
                    <path d="M20 2h8v2h-8V2zm0 4h8v2h-8V6zm0 4h8v2h-8v-2zm0 4h8v2h-8v-2z" fill="white" fillOpacity="0.7"/>
                    <text x="32" y="12" font-family="Arial, sans-serif" font-size="10" font-weight="600" fill="white" fillOpacity="0.7">RUNWAY</text>
                  </g>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}