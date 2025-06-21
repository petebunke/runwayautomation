import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart, ArrowUp } from 'lucide-react';
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
    } catch (error) {
      console.warn('Failed to load saved data from localStorage:', error);
    }
  }, [mounted]);

  // Save data to localStorage
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

  const estimateCreditsNeeded = (totalJobs, model, duration) => {
    const creditRates = {
      'gen4_turbo': {
        5: 50,   
        10: 100  
      },
      'gen3a_turbo': {
        5: 25,   
        10: 50   
      }
    };

    const creditsPerVideo = creditRates[model]?.[duration] || 50;
    const totalCredits = creditsPerVideo * totalJobs;
    return Math.ceil(totalCredits * 1.1);
  };

  const checkOrganizationCredits = async () => {
    if (!runwayApiKey.trim()) {
      return { success: false, error: 'API key required' };
    }

    setIsCheckingCredits(true);
    addLog('🔍 Checking organization credit balance and tier limits...', 'info');

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
        
        if (response.status === 404) {
          return { success: false, error: 'Organization endpoint not available', isAuthError: true };
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
      
      const maxConcurrent = Math.max(
        organizationData.tierInfo?.maxConcurrentGen4Turbo || 0,
        organizationData.tierInfo?.maxConcurrentGen3aTurbo || 0
      );
      
      addLog(`✅ Credit check completed - Balance: ${organizationData.creditBalance} credits`, 'success');
      addLog(`ℹ️ Tier limits: ${maxConcurrent} concurrent, ${organizationData.tierInfo?.maxDailyGen4Turbo || 'Unknown'} daily gen4_turbo`, 'info');
      
      return { 
        success: true, 
        data: organizationData,
        creditBalance: organizationData.creditBalance,
        tierInfo: organizationData.tierInfo,
        usageInfo: organizationData.usageInfo
      };
      
    } catch (error) {
      addLog('⚠️ Credit check failed due to network error: ' + error.message, 'warning');
      return { success: false, error: error.message };
    } finally {
      setIsCheckingCredits(false);
    }
  };

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
            
            let errorMessage = errorData.error || errorData.message || 'API Error: ' + response.status;
            
            if (response.status === 400) {
              if (errorMessage.toLowerCase().includes('credit') || 
                  errorMessage.toLowerCase().includes('insufficient') ||
                  errorMessage.toLowerCase().includes('balance')) {
                throw new Error('Insufficient credits: ' + errorMessage);
              }
              
              if (errorMessage.toLowerCase().includes('safety') || 
                  errorMessage.toLowerCase().includes('inappropriate')) {
                throw new Error('Content safety violation: ' + errorMessage);
              }
              
              if (errorMessage.toLowerCase().includes('aspect ratio') || 
                  errorMessage.toLowerCase().includes('image')) {
                throw new Error('Image format issue: ' + errorMessage + ' (Try using a different image with aspect ratio between 0.5-2.0)');
              }
            }
            
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

    while (pollCount < maxPolls) {
      try {
        const timeoutMs = 30000;
        
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
          
          throw new Error('Invalid response from Runway API: ' + responseText.substring(0, 100));
        }

        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
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

        await new Promise(resolve => setTimeout(resolve, 8000));
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

    throw new Error('Generation timeout after polling limit reached');
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
      addLog('❌ Image URL is required! The current Runway API only supports image-to-video generation. Please add an image URL.', 'error');
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('❌ Runway API key is required!', 'error');
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
    
    // Enhanced credit check before proceeding - MANDATORY validation
    addLog('🔍 Checking credit balance before starting generation...', 'info');
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
        // If credit check fails, show error and don't proceed
        showModalDialog({
          title: "Credit Check Failed",
          type: "warning",
          confirmText: "Try Again",
          cancelText: "Cancel",
          onConfirm: () => {
            generateVideos(); // Retry the generation process
          },
          content: (
            <div>
              <div className="alert alert-warning border-0 mb-3" style={{ borderRadius: '8px' }}>
                <div className="d-flex align-items-center mb-2">
                  <AlertCircle size={20} className="text-warning me-2" />
                  <strong>Unable to Verify Credits</strong>
                </div>
                <p className="mb-0">Could not check your credit balance: {creditCheckResult.error}</p>
              </div>
              
              <p className="mb-2">Please ensure you have sufficient credits before proceeding.</p>
              <p className="mb-0 text-muted">
                Check your balance at <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-bold">dev.runwayml.com</a>
              </p>
            </div>
          )
        });
        return;
      }
    }

    // MANDATORY: Check if current credits are sufficient
    const estimatedCreditsNeeded = estimateCreditsNeeded(totalJobs, model, duration);
    const currentBalance = creditCheckResult.creditBalance || 0;
    
    addLog(`💳 Credit analysis: ${currentBalance} available, ${estimatedCreditsNeeded} needed for ${totalJobs} video${totalJobs !== 1 ? 's' : ''}`, 'info');
    
    if (currentBalance < estimatedCreditsNeeded) {
      const shortfall = estimatedCreditsNeeded - currentBalance;
      const estimatedCost = (shortfall * 0.01).toFixed(2); // $0.01 per credit
      
      showModalDialog({
        title: "Insufficient Credits",
        type: "warning",
        confirmText: "Buy More Credits",
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
              <p className="mb-0">You don't have enough credits to generate {totalJobs} video{totalJobs !== 1 ? 's' : ''} using {model}.</p>
            </div>
            
            <div className="row g-2 mb-3">
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1 text-success">{currentBalance}</div>
                  <small className="text-muted">Available</small>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1 text-danger">{estimatedCreditsNeeded}</div>
                  <small className="text-muted">Required</small>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1 text-warning">{shortfall}</div>
                  <small className="text-muted">Shortfall</small>
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="mb-2"><strong>Generation Details:</strong></p>
              <ul className="small mb-2 ps-3">
                <li>{totalJobs} video{totalJobs !== 1 ? 's' : ''} × {model} ({duration}s each)</li>
                <li>~{Math.floor(estimatedCreditsNeeded / totalJobs)} credits per video</li>
                <li>You need {shortfall} more credits (~${estimatedCost})</li>
              </ul>
            </div>
            
            <p className="mb-0 text-muted">
              <strong>Visit <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none">dev.runwayml.com</a> to purchase more credits.</strong>
            </p>
          </div>
        )
      });
      return; // STOP generation - insufficient credits
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
    
    // Auto-advance to Results tab when generation completes successfully
    if (successCount > 0) {
      setActiveTab('results');
    }
  };

  const stopGeneration = () => {
    setIsRunning(false);
    addLog('🛑 Generation stopped by user', 'warning');
  };

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

  const generateFilename = (jobId, taskId, isUpscaled = false) => {
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
    addLog(`📦 Downloading ${videosWithUrls.length} videos...`, 'info');

    try {
      for (let i = 0; i < videosWithUrls.length; i++) {
        const result = videosWithUrls[i];
        const filename = generateFilename(result.jobId, result.id);
        
        await downloadVideo(result.video_url, filename);
      }
      
      addLog(`✅ Downloaded all ${videosWithUrls.length} videos`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to download all videos: ' + error.message, 'error');
    } finally {
      setIsDownloadingAll(false);
    }
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
    addLog(`📦 Downloading ${upscaledVideos.length} 4K videos...`, 'info');

    try {
      for (let i = 0; i < upscaledVideos.length; i++) {
        const result = upscaledVideos[i];
        const filename = generateFilename(result.jobId, result.id, true);
        
        await downloadVideo(result.upscaled_video_url, filename);
      }
      
      addLog(`✅ Downloaded all ${upscaledVideos.length} 4K videos`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to download all 4K videos: ' + error.message, 'error');
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
    addLog(`📦 Downloading ${favoritedVideos.length} favorited videos...`, 'info');

    try {
      for (let i = 0; i < favoritedVideos.length; i++) {
        const result = favoritedVideos[i];
        const filename = generateFilename(result.jobId, result.id);
        
        await downloadVideo(result.video_url, filename);
        
        // Also download 4K version if available
        if (result.upscaled_video_url) {
          const upscaledFilename = generateFilename(result.jobId, result.id, true);
          await downloadVideo(result.upscaled_video_url, upscaledFilename);
        }
      }
      
      addLog(`✅ Downloaded all ${favoritedVideos.length} favorited videos`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to download favorited videos: ' + error.message, 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const upscaleVideo = async (taskId, videoUrl, videoName) => {
    if (!runwayApiKey.trim()) {
      addLog('❌ Runway API key is required for 4K upscaling!', 'error');
      return;
    }

    const upscaleId = `upscale_${taskId}`;
    
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
          
          setResults(prev => prev.map(result => 
            result.id === taskId 
              ? { 
                  ...result, 
                  upscale_task_id: upscaleTask.id
                }
              : result
          ));
          
          setTimeout(() => {
            setUpscalingProgress(prev => {
              const updated = { ...prev };
              delete updated[upscaleId];
              return updated;
            });
            
            setResults(prev => prev.map(result => 
              result.id === taskId 
                ? { 
                    ...result, 
                    upscaled_video_url: result.video_url
                  }
                : result
            ));
            
            addLog(`✅ 4K upscaling completed for ${videoName}`, 'success');
          }, 5000);
          
        } catch (error) {
          addLog(`❌ 4K upscaling failed for ${videoName}: ${error.message}`, 'error');
          setUpscalingProgress(prev => {
            const updated = { ...prev };
            delete updated[upscaleId];
            return updated;
          });
        }
      },
      content: (
        <div>
          <div className="alert alert-warning border-0 mb-3" style={{ borderRadius: '8px' }}>
            <div className="d-flex align-items-center mb-2">
              <AlertCircle size={20} className="text-warning me-2" />
              <strong>4K Upscaling Cost</strong>
            </div>
            <p className="mb-0">4K upscaling typically costs <strong>~500 credits ($5)</strong> per video.</p>
          </div>
          
          <div className="mb-3">
            <p className="mb-2"><strong>Video:</strong> {videoName}</p>
            <p className="mb-2"><strong>Process:</strong> Standard → 4K resolution</p>
            <p className="mb-0 text-muted">This will create a new high-resolution version of your video.</p>
          </div>
          
          <p className="mb-0 text-muted">
            Are you sure you want to proceed with 4K upscaling?
          </p>
        </div>
      )
    });
  };

  return (
    <>
      <Head>
        <title>Runway Automation - Batch Video Generation</title>
        <meta name="description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download all 4K videos as MP4 and JSON." />
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
                style={{ fontSize: '1.95rem', fontWeight: 'bold' }}
              >
                <Clapperboard size={36} className="me-3" style={{ verticalAlign: 'middle' }} />
                Runway Automation
              </button>
            </div>
            <div className="text-end">
              <p className="lead text-white-50 mb-0" style={{ maxWidth: '420px', fontSize: '1rem', lineHeight: '1.4' }}>
                A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download all 4K videos as MP4 and JSON.
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
                            <li>~500 credits for 4K upscaling ($5.00)</li>
                            <li>Credits are separate from web app credits</li>
                          </ul>
                        </div>

                        {runwayApiKey && (
                          <div className="card bg-light border-0 shadow-sm mb-4" style={{ borderRadius: '8px' }}>
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold text-dark">Credit Balance</span>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={checkOrganizationCredits}
                                  disabled={isCheckingCredits}
                                  style={{ borderRadius: '6px' }}
                                >
                                  {isCheckingCredits ? (
                                    <>
                                      <div className="spinner-border spinner-border-sm me-1" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                      </div>
                                      Checking...
                                    </>
                                  ) : (
                                    'Refresh'
                                  )}
                                </button>
                              </div>
                              
                              {organizationInfo ? (
                                <div className="row g-2">
                                  <div className="col-4">
                                    <div className="text-center p-2 border rounded bg-white">
                                      <div className="h6 mb-1 text-success">{organizationInfo.creditBalance}</div>
                                      <small className="text-muted">Available Credits</small>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="text-center p-2 border rounded bg-white">
                                      <div className="h6 mb-1 text-primary">
                                        {organizationInfo.tierInfo ? 
                                          Math.max(organizationInfo.tierInfo.maxConcurrentGen4Turbo, organizationInfo.tierInfo.maxConcurrentGen3aTurbo) :
                                          'N/A'
                                        }
                                      </div>
                                      <small className="text-muted">Max Concurrent</small>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="text-center p-2 border rounded bg-white">
                                      <div className="h6 mb-1 text-info">
                                        {organizationInfo.tierInfo ? 
                                          Math.max(organizationInfo.tierInfo.maxDailyGen4Turbo, organizationInfo.tierInfo.maxDailyGen3aTurbo) :
                                          'N/A'
                                        }
                                      </div>
                                      <small className="text-muted">Max Daily</small>
                                    </div>
                                  </div>
                                </div>
                              ) : lastCreditCheck ? (
                                <div className="text-center text-muted">
                                  <small>Last checked: {new Date(lastCreditCheck).toLocaleTimeString()}</small>
                                </div>
                              ) : (
                                <div className="text-center text-muted">
                                  <small>Click "Refresh" to check your credit balance</small>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

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
                            <label className="form-label fw-bold">Aspect Ratio</label>
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
                            <label className="form-label fw-bold"># of Videos Generated</label>
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
                          <label className="form-label fw-bold">Image</label>
                          
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
                              className="btn btn-success btn-lg w-100 shadow"
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
                      <h3 className="mb-0 fw-bold">Video Generation</h3>
                    </div>
                    
                    <div style={{ marginRight: '30px' }}>
                      {!isRunning ? (
                        <button
                          className="btn btn-success btn-lg shadow"
                          onClick={generateVideos}
                          disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || concurrency < 1 || concurrency > 20}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600',
                            backgroundColor: '#28a745',
                            borderColor: '#28a745'
                          }}
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
                          style={{ borderRadius: '8px', fontWeight: '600' }}
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
                          <span className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.875rem' }}>CONNECTION STATUS</span>
                          <div className="d-flex gap-5 align-items-center text-center">
                            <span className="text-dark"><strong>API:</strong> {runwayApiKey ? '✓ Connected' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Prompt:</strong> {prompt.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Image:</strong> {imageUrl.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            {organizationInfo && (
                              <span className="text-dark"><strong>Credits:</strong> {organizationInfo.creditBalance} available</span>
                            )}
                            <div className="d-flex align-items-center">
                              <div className={`me-2 rounded-circle ${isRunning ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}></div>
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

                    {Object.keys(upscalingProgress).length > 0 && (
                      <div className="mb-3">
                        <h5 className="fw-bold text-dark mb-3">4K Upscaling Progress</h5>
                        <div className="row g-3">
                          {Object.entries(upscalingProgress).map(([upscaleId, progress]) => (
                            <div key={upscaleId} className="col-md-6 col-xl-3">
                              <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span className="fw-bold small">4K Upscale</span>
                                    <span className={`badge ${
                                      progress.status === 'completed' ? 'bg-success' :
                                      progress.status === 'failed' ? 'bg-danger' :
                                      'bg-info'
                                    }`}>
                                      {progress.status}
                                    </span>
                                  </div>
                                  <div className="progress mb-2" style={{ height: '8px' }}>
                                    <div 
                                      className={`progress-bar ${
                                        progress.status === 'completed' ? 'bg-success' :
                                        progress.status === 'failed' ? 'bg-danger' :
                                        'bg-info'
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
                        <h5 className="fw-bold mb-0" style={{ color: '#0d6efd' }}>Video Generation Log</h5>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={clearLogs}
                            title="Clear all logs"
                            style={{ borderRadius: '6px' }}
                          >
                            <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-light" 
                            onClick={copyLogsToClipboard}
                            title="Copy all logs to clipboard"
                            style={{ borderRadius: '6px' }}
                          >
                            <i className="bi bi-clipboard" style={{ fontSize: '14px' }}></i>
                          </button>
                        </div>
                      </div>
                      <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        {logs.map((log, index) => (
                          <div key={index} className={`small mb-1 ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-light' :
                            log.type === 'warning' ? 'text-warning' :
                            'text-light'
                          }`}>
                            <span style={{ color: '#4dd0ff' }}>[{log.timestamp}]</span> {log.message}
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="text-muted small">
                            No logs yet... Logs will appear here during video generation.
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
                      <h3 className="mb-0 fw-bold">Generated Videos</h3>
                    </div>
                    
                    {results.filter(result => result.video_url && result.status === 'completed').length > 0 && (
                      <div style={{ marginRight: '30px' }}>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-light shadow"
                            onClick={downloadAllVideos}
                            disabled={isDownloadingAll}
                            style={{ borderRadius: '8px', fontWeight: '600' }}
                          >
                            {isDownloadingAll ? 'Downloading...' : (
                              <>
                                <Download size={20} className="me-2" />
                                All Videos
                                <span className="ms-2 badge bg-primary">
                                  {results.filter(result => result.video_url && result.status === 'completed').length}
                                </span>
                              </>
                            )}
                          </button>
                          
                          {favoriteVideos.size > 0 && (
                            <button
                              className="btn btn-danger shadow"
                              onClick={downloadFavoritedVideos}
                              disabled={isDownloadingAll}
                              style={{ borderRadius: '8px', fontWeight: '600' }}
                            >
                              <Download size={16} className="me-2" />
                              Favorited
                              <span className="ms-2 badge bg-light text-dark">
                                {favoriteVideos.size}
                              </span>
                            </button>
                          )}
                          
                          <button
                            className="btn btn-outline-light shadow"
                            onClick={clearGeneratedVideos}
                            style={{ borderRadius: '8px', fontWeight: '600' }}
                          >
                            <Trash2 size={16} className="me-2" />
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4"></div>
                    {results.length === 0 ? (
                      <div className="text-center py-4">
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
                        {results.map((result, index) => (
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
                                ) : (
                                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                                    <div className="text-center">
                                      <Film size={48} className="text-primary mb-3" />
                                      <div className="fw-bold text-muted">Processing...</div>
                                    </div>
                                  </div>
                                )}
                                
                                <button
                                  className="btn btn-sm position-absolute top-0 end-0 m-2"
                                  onClick={() => toggleFavorite(result.id)}
                                  style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    color: favoriteVideos.has(result.id) ? '#e74c3c' : '#6c757d'
                                  }}
                                >
                                  <Heart 
                                    size={16} 
                                    fill={favoriteVideos.has(result.id) ? 'currentColor' : 'none'}
                                  />
                                </button>
                              </div>
                              
                              <div className="card-body p-3">
                                <div className="fw-bold text-primary mb-2">{result.jobId}</div>
                                <h6 className="card-title mb-3" style={{ fontWeight: '400' }}>
                                  {result.prompt}
                                </h6>
                                
                                <div className="d-grid gap-2">
                                  {result.video_url && (
                                    <div className="btn-group" role="group">
                                      <button
                                        className="btn btn-primary btn-sm flex-fill"
                                        onClick={() => downloadVideo(result.video_url, generateFilename(result.jobId, result.id))}
                                      >
                                        <Download size={16} className="me-1" />
                                        Download
                                      </button>
                                      <button
                                        className="btn btn-outline-primary btn-sm flex-fill"
                                        onClick={() => window.open(result.video_url, '_blank')}
                                      >
                                        <ExternalLink size={16} className="me-1" />
                                        View
                                      </button>
                                      <button
                                        className="btn btn-sm"
                                        onClick={() => upscaleVideo(result.id, result.video_url, generateFilename(result.jobId, result.id))}
                                        style={{ backgroundColor: '#4dd0ff', borderColor: '#4dd0ff', color: 'white' }}
                                      >
                                        <ArrowUp size={16} className="me-1" />
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

          <div className="text-center mt-3">
            <div className="d-flex align-items-center justify-content-center text-white-50">
              <small>Based on <a href="https://apify.com/igolaizola/runway-automation" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Runway Automation for Apify</a> by <a href="https://igolaizola.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Iñigo Garcia Olaizola</a>.<br />Enhanced by Claude. All rights reserved.</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}