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

  // Initialize tooltips function
  const initializeTooltips = () => {
    if (typeof window !== 'undefined' && window.bootstrap) {
      // Dispose existing tooltips first
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
        new window.bootstrap.Tooltip(tooltipTriggerEl, {
          html: true, // Enable HTML in tooltips
          placement: 'top'
        });
      });
    }
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

  // Initialize tooltips whenever the activeTab changes or component mounts
  useEffect(() => {
    if (!mounted) return;
    
    // Use a longer timeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      initializeTooltips();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [activeTab, mounted, model]); // Re-init when model changes (affects aspect ratio options)

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
          addLog(`🗑️