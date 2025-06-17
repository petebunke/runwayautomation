import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Play, Settings, Download, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen, Heart } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);
  const [favoriteVideos, setFavoriteVideos] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [hasShownCostWarning, setHasShownCostWarning] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [completedGeneration, setCompletedGeneration] = useState(null);
  const [generationCounter, setGenerationCounter] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const HEADER_BLUE = '#0d6efd';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal Component
  const Modal = ({ show, onClose, title, children, onConfirm, confirmText = "Confirm", cancelText = "Cancel", type = "confirm" }) => {
    if (!show) return null;
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="card shadow-lg border-0" style={{ borderRadius: '8px', overflow: 'hidden', maxWidth: '500px', width: '90%' }}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{title}</h5>
          </div>
          <div className="card-body p-4">
            {children}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button className="btn btn-secondary" onClick={onClose}>{cancelText}</button>
              {onConfirm && (
                <button className={`btn ${type === 'warning' ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
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

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearStoredApiKey = () => {
    if (mounted) {
      try {
        localStorage.removeItem('runway-automation-api-key');
        setRunwayApiKey('');
        addLog('API key cleared', 'info');
      } catch (error) {
        console.warn('Failed to clear API key:', error);
      }
    }
  };

  const generateVideos = async () => {
    if (!runwayApiKey.trim()) {
      addLog('❌ RunwayML API key is required!', 'error');
      return;
    }
    if (!prompt.trim()) {
      addLog('❌ No prompt provided!', 'error');
      return;
    }
    if (!imageUrl.trim()) {
      addLog('❌ Image URL is required!', 'error');
      return;
    }

    const totalJobs = Math.min(Math.max(parseInt(concurrency) || 1, 1), 20);
    const estimatedCostMin = totalJobs * 0.25;
    const estimatedCostMax = totalJobs * 0.75;
    
    if (!hasShownCostWarning) {
      showModalDialog({
        title: "Cost Warning",
        type: "warning",
        confirmText: "Proceed with Generation",
        cancelText: "Cancel",
        onConfirm: () => {
          setHasShownCostWarning(true);
          startGeneration(totalJobs);
        },
        content: (
          <div>
            <p>You are about to generate <strong>{totalJobs} video{totalJobs !== 1 ? 's' : ''}</strong>.</p>
            <p>Estimated cost: ${estimatedCostMin.toFixed(2)} - ${estimatedCostMax.toFixed(2)}</p>
            <p>Are you sure you want to proceed?</p>
          </div>
        )
      });
      return;
    }
    startGeneration(totalJobs);
  };

  const startGeneration = async (totalJobs) => {
    setIsRunning(true);
    setLogs([]);
    addLog('🚀 Starting video generation...', 'info');
    
    // Simulate generation process
    for (let i = 0; i < totalJobs; i++) {
      const jobId = `Generation 1 - Video ${i + 1}`;
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'running', progress: 50, message: 'Processing...' }
      }));
      
      // Simulate completion after 2 seconds
      setTimeout(() => {
        setGenerationProgress(prev => {
          const updated = { ...prev };
          delete updated[jobId];
          return updated;
        });
        
        const completedVideo = {
          id: `video_${Date.now()}_${i}`,
          prompt: prompt,
          video_url: 'https://example.com/video.mp4',
          status: 'completed',
          created_at: new Date().toISOString(),
          jobId: jobId
        };
        
        setResults(prev => [...prev, completedVideo]);
        addLog(`✓ Video ${i + 1} completed`, 'success');
        
        if (i === totalJobs - 1) {
          setIsRunning(false);
          setCompletedGeneration(1);
          setActiveTab('results');
        }
      }, (i + 1) * 2000);
    }
  };

  const downloadVideo = async (videoUrl, filename) => {
    addLog(`Downloading ${filename}...`, 'info');
    // Simulate download
    window.open(videoUrl, '_blank');
  };

  const generateFilename = (jobId, taskId) => {
    return `video_${taskId}.mp4`;
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

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Runway Automation Pro</title>
        <meta name="description" content="AI Video Generation Tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" />
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

      <div className="min-vh-100" style={{ background: 'black', color: 'white' }}>
        <div className="container-fluid py-4">
          
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-white">
              <Clapperboard size={36} className="me-3" />
              Runway Automation Pro
            </h1>
            <p className="text-white-50">Batch generate AI videos with RunwayML</p>
          </div>

          {/* Navigation */}
          <div className="row justify-content-center mb-3">
            <div className="col-auto">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'setup' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('setup')}
                  >
                    <Settings size={20} className="me-2" />
                    Setup
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'generation' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('generation')}
                  >
                    <Video size={20} className="me-2" />
                    Generation
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'results' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('results')}
                  >
                    <Download size={20} className="me-2" />
                    Results
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Setup Tab */}
          {activeTab === 'setup' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header">
                    <h5>Setup Configuration</h5>
                  </div>
                  <div className="card-body">
                    
                    {/* API Key */}
                    <div className="mb-3">
                      <label className="form-label">Runway API Key</label>
                      <div className="input-group">
                        <input
                          type="password"
                          className="form-control"
                          value={runwayApiKey}
                          onChange={(e) => setRunwayApiKey(e.target.value)}
                          placeholder="key_xxx..."
                        />
                        {runwayApiKey && (
                          <button className="btn btn-outline-danger" onClick={clearStoredApiKey}>
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="form-text">
                        Get your API key from <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer">dev.runwayml.com</a>
                      </div>
                    </div>

                    {/* Prompt */}
                    <div className="mb-3">
                      <label className="form-label">Video Prompt</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your video..."
                      />
                    </div>

                    {/* Image URL */}
                    <div className="mb-3">
                      <label className="form-label">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Settings */}
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label">Model</label>
                        <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)}>
                          <option value="gen4_turbo">Gen-4 Turbo</option>
                          <option value="gen3a_turbo">Gen-3 Alpha Turbo</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Aspect Ratio</label>
                        <select className="form-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                          <option value="16:9">16:9 (Landscape)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                          <option value="1:1">1:1 (Square)</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Duration</label>
                        <select className="form-select" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
                          <option value={5}>5 seconds</option>
                          <option value={10}>10 seconds</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label"># of Videos</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="form-control"
                          value={concurrency}
                          onChange={(e) => setConcurrency(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 20))}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        className="btn btn-success w-100"
                        onClick={generateVideos}
                        disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || isRunning}
                      >
                        <Play size={20} className="me-2" />
                        Generate Video{concurrency > 1 ? 's' : ''}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generation Tab */}
          {activeTab === 'generation' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Video Generation</h5>
                    <button
                      className={`btn ${isRunning ? 'btn-danger' : 'btn-success'}`}
                      onClick={isRunning ? () => setIsRunning(false) : generateVideos}
                      disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim()}
                    >
                      {isRunning ? (
                        <>
                          <AlertCircle size={20} className="me-2" />
                          Stop Generation
                        </>
                      ) : (
                        <>
                          <Play size={20} className="me-2" />
                          Start Generation
                        </>
                      )}
                    </button>
                  </div>
                  <div className="card-body">
                    
                    {/* Status */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <span>Status: {isRunning ? 'Running' : 'Idle'}</span>
                        <span>Progress: {Object.keys(generationProgress).length} active jobs</span>
                      </div>
                    </div>

                    {/* Progress Cards */}
                    {Object.keys(generationProgress).length > 0 && (
                      <div className="row g-3 mb-3">
                        {Object.entries(generationProgress).map(([jobId, progress]) => (
                          <div key={jobId} className="col-md-6">
                            <div className="card">
                              <div className="card-body">
                                <h6>{jobId}</h6>
                                <div className="progress mb-2">
                                  <div 
                                    className="progress-bar" 
                                    style={{ width: `${progress.progress}%` }}
                                  ></div>
                                </div>
                                <small>{progress.message}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Logs */}
                    <div className="card bg-dark text-light">
                      <div className="card-header">
                        <h6 className="mb-0">Generation Log</h6>
                      </div>
                      <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        {logs.map((log, index) => (
                          <div key={index} className={`small mb-1 ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-success' :
                            log.type === 'warning' ? 'text-warning' :
                            'text-light'
                          }`}>
                            [{log.timestamp}] {log.message}
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="text-muted small">Ready to start generation...</div>
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
              <div className="col-lg-10">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Generated Videos</h5>
                    {results.length > 0 && (
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          setResults([]);
                          addLog('All videos cleared', 'info');
                        }}
                      >
                        <Trash2 size={16} className="me-2" />
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    
                    {results.length === 0 ? (
                      <div className="text-center py-5">
                        <Film size={48} className="text-muted mb-3" />
                        <h5 className="text-muted">No videos generated yet</h5>
                        <p className="text-muted">Start a generation to see your videos here</p>
                        <button className="btn btn-primary" onClick={() => setActiveTab('setup')}>
                          Get Started
                        </button>
                      </div>
                    ) : (
                      <div className="row g-4">
                        {results.map((result, index) => (
                          <div key={index} className="col-md-6 col-lg-4">
                            <div className="card h-100">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="card-title">{result.jobId}</h6>
                                  <button
                                    className="btn btn-sm p-1"
                                    onClick={() => toggleFavorite(result.id)}
                                    style={{
                                      border: 'none',
                                      background: 'none',
                                      color: favoriteVideos.has(result.id) ? '#e74c3c' : '#dee2e6'
                                    }}
                                  >
                                    <Heart size={16} fill={favoriteVideos.has(result.id) ? 'currentColor' : 'none'} />
                                  </button>
                                </div>
                                <p className="card-text small">{result.prompt}</p>
                                <div className="btn-group w-100">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => downloadVideo(result.video_url, generateFilename(result.jobId, result.id))}
                                  >
                                    <Download size={14} className="me-1" />
                                    Download
                                  </button>
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => window.open(result.video_url, '_blank')}
                                  >
                                    <ExternalLink size={14} className="me-1" />
                                    View
                                  </button>
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
            <small className="text-white-50">
              Runway Automation Pro - AI Video Generation Tool
            </small>
          </div>

        </div>
      </div>
    </>
  );
}