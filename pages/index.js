import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const [favoriteVideos, setFavoriteVideos] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [hasShownCostWarning, setHasShownCostWarning] = useState(false);
  const fileInputRef = useRef(null);

  // Blue color to match tab buttons
  const HEADER_BLUE = '#0d6efd'; // Match Bootstrap primary blue

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal component
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
            <div className="mb-4">
            </div>
            {children}
            
            <div className="d-flex gap-3 justify-content-end mt-4">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                style={{ borderRadius: '8px', fontWeight: '600' }}
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
                  style={{ borderRadius: '8px', fontWeight: '600' }}
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

  // Show modal helper function
  const showModalDialog = (config) => {
    setModalConfig(config);
    setShowModal(true);
  };

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (!mounted) return;
    
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

      // Load model
      const savedModel = localStorage.getItem('runway-automation-model');
      if (savedModel && savedModel.trim()) {
        console.log('Loading saved model from localStorage');
        setModel(savedModel);
      }

      // Load aspect ratio
      const savedAspectRatio = localStorage.getItem('runway-automation-aspect-ratio');
      if (savedAspectRatio && savedAspectRatio.trim()) {
        console.log('Loading saved aspect ratio from localStorage');
        setAspectRatio(savedAspectRatio);
      }

      // Load duration
      const savedDuration = localStorage.getItem('runway-automation-duration');
      if (savedDuration && savedDuration.trim()) {
        console.log('Loading saved duration from localStorage');
        setDuration(parseInt(savedDuration));
      }

      // Load concurrency
      const savedConcurrency = localStorage.getItem('runway-automation-concurrency');
      if (savedConcurrency && savedConcurrency.trim()) {
        console.log('Loading saved concurrency from localStorage');
        setConcurrency(parseInt(savedConcurrency));
      }

      // Load generated videos
      const savedResults = localStorage.getItem('runway-automation-results');
      if (savedResults && savedResults.trim()) {
        try {
          const parsedResults = JSON.parse(savedResults);
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            console.log('Loading saved results from localStorage:', parsedResults.length, 'videos');
            setResults(parsedResults);
          }
        } catch (parseError) {
          console.warn('Failed to parse saved results:', parseError);
          localStorage.removeItem('runway-automation-results');
        }
      }

      // Load generation counter
      const savedGenerationCounter = localStorage.getItem('runway-automation-generation-counter');
      if (savedGenerationCounter && savedGenerationCounter.trim()) {
        setGenerationCounter(parseInt(savedGenerationCounter));
      }

      // Load favorite videos
      const savedFavorites = localStorage.getItem('runway-automation-favorites');
      if (savedFavorites && savedFavorites.trim()) {
        try {
          const parsedFavorites = JSON.parse(savedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setFavoriteVideos(new Set(parsedFavorites));
          }
        } catch (parseError) {
          console.warn('Failed to parse saved favorites:', parseError);
          localStorage.removeItem('runway-automation-favorites');
        }
      }

      // Load cost warning status - if user has ever generated videos, don't show modal again
      const savedHasShownCostWarning = localStorage.getItem('runway-automation-cost-warning-shown');
      if (savedHasShownCostWarning === 'true') {
        console.log('Loading cost warning status from localStorage');
        setHasShownCostWarning(true);
      }
    } catch (error) {
      console.warn('Failed to load saved data from localStorage:', error);
    }
  }, [mounted]);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (!mounted) return;
    
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
  }, [runwayApiKey, mounted]);

  // Save prompt to localStorage when it changes
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

  // Save image URL to localStorage when it changes
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

  // Save model to localStorage when it changes
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

  // Save aspect ratio to localStorage when it changes
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

  // Save duration to localStorage when it changes
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

  // Save concurrency to localStorage when it changes
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

  // Save results to localStorage when they change
  useEffect(() => {
    if (!mounted) return;
    
    try {
      if (results && results.length > 0) {
        localStorage.setItem('runway-automation-results', JSON.stringify(results));
      } else if (results.length === 0) {
        localStorage.removeItem('runway-automation-results');
      }
    } catch (error) {
      console.warn('Failed to save results to localStorage:', error);
    }
  }, [results, mounted]);

  // Save generation counter to localStorage when it changes
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

  // Save favorites to localStorage when they change
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
      localStorage.removeItem('runway-automation-model');
      localStorage.removeItem('runway-automation-aspect-ratio');
      localStorage.removeItem('runway-automation-duration');
      localStorage.removeItem('runway-automation-concurrency');
      localStorage.removeItem('runway-automation-results');
      localStorage.removeItem('runway-automation-generation-counter');
      localStorage.removeItem('runway-automation-favorites');
      setRunwayApiKey('');
      setPrompt('');
      setImageUrl('');
      setModel('gen3a_turbo');
      setAspectRatio('16:9');
      setDuration(5);
      setConcurrency(1);
      setResults([]);
      setGenerationCounter(0);
      setFavoriteVideos(new Set());
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      addLog('🔒 All stored data cleared', 'info');
    } catch (error) {
      console.warn('Failed to clear stored data:', error);
    }
  };

  // Clear generated videos function with modal
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
          // Do NOT remove the cost warning flag when clearing videos
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

  // Toggle favorite status for a video
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

  // Initialize Bootstrap tooltips - optimized for performance
  useEffect(() => {
    if (!mounted) return;
    
    // Only reinitialize tooltips when switching to setup tab or when results change
    if (typeof window !== 'undefined' && window.bootstrap && (activeTab === 'setup' || activeTab === 'results')) {
      // Use requestAnimationFrame to avoid blocking the UI
      requestAnimationFrame(() => {
        // Dispose existing tooltips first to prevent duplicates
        const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        existingTooltips.forEach(function (tooltipEl) {
          const existingTooltip = window.bootstrap.Tooltip.getInstance(tooltipEl);
          if (existingTooltip) {
            existingTooltip.dispose();
          }
        });

        // Initialize new tooltips only for the current tab
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

  // Improved generateVideo function with better error handling and reliability
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

      // Enhanced retry logic with exponential backoff and jitter
      let retryCount = 0;
      const maxRetries = 5; // Increased from 3
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60s

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

          // Enhanced response handling
          const responseText = await response.text();
          console.log('Generate API response status:', response.status);
          console.log('Generate API response text (first 500 chars):', responseText.substring(0, 500));

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse generate response as JSON:', parseError);
            console.log('Raw response:', responseText);
            
            // Better error message for JSON parse errors
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
              throw new Error('API returned HTML instead of JSON - likely a server error or maintenance');
            } else if (responseText.includes('502 Bad Gateway') || responseText.includes('503 Service Unavailable')) {
              throw new Error('RunwayML API is temporarily unavailable');
            } else if (responseText.startsWith('B') || responseText.charCodeAt(0) === 0) {
              throw new Error('API returned binary data instead of JSON');
            } else {
              throw new Error('Invalid JSON response from API: ' + responseText.substring(0, 100));
            }
          }

          if (!response.ok) {
            let errorMessage = data.error || 'API Error: ' + response.status;
            
            // Handle retryable errors with exponential backoff
            if (response.status === 429 || response.status >= 500) {
              if (retryCount < maxRetries) {
                // Exponential backoff with jitter: base * 2^retry + random(0-50% of base)
                const baseDelay = 15000;
                const exponentialDelay = baseDelay * Math.pow(2, retryCount);
                const jitter = Math.random() * (baseDelay * 0.5);
                const totalDelay = Math.min(exponentialDelay + jitter, 120000); // Cap at 2 minutes
                
                addLog(`⚠️ Job ${jobIndex + 1} API error (${response.status}), retrying in ${Math.round(totalDelay/1000)}s... (${retryCount + 1}/${maxRetries})`, 'warning');
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                retryCount++;
                continue;
              }
            }

            // Handle insufficient credits - don't retry, fail immediately
            if (response.status === 400 && errorMessage.includes('not have enough credits')) {
              throw new Error('Insufficient credits: ' + errorMessage);
            }
            
            // Handle content safety failures - don't retry
            if (response.status === 400 && errorMessage.toLowerCase().includes('safety')) {
              throw new Error('Content safety violation: ' + errorMessage);
            }
            
            if (errorMessage.includes('Invalid asset aspect ratio')) {
              errorMessage = 'Image aspect ratio issue: ' + errorMessage + ' Try using an image that is closer to square, landscape, or portrait format (not ultra-wide or ultra-tall).';
            }
            
            throw new Error(errorMessage);
          }

          const task = data;
          
          addLog('✓ Generation started for job ' + (jobIndex + 1) + ' (Task ID: ' + task.id + ') - Initial Status: ' + (task.status || 'unknown'), 'success');
          
          return await pollTaskCompletion(task.id, jobId, promptText, imageUrlText, jobIndex);
          
        } catch (fetchError) {
          if (retryCount < maxRetries && (
            fetchError.name === 'AbortError' || 
            fetchError.message.includes('fetch') ||
            fetchError.message.includes('network') ||
            fetchError.message.includes('Failed to fetch') ||
            fetchError.message.includes('temporarily unavailable') ||
            fetchError.message.includes('HTML instead of JSON') ||
            fetchError.message.includes('binary data instead of JSON')
          )) {
            const baseDelay = 10000;
            const exponentialDelay = baseDelay * Math.pow(1.5, retryCount);
            const jitter = Math.random() * (baseDelay * 0.3);
            const totalDelay = Math.min(exponentialDelay + jitter, 60000);
            
            addLog(`⚠️ Job ${jobIndex + 1} network/parse error, retrying in ${Math.round(totalDelay/1000)}s... (${retryCount + 1}/${maxRetries})`, 'warning');
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

  // Enhanced polling logic with better error handling and timeout management
  const pollTaskCompletion = async (taskId, jobId, promptText, imageUrlText, jobIndex) => {
    const maxPolls = Math.floor(3600 / 12); // Increased to 60 minutes total
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // Increased tolerance
    let isThrottled = false;
    let throttledStartTime = null;
    let lastKnownStatus = 'unknown';
    let stuckInPendingCount = 0;
    const maxStuckInPending = 15; // Increased tolerance
    let processingStartTime = null;

    while (pollCount < maxPolls) {
      try {
        // Adaptive timeout based on current status
        const timeoutMs = consecutiveErrors > 0 ? 60000 : 
                          isThrottled ? 90000 : 
                          lastKnownStatus === 'RUNNING' ? 45000 : 30000;
        
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
          
          // Better error handling for HTML/binary responses
          if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
            if (consecutiveErrors < maxConsecutiveErrors) {
              consecutiveErrors++;
              const backoffDelay = 30000 + (consecutiveErrors * 15000);
              addLog(`⚠️ Job ${jobIndex + 1} received HTML response, retrying in ${Math.round(backoffDelay/1000)}s... (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`, 'warning');
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              pollCount++;
              continue;
            }
            throw new Error('RunwayML API returning HTML instead of JSON - likely server maintenance');
          }
          
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
        
        // Enhanced throttling detection and handling
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
          
          // More frequent logging for throttled jobs
          if (throttledDuration > 0 && throttledDuration % 180 === 0) { // Every 3 minutes
            addLog('⏸️ Job ' + (jobIndex + 1) + ' still queued after ' + Math.floor(throttledDuration / 60) + ' minute(s)', 'info');
          }
          
          await new Promise(resolve => setTimeout(resolve, 25000)); // Slightly longer wait
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
        
        // Enhanced PENDING status handling
        if (task.status === 'PENDING') {
          if (lastKnownStatus === 'PENDING') {
            stuckInPendingCount++;
          } else {
            stuckInPendingCount = 1;
            if (!processingStartTime) processingStartTime = Date.now();
          }
          
          if (stuckInPendingCount >= maxStuckInPending) {
            addLog(`⚠️ Job ${jobIndex + 1} stuck in PENDING for ${stuckInPendingCount} cycles, using longer polling interval...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 40000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 18000));
          }
        } else if (task.status === 'RUNNING') {
          if (!processingStartTime) processingStartTime = Date.now();
          stuckInPendingCount = 0;
          await new Promise(resolve => setTimeout(resolve, 12000));
        } else {
          stuckInPen