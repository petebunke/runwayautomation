import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen } from 'lucide-react';
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

  // Load and save data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('runway-data');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.apiKey) setRunwayApiKey(data.apiKey);
          if (data.prompt) setPrompt(data.prompt);
          if (data.imageUrl) setImageUrl(data.imageUrl);
          if (data.model) setModel(data.model);
          if (data.aspectRatio) setAspectRatio(data.aspectRatio);
          if (data.duration) setDuration(data.duration);
          if (data.concurrency) setConcurrency(data.concurrency);
        }
      } catch (error) {
        console.warn('Failed to load data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          apiKey: runwayApiKey,
          prompt: prompt,
          imageUrl: imageUrl,
          model: model,
          aspectRatio: aspectRatio,
          duration: duration,
          concurrency: concurrency
        };
        localStorage.setItem('runway-data', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save data:', error);
      }
    }
  }, [runwayApiKey, prompt, imageUrl, model, aspectRatio, duration, concurrency]);

  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addLog('Please select a valid image file', 'error');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        setImageError(false);
        addLog('Image uploaded successfully', 'success');
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        addLog('Failed to read image file', 'error');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      addLog('Error uploading image', 'error');
      setIsUploadingImage(false);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const modelOptions = [
    { value: 'gen4_turbo', label: 'Gen-4 Turbo (Newest)' },
    { value: 'gen3a_turbo', label: 'Gen-3 Alpha Turbo' }
  ];

  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    ...(model === 'gen4_turbo' ? [
      { value: '1:1', label: '1:1 (Square)' },
      { value: '4:3', label: '4:3 (Standard)' }
    ] : [])
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearStoredApiKey = () => {
    setRunwayApiKey('');
    addLog('API key cleared', 'info');
  };

  const generateVideos = async () => {
    setIsRunning(true);
    setLogs([]);
    
    addLog('Starting video generation...', 'info');
    
    if (!prompt.trim()) {
      addLog('No prompt provided!', 'error');
      setIsRunning(false);
      return;
    }

    if (!imageUrl.trim()) {
      addLog('Image is required!', 'error');
      setIsRunning(false);
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('API key is required!', 'error');
      setIsRunning(false);
      return;
    }

    // Simulate generation for now
    addLog('Generation process would start here', 'info');
    setTimeout(() => {
      setIsRunning(false);
      addLog('Generation completed', 'success');
    }, 3000);
  };

  return (
    <>
      <Head>
        <title>Runway Automation Pro</title>
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" />
      </Head>

      <div className="min-vh-100" style={{ background: 'black', fontFamily: 'system-ui, sans-serif' }}>
        <div className="container-fluid py-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <button 
                onClick={() => setActiveTab('setup')}
                className="btn btn-link text-white text-decoration-none p-0 d-flex align-items-center"
                style={{ fontSize: '1.75rem', fontWeight: 'bold' }}
              >
                <Clapperboard size={36} className="me-3" />
                Runway Automation Pro
              </button>
            </div>
            <div className="text-end">
              <p className="lead text-white-50 mb-0" style={{ maxWidth: '420px', fontSize: '1rem' }}>
                Generate multiple AI videos from one prompt
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
                    <div className="card shadow-lg border-0" style={{ borderRadius: '8px' }}>
                      <div className="bg-primary text-white text-center py-3">
                        <h3 className="mb-0 fw-bold">API Setup</h3>
                      </div>
                      <div className="card-body p-4">
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">RunwayML API Key</label>
                            {runwayApiKey && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={clearStoredApiKey}
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
                            <label className="form-label fw-bold">Duration</label>
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
                            <label className="form-label fw-bold"># of Videos</label>
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
                              }}
                              style={{ borderRadius: '8px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card shadow-lg border-0" style={{ borderRadius: '8px' }}>
                      <div className="bg-primary text-white text-center py-3">
                        <h3 className="mb-0 fw-bold">Video Setup</h3>
                      </div>
                      <div className="card-body p-4">
                        <div className="mb-4">
                          <label className="form-label fw-bold">Video Prompt</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your video..."
                            style={{ borderRadius: '8px' }}
                          />
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
                                minHeight: '120px'
                              }}
                              onClick={triggerImageUpload}
                            >
                              <div>
                                {isUploadingImage ? (
                                  <>
                                    <div className="spinner-border text-primary mb-2" />
                                    <div className="text-muted">Uploading...</div>
                                  </>
                                ) : (
                                  <>
                                    <FolderOpen size={48} className="text-primary mb-2" />
                                    <div className="text-primary fw-bold mb-1">Click to upload image</div>
                                    <div className="text-muted small">or paste URL below</div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="position-relative">
                              <img 
                                src={imageUrl} 
                                alt="Preview"
                                className="img-fluid rounded border w-100"
                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                              />
                              <button
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                onClick={() => {
                                  setImageUrl('');
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
                              placeholder="Or paste image URL..."
                              style={{ borderRadius: '8px' }}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <button
                              className="btn btn-success btn-lg w-100"
                              onClick={() => {
                                setActiveTab('generation');
                                setTimeout(() => {
                                  if (!isRunning) {
                                    generateVideos();
                                  }
                                }, 100);
                              }}
                              disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || isRunning}
                              style={{ borderRadius: '8px', fontWeight: '600' }}
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
                <div className="card shadow-lg border-0" style={{ borderRadius: '8px' }}>
                  <div className="bg-primary text-white text-center py-3 d-flex justify-content-between align-items-center px-4">
                    <h2 className="mb-0 fw-bold">Video Generation</h2>
                    <button
                      className="btn btn-success btn-lg"
                      onClick={generateVideos}
                      disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || isRunning}
                      style={{ borderRadius: '8px', fontWeight: '600' }}
                    >
                      <Play size={24} className="me-2" />
                      {isRunning ? 'Generating...' : 'Start Generation'}
                    </button>
                  </div>
                  
                  <div className="card-body p-4">
                    <div className="card bg-dark text-light">
                      <div className="card-header">
                        <h5 className="mb-0">Generation Log</h5>
                      </div>
                      <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        {logs.map((log, index) => (
                          <div key={index} className={`small mb-1 ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-success' :
                            log.type === 'warning' ? 'text-warning' :
                            'text-light'
                          }`}>
                            <span className="text-muted">[{log.timestamp}]</span> {log.message}
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="text-muted small">
                            Ready to start generation...
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
                <div className="card shadow-lg border-0" style={{ borderRadius: '8px' }}>
                  <div className="bg-primary text-white text-center py-3">
                    <h2 className="mb-0 fw-bold">Generated Videos</h2>
                  </div>
                  <div className="card-body p-4">
                    <div className="text-center py-5">
                      <Film size={80} className="text-muted" />
                      <h4 className="text-muted mb-3">No videos generated yet</h4>
                      <p className="text-muted mb-4">Start a generation to see your videos here</p>
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setActiveTab('setup')}
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}