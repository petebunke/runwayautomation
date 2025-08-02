import React, { useState, useEffect, useRef }

// You'll also need to create this new API endpoint: /pages/api/runway-generate-video.js
// Here's the implementation for the video-to-video endpoint:

/*
// /pages/api/runway-generate-video.js
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
    const { apiKey, payload } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!payload || !payload.promptText) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!payload.videoUri) {
      return res.status(400).json({ 
        error: 'Video required for video-to-video generation',
        message: 'Gen-4 Aleph requires a video input for video-to-video generation.'
      });
    }

    console.log('Making video-to-video request to RunwayML API...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.dev.runwayml.com/v1/video_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));

    // Get response as text first to debug the issue
    const responseText = await response.text();
    console.log('Response length:', responseText.length);
    console.log('Response first 200 chars:', responseText.substring(0, 200));

    // Handle HTML error responses (like 404 pages)
    if (response.headers.get('content-type')?.includes('text/html')) {
      console.log('Received HTML response instead of JSON');
      return res.status(response.status).json({
        error: 'RunwayML API returned HTML error page',
        message: `HTTP ${response.status}: Server returned HTML instead of JSON`,
        status: response.status
      });
    }

    // Handle empty responses
    if (!responseText.trim()) {
      return res.status(502).json({
        error: 'Empty response from RunwayML API',
        message: 'No data received'
      });
    }

    // Handle obvious binary data
    if (responseText.charCodeAt(0) === 0 || responseText.includes('\ufffd')) {
      return res.status(502).json({
        error: 'RunwayML API returned binary data',
        message: 'Unexpected binary response'
      });
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.log('Failed to parse response:', responseText.substring(0, 500));
      
      return res.status(502).json({
        error: 'Invalid JSON response from RunwayML API',
        message: 'Could not parse response as JSON',
        parseError: parseError.message,
        contentType: response.headers.get('content-type'),
        status: response.status,
        preview: responseText.substring(0, 200)
      });
    }

    if (!response.ok) {
      console.error('RunwayML API error:', response.status, data);
      return res.status(response.status).json({
        error: `RunwayML API Error (${response.status})`,
        message: data.error || data.message || 'Unknown error',
        details: data
      });
    }

    console.log('Success! Video-to-video task created:', data.id);
    res.status(200).json(data);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
*/ from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart, ArrowUp, Edit3, Shield } from 'lucide-react';
import Head from 'next/head';

export default function RunwayAutomationApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [runwayApiKey, setRunwayApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // New state for video URL
  const [inputType, setInputType] = useState('image'); // New state to track input type
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
  const [videoError, setVideoError] = useState(false); // New state for video errors
  const [videoCounter, setVideoCounter] = useState(0);
  const [generationCounter, setGenerationCounter] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [completedGeneration, setCompletedGeneration] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false); // New state for video upload
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
  const videoFileInputRef = useRef(null); // New ref for video file input
  const logContainerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll logs to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const Modal = ({ show, onClose, title, children, onConfirm, confirmText = "Confirm", cancelText = "Cancel", type = "confirm" }) => {
    if (!show) return null;

    const getModalIcon = () => {
      switch (type) {
        case 'warning': return <AlertCircle className="text-white" size={32} />;
        case 'safety': return <Shield className="text-white" size={32} />;
        case 'credit': return <CreditCard className="text-white" size={32} />;
        default: return <CreditCard className="text-white" size={32} />;
      }
    };

    const getModalColor = () => {
      return '#4dd0ff';
    };

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
              borderRadius: '8px 8px 0 0',
              backgroundColor: '#0d6efd'
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
                backgroundColor: getModalColor()
              }}
            >
              {getModalIcon()}
            </div>
            
            <div className="text-white text-center">
              <h3 className="mb-0 fw-bold">{title}</h3>
            </div>
          </div>
          
          <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
            <div className="mb-4"></div>
            {children}
            
            <div className="d-flex gap-2 justify-content-end mt-4">
              {cancelText && (
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ borderRadius: '8px', fontWeight: '600', width: onConfirm ? '50%' : '100%' }}
                >
                  {cancelText}
                </button>
              )}
              {onConfirm && (
                <button
                  className={`btn ${type === 'warning' || type === 'safety' ? 'btn-danger' : 'btn-primary'} shadow`}
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  style={{ borderRadius: '8px', fontWeight: '600', width: cancelText ? '50%' : '100%' }}
                >
                  {confirmText}
                </button>
              )}
              {!onConfirm && !cancelText && (
                <button
                  className="btn btn-primary shadow"
                  onClick={onClose}
                  style={{ borderRadius: '8px', fontWeight: '600', width: '100%' }}
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

  // Show safety failure modal
  const showSafetyFailureModal = (errorMessage) => {
    showModalDialog({
      title: "Content Policy Violation",
      type: "safety",
      confirmText: "I Understand",
      cancelText: "Close",
      onConfirm: () => {
        // Optional: Could switch to setup tab to encourage retry with different content
        // setActiveTab('setup');
      },
      content: (
        <div>
          <div className="alert alert-danger border-0 mb-3" style={{ borderRadius: '8px' }}>
            <div className="d-flex align-items-center mb-2">
              <strong>Content Rejected by Safety Filter</strong>
            </div>
            <p className="mb-0">Your content was flagged by Runway's safety systems and cannot be processed.</p>
          </div>
          
          <div className="mb-3">
            <strong>Error Details:</strong>
            <div className="bg-light p-2 rounded mt-2" style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
              {errorMessage}
            </div>
          </div>

          <div className="mb-3">
            <strong>Runway's Usage Policy prohibits content with:</strong>
            <ul className="mb-0 text-muted mt-2 small">
              <li>Violence, gore, or disturbing imagery</li>
              <li>Illegal activities or harmful behavior</li>
              <li>Hate speech or discriminatory content</li>
              <li>Sexually explicit or suggestive material</li>
              <li>Copyright infringement or real people without consent</li>
            </ul>
          </div>
          
          <div className="alert alert-warning border-0 mb-3" style={{ borderRadius: '8px' }}>
            <strong>Important:</strong> Credits used for safety-rejected content are not refunded.
          </div>
          
          <p className="mb-0 text-muted small">
            Learn more at{' '}
            <a href="https://help.runwayml.com/hc/en-us/articles/17944787368595-Runway-s-Usage-Policy" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="text-decoration-none fw-bold">
              Runway's Usage Policy
            </a>
          </p>
        </div>
      )
    });
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

      // Load saved video URL
      const savedVideoUrl = localStorage.getItem('runway-automation-video-url');
      if (savedVideoUrl && savedVideoUrl.trim()) {
        setVideoUrl(savedVideoUrl);
      }

      // Load saved input type
      const savedInputType = localStorage.getItem('runway-automation-input-type');
      if (savedInputType && ['image', 'video'].includes(savedInputType)) {
        setInputType(savedInputType);
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

  // Save video URL to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      if (videoUrl && videoUrl.trim()) {
        localStorage.setItem('runway-automation-video-url', videoUrl);
      } else if (videoUrl === '') {
        localStorage.removeItem('runway-automation-video-url');
      }
    } catch (error) {
      console.warn('Failed to save video URL to localStorage:', error);
    }
  }, [videoUrl, mounted]);

  // Save input type to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('runway-automation-input-type', inputType);
    } catch (error) {
      console.warn('Failed to save input type to localStorage:', error);
    }
  }, [inputType, mounted]);

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

  // Clear input fields when switching between image and video
  useEffect(() => {
    if (inputType === 'image') {
      setVideoUrl('');
      setVideoError(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    } else if (inputType === 'video') {
      setImageUrl('');
      setImageError(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [inputType]);

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
        // Check data URI format and size limits
        const mimeMatch = url.match(/^data:image\/(jpeg|jpg|png|webp);base64,/);
        if (!mimeMatch) {
          addLog('❌ Data URI must be JPEG, PNG, or WebP format with base64 encoding', 'error');
          return false;
        }
        
        // Check 5MB limit for data URIs (base64 encoded size)
        if (url.length > 5 * 1024 * 1024) {
          addLog('❌ Data URI exceeds 5MB limit. Please use a smaller image or upload to a server.', 'error');
          return false;
        }
        
        // Check ~3.3MB original file size limit (accounting for base64 expansion)
        const estimatedOriginalSize = (url.length - url.indexOf(',') - 1) * 0.75;
        if (estimatedOriginalSize > 3.3 * 1024 * 1024) {
          addLog('⚠️ Image may be too large for data URI. Consider using a URL instead.', 'warning');
        }
        
        return true;
      }
      
      const urlObj = new URL(url);
      
      // Must be HTTPS
      if (urlObj.protocol !== 'https:') {
        addLog('❌ Image URL must use HTTPS protocol', 'error');
        return false;
      }
      
      // Must use domain name, not IP address
      const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(urlObj.hostname);
      if (isIP) {
        addLog('❌ Image URL must use a domain name, not an IP address', 'error');
        return false;
      }
      
      // URL length limit
      if (url.length > 2048) {
        addLog('❌ Image URL exceeds 2048 character limit', 'error');
        return false;
      }
      
      // Check for supported image extensions or known hosting services
      const hasImageExtension = /\.(jpg|jpeg|png|webp)$/i.test(urlObj.pathname);
      const isSupportedHost = [
        'imgur.com', 'googleusercontent.com', 'amazonaws.com', 
        'cloudinary.com', 'unsplash.com', 'pexels.com',
        'cdn.', 'static.', 'media.'
      ].some(host => urlObj.hostname.includes(host));
      
      if (!hasImageExtension && !isSupportedHost && url.length < 50) {
        addLog('⚠️ Image URL should end with .jpg, .jpeg, .png, or .webp extension', 'warning');
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  // Updated function to validate video URLs with Runway requirements
  const isValidVideoUrl = (url) => {
    try {
      if (url.startsWith('data:video/')) {
        // Check data URI format and size limits
        const mimeMatch = url.match(/^data:video\/(mp4|webm|quicktime|mov|ogg|h264);base64,/);
        if (!mimeMatch) {
          addLog('❌ Video data URI must be MP4, WebM, MOV, OGG, or H264 format with base64 encoding', 'error');
          return false;
        }
        
        // Check 5MB limit for data URIs (base64 encoded size)
        if (url.length > 5 * 1024 * 1024) {
          addLog('❌ Video data URI exceeds 5MB limit. Please upload to a server instead.', 'error');
          return false;
        }
        
        // Check ~3.3MB original file size limit (accounting for base64 expansion)
        const estimatedOriginalSize = (url.length - url.indexOf(',') - 1) * 0.75;
        if (estimatedOriginalSize > 3.3 * 1024 * 1024) {
          addLog('⚠️ Video may be too large for data URI. Consider uploading to a server.', 'warning');
        }
        
        return true;
      }
      
      const urlObj = new URL(url);
      
      // Must be HTTPS
      if (urlObj.protocol !== 'https:') {
        addLog('❌ Video URL must use HTTPS protocol', 'error');
        return false;
      }
      
      // Must use domain name, not IP address
      const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(urlObj.hostname);
      if (isIP) {
        addLog('❌ Video URL must use a domain name, not an IP address', 'error');
        return false;
      }
      
      // URL length limit
      if (url.length > 2048) {
        addLog('❌ Video URL exceeds 2048 character limit', 'error');
        return false;
      }
      
      // Check for supported video extensions or known hosting services
      const hasVideoExtension = /\.(mp4|mov|avi|webm|mkv|m4v|ogg)$/i.test(urlObj.pathname);
      const isSupportedHost = [
        'youtube.com', 'vimeo.com', 'amazonaws.com', 'cloudinary.com',
        'cdn.', 'static.', 'media.', 'storage.'
      ].some(host => urlObj.hostname.includes(host));
      
      if (!hasVideoExtension && !isSupportedHost && url.length < 50) {
        addLog('⚠️ Video URL should end with .mp4, .mov, .webm, .ogg, or other supported video extension', 'warning');
        return false;
      }
      
      return true;
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

  // New handlers for video
  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addLog('❌ Please select a valid image file', 'error');
      return;
    }

    // Check Runway's 16MB file size limit for images
    if (file.size > 16 * 1024 * 1024) {
      addLog('❌ Image file exceeds 16MB limit. Please use a smaller image.', 'error');
      return;
    }

    // Check if file will exceed 5MB data URI limit after base64 encoding
    const estimatedDataUriSize = file.size * 1.33; // Base64 adds ~33% size
    if (estimatedDataUriSize > 5 * 1024 * 1024) {
      addLog('❌ Image too large for data URI (5MB limit). Please upload to a server and use URL instead.', 'error');
      return;
    }

    setIsUploadingImage(true);
    addLog(`📤 Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB image...`, 'info');
    
    try {
      // Validate image type against Runway's supported formats
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        addLog('❌ Image must be JPEG, PNG, or WebP format for Runway API', 'error');
        setIsUploadingImage(false);
        return;
      }

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
      
      let { width, height } = img;
      const originalAspectRatio = width / height;
      
      addLog(`📏 Original image: ${width}x${height} (${originalAspectRatio.toFixed(2)} aspect ratio)`, 'info');
      
      // Runway will auto-crop from center, but warn about extreme ratios
      if (originalAspectRatio < 0.3 || originalAspectRatio > 3.0) {
        addLog(`⚠️ Warning: Extreme aspect ratio ${originalAspectRatio.toFixed(2)} will be heavily cropped by Runway`, 'warning');
      }
      
      // Don't resize - let Runway handle cropping to maintain quality
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      addLog('🔄 Creating data URI...', 'info');
      
      // Use appropriate format and quality for data URI
      let dataUrl;
      if (file.type === 'image/png' || file.type === 'image/webp') {
        dataUrl = canvas.toDataURL(file.type);
      } else {
        // Use JPEG with high quality to ensure compatibility
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
      
      // Final size check
      if (dataUrl.length > 5 * 1024 * 1024) {
        addLog('❌ Image data URI still exceeds 5MB after processing. Please use a smaller image or upload to a server.', 'error');
        setIsUploadingImage(false);
        return;
      }
      
      const finalSizeKB = Math.round(dataUrl.length / 1024);
      
      setImageUrl(dataUrl);
      setImageError(false);
      addLog(`✅ Image processed as data URI (~${finalSizeKB}KB) - Compatible with Runway API`, 'success');
      setIsUploadingImage(false);
      
    } catch (error) {
      addLog('❌ Error processing image: ' + error.message, 'error');
      setIsUploadingImage(false);
    }
  };

  // Updated function to handle video upload with Runway requirements
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      addLog('❌ Please select a valid video file', 'error');
      return;
    }

    // Check Runway's 16MB file size limit for videos
    if (file.size > 16 * 1024 * 1024) {
      addLog('❌ Video file exceeds 16MB limit. Please use a smaller video or upload to a server.', 'error');
      return;
    }

    // Validate video type against Runway's supported formats
    const supportedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/mov', 'video/ogg', 'video/h264'
    ];
    if (!supportedTypes.includes(file.type)) {
      addLog('❌ Video must be MP4, WebM, MOV, OGG, or H264 format for Runway API', 'error');
      return;
    }

    // Check if file will exceed 5MB data URI limit after base64 encoding
    const estimatedDataUriSize = file.size * 1.33; // Base64 adds ~33% size
    if (estimatedDataUriSize > 5 * 1024 * 1024) {
      addLog('❌ Video too large for data URI (5MB limit). Please upload to a server and use URL instead.', 'error');
      return;
    }

    setIsUploadingVideo(true);
    addLog(`📤 Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB video...`, 'info');
    
    try {
      // Create a data URL for the video
      const reader = new FileReader();
      reader.onload = function(e) {
        const videoDataUrl = e.target.result;
        
        // Final size check
        if (videoDataUrl.length > 5 * 1024 * 1024) {
          addLog('❌ Video data URI exceeds 5MB limit. Please upload to a server and use URL instead.', 'error');
          setIsUploadingVideo(false);
          return;
        }
        
        setVideoUrl(videoDataUrl);
        setVideoError(false);
        
        const finalSizeMB = (videoDataUrl.length / 1024 / 1024).toFixed(1);
        addLog(`✅ Video processed as data URI (~${finalSizeMB}MB) - Compatible with Runway API`, 'success');
        setIsUploadingVideo(false);
      };
      
      reader.onerror = function() {
        addLog('❌ Error reading video file', 'error');
        setIsUploadingVideo(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      addLog('❌ Error processing video: ' + error.message, 'error');
      setIsUploadingVideo(false);
    }
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // New function to trigger video upload
  const triggerVideoUpload = () => {
    if (videoFileInputRef.current) {
      videoFileInputRef.current.click();
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

  // Updated model options to include Gen-4 Aleph
  const modelOptions = [
    { value: 'gen4_turbo', label: 'Gen-4 Turbo (Image to Video)' },
    { value: 'gen3a_turbo', label: 'Gen-3 Alpha Turbo (Image to Video)' },
    { value: 'gen4_aleph', label: 'Gen-4 Aleph (Video to Video)' }
  ];

  // Updated aspect ratio options based on model and input type
  const aspectRatioOptions = (() => {
    if (model === 'gen4_aleph') {
      // Gen-4 Aleph aspect ratios for video-to-video
      return [
        { value: '16:9', label: '16:9 (Landscape)' },
        { value: '9:16', label: '9:16 (Portrait)' },
        { value: '1:1', label: '1:1 (Square)' },
        { value: '4:3', label: '4:3 (Standard)' },
        { value: '3:4', label: '3:4 (Portrait Standard)' },
        { value: '21:9', label: '21:9 (Cinematic)' },
        { value: '16:10', label: '16:10 (Widescreen)' },
        { value: '4:5', label: '4:5 (Classic Portrait)' }
      ];
    } else if (model === 'gen4_turbo') {
      // Gen-4 Turbo aspect ratios for image-to-video
      return [
        { value: '16:9', label: '16:9 (Landscape)' },
        { value: '9:16', label: '9:16 (Portrait)' },
        { value: '1:1', label: '1:1 (Square)' },
        { value: '4:3', label: '4:3 (Standard)' },
        { value: '3:4', label: '3:4 (Portrait Standard)' },
        { value: '21:9', label: '21:9 (Cinematic)' }
      ];
    } else {
      // Gen-3 Alpha Turbo aspect ratios
      return [
        { value: '16:9', label: '16:9 (Landscape)' },
        { value: '9:16', label: '9:16 (Portrait)' }
      ];
    }
  })();

  // Auto-switch input type when model changes
  useEffect(() => {
    if (model === 'gen4_aleph') {
      setInputType('video');
    } else {
      setInputType('image');
    }
  }, [model]);

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

  // Updated function to convert aspect ratios for different models
  const convertAspectRatio = (ratio, currentModel) => {
    if (currentModel === 'gen4_aleph') {
      // Gen-4 Aleph video-to-video resolutions
      const gen4AlephRatioMap = {
        '16:9': '1280:720',
        '9:16': '720:1280',
        '1:1': '960:960',
        '4:3': '1104:832',
        '3:4': '832:1104',
        '21:9': '1584:672',
        '16:10': '848:480',
        '4:5': '640:480'
      };
      return gen4AlephRatioMap[ratio] || '1280:720';
    } else if (currentModel === 'gen4_turbo') {
      // Gen-4 Turbo image-to-video resolutions
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

  // Enhanced credit estimation function with Gen-4 Aleph pricing
  const estimateCreditsNeeded = (totalJobs, model, duration) => {
    let creditsPerSecond;
    
    switch (model) {
      case 'gen4_aleph':
        creditsPerSecond = 15; // 15 credits per second for Gen-4 Aleph
        break;
      case 'gen4_turbo':
      case 'gen3a_turbo':
      default:
        creditsPerSecond = 5; // 5 credits per second for other models
        break;
    }
    
    const creditsPerVideo = creditsPerSecond * duration;
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
    
    // Check for appropriate input based on model
    if (model === 'gen4_aleph') {
      if (!videoUrl.trim()) {
        missingInputs.push('Video');
      }
    } else {
      if (!imageUrl.trim()) {
        missingInputs.push('Image');
      }
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

  // Updated generateVideo function to handle both image-to-video and video-to-video
  const generateVideo = async (promptText, inputUrl, jobIndex = 0, generationNum, videoNum) => {
    const jobId = 'Generation ' + generationNum + ' - Video ' + videoNum;
    
    try {
      // Validate input based on model type
      if (model === 'gen4_aleph') {
        // Video-to-video generation
        if (!inputUrl || !inputUrl.trim()) {
          const errorMsg = 'Video URL is required for Gen-4 Aleph video-to-video generation.';
          addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
          
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'failed', progress: 0, error: errorMsg }
          }));
          
          throw new Error(errorMsg);
        }

        if (!isValidVideoUrl(inputUrl.trim())) {
          const errorMsg = 'Invalid video URL format. Please use a direct link to a video file or a supported video hosting service.';
          addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
          
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'failed', progress: 0, error: errorMsg }
          }));
          
          throw new Error(errorMsg);
        }
      } else {
        // Image-to-video generation
        if (!inputUrl || !inputUrl.trim()) {
          const errorMsg = 'Image URL is required for image-to-video generation.';
          addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
          
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'failed', progress: 0, error: errorMsg }
          }));
          
          throw new Error(errorMsg);
        }

        if (!isValidImageUrl(inputUrl.trim())) {
          const errorMsg = 'Invalid image URL format. Please use a direct link to an image file or a supported image hosting service.';
          addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
          
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'failed', progress: 0, error: errorMsg }
          }));
          
          throw new Error(errorMsg);
        }
      }

      const inputType = model === 'gen4_aleph' ? 'video' : 'image';
      addLog(`Starting generation for job ${jobIndex + 1}: "${promptText.substring(0, 50)}..." with ${inputType}`, 'info');
      
      const selectedRatio = convertAspectRatio(aspectRatio, model);
      addLog(`Using model: ${model}, aspect ratio: ${aspectRatio} → ${selectedRatio}`, 'info');
      
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'starting', progress: 0 }
      }));

      // Create payload based on model type
      let payload;
      if (model === 'gen4_aleph') {
        // Video-to-video payload
        payload = {
          videoUri: inputUrl.trim(),
          promptText: promptText,
          model: model,
          ratio: selectedRatio,
          seed: Math.floor(Math.random() * 1000000)
        };
      } else {
        // Image-to-video payload
        payload = {
          promptText: promptText,
          promptImage: inputUrl.trim(),
          model: model,
          ratio: selectedRatio,
          duration: duration,
          seed: Math.floor(Math.random() * 1000000)
        };
      }

      // Use appropriate API endpoint based on model
      const apiEndpoint = model === 'gen4_aleph' ? '/runway-generate-video' : '/runway-generate';
      
      const response = await fetch(API_BASE + apiEndpoint, {
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
      
      return await pollTaskCompletion(task.id, jobId, promptText, inputUrl, jobIndex);
      
    } catch (error) {
      addLog('✗ Job ' + (jobIndex + 1) + ' failed: ' + error.message, 'error');
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'failed', progress: 0, error: error.message }
      }));
      throw error;
    }
  };

  // Updated pollTaskCompletion function
  const pollTaskCompletion = async (taskId, jobId, promptText, inputUrl, jobIndex) => {
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
            image_url: model !== 'gen4_aleph' ? inputUrl : null,
            video_input_url: model === 'gen4_aleph' ? inputUrl : null,
            status: 'completed',
            created_at: new Date().toISOString(),
            jobId: jobId,
            model: model
          };

          setResults(prev => [...prev, completedVideo]);
          return completedVideo;
        }

        if (task.status === 'FAILED') {
          const failureReason = task.failure_reason || task.failureCode || task.error || 'Generation failed - no specific reason provided';
          
          addLog('✗ Job ' + (jobIndex + 1) + ' failed on Runway: ' + failureReason, 'error');
          
          // Clear the failed job from generation progress
          setGenerationProgress(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });
          
          // Check for safety failures first
          if (failureReason.toUpperCase().includes('SAFETY.INPUT.') || 
              failureReason.toLowerCase().includes('safety filter') ||
              failureReason.toUpperCase().includes('SAFETY.INPUT.TEXT') ||
              failureReason.toUpperCase().includes('SAFETY.INPUT.IMAGE') ||
              failureReason.toUpperCase().includes('SAFETY.INPUT.VIDEO') ||
              failureReason.toUpperCase().includes('SAFETY.INPUT.')) {
            setTimeout(() => {
              showSafetyFailureModal(failureReason);
            }, 1000);
          }
          // Show specific modal for internal bad output error
          else if (failureReason.includes('INTERNAL.BAD_OUTPUT.CODE01')) {
            setTimeout(() => {
              showModalDialog({
                title: "Processing Error",
                type: "warning",
                confirmText: "Try Again",
                cancelText: "Close",
                onConfirm: () => {
                  // Auto-switch to setup tab to encourage trying with different settings
                  setActiveTab('setup');
                },
                content: (
                  <div>
                    <div className="alert alert-danger border-0 mb-3" style={{ borderRadius: '8px' }}>
                      <div className="d-flex align-items-center mb-2">
                        <strong>Runway API Processing Error</strong>
                      </div>
                      <p className="mb-0">The video generation failed due to an internal processing issue with your {model === 'gen4_aleph' ? 'video' : 'image'} or prompt.</p>
                    </div>
                    
                    <div className="mb-3">
                      <strong>How to fix this:</strong>
                      <ol className="mb-0 text-muted">
                        <li><strong>Try different {model === 'gen4_aleph' ? 'video' : 'image'}</strong> - Use a clearer, simpler {model === 'gen4_aleph' ? 'video' : 'image'}</li>
                        <li><strong>Modify your prompt</strong> - Make prompt more specific and descriptive</li>
                        <li><strong>Check {model === 'gen4_aleph' ? 'video' : 'image'} format</strong> - Ensure it is {model === 'gen4_aleph' ? 'MP4 or MOV' : 'JPG or PNG'}</li>
                        <li><strong>Verify aspect ratio</strong> - Keep between 0.5-2.0 (width/height)</li>
                        <li><strong>Wait and retry</strong> - It may be a temporary server issue</li>
                      </ol>
                    </div>
                  </div>
                )
              });
            }, 1000); // Small delay to ensure generation state is cleaned up first
          }
          
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
    
    // Updated cost estimates with Gen-4 Aleph pricing
    const creditsPerVideo = model === 'gen4_aleph' ? duration * 15 : duration * 5;
    const totalCreditsNeeded = creditsPerVideo * totalJobs;
    const estimatedCostMin = totalCreditsNeeded * 0.01; // $0.01 per credit
    const estimatedCostMax = totalCreditsNeeded * 0.01; // Same rate for consistency
    
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
              <p className="mb-0">You are about to generate <strong>{totalJobs} video{totalJobs !== 1 ? 's' : ''}</strong> using <strong>{model}</strong>.</p>
            </div>
            
            <div className="row g-3 mb-3">
              <div className="col-6">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1">~${estimatedCostMin.toFixed(2)}</div>
                  <small className="text-muted">Estimated Cost</small>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-3 border rounded">
                  <div className="h5 mb-1">{totalCreditsNeeded}</div>
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
    
    // Clear any previous generation progress and upscaling progress when starting new generation
    setGenerationProgress({});
    setUpscalingProgress({});
    
    const currentGeneration = generationCounter + 1;
    setGenerationCounter(currentGeneration);
    
    addLog('🚀 Starting Runway video generation...', 'info');
    addLog('Configuration: ' + model + ', ' + aspectRatio + ', ' + duration + 's', 'info');
    addLog(`💰 Estimated cost: ~${estimatedCostMin.toFixed(2)} (${totalJobs} videos)`, 'info');
    
    if (organizationInfo) {
      const estimatedCredits = estimateCreditsNeeded(totalJobs, model, duration);
      addLog(`💳 Credit usage: ${estimatedCredits} credits (${organizationInfo.creditBalance} available)`, 'info');
    }
    
    const inputType = model === 'gen4_aleph' ? 'video' : 'image';
    addLog(`📊 Processing ${totalJobs} ${totalJobs === 1 ? 'video generation' : 'video generations'} using the same prompt and ${inputType}...`, 'info');

    const batchResults = [];
    const errors = [];
    const allPromises = [];
    
    // Get the appropriate input URL based on model
    const inputUrl = model === 'gen4_aleph' ? videoUrl : imageUrl;
    
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
          const result = await generateVideo(prompt, inputUrl, jobIndex, currentGeneration, currentVideoNumber);
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
            image_url: result.image_url || null,
            video_input_url: result.video_input_url || null,
            status: result.status,
            created_at: result.created_at,
            filename: filename,
            is_upscaled: !!result.upscaled_video_url,
            is_favorited: favoriteVideos.has(result.id),
            model: result.model || 'unknown'
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
      return `${cleanTitle}${isUpscaled ? '_4k' : ''}.mp4`;
    }
    
    // Fall back to original logic
    if (!jobId) return `video_${taskId}${isUpscaled ? '_4k' : ''}.mp4`;
    
    const genMatch = jobId.match(/Generation (\d+)/);
    const vidMatch = jobId.match(/Video (\d+)/);
    
    if (genMatch && vidMatch) {
      const generation = genMatch[1];
      const video = vidMatch[1];
      return `gen-${generation}-vid-${video}${isUpscaled ? '_4k' : ''}.mp4`;
    }
    
    return `video_${taskId}${isUpscaled ? '_4k' : ''}.mp4`;
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

  // Enhanced upscaling function with auto-navigation to results
  const upscaleVideo = async (taskId, videoUrl, videoName) => {
    if (!runwayApiKey.trim()) {
      addLog('❌ Runway API key is required for 4K upscaling!', 'error');
      return;
    }

    const upscaleId = `upscale_${taskId}`;
    
    // Get the video's display title for the upscaling cost warning
    const videoResult = results.find(r => r.id === taskId);
    const displayTitle = videoResult ? getVideoDisplayTitle(videoResult) : videoName;
    
    // Show cost warning for upscaling with corrected credit calculation
    const upscaleCredits = duration * 2; // 2 credits per second for upscaling
    
    showModalDialog({
      title: "Upscaling Cost Warning",
      type: "warning",
      confirmText: "Start 4K Upscaling",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          addLog(`🔄 Starting 4K upscaling for ${displayTitle}...`, 'info');
          
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

          addLog(`✓ 4K upscaling started for ${displayTitle} (Task ID: ${upscaleTask.id})`, 'success');
          
          // Update the original video result with upscaling info
          setResults(prev => prev.map(result => 
            result.id === taskId 
              ? { 
                  ...result, 
                  upscale_task_id: upscaleTask.id
                }
              : result
          ));
          
          // Poll for upscaling completion with auto-navigation
          pollUpscaleCompletion(upscaleTask.id, taskId, displayTitle, upscaleId);
          
        } catch (error) {
          addLog(`❌ 4K upscaling failed for ${displayTitle}: ${error.message}`, 'error');
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
            <p className="mb-0">4K upscaling costs <strong>{upscaleCredits} credits</strong> for this {duration}-second video.</p>
          </div>
          
          <div className="mb-3">
            <p className="mb-2"><strong>Video:</strong> {displayTitle}</p>
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

  // New function to poll upscaling completion with auto-navigation and updated title display
  const pollUpscaleCompletion = async (upscaleTaskId, originalTaskId, videoDisplayTitle, upscaleId) => {
    const maxPolls = Math.floor(1800 / 10); // 30 minutes with 10-second intervals
    let pollCount = 0;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(API_BASE + '/runway-status?taskId=' + upscaleTaskId + '&apiKey=' + encodeURIComponent(runwayApiKey), {
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
          throw new Error(task.error || 'Upscaling polling failed: ' + response.status);
        }
        
        let progress = 20;
        
        if (task.status === 'PENDING') {
          progress = 35;
        } else if (task.status === 'RUNNING') {
          progress = 50 + (pollCount * 3);
        } else if (task.status === 'SUCCEEDED') {
          progress = 100;
        }
        
        setUpscalingProgress(prev => ({
          ...prev,
          [upscaleId]: { 
            status: task.status.toLowerCase(), 
            progress: Math.round(progress),
            message: task.status.toLowerCase()
          }
        }));

        if (task.status === 'SUCCEEDED') {
          clearInterval(pollInterval);
          
          addLog(`✅ 4K upscaling completed for ${videoDisplayTitle}`, 'success');
          
          // Clear upscaling progress
          setUpscalingProgress(prev => {
            const updated = { ...prev };
            delete updated[upscaleId];
            return updated;
          });
          
          // Update results with upscaled video URL
          setResults(prev => prev.map(result => 
            result.id === originalTaskId 
              ? { 
                  ...result, 
                  upscaled_video_url: task.output && task.output[0] ? task.output[0] : result.video_url
                }
              : result
          ));
          
          // Always auto-navigate to results tab when upscaling completes
          addLog('🎬 Automatically switching to Results tab to show completed 4K video', 'info');
          setTimeout(() => {
            setActiveTab('results');
            // Scroll to top when switching tabs
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 500); // Small delay to ensure state updates complete
          
          // Update credits after upscaling
          updateCreditsAfterGeneration();
          
          return;
        }

        if (task.status === 'FAILED') {
          clearInterval(pollInterval);
          
          const failureReason = task.failure_reason || task.failureCode || task.error || '4K upscaling failed - no specific reason provided';
          
          addLog(`❌ 4K upscaling failed for ${videoDisplayTitle}: ${failureReason}`, 'error');
          
          setUpscalingProgress(prev => {
            const updated = { ...prev };
            delete updated[upscaleId];
            return updated;
          });
          
          return;
        }

        pollCount++;
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          addLog(`⏰ 4K upscaling timeout for ${videoDisplayTitle} after 30 minutes`, 'warning');
          setUpscalingProgress(prev => {
            const updated = { ...prev };
            delete updated[upscaleId];
            return updated;
          });
        }
        
      } catch (error) {
        clearInterval(pollInterval);
        addLog(`❌ 4K upscaling polling error for ${videoDisplayTitle}: ${error.message}`, 'error');
        setUpscalingProgress(prev => {
          const updated = { ...prev };
          delete updated[upscaleId];
          return updated;
        });
      }
    }, 10000); // Poll every 10 seconds for upscaling
  };