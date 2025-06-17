import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart } from 'lucide-react';
import Head from 'next/head';

export default function RunwayAutomationApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [runwayApiKey, setRunwayApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [model, setModel] = useState('gen4_turbo');
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
  const [mounted, setMounted] = useState(false);
  const [favoriteVideos, setFavoriteVideos] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [hasShownCostWarning, setHasShownCostWarning] = useState(false);
  const fileInputRef = useRef(null);

  const HEADER_BLUE = '#0d6efd';

  useEffect(() => {
    setMounted(true);
  }, []);

  const Modal = ({ show, onClose, title, children, onConfirm, confirmText = "Confirm", cancelText = "Cancel", type = "confirm" }) => {
    if (!show) return null;

    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        zIndex: 9999 
      }}>
        <div className="card shadow-lg border-0" style={{ 
          borderRadius: '8px', 
          overflow: 'hidden',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div 
            className="position-relative d-flex align-items-center justify-content-center" 
            style={{ 
              height: '80px',
              borderRadius: '8px 8px 0 0',
              backgroundColor: HEADER_BLUE
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
              {type === 'warning' ? <AlertCircle className="text-white" size={32} /> : <CreditCard className="text-white" size={32} />}
            </div>
            
            <div className="text-white text-center">
              <h3 className="mb-0 fw-bold">{title}</h3>
            </div>
          </div>
          
          <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
            <div className="mb-4"></div>
            {children}
            
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                style={{ borderRadius: '8px', fontWeight: '600', width: '48%' }}
              >
                {cancelText}
              </button>
              {onConfirm && (
                <button
                  className={`btn ${type === 'warning' ? 'btn-danger' : 'btn-primary'} shadow`}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  style={{ borderRadius: '8px', fontWeight: '600', width: '48%' }}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showModalDialog = (config) => {
    setModalConfig(config);
    setShowModal(true);
  };

  useEffect(() => {
    if (!mounted) return;
    
    try {
      const savedApiKey = localStorage.getItem('runway-automation-api-key');
      if (savedApiKey && savedApiKey.trim()) {
        console.log('Loading saved API key from localStorage');
        setRunwayApiKey(savedApiKey);
      }
      
      const savedPrompt = localStorage.getItem('runway-automation-prompt');
      if (savedPrompt && savedPrompt.trim()) {
        setPrompt(savedPrompt);
      }
      
      const savedImageUrl = localStorage.getItem('runway-automation-image-url');
      if (savedImageUrl && savedImageUrl.trim()) {
        setImageUrl(savedImageUrl);
      }

      const savedModel = localStorage.getItem('runway-automation-model');
      if (savedModel && savedModel.trim()) {
        setModel(savedModel);
      }

      const savedAspectRatio = localStorage.getItem('runway-automation-aspect-ratio');
      if (savedAspectRatio && savedAspectRatio.trim()) {
        setAspectRatio(savedAspectRatio);
      }

      const savedDuration = localStorage.getItem('runway-automation-duration');
      if (savedDuration && savedDuration.trim()) {
        setDuration(parseInt(savedDuration));
      }

      const savedConcurrency = localStorage.getItem('runway-automation-concurrency');
      if (savedConcurrency && savedConcurrency.trim()) {
        setConcurrency(parseInt(savedConcurrency));
      }

      const savedResults = localStorage.getItem('runway-automation-results');
      if (savedResults && savedResults.trim()) {
        try {
          const parsedResults = JSON.parse(savedResults);
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            setResults(parsedResults);
          }
        } catch (parseError) {
          localStorage.removeItem('runway-automation-results');
        }
      }

      const savedGenerationCounter = localStorage.getItem('runway-automation-generation-counter');
      if (savedGenerationCounter && savedGenerationCounter.trim()) {
        setGenerationCounter(parseInt(savedGenerationCounter));
      }

      const savedFavorites = localStorage.getItem('runway-automation-favorites');
      if (savedFavorites && savedFavorites.trim()) {
        try {
          const parsedFavorites = JSON.parse(savedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setFavoriteVideos(new Set(parsedFavorites));
          }
        } catch (parseError) {
          localStorage.removeItem('runway-automation-favorites');
        }
      }

      const savedHasShownCostWarning = localStorage.getItem('runway-automation-cost-warning-shown');
      if (savedHasShownCostWarning === 'true') {
        setHasShownCostWarning(true);
      }
    } catch (error) {
      console.warn('Failed to load saved data from localStorage:', error);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (runwayApiKey && runwayApiKey.trim() && runwayApiKey.length > 5) {
        localStorage.setItem('runway-automation-api-key', runwayApiKey);
      } else if (runwayApiKey === '') {
        localStorage.removeItem('runway-automation-api-key');
      }
    } catch (error) {
      console.warn('Failed to save API key to localStorage:', error);
    }
  }, [runwayApiKey, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (prompt && prompt.trim()) {
        localStorage.setItem('runway-automation-prompt', prompt);
      } else if (prompt === '') {
        localStorage.removeItem('runway-automation-prompt');
      }
    } catch (error) {
      console.warn('Failed to save prompt to localStorage:', error);
    }
  }, [prompt, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (imageUrl && imageUrl.trim()) {
        localStorage.setItem('runway-automation-image-url', imageUrl);
      } else if (imageUrl === '') {
        localStorage.removeItem('runway-automation-image-url');
      }
    } catch (error) {
      console.warn('Failed to save image URL to localStorage:', error);
    }
  }, [imageUrl, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (model && model.trim()) {
        localStorage.setItem('runway-automation-model', model);
      }
    } catch (error) {
      console.warn('Failed to save model to localStorage:', error);
    }
  }, [model, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (aspectRatio && aspectRatio.trim()) {
        localStorage.setItem('runway-automation-aspect-ratio', aspectRatio);
      }
    } catch (error) {
      console.warn('Failed to save aspect ratio to localStorage:', error);
    }
  }, [aspectRatio, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (duration) {
        localStorage.setItem('runway-automation-duration', duration.toString());
      }
    } catch (error) {
      console.warn('Failed to save duration to localStorage:', error);
    }
  }, [duration, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (concurrency) {
        localStorage.setItem('runway-automation-concurrency', concurrency.toString());
      }
    } catch (error) {
      console.warn('Failed to save concurrency to localStorage:', error);
    }
  }, [concurrency, mounted]);

  useEffect(() => {
    if (!mounted || !Array.isArray(results)) return;
    try {
      if (results.length > 0) {
        localStorage.setItem('runway-automation-results', JSON.stringify(results));
      } else {
        localStorage.removeItem('runway-automation-results');
      }
    } catch (error) {
      console.warn('Failed to save results to localStorage:', error);
    }
  }, [results, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (generationCounter > 0) {
        localStorage.setItem('runway-automation-generation-counter', generationCounter.toString());
      }
    } catch (error) {
      console.warn('Failed to save generation counter to localStorage:', error);
    }
  }, [generationCounter, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (favoriteVideos.size > 0) {
        localStorage.setItem('runway-automation-favorites', JSON.stringify([...favoriteVideos]));
      } else {
        localStorage.removeItem('runway-automation-favorites');
      }
    } catch (error) {
      console.warn('Failed to save favorites to localStorage:', error);
    }
  }, [favoriteVideos, mounted]);

  const clearStoredApiKey = () => {
    try {
      localStorage.removeItem('runway-automation-api-key');
      setRunwayApiKey('');
      addLog('🔒 API key cleared from storage', 'info');
    } catch (error) {
      console.warn('Failed to clear API key:', error);
    }
  };

  const clearGeneratedVideos = () => {
    const videoCount = results.length;
    if (videoCount === 0) {
      addLog('ℹ️ No videos to clear', 'info');
      return;
    }

    showModalDialog({
      title: "Clear All Videos",
      type: "warning",
      confirmText: "Clear Videos",
      cancelText: "Cancel",
      onConfirm: () => {
        try {
          localStorage.removeItem('runway-automation-results');
          localStorage.removeItem('runway-automation-generation-counter');
          localStorage.removeItem('runway-automation-favorites');
          setResults([]);
          setGenerationCounter(0);
          setCompletedGeneration(null);
          setFavoriteVideos(new Set());
          addLog(`🗑️ Cleared ${videoCount} generated video${videoCount !== 1 ? 's' : ''} from browser storage`, 'info');
        } catch (error) {
          console.warn('Failed to clear videos:', error);
          addLog('❌ Failed to clear videos: ' + error.message, 'error');
        }
      },
      content: (
        <div>
          <p className="mb-3">
            <strong>This will permanently remove {videoCount} generated video{videoCount !== 1 ? 's' : ''} from your browser.</strong>
          </p>
          <p className="mb-3">
            Videos will still be accessible via their original URLs if you have them saved elsewhere.
          </p>
          <p className="mb-0 text-muted">
            Are you sure you want to continue?
          </p>
        </div>
      )
    });
  };

  const toggleFavorite = (videoId) => {
    setFavoriteVideos(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(videoId)) {
        newFavorites.delete(videoId);
      } else {
        newFavorites.add(videoId);
      }
      return newFavorites;
    });
  };

  const isValidImageUrl = (url) => {
    try {
      if (url.startsWith('data:image/')) {
        if (url.length > 1.5 * 1024 * 1024) {
          addLog('⚠️ Uploaded image is very large and may cause API errors', 'warning');
        }
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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addLog('❌ Please select a valid image file', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      addLog('❌ Image file too large. Please use an image under 50MB', 'error');
      return;
    }

    setIsUploadingImage(true);
    addLog(`📤 Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB image...`, 'info');
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const loadImage = new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
      });
      
      await loadImage;
      
      const maxSize = 1024;
      let { width, height } = img;
      const originalAspectRatio = width / height;
      
      addLog(`📏 Original image: ${width}x${height} (${originalAspectRatio.toFixed(2)} aspect ratio)`, 'info');
      
      if (originalAspectRatio < 0.5 || originalAspectRatio > 2.0) {
        addLog(`⚠️ Warning: Image aspect ratio ${originalAspectRatio.toFixed(2)} is outside RunwayML's accepted range (0.5-2.0). This may cause API errors.`, 'warning');
      }
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      addLog('🔄 Compressing image...', 'info');
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      const finalSizeKB = Math.round((compressedDataUrl.length * 0.75) / 1024);
      
      if (compressedDataUrl.length > 1.5 * 1024 * 1024) {
        addLog('❌ Image is still too large after compression. Please use a smaller image.', 'error');
        setIsUploadingImage(false);
        return;
      }
      
      setImageUrl(compressedDataUrl);
      setImageError(false);
      addLog(`✅ Image uploaded and compressed to ${width}x${height} (~${finalSizeKB}KB)`, 'success');
      setIsUploadingImage(false);
      
    } catch (error) {
      addLog('❌ Error processing image: ' + error.message, 'error');
      setIsUploadingImage(false);
    }
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    if (typeof window !== 'undefined' && window.bootstrap && (activeTab === 'setup' || activeTab === 'results')) {
      requestAnimationFrame(() => {
        const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        existingTooltips.forEach(function (tooltipEl) {
          const existingTooltip = window.bootstrap.Tooltip.getInstance(tooltipEl);
          if (existingTooltip) {
            existingTooltip.dispose();
          }
        });

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
          new window.bootstrap.Tooltip(tooltipTriggerEl);
        });
      });
    }
  }, [activeTab, mounted]);

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
    const timestamp = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
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

  const convertAspectRatio = (ratio) => {
    const ratioMap = {
      '16:9': '1280:720',
      '9:16': '720:1280', 
      '1:1': '1024:1024',
      '4:3': '1024:768',
      '3:4': '768:1024',
      '21:9': '1344:576'
    };
    return ratioMap[ratio] || '1280:720';
  };

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
        promptText: promptText,
        promptImage: imageUrlText.trim(),
        model: model,
        ratio: convertAspectRatio(aspectRatio),
        duration: duration,
        seed: Math.floor(Math.random() * 1000000)
      };

      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

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

          const responseText = await response.text();

          if (!response.ok) {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch (parseError) {
              throw new Error(`API Error ${response.status}: Could not parse error response`);
            }
            
            let errorMessage = errorData.error || 'API Error: ' + response.status;
            
            if (response.status === 429 || response.status >= 500) {
              if (retryCount < maxRetries) {
                const baseDelay = 15000;
                const exponentialDelay = baseDelay * Math.pow(2, retryCount);
                const jitter = Math.random() * (baseDelay * 0.5);
                const totalDelay = Math.min(exponentialDelay + jitter, 120000);
                
                addLog(`⚠️ Job ${jobIndex + 1} API error (${response.status}), retrying in ${Math.round(totalDelay/1000)}s... (${retryCount + 1}/${maxRetries})`, 'warning');
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                retryCount++;
                continue;
              }
            }

            if (response.status === 400 && errorMessage.includes('not have enough credits')) {
              throw new Error('Insufficient credits: ' + errorMessage);
            }
            
            if (response.status === 400 && errorMessage.toLowerCase().includes('safety')) {
              throw new Error('Content safety violation: ' + errorMessage);
            }
            
            if (errorMessage.includes('Invalid asset aspect ratio')) {
              errorMessage = 'Image aspect ratio issue: ' + errorMessage + ' Try using an image that is closer to square, landscape, or portrait format (not ultra-wide or ultra-tall).';
            }
            
            throw new Error(errorMessage);
          }

          let task;
          try {
            task = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error('Could not parse successful API response');
          }
          
          addLog('✓ Generation started for job ' + (jobIndex + 1) + ' (Task ID: ' + task.id + ') - Initial Status: ' + (task.status || 'unknown'), 'success');
          
          return await pollTaskCompletion(task.id, jobId, promptText, imageUrlText, jobIndex);
          
        } catch (fetchError) {
          if (retryCount < maxRetries && (
            fetchError.name === 'AbortError' || 
            fetchError.message.includes('fetch') ||
            fetchError.message.includes('network') ||
            fetchError.message.includes('Failed to fetch')
          )) {
            const baseDelay = 10000;
            const exponentialDelay = baseDelay * Math.pow(1.5, retryCount);
            const jitter = Math.random() * (baseDelay * 0.3);
            const totalDelay = Math.min(exponentialDelay + jitter, 60000);
            
            addLog(`⚠️ Job ${jobIndex + 1} network error, retrying in ${Math.round(totalDelay/1000)}s... (${retryCount + 1}/${maxRetries})`, 'warning');
            await new Promise(resolve => setTimeout(resolve, totalDelay));
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

  const pollTaskCompletion = async (taskId, jobId, promptText, imageUrlText, jobIndex) => {
    const maxPolls = Math.floor(3600 / 12);
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;
    let isThrottled = false;
    let throttledStartTime = null;
    let lastKnownStatus = 'unknown';
    let stuckInPendingCount = 0;
    const maxStuckInPending = 15;
    let processingStartTime = null;

    while (pollCount < maxPolls) {
      try {
        const timeoutMs = consecutiveErrors > 0 ? 30000 : 
                          isThrottled ? 45000 : 
                          lastKnownStatus === 'RUNNING' ? 20000 : 15000;
        
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
          if (consecutiveErrors < maxConsecutiveErrors) {
            consecutiveErrors++;
            const backoffDelay = 20000 + (consecutiveErrors * 10000) + (Math.random() * 5000);
            addLog(`⚠️ Job ${jobIndex + 1} parse error, retrying in ${Math.round(backoffDelay/1000)}s... (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`, 'warning');
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            pollCount++;
            continue;
          }
          
          throw new Error('Invalid response from RunwayML API: ' + responseText.substring(0, 100));
        }

        if (!response.ok) {
          if (response.status === 429) {
            const backoffTime = 45000 + (consecutiveErrors * 20000) + (Math.random() * 15000);
            addLog(`⚠️ Job ${jobIndex + 1} rate limited (${response.status}), backing off for ${Math.round(backoffTime/1000)}s...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            consecutiveErrors++;
            pollCount++;
            continue;
          } else if (response.status >= 500) {
            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
              throw new Error(`Server error after ${maxConsecutiveErrors} attempts: ${task.error || response.status}`);
            }
            const backoffDelay = 30000 + (consecutiveErrors * 15000) + (Math.random() * 10000);
            addLog(`⚠️ Job ${jobIndex + 1} server error (${response.status}), retrying in ${Math.round(backoffDelay/1000)}s... (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`, 'warning');
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
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
              message: `Queued for ${Math.floor(throttledDuration / 60)}m ${throttledDuration % 60}s` 
            }
          }));
          
          if (throttledDuration > 0 && throttledDuration % 180 === 0) {
            addLog('⏸️ Job ' + (jobIndex + 1) + ' still queued after ' + Math.floor(throttledDuration / 60) + ' minute(s)', 'info');
          }
          
          await new Promise(resolve => setTimeout(resolve, 4000));
          pollCount++;
          continue;
        }
        
        if (isThrottled && task.status !== 'THROTTLED') {
          const queueTime = Math.floor((Date.now() - throttledStartTime) / 1000);
          addLog('▶️ Job ' + (jobIndex + 1) + ' started processing after ' + Math.floor(queueTime / 60) + 'm ' + (queueTime % 60) + 's in queue', 'info');
          isThrottled = false;
          stuckInPendingCount = 0;
          processingStartTime = Date.now();
        }
        
        if (task.status === 'PENDING') {
          if (lastKnownStatus === 'PENDING') {
            stuckInPendingCount++;
          } else {
            stuckInPendingCount = 1;
            if (!processingStartTime) processingStartTime = Date.now();
          }
          
          if (stuckInPendingCount >= maxStuckInPending) {
            addLog(`⚠️ Job ${jobIndex + 1} stuck in PENDING for ${stuckInPendingCount} cycles, using longer polling interval...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 12000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } else if (task.status === 'RUNNING') {
          if (!processingStartTime) processingStartTime = Date.now();
          stuckInPendingCount = 0;
          await new Promise(resolve => setTimeout(resolve, 8000));
        } else {
          stuckInPendingCount = 0;
        }
        
        lastKnownStatus = task.status;
        
        let progress = 10;
        const now = Date.now();
        let runningTime = 0;
        
        if (task.status === 'PENDING') {
          progress = Math.min(20 + (stuckInPendingCount * 1.5), 35);
        } else if (task.status === 'RUNNING') {
          runningTime = processingStartTime ? Math.floor((now - processingStartTime) / 1000) : 0;
          const expectedDuration = duration * 8;
          const runningProgress = Math.min((runningTime / expectedDuration) * 60, 60);
          progress = Math.min(35 + runningProgress, 95);
        } else if (task.status === 'SUCCEEDED') {
          progress = 100;
        }
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { 
            status: task.status.toLowerCase(), 
            progress: Math.round(progress),
            message: task.status === 'RUNNING' ? 
              `Processing... (${Math.floor(runningTime / 60)}m ${runningTime % 60}s)` : 
              task.status === 'PENDING' && stuckInPendingCount > 8 ? 
                'Processing (high load)...' :
              task.status.toLowerCase()
          }
        }));

        if (task.status === 'SUCCEEDED') {
          const totalTime = processingStartTime ? Math.floor((now - processingStartTime) / 1000) : 0;
          addLog('✓ Job ' + (jobIndex + 1) + ' completed successfully in ' + Math.floor(totalTime / 60) + 'm ' + (totalTime % 60) + 's', 'success');
          
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
            jobId: jobId,
            processingTime: totalTime
          };

          setResults(prev => [...prev, completedVideo]);
          return completedVideo;
        }

        if (task.status === 'FAILED') {
          const failureReason = task.failure_reason || task.failureCode || task.error || 'Generation failed - no specific reason provided';
          
          let enhancedFailureReason = failureReason;
          if (failureReason.includes('SAFETY')) {
            enhancedFailureReason = 'Content safety violation: ' + failureReason;
          } else if (failureReason.includes('INTERNAL.BAD_OUTPUT')) {
            enhancedFailureReason = 'Output quality issue: ' + failureReason + ' (Try different prompt/image)';
          } else if (failureReason.includes('INTERNAL')) {
            enhancedFailureReason = 'Internal processing error: ' + failureReason + ' (Retryable)';
          }
          
          addLog('✗ Job ' + (jobIndex + 1) + ' failed on RunwayML: ' + enhancedFailureReason, 'error');
          
          setGenerationProgress(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });
          
          throw new Error(enhancedFailureReason);
        }

        const pollInterval = 
          task.status === 'PENDING' && stuckInPendingCount > 8 ? 12000 :
          task.status === 'RUNNING' ? 4000 :
          task.status === 'THROTTLED' ? 10000 :
          isThrottled ? 12000 :
          5000;
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollCount++;
        
      } catch (error) {
        consecutiveErrors++;
        
        if (error.message.includes('Content safety violation') || 
            error.message.includes('Insufficient credits') ||
            (error.message.includes('Generation failed') && 
             !error.message.includes('timeout') && 
             !error.message.includes('network') && 
             !error.message.includes('rate limit') &&
             !error.message.includes('server error'))) {
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
          await new Promise(resolve => setTimeout(resolve, 90000));
        } else {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' error: ' + error.message + ' (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        }
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          const finalError = 'Failed after ' + maxConsecutiveErrors + ' consecutive errors. Last error: ' + error.message;
          addLog('✗ Job ' + (jobIndex + 1) + ' ' + finalError, 'error');
          throw new Error(finalError);
        }
        
        const baseDelay = 20000;
        const maxDelay = 180000;
        const exponentialDelay = baseDelay * Math.pow(1.8, consecutiveErrors);
        const jitter = Math.random() * (baseDelay * 0.5);
        const backoffDelay = Math.min(exponentialDelay + jitter, maxDelay);
        
        addLog(`⏳ Job ${jobIndex + 1} waiting ${Math.round(backoffDelay/1000)}s before retry...`, 'info');
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        pollCount++;
      }
    }

    const totalTime = Math.floor((pollCount * 15) / 60);
    throw new Error('Generation timeout after ' + totalTime + ' minutes');
  };

  const generateVideos = async () => {
    const requestedJobs = parseInt(concurrency) || 1;
    const MAX_CONCURRENT_JOBS = 20;
    const totalJobs = Math.min(Math.max(requestedJobs, 1), MAX_CONCURRENT_JOBS);
    
    if (!prompt.trim()) {
      addLog('❌ No prompt provided!', 'error');
      return;
    }

    if (!imageUrl.trim()) {
      addLog('❌ Image URL is required! The current RunwayML API only supports image-to-video generation. Please add an image URL.', 'error');
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('❌ RunwayML API key is required!', 'error');
      return;
    }

    if (requestedJobs > MAX_CONCURRENT_JOBS) {
      addLog(`❌ SAFETY BLOCK: Cannot generate more than ${MAX_CONCURRENT_JOBS} videos at once to prevent excessive costs!`, 'error');
      return;
    }
    
    if (isNaN(totalJobs) || totalJobs < 1) {
      addLog('❌ SAFETY: Invalid number of videos specified. Using 1 video.', 'error');
      return;
    }
    
    const estimatedCostMin = totalJobs * 0.25;
    const estimatedCostMax = totalJobs * 0.75;
    
    if (!hasShownCostWarning) {
      showModalDialog({
        title: estimatedCostMax > 20 ? "High Cost Warning" : "Cost Warning",
        type: "warning",
        confirmText: "Proceed with Generation",
        cancelText: "Cancel",
        onConfirm: () => {
          setHasShownCostWarning(true);
          localStorage.setItem('runway-automation-cost-warning-shown', 'true');
          startGeneration(totalJobs, estimatedCostMin, estimatedCostMax);
        },
        content: (
          <div>
            <div className="alert alert-warning border-0 mb-3" style={{ borderRadius: '8px' }}>
              <div className="d-flex align-items-center mb-2">
                <AlertCircle size={20} className="text-warning me-2" />
                <strong>{estimatedCostMax > 20 ? "High Cost Warning" : "Cost Confirmation"}</strong>
              </div>
              <p className="mb-0">You are about to generate <strong>{totalJobs} video{totalJobs !== 1 ? 's' : ''}</strong>.</p>
            </div>
            
            <div className="row g-3 mb-3">
              <div className="col-6">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1">${estimatedCostMin.toFixed(2)} - ${estimatedCostMax.toFixed(2)}</div>
                  <small className="text-muted">Estimated Cost</small>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1">{totalJobs * 25} - {totalJobs * 50}</div>
                  <small className="text-muted">Credits Required</small>
                </div>
              </div>
            </div>
            
            <p className="mb-0 text-muted">
              This will use credits from your RunwayML account. Are you sure you want to proceed?
            </p>
          </div>
        )
      });
      return;
    }

    startGeneration(totalJobs, estimatedCostMin, estimatedCostMax);
  };

  const startGeneration = async (totalJobs, estimatedCostMin, estimatedCostMax) => {
    setIsRunning(true);
    setLogs([]);
    
    const currentGeneration = generationCounter + 1;
    setGenerationCounter(currentGeneration);
    
    addLog('🚀 Starting Runway video generation...', 'info');
    addLog('Configuration: ' + model + ', ' + aspectRatio + ', ' + duration + 's', 'info');
    addLog(`💰 Estimated cost: ${estimatedCostMin.toFixed(2)} - ${estimatedCostMax.toFixed(2)} (${totalJobs} videos)`, 'info');
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
    addLog('🎬 Generation completed! ✅ ' + successCount + (successCount === 1 ? ' video' : ' videos') + ' generated, ❌ ' + errors.length + (errors.length === 1 ? ' failed' : ' failed'), 
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

    setCompletedGeneration(currentGeneration);
    setIsRunning(false);
    
    // Auto-advance to Results tab when generation completes successfully
    if (successCount > 0) {
      setActiveTab('results');
    }
  };

  const stopGeneration = () => {
    setIsRunning(false);
    addLog('🛑 Generation stopped by user', 'warning');
  };

  const downloadVideoWithRetry = async (videoUrl, filename, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        addLog(`📥 Downloading ${filename}... (attempt ${attempt}/${maxRetries})`, 'info');
        
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Empty file received');
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
        addLog(`✅ Downloaded ${filename} (${sizeMB}MB)`, 'success');
        return true;
        
      } catch (error) {
        addLog(`⚠️ Download attempt ${attempt} failed: ${error.message}`, 'warning');
        
        if (attempt === maxRetries) {
          addLog(`❌ Failed to download ${filename} after ${maxRetries} attempts`, 'error');
          return false;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  };

  const downloadVideo = async (videoUrl, filename) => {
    return await downloadVideoWithRetry(videoUrl, filename);
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
    const videosWithUrls = results.filter(result => result.video_url && result.status === 'completed');
    
    if (videosWithUrls.length === 0) {
      addLog('❌ No completed videos available for download', 'error');
      return;
    }

    setIsDownloadingAll(true);
    addLog(`📦 Creating zip archive with ${videosWithUrls.length} videos...`, 'info');

    try {
      // Dynamic import of JSZip to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Create timestamp for unique folder naming
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }).replace(/[/:]/g, '-').replace(', ', '_');

      const folderName = `Runway Videos (${timestamp})`;
      const folder = zip.folder(folderName);
      const videosFolder = folder.folder('Videos');
      const jsonFolder = folder.folder('JSON');

      // Sort videos by generation and video number for organized download
      const sortedVideos = videosWithUrls
        .map(result => ({
          ...result,
          filename: generateFilename(result.jobId, result.id)
        }))
        .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

      // Add each video to the zip with progress tracking
      for (let i = 0; i < sortedVideos.length; i++) {
        const result = sortedVideos[i];
        try {
          addLog(`📥 Adding ${result.filename} to archive... (${i + 1}/${sortedVideos.length})`, 'info');
          
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch video`);
          }
          
          const blob = await response.blob();
          
          // Verify blob size before adding to zip
          if (blob.size === 0) {
            throw new Error('Empty video file received');
          }
          
          // Add video to Videos folder
          videosFolder.file(result.filename, blob);
          
          // Add metadata file to JSON folder
          const metadata = {
            id: result.id,
            prompt: result.prompt,
            jobId: result.jobId,
            created_at: result.created_at,
            image_url: result.image_url,
            processingTime: result.processingTime || 'unknown'
          };
          
          jsonFolder.file(result.filename.replace('.mp4', '_metadata.json'), JSON.stringify(metadata, null, 2));
          
        } catch (error) {
          addLog(`⚠️ Failed to add ${result.filename}: ${error.message}`, 'warning');
        }
      }

      addLog('🔄 Generating zip file...', 'info');
      
      // Generate zip with no compression for faster processing
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
        compressionOptions: { level: 0 }
      });

      // Calculate final zip size
      const zipSizeMB = (zipBlob.size / 1024 / 1024).toFixed(1);
      addLog(`📦 Zip file created: ${zipSizeMB}MB`, 'info');

      // Create download link and trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded zip archive: ${folderName}.zip (${zipSizeMB}MB)`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to create zip archive: ' + error.message, 'error');
      console.error('Zip creation error:', error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const downloadFavoritedVideos = async () => {
    const favoritedVideos = results.filter(result => 
      result.video_url && 
      result.status === 'completed' && 
      favoriteVideos.has(result.id)
    );
    
    if (favoritedVideos.length === 0) {
      addLog('❌ No favorited videos available for download', 'error');
      return;
    }

    setIsDownloadingAll(true);
    addLog(`📦 Creating zip archive with ${favoritedVideos.length} favorited videos...`, 'info');

    try {
      // Dynamic import of JSZip to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Create timestamp for unique folder naming
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }).replace(/[/:]/g, '-').replace(', ', '_');

      const folderName = `Favorited Videos (${timestamp})`;
      const folder = zip.folder(folderName);
      const videosFolder = folder.folder('Videos');
      const jsonFolder = folder.folder('JSON');

      // Sort videos by generation and video number for organized download
      const sortedVideos = favoritedVideos
        .map(result => ({
          ...result,
          filename: generateFilename(result.jobId, result.id)
        }))
        .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

      // Add each video to the zip with progress tracking
      for (let i = 0; i < sortedVideos.length; i++) {
        const result = sortedVideos[i];
        try {
          addLog(`📥 Adding ${result.filename} to archive... (${i + 1}/${sortedVideos.length})`, 'info');
          
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch video`);
          }
          
          const blob = await response.blob();
          
          // Verify blob size before adding to zip
          if (blob.size === 0) {
            throw new Error('Empty video file received');
          }
          
          // Add video to Videos folder
          videosFolder.file(result.filename, blob);
          
          // Add metadata file to JSON folder
          const metadata = {
            id: result.id,
            prompt: result.prompt,
            jobId: result.jobId,
            created_at: result.created_at,
            image_url: result.image_url,
            processingTime: result.processingTime || 'unknown',
            favorited: true
          };
          
          jsonFolder.file(result.filename.replace('.mp4', '_metadata.json'), JSON.stringify(metadata, null, 2));
          
        } catch (error) {
          addLog(`⚠️ Failed to add ${result.filename}: ${error.message}`, 'warning');
        }
      }

      addLog('🔄 Generating zip file...', 'info');
      
      // Generate zip with no compression for faster processing
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
        compressionOptions: { level: 0 }
      });

      // Calculate final zip size
      const zipSizeMB = (zipBlob.size / 1024 / 1024).toFixed(1);
      addLog(`📦 Zip file created: ${zipSizeMB}MB`, 'info');

      // Create download link and trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded zip archive: ${folderName}.zip (${zipSizeMB}MB)`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to create zip archive: ' + error.message, 'error');
      console.error('Zip creation error:', error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const exportResults = () => {
    const exportData = {
      generated_at: new Date().toISOString(),
      total_videos: results.length,
      completed_videos: results.filter(r => r.status === 'completed').length,
      favorited_videos: results.filter(r => favoriteVideos.has(r.id)).length,
      configuration: {
        model,
        aspect_ratio: aspectRatio,
        duration,
        concurrency
      },
      statistics: {
        generation_counter: generationCounter,
        video_counter: videoCounter,
        average_processing_time: results.length > 0 ? 
          Math.round(results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length) + 's' : 
          'N/A'
      },
      videos: results.map(result => ({
        id: result.id,
        prompt: result.prompt,
        video_url: result.video_url,
        thumbnail_url: result.thumbnail_url,
        image_url: result.image_url,
        status: result.status,
        created_at: result.created_at,
        jobId: result.jobId,
        processingTime: result.processingTime,
        favorited: favoriteVideos.has(result.id),
        filename: generateFilename(result.jobId, result.id)
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runway_generation_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    addLog('📊 Results exported to JSON with enhanced metadata', 'success');
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Runway Automation Pro - AI Video Generation</title>
        <meta name="description" content="Batch generate up to 20 videos from a single prompt. Download all videos as MP4 and JSON in a ZIP file." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A90E2'><path d='M21 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18zM20 5H4v14h16V5zm-8 2v2h2V7h-2zm-4 0v2h2V7H8zm8 0v2h2V7h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z'/></svg>" />
        
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
        <style>{`
          .tooltip .tooltip-inner {
            background-color: rgba(0, 0, 0, 1) !important;
            color: white !important;
          }
          .tooltip.bs-tooltip-top .tooltip-arrow::before,
          .tooltip.bs-tooltip-bottom .tooltip-arrow::before,
          .tooltip.bs-tooltip-start .tooltip-arrow::before,
          .tooltip.bs-tooltip-end .tooltip-arrow::before {
            border-color: rgba(0, 0, 0, 1) transparent !important;
          }
        `}</style>
      </Head>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
      >
        {modalConfig.content}
      </Modal>

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
                Batch generate up to 20 videos from a single prompt. Download all videos as MP4 and JSON in a ZIP file.
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
                        className="position-relative d-flex align-items-center justify-content-center" 
                        style={{ 
                          height: '60px',
                          borderRadius: '8px 8px 0 0',
                          backgroundColor: HEADER_BLUE
                        }}
                      >
                        <div 
                          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            left: '20px',
                            top: '20px',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: '#4dd0ff'
                          }}
                        >
                          <Key className="text-white" size={32} />
                        </div>
                        
                        <div className="text-white text-center">
                          <h4 className="mb-0 fw-bold">API Setup</h4>
                        </div>
                      </div>
                      
                      <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4"></div>
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">Runway API Key</label>
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
                              Get your API key from Runway Developer Portal
                            </a>
                          </div>
                          
                          {runwayApiKey && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info"
                                onClick={async () => {
                                  addLog('🔍 Testing API connectivity...', 'info');
                                  try {
                                    const response = await fetch('/api/runway-debug', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ apiKey: runwayApiKey })
                                    });
                                    const data = await response.json();
                                    addLog('✅ Debug test completed - check browser console for details', 'success');
                                    console.log('=== RUNWAY API DEBUG RESULTS ===');
                                    console.log(JSON.stringify(data, null, 2));
                                  } catch (error) {
                                    addLog('❌ Debug test failed: ' + error.message, 'error');
                                    console.error('Debug test error:', error);
                                  }
                                }}
                                style={{ fontSize: '12px' }}
                              >
                                🔍 Test API
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <CreditCard size={20} className="text-warning me-2" />
                            <strong>Credits Required</strong>
                          </div>
                          <p className="mb-2 small">The Runway API requires credits for all video generations.</p>
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
                                title="16:9 for YouTube, TV, and desktop. 9:16 for TikTok, FB Reels, and IG Stories. 1:1 for IG posts and profile pics. 4:3 for classic TV and monitors. 3:4 for print and documents. 21:9 for ultrawide movies."
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
                          <label className="form-label fw-bold mb-2">
                            Video Generation Limits by Tier
                            <i 
                              className="bi bi-info-circle ms-1 text-primary" 
                              style={{ cursor: 'help' }}
                              data-bs-toggle="tooltip" 
                              data-bs-placement="top" 
                              title="All tiers can generate up to 20 videos at once, but you will be throttled past your tier's limits."
                            ></i>
                          </label>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered border-dark mb-0">
                              <thead>
                                <tr style={{ backgroundColor: HEADER_BLUE }}>
                                  <th className="fw-bold border-dark text-white" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid', backgroundColor: HEADER_BLUE }}>Tier</th>
                                  <th className="fw-bold border-dark text-white" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid', backgroundColor: HEADER_BLUE }}>Videos Generated</th>
                                  <th className="fw-bold border-dark text-white" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid', backgroundColor: HEADER_BLUE }}>Criteria</th>
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
                        className="position-relative d-flex align-items-center justify-content-center" 
                        style={{ 
                          height: '60px',
                          borderRadius: '8px 8px 0 0',
                          backgroundColor: HEADER_BLUE
                        }}
                      >
                        <div 
                          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            left: '20px',
                            top: '20px',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: '#4dd0ff'
                          }}
                        >
                          <Film className="text-white" size={32} />
                        </div>
                        
                        <div className="text-white text-center">
                          <h4 className="mb-0 fw-bold">Video Setup</h4>
                        </div>
                      </div>
                      
                      <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4"></div>
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
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                          
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
                                style={{ 
                                  borderRadius: '50%', 
                                  width: '32px', 
                                  height: '32px',
                                  fontSize: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1',
                                  padding: '0'
                                }}
                              >
                                <span style={{ transform: 'translateY(-1px)' }}>×</span>
                              </button>
                            </div>
                          )}
                          
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
                          
                          <div className="mt-4">
                            <button
                              className="btn btn-success w-100 shadow"
                              onClick={() => {
                                setActiveTab('generation');
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
                                borderColor: '#28a745',
                                opacity: '1',
                                transition: 'opacity 0.1s ease-in-out',
                                padding: '8px 16px'
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
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
                    className="position-relative d-flex align-items-center justify-content-between" 
                    style={{ 
                      height: '60px',
                      borderRadius: '8px 8px 0 0',
                      backgroundColor: HEADER_BLUE,
                      paddingLeft: '105px',
                      paddingRight: '30px'
                    }}
                  >
                    <div 
                      className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '80px', 
                        height: '80px',
                        left: '20px',
                        top: '20px',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        backgroundColor: '#4dd0ff'
                      }}
                    >
                      <Video className="text-white" size={32} />
                    </div>
                    
                    <div className="text-white flex-grow-1">
                      <h4 className="mb-0 fw-bold">Video Generation</h4>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {!isRunning ? (
                        <button
                          className="btn btn-success shadow"
                          onClick={generateVideos}
                          disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || concurrency < 1 || concurrency > 20}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600', 
                            opacity: '1',
                            transition: 'opacity 0.1s ease-in-out',
                            backgroundColor: '#28a745',
                            borderColor: '#28a745',
                            padding: '8px 16px'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
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
                          className="btn btn-danger shadow"
                          onClick={stopGeneration}
                          style={{ borderRadius: '8px', fontWeight: '600', padding: '8px 16px' }}
                        >
                          <AlertCircle size={24} className="me-2" />
                          Stop Generation
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4"></div>
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

                    <div className="mb-3" style={{ minHeight: '100px' }}>
                      <div className="text-center py-3">
                        <h4 className="fw-bold text-dark mb-2">
                          {(() => {
                            if (Object.keys(generationProgress).length > 0) {
                              return `Generation ${generationCounter || 1} in progress`;
                            } else if (completedGeneration) {
                              return `Generation ${completedGeneration} completed`;
                            } else {
                              return `Generation ${generationCounter || 1}`;
                            }
                          })()}
                        </h4>
                          <p className="text-muted mb-0">
                            {(() => {
                              if (Object.keys(generationProgress).length > 0) {
                                const count = Object.keys(generationProgress).length;
                                return `${count} video${count !== 1 ? 's' : ''} generating`;
                              } else if (completedGeneration) {
                                const count = results.filter(r => r.jobId && r.jobId.includes(`Generation ${completedGeneration}`)).length;
                                return `${count} video${count !== 1 ? 's' : ''} generated successfully`;
                              } else {
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
                      <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', lineHeight: '1.4' }}>
                        {logs.map((log, index) => {
                          // Check if message contains actual line breaks
                          const hasLineBreaks = log.message.includes('\n');
                          
                          if (hasLineBreaks) {
                            const lines = log.message.split('\n');
                            const timestampText = `[${log.timestamp}] `;
                            
                            return (
                              <div key={index} className="small mb-1">
                                <div className={`${
                                  log.type === 'error' ? 'text-danger' :
                                  log.type === 'success' ? 'text-light' :
                                  log.type === 'warning' ? 'text-warning' :
                                  'text-light'
                                }`}>
                                  <span className="text-primary">{timestampText}</span>{lines[0]}
                                </div>
                                {lines.slice(1).map((line, lineIndex) => (
                                  <div 
                                    key={lineIndex} 
                                    className={`${
                                      log.type === 'error' ? 'text-danger' :
                                      log.type === 'success' ? 'text-light' :
                                      log.type === 'warning' ? 'text-warning' :
                                      'text-light'
                                    }`}
                                    style={{ 
                                      paddingLeft: '12.5ch' // Width of timestamp in monospace
                                    }}
                                  >
                                    {line}
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            // Single line message
                            return (
                              <div key={index} className={`small mb-1 ${
                                log.type === 'error' ? 'text-danger' :
                                log.type === 'success' ? 'text-light' :
                                log.type === 'warning' ? 'text-warning' :
                                'text-light'
                              }`}>
                                <span className="text-primary">[{log.timestamp}]</span> {log.message}
                              </div>
                            );
                          }
                        })}
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
                    className="position-relative d-flex align-items-center justify-content-between" 
                    style={{ 
                      height: '60px',
                      borderRadius: '8px 8px 0 0',
                      backgroundColor: HEADER_BLUE,
                      paddingLeft: '105px',
                      paddingRight: '30px'
                    }}
                  >
                    <div 
                      className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '80px', 
                        height: '80px',
                        left: '20px',
                        top: '20px',
                        zIndex: 10,
                        backgroundColor: '#4dd0ff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Download className="text-white" size={32} />
                    </div>
                    
                    <div className="text-white flex-grow-1">
                      <h4 className="mb-0 fw-bold">Generated Videos</h4>
                    </div>
                    
                    {results.filter(result => result.video_url && result.status === 'completed').length > 0 && (
                      <div className="d-flex gap-2 flex-wrap flex-shrink-0">
                        <button
                          className="btn btn-light shadow"
                          onClick={downloadAllVideos}
                          disabled={isDownloadingAll}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600',
                            opacity: '1',
                            transition: 'opacity 0.1s ease-in-out'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
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
                              <Download size={16} className="me-2" />
                              All Videos
                              <span className="ms-2 badge bg-primary">
                                {results.filter(result => result.video_url && result.status === 'completed').length}
                              </span>
                            </>
                          )}
                        </button>
                        
                        {favoriteVideos.size > 0 && (
                          <button
                            className="btn btn-light shadow"
                            onClick={downloadFavoritedVideos}
                            disabled={isDownloadingAll}
                            style={{ 
                              borderRadius: '8px', 
                              fontWeight: '600',
                              opacity: '1',
                              transition: 'opacity 0.1s ease-in-out'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Download size={16} className="me-2" />
                            Favorited Videos
                            <span className="ms-2 badge bg-danger">
                              {results.filter(result => result.video_url && result.status === 'completed' && favoriteVideos.has(result.id)).length}
                            </span>
                          </button>
                        )}
                        
                        <button
                          className="btn btn-danger shadow"
                          onClick={clearGeneratedVideos}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600',
                            opacity: '1',
                            transition: 'opacity 0.1s ease-in-out'
                          }}
                          title="Clear all generated videos from browser storage"
                          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          <Trash2 size={16} className="me-2" />
                          Clear Videos
                          <span className="ms-2 badge bg-light text-dark">
                            {results.length}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4"></div>
                    {results.length === 0 ? (
                      <div className="text-center py-5" style={{ minHeight: '400px' }}>
                        <div className="mb-3">
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
                            <div className="card border-0 shadow h-100 d-flex flex-column" style={{ borderRadius: '8px' }}>
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
                              
                              <div className="card-body p-3 d-flex flex-column flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div className="fw-bold text-primary flex-grow-1">{result.jobId}</div>
                                  <button
                                    className="btn btn-sm p-1 ms-2"
                                    onClick={() => toggleFavorite(result.id)}
                                    style={{
                                      border: 'none',
                                      background: 'none',
                                      color: favoriteVideos.has(result.id) ? '#e74c3c' : '#dee2e6',
                                      transition: 'color 0.2s ease',
                                      flexShrink: 0,
                                      marginTop: '-5px'
                                    }}
                                    title={favoriteVideos.has(result.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Heart 
                                      size={18} 
                                      fill={favoriteVideos.has(result.id) ? 'currentColor' : 'none'}
                                    />
                                  </button>
                                </div>
                                <h6 className="card-title mb-3 flex-grow-1" style={{ fontWeight: '400' }} title={result.prompt}>
                                  {result.prompt}
                                </h6>
                                
                                <div className="mt-auto">
                                  {result.video_url && (
                                    <div className="btn-group w-100" role="group">
                                      <button
                                        className="btn btn-primary btn-sm"
                                        style={{ width: '50%' }}
                                        onClick={() => downloadVideo(result.video_url, generateFilename(result.jobId, result.id))}
                                      >
                                        <Download size={16} className="me-1" />
                                        Download
                                      </button>
                                      <button
                                        className="btn btn-outline-primary btn-sm"
                                        style={{ width: '50%' }}
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

          <div className="text-center mt-4">
            <div className="d-flex align-items-center justify-content-center text-white-50">
              <small>Based on <a href="https://apify.com/igolaizola/runway-automation" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Runway Automation for Apify</a> by <a href="https://igolaizola.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Iñigo Garcia Olaizola</a>.<br />Vibe coded by <a href="https://petebunke.com" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Pete Bunke</a>. All rights reserved.<br /><a href="mailto:petebunke@gmail.com?subject=Runway%20Automation%20User%20Feedback" className="text-white-50 text-decoration-none"><strong>Got user feedback?</strong> Hit me up!</a></small>
            </div>
            <div className="d-flex align-items-center justify-content-center text-white-50 mt-1" style={{ marginLeft: '12px' }}>
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://runway-static-assets.s3.amazonaws.com/site/images/api-page/powered-by-runway-white.png" 
                  alt="Powered by Runway" 
                  style={{ height: '20px', width: 'auto' }}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}