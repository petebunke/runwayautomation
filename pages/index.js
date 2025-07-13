import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart, ArrowUp, Edit3 } from 'lucide-react';
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
  const [upscalingProgress, setUpscalingProgress] = useState({});
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [lastCreditCheck, setLastCreditCheck] = useState(null);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const [editingVideoTitle, setEditingVideoTitle] = useState(null);
  const [customTitles, setCustomTitles] = useState({});
  const [tempEditTitle, setTempEditTitle] = useState('');
  const fileInputRef = useRef(null);

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
                style={{ borderRadius: '8px', fontWeight: '600', width: '50%' }}
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
                  style={{ borderRadius: '8px', fontWeight: '600', width: '50%' }}
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

      // Load saved logs
      const savedLogs = localStorage.getItem('runway-automation-logs');
      if (savedLogs && savedLogs.trim()) {
        try {
          const parsedLogs = JSON.parse(savedLogs);
          if (Array.isArray(parsedLogs) && parsedLogs.length > 0) {
            setLogs(parsedLogs);
          }
        } catch (parseError) {
          localStorage.removeItem('runway-automation-logs');
        }
      }

      // Load custom titles
      const savedCustomTitles = localStorage.getItem('runway-automation-custom-titles');
      if (savedCustomTitles && savedCustomTitles.trim()) {
        try {
          const parsedTitles = JSON.parse(savedCustomTitles);
          if (typeof parsedTitles === 'object' && parsedTitles !== null) {
            setCustomTitles(parsedTitles);
          }
        } catch (parseError) {
          localStorage.removeItem('runway-automation-custom-titles');
        }
      }

      // Load saved active tab
      const savedActiveTab = localStorage.getItem('runway-automation-active-tab');
      if (savedActiveTab && ['setup', 'generation', 'results'].includes(savedActiveTab)) {
        setActiveTab(savedActiveTab);
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

  // Save logs to localStorage whenever logs change
  useEffect(() => {
    if (!mounted || !Array.isArray(logs)) return;
    try {
      if (logs.length > 0) {
        localStorage.setItem('runway-automation-logs', JSON.stringify(logs));
      } else {
        localStorage.removeItem('runway-automation-logs');
      }
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }, [logs, mounted]);

  // Save custom titles to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      if (Object.keys(customTitles).length > 0) {
        localStorage.setItem('runway-automation-custom-titles', JSON.stringify(customTitles));
      } else {
        localStorage.removeItem('runway-automation-custom-titles');
      }
    } catch (error) {
      console.warn('Failed to save custom titles to localStorage:', error);
    }
  }, [customTitles, mounted]);

  // Save active tab to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('runway-automation-active-tab', activeTab);
    } catch (error) {
      console.warn('Failed to save active tab to localStorage:', error);
    }
  }, [activeTab, mounted]);

  const clearStoredApiKey = () => {
    try {
      localStorage.removeItem('runway-automation-api-key');
      setRunwayApiKey('');
      setOrganizationInfo(null);
      setLastCreditCheck(null);
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
          localStorage.removeItem('runway-automation-custom-titles');
          setResults([]);
          setGenerationCounter(0);
          setCompletedGeneration(null);
          setFavoriteVideos(new Set());
          setCustomTitles({});
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

  const handleEditTitle = (videoId, currentTitle) => {
    setEditingVideoTitle(videoId);
    setTempEditTitle(customTitles[videoId] || currentTitle);
  };

  const saveEditTitle = (videoId) => {
    if (tempEditTitle.trim()) {
      setCustomTitles(prev => ({
        ...prev,
        [videoId]: tempEditTitle.trim()
      }));
      addLog(`✏️ Video title updated to: "${tempEditTitle.trim()}"`, 'info');
    }
    setEditingVideoTitle(null);
    setTempEditTitle('');
  };

  const cancelEditTitle = () => {
    setEditingVideoTitle(null);
    setTempEditTitle('');
  };

  const handleEditKeyPress = (e, videoId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditTitle(videoId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditTitle();
    }
  };

  const getVideoDisplayTitle = (result) => {
    return customTitles[result.id] || result.jobId || `Video ${result.id}`;
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
        addLog(`⚠️ Warning: Image aspect ratio ${originalAspectRatio.toFixed(2)} is outside Runway's accepted range (0.5-2.0). This may cause API errors.`, 'warning');
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

  // Initialize Bootstrap tooltips
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
    // Sanitize log message to prevent XSS
    const sanitizedMessage = String(message).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    const timestamp = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    setLogs(prev => [...prev, { message: sanitizedMessage, type, timestamp }]);
  };

  const copyLogsToClipboard = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      addLog('📋 Logs copied to clipboard', 'info');
    }).catch(() => {
      addLog('❌ Failed to copy logs to clipboard', 'error');
    });
  };

  const clearLogs = () => {
    const logCount = logs.length;
    if (logCount === 0) {
      addLog('ℹ️ No logs to clear', 'info');
      return;
    }

    showModalDialog({
      title: "Clear Generation Log",
      type: "warning",
      confirmText: "Clear Log",
      cancelText: "Cancel",
      onConfirm: () => {
        try {
          localStorage.removeItem('runway-automation-logs');
          setLogs([]);
          console.log(`Cleared ${logCount} log entries from browser storage`);
        } catch (error) {
          console.warn('Failed to clear logs:', error);
        }
      },
      content: (
        <div>
          <p className="mb-3">
            <strong>This will permanently remove {logCount} log entr{logCount !== 1 ? 'ies' : 'y'} from your browser.</strong>
          </p>
          <p className="mb-3">
            This action cannot be undone, but new logs will continue to be generated during video creation.
          </p>
          <p className="mb-0 text-muted">
            Are you sure you want to continue?
          </p>
        </div>
      )
    });
  };

  const API_BASE = '/api';

  const convertAspectRatio = (ratio, currentModel) => {
    if (currentModel === 'gen4_turbo') {
      const gen4RatioMap = {
        '16:9': '1280:720',
        '9:16': '720:1280',
        '1:1': '960:960',
        '4:3': '1104:832',
        '3:4': '832:1104',
        '21:9': '1584:672'
      };
      return gen4RatioMap[ratio] || '1280:720';
    } else {
      // Gen-3 Alpha Turbo resolutions
      const gen3RatioMap = {
        '16:9': '1280:768',
        '9:16': '768:1280'
      };
      return gen3RatioMap[ratio] || '1280:768';
    }
  };

  // Enhanced credit estimation function
  const estimateCreditsNeeded = (totalJobs, model, duration) => {
    // Credit estimates based on model and duration
    const creditRates = {
      'gen4_turbo': {
        5: 50,  // 50 credits for 5 seconds
        10: 100 // 100 credits for 10 seconds
      },
      'gen3a_turbo': {
        5: 25,  // 25 credits for 5 seconds
        10: 50  // 50 credits for 10 seconds
      }
    };

    const creditsPerVideo = creditRates[model]?.[duration] || 50;
    return creditsPerVideo * totalJobs;
  };

  // Enhanced credit check function using the organization endpoint
  const checkOrganizationCredits = async () => {
    if (!runwayApiKey.trim()) {
      return { success: false, error: 'API key required' };
    }

    setIsCheckingCredits(true);
    addLog('🔍 Checking organization credit balance...', 'info');

    try {
      const response = await fetch(API_BASE + '/runway-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: runwayApiKey
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          return { success: false, error: `Credit check failed: Could not parse response` };
        }
        
        const errorMessage = errorData.error || errorData.message || 'Unknown error';
        
        if (response.status === 401) {
          return { success: false, error: 'Invalid API key', isAuthError: true };
        }
        
        return { success: false, error: errorMessage };
      }

      let organizationData;
      try {
        organizationData = JSON.parse(responseText);
      } catch (parseError) {
        return { success: false, error: 'Could not parse organization response' };
      }

      setOrganizationInfo(organizationData);
      setLastCreditCheck(new Date().toISOString());
      
      addLog(`✅ Credit check completed - Balance: ${organizationData.creditBalance} credits`, 'success');
      
      return { 
        success: true, 
        data: organizationData,
        creditBalance: organizationData.creditBalance,
        tierInfo: organizationData.tierInfo,
        usageInfo: organizationData.usageInfo
      };
      
    } catch (error) {
      addLog('⚠️ Credit check failed due to network error', 'warning');
      return { success: false, error: error.message };
    } finally {
      setIsCheckingCredits(false);
    }
  };

  // Auto-check credits when API key is entered and when videos are generated
  useEffect(() => {
    if (runwayApiKey && runwayApiKey.trim() && runwayApiKey.length > 10) {
      checkOrganizationCredits();
    }
  }, [runwayApiKey]);

  // Auto-update credits when generation completes
  const updateCreditsAfterGeneration = () => {
    if (runwayApiKey && runwayApiKey.trim()) {
      setTimeout(() => {
        checkOrganizationCredits();
      }, 2000); // Wait 2 seconds for credits to update on Runway's side
    }
  };

  // Check for missing inputs and show modal if needed
  const checkRequiredInputs = () => {
    const missingInputs = [];
    
    if (!runwayApiKey.trim()) {
      missingInputs.push('API Key');
    }
    if (!prompt.trim()) {
      missingInputs.push('Video Prompt');
    }
    if (!imageUrl.trim()) {
      missingInputs.push('Image');
    }
    
    if (missingInputs.length > 0) {
      showModalDialog({
        title: "Missing Required Field",
        type: "warning",
        confirmText: "Go to Setup",
        cancelText: "Cancel",
        onConfirm: () => {
          setActiveTab('setup');
        },
        content: (
          <div>
            <div className="alert alert-warning border-0 mb-3" style={{ borderRadius: '8px' }}>
            
              <p className="mb-0">Please fill in all required fields before generating videos.</p>
            </div>
            
            <div className="mb-3">
              <strong>Missing fields:</strong>
              <ul className="mt-2 mb-0">
                {missingInputs.map((input, index) => (
                  <li key={index} className="text-danger">{input}</li>
                ))}
              </ul>
            </div>
            
            <p className="mb-0 text-muted">
              Navigate to the Setup tab to complete the required fields.
            </p>
          </div>
        )
      });
      return false;
    }
    
    return true;
  };

  // Add the generateVideo function
  const generateVideo = async (promptText, imageUrlText, jobIndex = 0, generationNum, videoNum) => {
    const jobId = 'Generation ' + generationNum + ' - Video ' + videoNum;
    
    try {
      if (!imageUrlText || !imageUrlText.trim()) {
        const errorMsg = 'Image URL is required for video generation. The current Runway API only supports image-to-video generation.';
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
      
      const selectedRatio = convertAspectRatio(aspectRatio, model);
      addLog(`Using model: ${model}, aspect ratio: ${aspectRatio} → ${selectedRatio}`, 'info');
      
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'starting', progress: 0 }
      }));

      const payload = {
        promptText: promptText,
        promptImage: imageUrlText.trim(),
        model: model,
        ratio: selectedRatio,
        duration: duration,
        seed: Math.floor(Math.random() * 1000000)
      };

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

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`API Error ${response.status}: Could not parse error response`);
        }
        
        let errorMessage = errorData.error || errorData.message || 'API Error: ' + response.status;
        // Add more detailed error information
        if (errorData.details) {
          errorMessage += ' - ' + JSON.stringify(errorData.details);
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
      
    } catch (error) {
      addLog('✗ Job ' + (jobIndex + 1) + ' failed: ' + error.message, 'error');
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'failed', progress: 0, error: error.message }
      }));
      throw error;
    }
  };

  // Add the pollTaskCompletion function
  const pollTaskCompletion = async (taskId, jobId, promptText, imageUrlText, jobIndex) => {
    const maxPolls = Math.floor(3600 / 12);
    let pollCount = 0;

    while (pollCount < maxPolls) {
      try {
        const response = await fetch(API_BASE + '/runway-status?taskId=' + taskId + '&apiKey=' + encodeURIComponent(runwayApiKey), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const responseText = await response.text();
        
        let task;
        try {
          task = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error('Invalid response from Runway API: ' + responseText.substring(0, 100));
        }

        if (!response.ok) {
          throw new Error(task.error || 'Polling failed: ' + response.status);
        }
        
        let progress = 10;
        
        if (task.status === 'PENDING') {
          progress = 25;
        } else if (task.status === 'RUNNING') {
          progress = 50 + (pollCount * 2);
        } else if (task.status === 'SUCCEEDED') {
          progress = 100;
        }
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { 
            status: task.status.toLowerCase(), 
            progress: Math.round(progress),
            message: task.status.toLowerCase()
          }
        }));

        if (task.status === 'SUCCEEDED') {
          addLog('✓ Job ' + (jobIndex + 1) + ' completed successfully', 'success');
          
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
          const failureReason = task.failure_reason || task.failureCode || task.error || 'Generation failed - no specific reason provided';
          
          addLog('✗ Job ' + (jobIndex + 1) + ' failed on Runway: ' + failureReason, 'error');
          
          setGenerationProgress(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });
          
          throw new Error(failureReason);
        }

        await new Promise(resolve => setTimeout(resolve, 6000)); // Reduced from 8000ms to 6000ms
        pollCount++;
        
      } catch (error) {
        throw error;
      }
    }

    throw new Error('Generation timeout after polling limit reached');
  };

  const generateVideos = async () => {
    // Check for required inputs first
    if (!checkRequiredInputs()) {
      return;
    }

    const requestedJobs = parseInt(concurrency) || 1;
    const MAX_CONCURRENT_JOBS = 20;
    const totalJobs = Math.min(Math.max(requestedJobs, 1), MAX_CONCURRENT_JOBS);
    
    if (requestedJobs > MAX_CONCURRENT_JOBS) {
      addLog(`❌ SAFETY BLOCK: Cannot generate more than ${MAX_CONCURRENT_JOBS} videos at once to prevent excessive costs!`, 'error');
      return;
    }
    
    if (isNaN(totalJobs) || totalJobs < 1) {
      addLog('❌ SAFETY: Invalid number of videos specified. Using 1 video.', 'error');
      return;
    }
    
    // Enhanced credit check before proceeding
    const creditCheckResult = await checkOrganizationCredits();
    
    if (!creditCheckResult.success) {
      if (creditCheckResult.isAuthError) {
        showModalDialog({
          title: "Invalid API Key",
          type: "warning",
          confirmText: "OK",
          cancelText: null,
          onConfirm: null,
          content: (
            <div>
              <div className="alert alert-danger border-0 mb-3" style={{ borderRadius: '8px' }}>
                <div className="d-flex align-items-center mb-2">
                  <AlertCircle size={20} className="text-danger me-2" />
                  <strong>Authentication Failed</strong>
                </div>
                <p className="mb-0">Your Runway API key appears to be invalid or expired.</p>
              </div>
              
              <p className="mb-2">Please check your API key and try again.</p>
              <p className="mb-0 text-muted">
                Get a valid API key from <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-bold">dev.runwayml.com</a>
              </p>
            </div>
          )
        });
        return;
      } else {
        addLog('⚠️ Could not verify credit balance, proceeding with generation...', 'warning');
      }
    } else {
      const estimatedCreditsNeeded = estimateCreditsNeeded(totalJobs, model, duration);
      const currentBalance = creditCheckResult.creditBalance || 0;
      
      if (currentBalance < estimatedCreditsNeeded) {
        showModalDialog({
          title: "Insufficient Credits",
          type: "warning",
          confirmText: "Get Credits",
          cancelText: "Cancel",
          onConfirm: () => {
            window.open('https://dev.runwayml.com', '_blank');
          },
          content: (
            <div>
              <div className="alert alert-danger border-0 mb-3" style={{ borderRadius: '8px' }}>
                <div className="d-flex align-items-center mb-2">
                  <CreditCard size={20} className="text-danger me-2" />
                  <strong>Insufficient Credits</strong>
                </div>
                <p className="mb-0">You don't have enough credits to generate {totalJobs} video{totalJobs !== 1 ? 's' : ''}.</p>
              </div>
              
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <div className="text-center p-3 border rounded">
                    <div className="h5 mb-1 text-success">{currentBalance}</div>
                    <small className="text-muted">Current Balance</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 border rounded">
                    <div className="h5 mb-1 text-danger">{estimatedCreditsNeeded}</div>
                    <small className="text-muted">Credits Needed</small>
                  </div>
                </div>
              </div>
              
              <p className="mb-0 text-muted">
                Visit the Runway Developer Portal to purchase more credits.
              </p>
            </div>
          )
        });
        return;
      }
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
              This will use credits from your Runway account. Are you sure you want to proceed?
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
    
    const currentGeneration = generationCounter + 1;
    setGenerationCounter(currentGeneration);
    
    addLog('🚀 Starting Runway video generation...', 'info');
    addLog('Configuration: ' + model + ', ' + aspectRatio + ', ' + duration + 's', 'info');
    addLog(`💰 Estimated cost: ${estimatedCostMin.toFixed(2)} - ${estimatedCostMax.toFixed(2)} (${totalJobs} videos)`, 'info');
    
    if (organizationInfo) {
      const estimatedCredits = estimateCreditsNeeded(totalJobs, model, duration);
      addLog(`💳 Credit usage: ${estimatedCredits} credits (${organizationInfo.creditBalance} available)`, 'info');
    }
    
    addLog('📊 Processing ' + totalJobs + (totalJobs === 1 ? ' video generation' : ' video generations') + ' using the same prompt and image...', 'info');

    const batchResults = [];
    const errors = [];
    const allPromises = [];
    
    for (let i = 0; i < totalJobs; i++) {
      const jobIndex = i;
      const currentVideoNumber = i + 1;
      const staggerDelay = i * 500; // Reduced from 1000ms to 500ms for faster starts
      
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

    addLog('🚀 Starting ' + totalJobs + ' concurrent video generations with 0.5s stagger...', 'info');

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

    setCompletedGeneration(currentGeneration);
    setIsRunning(false);
    
    // Update credits after generation completes
    updateCreditsAfterGeneration();
    
    // Auto-advance to Results tab when generation completes successfully
    if (successCount > 0) {
      setActiveTab('results');
    }
  };

  const stopGeneration = () => {
    setIsRunning(false);
    addLog('🛑 Generation stopped by user', 'warning');
  };

  // Add JSZip import at the top after other imports
  const JSZip = typeof window !== 'undefined' ? window.JSZip : null;

  // Add the download functions with ZIP support
  const downloadVideo = async (videoUrl, filename) => {
    try {
      addLog(`📥 Downloading ${filename}...`, 'info');
      
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
      addLog(`❌ Failed to download ${filename}: ${error.message}`, 'error');
      return false;
    }
  };

  const createZipDownload = async (videos, zipName, folderName) => {
    if (!JSZip) {
      addLog('❌ JSZip not available. Downloading files individually...', 'error');
      return;
    }

    const zip = new JSZip();
    const mainFolder = zip.folder(folderName);
    const videosFolder = mainFolder.folder('Videos');
    const jsonFolder = mainFolder.folder('JSON');

    try {
      // Download all videos and add to zip
      for (let i = 0; i < videos.length; i++) {
        const result = videos[i];
        const filename = generateFilename(result.jobId, result.id, !!result.upscaled_video_url);
        
        addLog(`📥 Adding ${filename} to ${zipName}... (${i + 1}/${videos.length})`, 'info');
        
        try {
          const response = await fetch(result.upscaled_video_url || result.video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const videoBlob = await response.blob();
          videosFolder.file(filename, videoBlob);
          
          // Create JSON file for each video
          const jsonData = {
            id: result.id,
            jobId: result.jobId,
            customTitle: customTitles[result.id] || null,
            prompt: result.prompt,
            video_url: result.video_url,
            upscaled_video_url: result.upscaled_video_url || null,
            thumbnail_url: result.thumbnail_url,
            image_url: result.image_url,
            status: result.status,
            created_at: result.created_at,
            filename: filename,
            is_upscaled: !!result.upscaled_video_url,
            is_favorited: favoriteVideos.has(result.id)
          };
          
          const jsonFilename = filename.replace('.mp4', '.json');
          jsonFolder.file(jsonFilename, JSON.stringify(jsonData, null, 2));
          
        } catch (error) {
          addLog(`⚠️ Failed to add ${filename}: ${error.message}`, 'warning');
        }
      }

      // Generate and download zip
      addLog(`📦 Creating ${zipName}...`, 'info');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = zipName;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      const sizeMB = (zipBlob.size / 1024 / 1024).toFixed(1);
      addLog(`✅ Downloaded ${zipName} (${sizeMB}MB)`, 'success');
      
    } catch (error) {
      addLog(`❌ Failed to create ${zipName}: ${error.message}`, 'error');
    }
  };

  const generateTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  };

  const generateFilename = (jobId, taskId, isUpscaled = false) => {
    // Check if there's a custom title for this video
    const customTitle = customTitles[taskId];
    if (customTitle) {
      // Clean the custom title for filename
      const cleanTitle = customTitle.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '-');
      return `${cleanTitle}${isUpscaled ? '_4K' : ''}.mp4`;
    }
    
    // Fall back to original logic
    if (!jobId) return `video_${taskId}${isUpscaled ? '_4K' : ''}.mp4`;
    
    const genMatch = jobId.match(/Generation (\d+)/);
    const vidMatch = jobId.match(/Video (\d+)/);
    
    if (genMatch && vidMatch) {
      const generation = genMatch[1];
      const video = vidMatch[1];
      return `gen-${generation}-video-${video}${isUpscaled ? '_4K' : ''}.mp4`;
    }
    
    return `video_${taskId}${isUpscaled ? '_4K' : ''}.mp4`;
  };

  const downloadAllVideos = async () => {
    const videosWithUrls = results.filter(result => result.video_url && result.status === 'completed');
    
    if (videosWithUrls.length === 0) {
      addLog('❌ No completed videos available for download', 'error');
      return;
    }

    setIsDownloadingAll(true);
    const timestamp = generateTimestamp();
    const zipName = `All Videos (${timestamp}).zip`;
    const folderName = `All Videos (${timestamp})`;
    
    await createZipDownload(videosWithUrls, zipName, folderName);
    setIsDownloadingAll(false);
  };

  const downloadUpscaledVideos = async () => {
    const upscaledVideos = results.filter(result => 
      result.upscaled_video_url && 
      result.status === 'completed'
    );
    
    if (upscaledVideos.length === 0) {
      addLog('❌ No 4K videos available for download', 'error');
      return;
    }

    setIsDownloadingAll(true);
    const timestamp = generateTimestamp();
    const zipName = `4K Videos (${timestamp}).zip`;
    const folderName = `4K Videos (${timestamp})`;
    
    await createZipDownload(upscaledVideos, zipName, folderName);
    setIsDownloadingAll(false);
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
    const timestamp = generateTimestamp();
    const zipName = `Favorited Videos (${timestamp}).zip`;
    const folderName = `Favorited Videos (${timestamp})`;
    
    await createZipDownload(favoritedVideos, zipName, folderName);
    setIsDownloadingAll(false);
  };

  // Add the upscaling function
  const upscaleVideo = async (taskId, videoUrl, videoName) => {
    if (!runwayApiKey.trim()) {
      addLog('❌ Runway API key is required for 4K upscaling!', 'error');
      return;
    }

    const upscaleId = `upscale_${taskId}`;
    
    // Show cost warning for upscaling
    showModalDialog({
      title: "Upscaling Cost Warning",
      type: "warning",
      confirmText: "Start 4K Upscaling",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          addLog(`🔄 Starting 4K upscaling for ${videoName}...`, 'info');
          
          setUpscalingProgress(prev => ({
            ...prev,
            [upscaleId]: { status: 'starting', progress: 0, message: 'Starting 4K upscale...' }
          }));

          const response = await fetch(API_BASE + '/runway-upscale', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiKey: runwayApiKey,
              taskId: taskId,
              videoUrl: videoUrl
            })
          });

          const responseText = await response.text();
          
          if (!response.ok) {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch (parseError) {
              throw new Error(`Upscale API Error ${response.status}: Could not parse error response`);
            }
            
            const errorMessage = errorData.error || errorData.message || 'Upscaling failed';
            throw new Error(errorMessage);
          }

          let upscaleTask;
          try {
            upscaleTask = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error('Could not parse upscale API response');
          }

          addLog(`✓ 4K upscaling started for ${videoName} (Task ID: ${upscaleTask.id})`, 'success');
          
          // Update the original video result with upscaling info
          setResults(prev => prev.map(result => 
            result.id === taskId 
              ? { 
                  ...result, 
                  upscale_task_id: upscaleTask.id
                }
              : result
          ));
          
          //