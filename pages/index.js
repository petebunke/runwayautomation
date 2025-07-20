import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart, ArrowUp, Edit3, Shield } from 'lucide-react';
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
  const [promptContainsProfanity, setPromptContainsProfanity] = useState(false);
  const fileInputRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Comprehensive profanity filter
  const profanityWords = [
    'fuck', 'fucking', 'fucked', 'fucker', 'fucks', 'shit', 'shitting', 'shits', 'damn', 'damned',
    'hell', 'bitch', 'bitches', 'bastard', 'bastards', 'asshole', 'assholes', 'crap', 'piss',
    'whore', 'slut', 'sluts', 'cock', 'cocks', 'dick', 'dicks', 'pussy', 'cunt', 'cunts',
    'tits', 'boobs', 'nipples', 'penis', 'vagina', 'anus', 'rape', 'raping', 'raped',
    'nigger', 'nigga', 'chink', 'gook', 'spic', 'wetback', 'kike', 'faggot', 'fag', 'dyke',
    'retard', 'retarded', 'mongoloid', 'cripple', 'midget',
    'kill', 'murder', 'suicide', 'death', 'torture', 'abuse', 'violence', 'shoot', 'shooting',
    'bomb', 'explosion', 'terrorist', 'terrorism', 'weapon', 'gun', 'knife', 'blood', 'gore',
    'brutal', 'savage', 'attack', 'assault', 'harm', 'hurt', 'pain', 'suffer', 'bleeding',
    'cocaine', 'heroin', 'meth', 'methamphetamine', 'crack', 'weed', 'marijuana', 'cannabis',
    'drugs', 'overdose', 'addiction', 'needle', 'inject', 'snort', 'smoke', 'high', 'stoned',
    'sex', 'sexual', 'naked', 'nude', 'porn', 'pornography', 'masturbate', 'orgasm', 'climax',
    'erotic', 'aroused', 'horny', 'seduce', 'seduction', 'fetish', 'kinky', 'bondage',
    'prostitute', 'escort', 'brothel', 'strip', 'stripper', 'underwear', 'lingerie',
    'f*ck', 'f**k', 'sh*t', 'sh!t', 'b*tch', 'a**hole', 'a$$hole', 'n*gger', 'f@g',
    'fuk', 'fack', 'phuck', 'shyt', 'byatch', 'azz', 'azzhole', 'biatch'
  ];

  const checkForProfanity = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (profanityWords.includes(cleanWord)) {
        return true;
      }
    }
    
    for (const profaneWord of profanityWords) {
      if (lowerText.includes(profaneWord)) {
        return true;
      }
    }
    
    return false;
  };

  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    const containsProfanity = checkForProfanity(newPrompt);
    
    if (containsProfanity && !promptContainsProfanity) {
      showModalDialog({
        title: "Content Warning",
        type: "warning",
        confirmText: "I Understand",
        cancelText: null,
        onConfirm: () => {
          setPromptContainsProfanity(true);
          setPrompt(newPrompt);
        },
        content: (
          <div>
            <div className="alert alert-warning border-0 mb-3" style={{ borderRadius: '8px' }}>
              <div className="d-flex align-items-center mb-2">
                <Shield size={20} className="text-warning me-2" />
                <strong>Inappropriate Content Detected</strong>
              </div>
              <p className="mb-0">Your video prompt contains potentially inappropriate or offensive language.</p>
            </div>
            
            <div className="mb-3">
              <p className="mb-2"><strong>Please note:</strong></p>
              <ul className="mb-0 ps-3">
                <li>Runway AI has content policies that may reject inappropriate prompts</li>
                <li>Videos with offensive content may be automatically flagged or removed</li>
                <li>Consider rephrasing your prompt to avoid policy violations</li>
                <li>This could result in wasted credits or API restrictions</li>
              </ul>
            </div>
            
            <p className="mb-0 text-muted">
              We recommend using professional, appropriate language for better results and compliance with Runway's terms of service.
            </p>
          </div>
        )
      });
      return;
    }
    
    setPrompt(newPrompt);
    
    if (!containsProfanity && promptContainsProfanity) {
      setPromptContainsProfanity(false);
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

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
              {cancelText && (
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ borderRadius: '8px', fontWeight: '600', width: '50%' }}
                >
                  {cancelText}
                </button>
              )}
              {onConfirm && (
                <button
                  className={`btn ${type === 'warning' ? 'btn-danger' : 'btn-primary'} shadow`}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  style={{ borderRadius: '8px', fontWeight: '600', width: cancelText ? '50%' : '100%' }}
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

  // Load saved data on mount
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
        setPromptContainsProfanity(checkForProfanity(savedPrompt));
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

      const savedActiveTab = localStorage.getItem('runway-automation-active-tab');
      if (savedActiveTab && ['setup', 'generation', 'results'].includes(savedActiveTab)) {
        setActiveTab(savedActiveTab);
      }
    } catch (error) {
      console.warn('Failed to load saved data from localStorage:', error);
    }
  }, [mounted]);

  // Save data effects
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

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('runway-automation-active-tab', activeTab);
    } catch (error) {
      console.warn('Failed to save active tab to localStorage:', error);
    }
  }, [activeTab, mounted]);

  // Helper functions
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
      const gen3RatioMap = {
        '16:9': '1280:768',
        '9:16': '768:1280'
      };
      return gen3RatioMap[ratio] || '1280:768';
    }
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
    return creditsPerVideo * totalJobs;
  };

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

  useEffect(() => {
    if (runwayApiKey && runwayApiKey.trim() && runwayApiKey.length > 10) {
      checkOrganizationCredits();
    }
  }, [runwayApiKey]);

  const updateCreditsAfterGeneration = () => {
    if (runwayApiKey && runwayApiKey.trim()) {
      setTimeout(() => {
        checkOrganizationCredits();
      }, 2000);
    }
  };

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

  // Simplified video generation functions for space
  const generateVideo = async (promptText, imageUrlText, jobIndex = 0, generationNum, videoNum) => {
    const jobId = 'Generation ' + generationNum + ' - Video ' + videoNum;
    addLog('Starting generation for job ' + (jobIndex + 1), 'info');
    // Placeholder for actual implementation
    return null;
  };

  const generateVideos = async () => {
    if (!checkRequiredInputs()) return;
    addLog('🚀 Starting video generation...', 'info');
  };

  return (
    <>
      <Head>
        <title>Runway Automation - Batch Video Generation</title>
        <meta name="description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <script 
          src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
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

      <div className="vh-100 overflow-auto" style={{ background: 'black', fontFamily: 'Normal, Inter, system-ui, sans-serif' }}>
        <div className="container-fluid py-4 h-100" style={{ paddingRight: '0', paddingLeft: '0' }}>
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
                A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones.
              </p>
            </div>
          </div>

          <div className="row justify-content-center mb-4" style={{ margin: '0' }}>
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
            <div className="row justify-content-center" style={{ margin: '0' }}>
              <div className="col-lg-10" style={{ maxWidth: '1200px', paddingLeft: '12px', paddingRight: '12px' }}>
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0 h-100" style={{ borderRadius: '8px', overflow: 'hidden' }}>
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
                      
                      <div className="card-body p-4 d-flex flex-column" style={{ paddingTop: '30px !important' }}>
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

                        <div className="alert alert-warning border-0 shadow-sm mb-4" style={{ borderRadius: '8px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <CreditCard size={20} className="text-warning me-2" />
                            <strong>Credits Required</strong>
                          </div>
                          <p className="mb-2 small">The Runway API requires credits for all video generations.</p>
                          <ul className="small mb-0 ps-3">
                            <li>Purchase credits at <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-bold">dev.runwayml.com</a></li>
                            <li>Minimum $10 (1000 credits)</li>
                            <li>~25-50 credits per 5-10 second video ($0.25-$0.50)</li>
                            <li>~10-20 credits for 4K upscaling ($0.10-$0.20)</li>
                            <li>Credits are separate from web app credits</li>
                          </ul>
                          
                          <div className="mt-3 pt-3 border-top border-warning">
                            <div className="row g-2">
                              <div className="col-6">
                                <div className="text-center p-2 border rounded bg-white">
                                  <div className="h6 mb-0 text-success">
                                    {organizationInfo ? organizationInfo.creditBalance : 0}
                                  </div>
                                  <small className="text-muted">Credits</small>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="text-center p-2 border rounded bg-white">
                                  <div className="h6 mb-0 text-primary">
                                    {(() => {
                                      if (!organizationInfo?.tierInfo || !organizationInfo?.usageInfo) return '0/0';
                                      
                                      const isGen4 = model === 'gen4_turbo';
                                      const dailyUsed = isGen4 ? 
                                        (organizationInfo.usageInfo.dailyGen4Turbo || 0) :
                                        (organizationInfo.usageInfo.dailyGen3aTurbo || 0);
                                      const dailyMax = isGen4 ?
                                        (organizationInfo.tierInfo.maxDailyGen4Turbo || 0) :
                                        (organizationInfo.tierInfo.maxDailyGen3aTurbo || 0);
                                      
                                      return `${dailyUsed}/${dailyMax}`;
                                    })()}
                                  </div>
                                  <small className="text-muted">Daily Generations</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row g-3 flex-grow-1">
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
                                title="16:9 for YouTube, TV, and desktop. 9:16 for TikTok, IG Stories, and mobile. 1:1 for IG posts."
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

                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0 h-100" style={{ borderRadius: '8px', overflow: 'hidden' }}>
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
                      
                      <div className="card-body p-4 d-flex flex-column" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4"></div>
                        <div className="mb-4">
                          <label className="form-label fw-bold">
                            Video Prompt
                            {promptContainsProfanity && (
                              <span className="badge bg-warning text-dark ms-2" title="Content warning detected">
                                <Shield size={12} className="me-1" />
                                Warning
                              </span>
                            )}
                          </label>
                          <div className="position-relative">
                            <textarea
                              className={`form-control ${promptContainsProfanity ? 'border-warning' : ''}`}
                              rows="3"
                              value={prompt}
                              onChange={handlePromptChange}
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
                          {promptContainsProfanity && (
                            <div className="form-text text-warning">
                              <Shield size={14} className="me-1" />
                              Content warning: This prompt may violate Runway's content policies
                            </div>
                          )}
                        </div>

                        <div className="mb-4 flex-grow-1 d-flex flex-column">
                          <label className="form-label fw-bold">
                            Image
                            <i 
                              className="bi bi-info-circle ms-1 text-primary" 
                              style={{ cursor: 'help' }}
                              data-bs-toggle="tooltip" 
                              data-bs-placement="top" 
                              title="Upload an image file or paste an image URL. Image aspect ratio must be between 0.5 and 2.0."
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
                              className="d-flex align-items-center justify-content-center border border-2 border-dashed rounded p-4 text-center flex-grow-1"
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
                            <div className="position-relative flex-grow-1 d-flex">
                              <img 
                                src={imageUrl} 
                                alt="Uploaded image preview"
                                className="img-fluid rounded border w-100"
                                style={{ height: 'auto', maxHeight: '300px', objectFit: 'contain' }}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                              />
                              <button
                                className="btn btn-danger btn-sm position-absolute"
                                onClick={() => {
                                  setImageUrl('');
                                  setImageError(false);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                style={{ 
                                  border: 'none',
                                  background: 'rgba(220, 53, 69, 0.9)',
                                  borderRadius: '50%', 
                                  width: '32px', 
                                  height: '32px', 
                                  fontSize: '18px', 
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1',
                                  top: '8px',
                                  right: '8px',
                                  color: 'white'
                                }}
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
                        </div>
                        
                        <div className="mt-auto pt-3">
                          <button
                            className="btn btn-success btn-lg w-100 shadow"
                            onClick={() => {
                              setActiveTab('generation');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              setTimeout(() => {
                                if (!isRunning) {
                                  generateVideos();
                                }
                              }, 100);
                            }}
                            disabled={isRunning}
                            style={{ 
                              borderRadius: '8px', 
                              fontWeight: '600',
                              backgroundColor: '#28a745',
                              borderColor: '#28a745',
                              opacity: '1',
                              transition: 'opacity 0.15s ease-in-out'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.85'}
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
          )}

          {activeTab === 'generation' && (
            <div className="row justify-content-center" style={{ margin: '0' }}>
              <div className="col-lg-10" style={{ maxWidth: '1200px', paddingLeft: '12px', paddingRight: '12px' }}>
                <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden', height: 'calc(100vh - 320px)' }}>
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
                    
                    <div style={{ marginRight: '30px', marginTop: '10px', marginBottom: '10px' }}>
                      {!isRunning ? (
                        <button
                          className="btn btn-success btn-lg shadow"
                          onClick={generateVideos}
                          disabled={isRunning}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600', 
                            marginTop: '6px', 
                            marginBottom: '6px',
                            opacity: '1',
                            transition: 'opacity 0.15s ease-in-out',
                            backgroundColor: '#28a745',
                            borderColor: '#28a745'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.85'}
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
                          onClick={() => setIsRunning(false)}
                          style={{ borderRadius: '8px', fontWeight: '600', marginTop: '10px', marginBottom: '10px' }}
                        >
                          <AlertCircle size={24} className="me-2" />
                          Stop Generation
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-body p-4 d-flex flex-column" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4"></div>
                    <div className="card text-white mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '8px' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark text-uppercase d-flex align-items-center" style={{ fontSize: '0.875rem', height: '100%' }}>CONNECTION STATUS</span>
                          <div className="d-flex gap-5 align-items-center text-center">
                            <span className="text-dark"><strong>API:</strong> {runwayApiKey ? '✓ Connected' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Prompt:</strong> {prompt.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Image:</strong> {imageUrl.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Credits:</strong> {organizationInfo ? organizationInfo.creditBalance : 0}</span>
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

                    <div className="mb-4" style={{ minHeight: '100px' }}>
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

                    <div className="card bg-dark text-light border-0 shadow" style={{ 
                      borderRadius: '8px',
                      height: '300px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div className="card-header bg-transparent border-0 pb-2 pt-3 px-3 d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
                        <h5 className="fw-bold mb-0" style={{ color: '#ffffff' }}>Video Generation Log</h5>
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
                      <div 
                        ref={logContainerRef}
                        style={{ 
                          fontFamily: 'monospace',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          flex: 1,
                          minHeight: 0,
                          padding: '8px 16px',
                          scrollBehavior: 'smooth'
                        }}
                      >
                        {logs.map((log, index) => (
                          <div key={index} className={`small ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-light' :
                            log.type === 'warning' ? 'text-warning' :
                            'text-light'
                          }`} style={{ marginBottom: '4px' }}>
                            <span style={{ color: '#0d6efd' }}>[{log.timestamp}]</span> {log.message}
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="text-muted small">
                            No logs yet... Logs will appear here during video generation and persist across page refreshes.
                          </div>
                        )}
                        {logs.length > 0 && <div style={{ minHeight: '20px' }}></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="row justify-content-center" style={{ margin: '0' }}>
              <div className="col-lg-10" style={{ maxWidth: '1200px', paddingLeft: '12px', paddingRight: '12px' }}>
                <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden', height: 'calc(100vh - 320px)' }}>
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
                            onClick={() => addLog('Download feature coming soon!', 'info')}
                            style={{ borderRadius: '8px', fontWeight: '600' }}
                          >
                            <Download size={20} className="me-2" />
                            All Videos
                            <span className="ms-2 badge bg-primary">
                              {results.filter(result => result.video_url && result.status === 'completed').length}
                            </span>
                          </button>
                          
                          <button
                            className="btn btn-outline-light shadow"
                            onClick={clearGeneratedVideos}
                            style={{ borderRadius: '8px', fontWeight: '600' }}
                          >
                            <Trash2 size={16} className="me-2" />
                            Clear Videos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body p-4 d-flex flex-column" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4"></div>
                    {results.length === 0 ? (
                      <div className="text-center py-4 flex-grow-1 d-flex flex-column justify-content-center">
                        <div className="mb-4">
                          <Film size={80} className="text-muted" />
                        </div>
                        <h4 className="text-muted mb-3">No videos generated yet</h4>
                        <p className="text-muted mb-4">Start a generation process to see your AI-generated videos here</p>
                        <div className="d-flex justify-content-center">
                          <button
                            className="btn btn-primary btn-lg shadow"
                            onClick={() => setActiveTab('setup')}
                            style={{ borderRadius: '6px', paddingLeft: '2rem', paddingRight: '2rem' }}
                          >
                            Get Started
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="row g-4 flex-grow-1" style={{ overflowY: 'auto' }}>
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
                                    color: favoriteVideos.has(result.id) ? '#e74c3c' : '#6c757d',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title={favoriteVideos.has(result.id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <Heart 
                                    size={16} 
                                    fill={favoriteVideos.has(result.id) ? 'currentColor' : 'none'}
                                  />
                                </button>
                              </div>
                              
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <span className="fw-bold text-primary me-2" style={{ 
                                    lineHeight: '1.2',
                                    wordBreak: 'break-word',
                                    maxWidth: '200px',
                                    flex: '1'
                                  }}>
                                    {getVideoDisplayTitle(result)}
                                  </span>
                                </div>
                                <h6 className="card-title mb-3" style={{ fontWeight: '400' }} title={result.prompt}>
                                  {result.prompt}
                                </h6>
                                
                                <div className="d-grid gap-2">
                                  {result.video_url && (
                                    <div className="btn-group" role="group">
                                      <button
                                        className="btn btn-primary btn-sm flex-fill"
                                        onClick={() => addLog('Download feature coming soon!', 'info')}
                                      >
                                        <Download size={16} className="me-1" />
                                        Download
                                      </button>
                                      <button
                                        className="btn btn-outline-primary btn-sm flex-fill"
                                        onClick={() => window.open(result.video_url, '_blank', 'noopener,noreferrer')}
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

          <div className="text-center mt-4 mb-4">
            <div className="d-flex align-items-center justify-content-center text-white-50">
              <small>Based on <a href="https://apify.com/igolaizola/runway-automation" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Runway Automation for Apify</a> by <a href="https://igolaizola.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Iñigo Garcia Olaizola</a>.<br />Vibe coded by <a href="https://petebunke.com" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Pete Bunke</a>. All rights reserved.<br /><a href="mailto:petebunke@gmail.com?subject=Runway%20Automation%20User%20Feedback" className="text-white-50 text-decoration-none"><strong>Got user feedback?</strong> Hit me up!</a></small>
            </div>
            <div className="d-flex align-items-center justify-content-center text-white-50 mt-2" style={{ marginLeft: '5px'}}>
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://runway-static-assets.s3.amazonaws.com/site/images/api-page/powered-by-runway-white.png" 
                  alt="Powered by Runway" 
                  style={{ height: '24px', opacity: '0.7', marginBottom:'20px' }}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}