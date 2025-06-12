import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Clapperboard, Key, ExternalLink, CreditCard, Video, FolderOpen } from 'lucide-react';
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
  const fileInputRef = useRef(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
        if (savedModel && ['gen3a_turbo', 'gen4_turbo'].includes(savedModel)) {
          setModel(savedModel);
        }
        
        const savedAspectRatio = localStorage.getItem('runway-automation-aspect-ratio');
        if (savedAspectRatio && ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'].includes(savedAspectRatio)) {
          setAspectRatio(savedAspectRatio);
        }
        
        const savedDuration = localStorage.getItem('runway-automation-duration');
        if (savedDuration && ['5', '10'].includes(savedDuration)) {
          setDuration(parseInt(savedDuration));
        }
        
        const savedConcurrency = localStorage.getItem('runway-automation-concurrency');
        if (savedConcurrency) {
          const parsedConcurrency = parseInt(savedConcurrency);
          if (!isNaN(parsedConcurrency) && parsedConcurrency >= 1 && parsedConcurrency <= 20) {
            setConcurrency(parsedConcurrency);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved data from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (runwayApiKey && runwayApiKey.trim() && runwayApiKey.length > 5) {
          localStorage.setItem('runway-automation-api-key', runwayApiKey);
        } else if (runwayApiKey === '') {
          localStorage.removeItem('runway-automation-api-key');
        }
      } catch (error) {
        console.warn('Failed to save API key:', error);
      }
    }
  }, [runwayApiKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (prompt && prompt.trim()) {
          localStorage.setItem('runway-automation-prompt', prompt);
        } else if (prompt === '') {
          localStorage.removeItem('runway-automation-prompt');
        }
      } catch (error) {
        console.warn('Failed to save prompt:', error);
      }
    }
  }, [prompt]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (imageUrl && imageUrl.trim()) {
          localStorage.setItem('runway-automation-image-url', imageUrl);
        } else if (imageUrl === '') {
          localStorage.removeItem('runway-automation-image-url');
        }
      } catch (error) {
        console.warn('Failed to save image URL:', error);
      }
    }
  }, [imageUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('runway-automation-model', model);
      } catch (error) {
        console.warn('Failed to save model:', error);
      }
    }
  }, [model]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('runway-automation-aspect-ratio', aspectRatio);
      } catch (error) {
        console.warn('Failed to save aspect ratio:', error);
      }
    }
  }, [aspectRatio]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('runway-automation-duration', duration.toString());
      } catch (error) {
        console.warn('Failed to save duration:', error);
      }
    }
  }, [duration]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('runway-automation-concurrency', concurrency.toString());
      } catch (error) {
        console.warn('Failed to save concurrency:', error);
      }
    }
  }, [concurrency]);

  const isValidImageUrl = (url) => {
    try {
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

  return (
    <>
      <Head>
        <title>Runway Automation Pro - AI Video Generation</title>
        <meta name="description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runway-automation.vercel.app/" />
        <meta property="og:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="og:description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta property="og:image" content="/og-image.png" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://runway-automation.vercel.app/" />
        <meta property="twitter:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="twitter:description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta property="twitter:image" content="/og-image.png" />

        <meta name="keywords" content="RunwayML, AI video generation, automation, video creation, artificial intelligence, machine learning" />
        <meta name="author" content="Runway Automation Pro" />
        <meta name="robots" content="index, follow" />
        
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-navbutton-color" content="#667eea" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
      </Head>

      <div className="min-vh-100 d-flex flex-column" style={{ background: 'black', fontFamily: 'Normal, Inter, system-ui, sans-serif' }}>
        <div className="container-fluid py-4 flex-grow-1 d-flex flex-column">
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
                A lightweight front end for the Runway API that generates up to 20 videos from one prompt, all at the same time. Download every video you generate with one button.
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

          <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>

          {activeTab === 'setup' && (
            <div className="row justify-content-center flex-grow-1">
              <div className="col-lg-10 d-flex flex-column">
                <div className="row g-4 flex-grow-1">
                  <div className="col-lg-6 d-flex">
                    <div className="card shadow-lg border-0 flex-grow-1 d-flex flex-column" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                      <div 
                        className="bg-primary position-relative d-flex align-items-center justify-content-center" 
                        style={{ 
                          height: '80px',
                          borderRadius: '8px 8px 0 0',
                          flexShrink: 0
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
                      
                      <div className="card-body p-4 flex-grow-1 overflow-auto" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4">
                        </div>
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">RunwayML API Key</label>
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
                              Get your API key from RunwayML Developer Portal
                            </a>
                          </div>
                        </div>

                        <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <CreditCard size={20} className="text-warning me-2" />
                            <strong>Credits Required</strong>
                          </div>
                          <p className="mb-2 small">The RunwayML API requires credits for all video generations.</p>
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
                                title="• 16:9 (Landscape - YouTube, TV, desktop)&#10;• 9:16 (Portrait - TikTok, Instagram Stories, mobile)&#10;• 1:1 (Square - Instagram posts, profile pics)&#10;• 4:3 (Standard - Classic TV, monitors)&#10;• 3:4 (Portrait Standard - Print, documents)&#10;• 21:9 (Cinematic - Ultrawide movies)"
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
                          <label className="form-label fw-bold mb-2">Video Generation Limits by Tier</label>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered border-dark mb-0">
                              <thead className="table-secondary">
                                <tr>
                                  <th className="fw-bold border-dark" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid' }}>Tier</th>
                                  <th className="fw-bold border-dark" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid' }}>Videos Generated</th>
                                  <th className="fw-bold border-dark" style={{ borderTop: 'black 1px solid', borderBottom: 'black 1px solid' }}>Criteria</th>
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

                  <div className="col-lg-6 d-flex">
                    <div className="card shadow-lg border-0 flex-grow-1 d-flex flex-column" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                      <div 
                        className="bg-primary position-relative d-flex align-items-center justify-content-center" 
                        style={{ 
                          height: '80px',
                          borderRadius: '8px 8px 0 0',
                          flexShrink: 0
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
                      
                      <div className="card-body p-4 flex-grow-1 overflow-auto" style={{ paddingTop: '30px !important' }}>
                        <div className="mb-4">
                        </div>
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
            <div className="row justify-content-center flex-grow-1">
              <div className="col-lg-10 d-flex flex-column">
                <div className="card shadow-lg border-0 flex-grow-1 d-flex flex-column" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    className="bg-primary position-relative d-flex align-items-center justify-content-between" 
                    style={{ 
                      height: '80px',
                      borderRadius: '8px 8px 0 0',
                      flexShrink: 0
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
                      <h2 className="mb-0 fw-bold">Video Generation</h2>
                    </div>
                    
                    <div style={{ marginRight: '30px', marginTop: '10px', marginBottom: '10px' }}>
                      {!isRunning ? (
                        <button
                          className="btn btn-success btn-lg shadow"
                          onClick={generateVideos}
                          disabled={!runwayApiKey || !prompt.trim() || !imageUrl.trim() || concurrency < 1 || concurrency > 20}
                          style={{ 
                            borderRadius: '8px', 
                            fontWeight: '600', 
                            marginTop: '5px', 
                            marginBottom: '5px',
                            opacity: '1',
                            transition: 'opacity 0.2s ease-in-out',
                            backgroundColor: '#28a745',
                            borderColor: '#28a745'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.6'}
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
                          onClick={stopGeneration}
                          style={{ borderRadius: '8px', fontWeight: '600', marginTop: '10px', marginBottom: '10px' }}
                        >
                          <AlertCircle size={24} className="me-2" />
                          Stop Generation
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-body p-4 flex-grow-1 overflow-auto d-flex flex-column" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4">
                    </div>
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

                    <div className="card bg-dark text-light border-0 shadow flex-shrink-0" style={{ borderRadius: '8px' }}>
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
                      <div className="card-body overflow-auto" style={{ maxHeight: '300px', fontFamily: 'monospace' }}>
                        {logs.map((log, index) => (
                          <div key={index} className={`small mb-1 ${
                            log.type === 'error' ? 'text-danger' :
                            log.type === 'success' ? 'text-light' :
                            log.type === 'warning' ? 'text-warning' :
                            'text-light'
                          }`}>
                            <span className="text-muted">[{log.timestamp}]</span> {log.message}
                          </div>
                        ))}
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
            <div className="row justify-content-center flex-grow-1">
              <div className="col-lg-10 d-flex flex-column">
                <div className="card shadow-lg border-0 flex-grow-1 d-flex flex-column" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    className="bg-primary position-relative d-flex align-items-center justify-content-between" 
                    style={{ 
                      height: '80px',
                      borderRadius: '8px 8px 0 0',
                      flexShrink: 0
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
                      <h2 className="mb-0 fw-bold">Generated Videos</h2>
                    </div>
                    
                    {results.filter(result => result.video_url && result.status === 'completed').length > 0 && (
                      <div style={{ marginRight: '30px' }}>
                        <button
                          className="btn btn-light shadow"
                          onClick={downloadAllVideos}
                          disabled={isDownloadingAll}
                          style={{ borderRadius: '8px', fontWeight: '600' }}
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
                              <Download size={20} className="me-2" />
                              Download All as ZIP
                              <span className="ms-2 badge bg-primary">
                                {results.filter(result => result.video_url && result.status === 'completed').length}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body p-4 flex-grow-1 overflow-auto" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4">
                    </div>
                    <ResultsTabContent />
                  </div>
                </div>
              </div>
            </div>
          )}

          </div>

          <div className="text-center mt-3 flex-shrink-0">
            <div className="d-flex align-items-center justify-content-center text-white-50">
              <small>Based on <a href="https://apify.com/igolaizola/runway-automation" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Runway Automation for Apify</a> by <a href="https://igolaizola.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Iñigo Garcia Olaizola</a>.<br />Vibe coded by <a href="https://petebunke.com" target="_blank" rel="noopener noreferrer" className="text-white-50 fw-bold text-decoration-none">Pete Bunke</a>. All rights reserved.<br /><a href="mailto:petebunke@gmail.com?subject=Runway%20Automation%20User%20Feedback" className="text-white-50 text-decoration-none"><strong>Got user feedback?</strong> Hit me up!</a></small>
            </div>
            <div className="d-flex align-items-center justify-content-center text-white-50 mt-3">
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer">
                <svg width="160" height="20" viewBox="0 0 160 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="14" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="400" fill="white" fillOpacity="0.7">Powered by</text>
                  <g transform="translate(75, 2)">
                    <path d="M0 0h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4zM6 0h4v4H6V0zm0 6h4v4H6V6zm0 6h4v4H6v-4zM12 0h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4z" fill="white" fillOpacity="0.7"/>
                    <path d="M20 2h8v2h-8V2zm0 4h8v2h-8V6zm0 4h8v2h-8v-2zm0 4h8v2h-8v-2z" fill="white" fillOpacity="0.7"/>
                    <text x="32" y="12" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="600" fill="white" fillOpacity="0.7">RUNWAY</text>
                  </g>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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

    if (file.size > 10 * 1024 * 1024) {
      addLog('❌ Image file too large. Please use an image under 10MB', 'error');
      return;
    }

    setIsUploadingImage(true);
    
    try {
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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.bootstrap) {
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
    }
  }, [activeTab, model, results]);

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
    const timestamp = new Date().toLocaleTimeString();
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

  const clearStoredApiKey = () => {
    try {
      localStorage.removeItem('runway-automation-api-key');
      setRunwayApiKey('');
      addLog('🔒 API key cleared from storage', 'info');
    } catch (error) {
      console.warn('Failed to clear API key:', error);
    }
  };

  const API_BASE = '/api';

  // Download Functions
  const downloadVideo = async (videoUrl, filename) => {
    try {
      addLog(`📥 Downloading ${filename}...`, 'info');
      
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded ${filename}`, 'success');
    } catch (error) {
      addLog(`❌ Failed to download ${filename}: ${error.message}`, 'error');
    }
  };

  const downloadAllVideos = async () => {
    const completedVideos = results.filter(result => result.video_url && result.status === 'completed');
    
    if (completedVideos.length === 0) {
      addLog('❌ No completed videos to download', 'error');
      return;
    }

    setIsDownloadingAll(true);
    addLog(`📦 Creating ZIP file with ${completedVideos.length} videos...`, 'info');

    try {
      // Check if JSZip is available
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
      }

      const zip = new JSZip();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      
      // Add each video to the zip
      for (let i = 0; i < completedVideos.length; i++) {
        const result = completedVideos[i];
        const videoNumber = i + 1;
        
        try {
          addLog(`📥 Adding video ${videoNumber}/${completedVideos.length} to ZIP...`, 'info');
          
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`Failed to fetch video ${videoNumber}: ${response.status}`);
          }
          
          const blob = await response.blob();
          const filename = `runway-video-${timestamp}-${videoNumber.toString().padStart(2, '0')}.mp4`;
          
          zip.file(filename, blob);
          
          // Add metadata file for each video
          const metadata = {
            prompt: result.prompt,
            model: result.model,
            aspectRatio: result.aspectRatio,
            duration: result.duration,
            taskId: result.taskId,
            timestamp: result.timestamp,
            credits_deducted: result.credits_deducted
          };
          
          zip.file(`${filename.replace('.mp4', '')}-metadata.json`, JSON.stringify(metadata, null, 2));
          
        } catch (videoError) {
          addLog(`⚠️ Skipping video ${videoNumber}: ${videoError.message}`, 'warning');
        }
      }

      // Generate and download the ZIP file
      addLog('🔄 Generating ZIP file...', 'info');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `runway-videos-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Successfully downloaded ${completedVideos.length} videos as ZIP file`, 'success');
      
    } catch (error) {
      addLog(`❌ Failed to create ZIP file: ${error.message}`, 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const upscaleVideo = async (result) => {
    if (!result.taskId) {
      addLog('❌ Cannot upscale: Missing task ID', 'error');
      return;
    }

    try {
      addLog(`🔍 Starting 4K upscale for ${result.jobId}...`, 'info');
      
      const upscaleResponse = await fetch(`${API_BASE}/runway-upscale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: runwayApiKey,
          taskId: result.taskId
        })
      });

      if (!upscaleResponse.ok) {
        const errorData = await upscaleResponse.json();
        throw new Error(errorData.error || `HTTP ${upscaleResponse.status}`);
      }

      const upscaleData = await upscaleResponse.json();
      const upscaleTaskId = upscaleData.id;

      if (!upscaleTaskId) {
        throw new Error('No upscale task ID returned');
      }

      addLog(`✅ Upscale submitted for ${result.jobId} (Task: ${upscaleTaskId})`, 'success');
      addLog(`⏳ Upscaling will take 2-5 minutes. Check Results tab for progress.`, 'info');

      // Update result with upscale task ID
      setResults(prev => prev.map(r => 
        r.jobId === result.jobId 
          ? { ...r, upscaleTaskId: upscaleTaskId, upscaleStatus: 'processing' }
          : r
      ));

      // Start polling for upscale completion
      pollUpscaleStatus(result.jobId, upscaleTaskId);

    } catch (error) {
      addLog(`❌ Upscale failed for ${result.jobId}: ${error.message}`, 'error');
    }
  };

  const pollUpscaleStatus = async (jobId, upscaleTaskId) => {
    let pollAttempts = 0;
    const maxPollAttempts = 60; // 5 minutes max
    
    const poll = async () => {
      try {
        const statusResponse = await fetch(`${API_BASE}/runway-status?taskId=${upscaleTaskId}&apiKey=${encodeURIComponent(runwayApiKey)}`);
        
        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const status = statusData.status;

        if (status === 'SUCCEEDED') {
          const upscaledVideoUrl = statusData.output && statusData.output[0];
          if (upscaledVideoUrl) {
            addLog(`🎉 4K upscale completed for ${jobId}!`, 'success');
            
            // Update result with upscaled video
            setResults(prev => prev.map(r => 
              r.jobId === jobId 
                ? { 
                    ...r, 
                    upscaledVideoUrl: upscaledVideoUrl, 
                    upscaleStatus: 'completed',
                    upscaleTaskId: upscaleTaskId
                  }
                : r
            ));
          }
          return;
        } else if (status === 'FAILED') {
          throw new Error(`Upscale failed: ${statusData.failure_reason || 'Unknown error'}`);
        } else if (status === 'CANCELLED') {
          throw new Error('Upscale was cancelled');
        }

        // Continue polling
        pollAttempts++;
        if (pollAttempts < maxPollAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error('Upscale polling timeout');
        }

      } catch (error) {
        addLog(`❌ Upscale status error for ${jobId}: ${error.message}`, 'error');
        
        // Update result with error
        setResults(prev => prev.map(r => 
          r.jobId === jobId 
            ? { ...r, upscaleStatus: 'failed', upscaleError: error.message }
            : r
        ));
      }
    };

    poll();
  };

  // Main video generation function
  const generateVideos = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);
    setGenerationProgress({});
    
    const currentGeneration = generationCounter + 1;
    setGenerationCounter(currentGeneration);
    
    addLog('🚀 Starting Runway video generation...', 'info');
    addLog('Configuration: ' + model + ', ' + aspectRatio + ', ' + duration + 's', 'info');
    
    if (!prompt.trim()) {
      addLog('❌ No prompt provided!', 'error');
      setIsRunning(false);
      return;
    }

    if (!imageUrl.trim()) {
      addLog('❌ Image URL is required! The current RunwayML API only supports image-to-video generation. Please add an image URL.', 'error');
      setIsRunning(false);
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('❌ RunwayML API key is required!', 'error');
      setIsRunning(false);
      return;
    }

    const requestedJobs = parseInt(concurrency) || 1;
    const MAX_CONCURRENT_JOBS = 20;
    const totalJobs = Math.min(Math.max(requestedJobs, 1), MAX_CONCURRENT_JOBS);
    
    if (requestedJobs > MAX_CONCURRENT_JOBS) {
      addLog(`❌ SAFETY BLOCK: Cannot generate more than ${MAX_CONCURRENT_JOBS} videos at once to prevent excessive costs!`, 'error');
      setIsRunning(false);
      return;
    }
    
    if (isNaN(totalJobs) || totalJobs < 1) {
      addLog('❌ SAFETY: Invalid number of videos specified. Using 1 video.', 'error');
      setIsRunning(false);
      return;
    }
    
    const estimatedCostMin = totalJobs * 0.25;
    const estimatedCostMax = totalJobs * 0.75;
    
    addLog(`💰 Estimated cost: $${estimatedCostMin.toFixed(2)} - $${estimatedCostMax.toFixed(2)} (${totalJobs} videos)`, 'info');
    
    if (totalJobs >= 10) {
      const confirmLargeBatch = window.confirm(
        `⚠️ COST WARNING ⚠️\n\n` +
        `You are about to generate ${totalJobs} videos.\n` +
        `Estimated cost: $${estimatedCostMin.toFixed(2)} - $${estimatedCostMax.toFixed(2)}\n\n` +
        `This will use ${totalJobs * 25}-${totalJobs * 50} credits from your RunwayML account.\n\n` +
        `Are you sure you want to proceed?`
      );
      
      if (!confirmLargeBatch) {
        addLog('🛑 Generation cancelled by user (cost protection)', 'warning');
        setIsRunning(false);
        return;
      }
      
      addLog('✅ User confirmed large batch generation', 'info');
    }

    addLog('📊 Processing ' + totalJobs + (totalJobs === 1 ? ' video generation' : ' video generations') + ' using the same prompt and image...', 'info');
    addLog('💳 Note: Each generation requires credits from your API account', 'info');
    addLog('🔄 Jobs will process based on your RunwayML tier limits (Tier 1: 1 concurrent, Tier 2: 3, Tier 3: 5, Tier 4: 10, Tier 5: 20)', 'info');

    // Check credits first
    try {
      addLog('💳 Checking credit balance...', 'info');
      const creditsResponse = await fetch(`${API_BASE}/runway-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: runwayApiKey
        })
      });

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        const credits = creditsData.credits || 0;
        addLog(`💰 Current balance: ${credits} credits (Tier: ${creditsData.tier || 'unknown'})`, 'info');
        
        const requiredCredits = totalJobs * 30; // Conservative estimate
        if (credits < requiredCredits) {
          addLog(`⚠️ Warning: Low credits! You have ${credits} credits but need ~${requiredCredits} for this generation`, 'warning');
        }
      } else {
        addLog('⚠️ Could not check credit balance, continuing anyway...', 'warning');
      }
    } catch (error) {
      addLog('⚠️ Error checking credits: ' + error.message, 'warning');
    }

    // Create generation jobs
    const jobs = [];
    for (let i = 0; i < totalJobs; i++) {
      const jobId = `Generation ${currentGeneration} - Video ${i + 1}`;
      jobs.push({
        id: jobId,
        index: i + 1,
        status: 'pending',
        prompt: prompt,
        imageUrl: imageUrl,
        model: model,
        aspectRatio: aspectRatio,
        duration: duration
      });
    }

    addLog(`🎬 Starting ${totalJobs} video generation${totalJobs > 1 ? 's' : ''}...`, 'info');

    // Process jobs with proper concurrency handling
    const processJob = async (job) => {
      const jobId = job.id;
      
      try {
        // Update progress
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { status: 'generating', progress: 0 }
        }));

        addLog(`🎥 Starting ${jobId}...`, 'info');

        // Create generation request payload
        const payload = {
          text_prompt: job.prompt,
          image_prompt: job.imageUrl,
          model: job.model,
          aspect_ratio: job.aspectRatio,
          duration: job.duration,
          seed: Math.floor(Math.random() * 1000000)
        };

        // Submit generation request
        const generateResponse = await fetch(`${API_BASE}/runway-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: runwayApiKey,
            payload: payload
          })
        });

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.error || `HTTP ${generateResponse.status}`);
        }

        const generateData = await generateResponse.json();
        const taskId = generateData.id;

        if (!taskId) {
          throw new Error('No task ID returned from generation request');
        }

        addLog(`✅ ${jobId} submitted successfully (Task: ${taskId})`, 'success');

        // Update progress with task ID
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { status: 'processing', progress: 25, taskId: taskId }
        }));

        // Poll for completion
        let pollAttempts = 0;
        const maxPollAttempts = 120; // 10 minutes max (5 second intervals)
        
        while (pollAttempts < maxPollAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          pollAttempts++;

          try {
            const statusResponse = await fetch(`${API_BASE}/runway-status?taskId=${taskId}&apiKey=${encodeURIComponent(runwayApiKey)}`);
            
            if (!statusResponse.ok) {
              const errorData = await statusResponse.json();
              throw new Error(errorData.error || `Status check failed: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();
            const status = statusData.status;

            // Update progress based on status
            let progress = 25;
            if (status === 'RUNNING') {
              progress = Math.min(25 + (pollAttempts * 2), 90);
            } else if (status === 'SUCCEEDED') {
              progress = 100;
            }

            setGenerationProgress(prev => ({
              ...prev,
              [jobId]: { status: status.toLowerCase(), progress: progress, taskId: taskId }
            }));

            if (status === 'SUCCEEDED') {
              const videoUrl = statusData.output && statusData.output[0];
              if (videoUrl) {
                addLog(`🎉 ${jobId} completed successfully!`, 'success');
                
                // Add to results
                setResults(prev => [...prev, {
                  jobId: jobId,
                  taskId: taskId,
                  video_url: videoUrl,
                  status: 'completed',
                  prompt: job.prompt,
                  model: job.model,
                  aspectRatio: job.aspectRatio,
                  duration: job.duration,
                  timestamp: new Date().toISOString(),
                  credits_deducted: statusData.credits_deducted || 'unknown'
                }]);

                // Remove from progress tracking
                setGenerationProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[jobId];
                  return newProgress;
                });

                setVideoCounter(prev => prev + 1);
                return { success: true, jobId, videoUrl, taskId };
              } else {
                throw new Error('Video generation completed but no video URL returned');
              }
            } else if (status === 'FAILED') {
              throw new Error(`Video generation failed: ${statusData.failure_reason || 'Unknown error'}`);
            } else if (status === 'CANCELLED') {
              throw new Error('Video generation was cancelled');
            }

            // Continue polling for PENDING, RUNNING statuses
            if (pollAttempts % 6 === 0) { // Every 30 seconds
              addLog(`⏳ ${jobId} still processing... (${Math.floor(pollAttempts * 5 / 60)}m ${(pollAttempts * 5) % 60}s)`, 'info');
            }

          } catch (statusError) {
            addLog(`❌ Error checking status for ${jobId}: ${statusError.message}`, 'error');
            
            // If it's a temporary network error, continue polling
            if (pollAttempts < maxPollAttempts - 10) {
              continue;
            } else {
              throw statusError;
            }
          }
        }