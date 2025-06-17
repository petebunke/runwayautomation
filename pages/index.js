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
        <style>{`
          .layout-stable {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .header-fixed {
            flex-shrink: 0;
            position: relative;
            z-index: 10;
          }
          .content-container {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          .tab-content-wrapper {
            flex: 1;
            min-height: 500px;
          }
          .nav-pills .nav-link {
            transition: all 0.15s ease-in-out;
          }
          .nav-pills .nav-link:not(.active) {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.2);
          }
          .nav-pills .nav-link:not(.active):hover {
            background: rgba(255,255,255,0.1);
            transform: translateY(-1px);
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

      <div className="layout-stable" style={{ background: 'black', color: 'white' }}>
        <div className="container-fluid py-4 content-container">
          
          {/* Header - Fixed Position */}
          <div className="header-fixed text-center mb-4">
            <h1 className="text-white mb-2" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              <Clapperboard size={36} className="me-3" style={{ verticalAlign: 'middle' }} />
              Runway Automation Pro
            </h1>
            <p className="text-white-50 mb-0" style={{ fontSize: '1.1rem' }}>
              Batch generate AI videos with RunwayML
            </p>
          </div>

          {/* Navigation - Stable */}
          <div className="row justify-content-center mb-4">
            <div className="col-auto">
              <ul className="nav nav-pills nav-fill shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }}>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'setup' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('setup')}
                    style={{ borderRadius: '8px', fontWeight: '600', minWidth: '120px' }}
                  >
                    <Settings size={20} className="me-2" />
                    Setup
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'generation' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('generation')}
                    style={{ borderRadius: '8px', fontWeight: '600', minWidth: '120px' }}
                  >
                    <Video size={20} className="me-2" />
                    Generation
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link d-flex align-items-center ${activeTab === 'results' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('results')}
                    style={{ borderRadius: '8px', fontWeight: '600', minWidth: '120px' }}
                  >
                    <Download size={20} className="me-2" />
                    Results
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab Content - Stable Container */}
          <div className="tab-content-wrapper">
            
            {/* Setup Tab */}
            {activeTab === 'setup' && (
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="card shadow-lg" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-primary text-white" style={{ borderRadius: '12px 12px 0 0' }}>
                      <h5 className="mb-0 d-flex align-items-center">
                        <Settings size={24} className="me-2" />
                        Setup Configuration
                      </h5>
                    </div>
                    <div className="card-body p-4">
                      
                      {/* API Key */}
                      <div className="mb-4">
                        <label className="form-label fw-bold">Runway API Key</label>
                        <div className="input-group">
                          <input
                            type="password"
                            className="form-control form-control-lg"
                            value={runwayApiKey}
                            onChange={(e) => setRunwayApiKey(e.target.value)}
                            placeholder="key_xxx..."
                            style={{ borderRadius: '8px 0 0 8px' }}
                          />
                          {runwayApiKey && (
                            <button className="btn btn-outline-danger" onClick={clearStoredApiKey}>
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="form-text">
                          <ExternalLink size={14} className="me-1" />
                          Get your API key from <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer">dev.runwayml.com</a>
                        </div>
                      </div>

                      {/* Prompt */}
                      <div className="mb-4">
                        <label className="form-label fw-bold">Video Prompt</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe your video scene..."
                          style={{ borderRadius: '8px' }}
                        />
                      </div>

                      {/* Image URL */}
                      <div className="mb-4">
                        <label className="form-label fw-bold">Image URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          style={{ borderRadius: '8px' }}
                        />
                        <div className="form-text">
                          Direct link to an image file (JPG, PNG, GIF, etc.)
                        </div>
                      </div>

                      {/* Settings Row */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-3">
                          <label className="form-label fw-bold">Model</label>
                          <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)} style={{ borderRadius: '8px' }}>
                            <option value="gen4_turbo">Gen-4 Turbo</option>
                            <option value="gen3a_turbo">Gen-3 Alpha Turbo</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold">Aspect Ratio</label>
                          <select className="form-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={{ borderRadius: '8px' }}>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="1:1">1:1 (Square)</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold">Duration</label>
                          <select className="form-select" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} style={{ borderRadius: '8px' }}>
                            <option value={5}>5 seconds</option>
                            <option value={10}>10 seconds</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold"># of Videos</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-control"
                            value={concurrency}
                            onChange={(e) => setConcurrency(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 20))}
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      {/* Generate Button */}
                      <div className="d-grid">
                        <button
                          className="btn btn-success btn-lg shadow"
                          onClick={generateVideos}
                          disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || isRunning}
                          style={{ borderRadius: '8px', fontWeight: '600' }}
                        >
                          <Play size={24} className="me-2" />
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
            )}

            {/* Generation Tab */}
            {activeTab === 'generation' && (
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="card shadow-lg" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center" style={{ borderRadius: '12px 12px 0 0' }}>
                      <h5 className="mb-0 d-flex align-items-center">
                        <Video size={24} className="me-2" />
                        Video Generation
                      </h5>
                      <button
                        className={`btn ${isRunning ? 'btn-danger' : 'btn-light'} btn-sm`}
                        onClick={isRunning ? () => setIsRunning(false) : generateVideos}
                        disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim()}
                        style={{ borderRadius: '6px' }}
                      >
                        {isRunning ? (
                          <>
                            <AlertCircle size={16} className="me-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play size={16} className="me-1" />
                            Start
                          </>
                        )}
                      </button>
                    </div>
                    <div className="card-body p-4">
                      
                      {/* Status Panel */}
                      <div className="alert alert-light border-0 mb-4" style={{ borderRadius: '8px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className={`me-3 rounded-circle ${isRunning ? 'bg-success' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}></div>
                            <span className="fw-bold">Status: {isRunning ? 'Running' : 'Idle'}</span>
                          </div>
                          <span className="badge bg-primary">
                            {Object.keys(generationProgress).length} active jobs
                          </span>
                        </div>
                      </div>

                      {/* Progress Cards */}
                      {Object.keys(generationProgress).length > 0 && (
                        <div className="row g-3 mb-4">
                          {Object.entries(generationProgress).map(([jobId, progress]) => (
                            <div key={jobId} className="col-md-6">
                              <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                  <h6 className="card-title mb-2">{jobId}</h6>
                                  <div className="progress mb-2" style={{ height: '6px' }}>
                                    <div 
                                      className="progress-bar bg-primary" 
                                      style={{ width: `${progress.progress}%` }}
                                    ></div>
                                  </div>
                                  <small className="text-muted">{progress.message}</small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Logs Panel */}
                      <div className="card bg-dark text-light border-0 shadow" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-dark border-0">
                          <h6 className="mb-0 text-light">Generation Log</h6>
                        </div>
                        <div className="card-body bg-dark" style={{ maxHeight: '300px', overflowY: 'auto', fontFamily: 'Consolas, monospace', fontSize: '0.85rem' }}>
                          {logs.map((log, index) => (
                            <div key={index} className={`mb-1 ${
                              log.type === 'error' ? 'text-danger' :
                              log.type === 'success' ? 'text-success' :
                              log.type === 'warning' ? 'text-warning' :
                              'text-light'
                            }`}>
                              <span className="text-info">[{log.timestamp}]</span> {log.message}
                            </div>
                          ))}
                          {logs.length === 0 && (
                            <div className="text-muted">Ready to start generation...</div>
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
                  <div className="card shadow-lg" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center" style={{ borderRadius: '12px 12px 0 0' }}>
                      <h5 className="mb-0 d-flex align-items-center">
                        <Download size={24} className="me-2" />
                        Generated Videos
                        <span className="ms-3 badge bg-light text-dark">
                          {results.length}
                        </span>
                      </h5>
                      {results.length > 0 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setResults([]);
                            addLog('All videos cleared', 'info');
                          }}
                          style={{ borderRadius: '6px' }}
                        >
                          <Trash2 size={16} className="me-1" />
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="card-body p-4" style={{ minHeight: '400px' }}>
                      
                      {results.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="mb-4">
                            <Film size={64} className="text-muted" />
                          </div>
                          <h4 className="text-muted mb-3">No videos generated yet</h4>
                          <p className="text-muted mb-4">Start a generation to see your AI-generated videos here</p>
                          <button 
                            className="btn btn-primary btn-lg" 
                            onClick={() => setActiveTab('setup')}
                            style={{ borderRadius: '8px' }}
                          >
                            <Settings size={20} className="me-2" />
                            Get Started
                          </button>
                        </div>
                      ) : (
                        <div className="row g-4">
                          {results.map((result, index) => (
                            <div key={index} className="col-md-6 col-lg-4">
                              <div className="card h-100 border-0 shadow" style={{ borderRadius: '12px' }}>
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h6 className="card-title text-primary mb-0" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                      {result.jobId}
                                    </h6>
                                    <button
                                      className="btn btn-sm p-1 border-0"
                                      onClick={() => toggleFavorite(result.id)}
                                      style={{
                                        background: 'none',
                                        color: favoriteVideos.has(result.id) ? '#e74c3c' : '#dee2e6',
                                        transition: 'color 0.2s ease'
                                      }}
                                      title={favoriteVideos.has(result.id) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                      <Heart size={18} fill={favoriteVideos.has(result.id) ? 'currentColor' : 'none'} />
                                    </button>
                                  </div>
                                  
                                  <p className="card-text text-muted mb-3" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    {result.prompt}
                                  </p>
                                  
                                  <div className="btn-group w-100" role="group">
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => downloadVideo(result.video_url, generateFilename(result.jobId, result.id))}
                                      style={{ borderRadius: '6px 0 0 6px' }}
                                    >
                                      <Download size={14} className="me-1" />
                                      Download
                                    </button>
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => window.open(result.video_url, '_blank')}
                                      style={{ borderRadius: '0 6px 6px 0' }}
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

          </div>

          {/* Footer - Fixed */}
          <div className="text-center mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <small className="text-white-50">
              Runway Automation Pro - AI Video Generation Tool
            </small>
          </div>

        </div>
      </div>
    </>
  );
}