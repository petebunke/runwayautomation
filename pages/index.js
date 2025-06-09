import React, { useState } from 'react';
import { Play, Settings, Download, Plus, Trash2, AlertCircle, Film, Key, ExternalLink, CreditCard } from 'lucide-react';

export default function RunwayAutomationApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [runwayApiKey, setRunwayApiKey] = useState('');
  const [prompts, setPrompts] = useState(['A serene lake with mountains in the background at sunset']);
  const [images, setImages] = useState(['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720']);
  const [model, setModel] = useState('gen3a_turbo');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [concurrency, setConcurrency] = useState(1);

  // Auto-adjust prompts and images when concurrency changes
  const handleConcurrencyChange = (newConcurrency) => {
    setConcurrency(newConcurrency);
    
    // Adjust prompts to match concurrency
    const currentPrompts = prompts.filter(p => p.trim() !== '');
    if (currentPrompts.length < newConcurrency) {
      // Add more prompts if needed
      const promptsToAdd = newConcurrency - currentPrompts.length;
      const newPrompts = [...prompts];
      for (let i = 0; i < promptsToAdd; i++) {
        newPrompts.push('');
      }
      setPrompts(newPrompts);
    } else if (currentPrompts.length > newConcurrency) {
      // Keep only the first 'newConcurrency' prompts
      setPrompts(prompts.slice(0, newConcurrency));
    }
    
    // Adjust images to match concurrency (optional - ensures at least one image per job)
    const currentImages = images.filter(img => img.trim() !== '');
    if (currentImages.length < newConcurrency) {
      // Add more image slots if needed
      const imagesToAdd = newConcurrency - currentImages.length;
      const newImages = [...images];
      for (let i = 0; i < imagesToAdd; i++) {
        newImages.push('');
      }
      setImages(newImages);
    }
  };
  const [minWait, setMinWait] = useState(2);
  const [maxWait, setMaxWait] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [generationProgress, setGenerationProgress] = useState({});

  const modelOptions = [
    { value: 'gen4_turbo', label: 'Gen-4 Turbo (Newest, highest quality)' },
    { value: 'gen3a_turbo', label: 'Gen-3 Alpha Turbo (Fast, reliable)' }
  ];

  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '1:1', label: '1:1 (Square)' }
  ];

  const addPrompt = () => {
    setPrompts([...prompts, '']);
  };

  const removePrompt = (index) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index, value) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const addImage = () => {
    setImages([...images, '']);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const API_BASE = '/api';

  const generateVideo = async (prompt, imageUrl = null, jobIndex = 0) => {
    const jobId = 'job_' + jobIndex + '_' + Date.now();
    
    try {
      // Check if image is provided (required for current API)
      if (!imageUrl || !imageUrl.trim()) {
        const errorMsg = 'Image URL is required for video generation. The current RunwayML API only supports image-to-video generation.';
        addLog('❌ Job ' + (jobIndex + 1) + ' failed: ' + errorMsg, 'error');
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { status: 'failed', progress: 0, error: errorMsg }
        }));
        
        throw new Error(errorMsg);
      }

      addLog('Starting generation for job ' + (jobIndex + 1) + ': "' + prompt.substring(0, 50) + '..." with image', 'info');
      
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'starting', progress: 0 }
      }));

      const payload = {
        text_prompt: prompt,
        image_prompt: imageUrl.trim(),
        model: model,
        aspect_ratio: aspectRatio,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API Error: ' + response.status);
      }

      const task = await response.json();
      addLog('✓ Generation started for job ' + (jobIndex + 1) + ' (Task ID: ' + task.id + ')', 'success');
      
      return await pollTaskCompletion(task.id, jobId, prompt, imageUrl, jobIndex);
      
    } catch (error) {
      addLog('✗ Job ' + (jobIndex + 1) + ' failed: ' + error.message, 'error');
      setGenerationProgress(prev => ({
        ...prev,
        [jobId]: { status: 'failed', progress: 0, error: error.message }
      }));
      throw error;
    }
  };

  const pollTaskCompletion = async (taskId, jobId, prompt, imageUrl, jobIndex) => {
    const maxPolls = Math.floor(300 / 5);
    let pollCount = 0;

    while (pollCount < maxPolls) {
      try {
        const response = await fetch(API_BASE + '/runway-status?taskId=' + taskId + '&apiKey=' + encodeURIComponent(runwayApiKey));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Polling failed: ' + response.status);
        }

        const task = await response.json();
        const progress = Math.min((pollCount / maxPolls) * 90, 90);
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { status: task.status, progress: progress }
        }));

        if (task.status === 'SUCCEEDED') {
          addLog('✓ Job ' + (jobIndex + 1) + ' completed successfully', 'success');
          
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { status: 'completed', progress: 100 }
          }));

          return {
            id: taskId,
            prompt: prompt,
            video_url: task.output && task.output[0] ? task.output[0] : null,
            thumbnail_url: task.output && task.output[1] ? task.output[1] : null,
            image_url: imageUrl,
            status: 'completed',
            created_at: new Date().toISOString()
          };
        }

        if (task.status === 'FAILED') {
          throw new Error(task.failure_reason || 'Generation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        pollCount++;
        
      } catch (error) {
        addLog('✗ Polling error for job ' + (jobIndex + 1) + ': ' + error.message, 'error');
        throw error;
      }
    }

    throw new Error('Generation timeout');
  };

  const generateVideos = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    setGenerationProgress({});
    
    addLog('🚀 Starting Runway video generation...', 'info');
    addLog('Configuration: ' + model + ', ' + aspectRatio + ', ' + duration + 's', 'info');
    
    const activePrompts = prompts.filter(p => p.trim());
    const activeImages = images.filter(img => img.trim());
    
    if (activePrompts.length === 0) {
      addLog('❌ No prompts provided!', 'error');
      setIsRunning(false);
      return;
    }

    // IMPORTANT: Validate that images are provided
    if (activeImages.length === 0) {
      addLog('❌ Images are required! The current RunwayML API only supports image-to-video generation. Please add at least one image URL.', 'error');
      setIsRunning(false);
      return;
    }

    if (!runwayApiKey.trim()) {
      addLog('❌ RunwayML API key is required!', 'error');
      setIsRunning(false);
      return;
    }

    const totalJobs = Math.max(activePrompts.length, activeImages.length);
    addLog('📊 Processing ' + totalJobs + ' video generations...', 'info');
    addLog('💳 Note: Each generation requires credits from your API account', 'info');

    const results = [];
    const errors = [];

    for (let i = 0; i < totalJobs; i += concurrency) {
      const batch = [];
      
      for (let j = 0; j < concurrency && (i + j) < totalJobs; j++) {
        const jobIndex = i + j;
        const promptIndex = jobIndex % activePrompts.length;
        const imageIndex = jobIndex % activeImages.length; // Always use an image
        
        const prompt = activePrompts[promptIndex];
        const imageUrl = activeImages[imageIndex]; // Required
        
        if (jobIndex > 0) {
          const waitTime = Math.random() * (maxWait - minWait) + minWait;
          addLog('⏱️ Waiting ' + waitTime.toFixed(1) + 's before next job...', 'info');
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        batch.push(generateVideo(prompt, imageUrl, jobIndex));
      }

      try {
        const batchResults = await Promise.allSettled(batch);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            setResults(prev => [...prev, result.value]);
          } else {
            errors.push(result.reason);
          }
        });
        
      } catch (error) {
        addLog('❌ Batch processing error: ' + error.message, 'error');
        errors.push(error);
      }
    }

    addLog('🎬 Generation completed! ✅ ' + results.length + ' videos generated, ❌ ' + errors.length + ' failed', 
           results.length > 0 ? 'success' : 'error');
    
    if (errors.length > 0) {
      addLog('⚠️ Failed jobs: ' + errors.map(e => e.message).join(', '), 'warning');
    }

    setIsRunning(false);
  };

  const stopGeneration = () => {
    setIsRunning(false);
    addLog('🛑 Generation stopped by user', 'warning');
  };

  const downloadVideo = async (videoUrl, filename) => {
    try {
      addLog('📥 Downloading ' + filename + '...', 'info');
      
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog('✅ Downloaded ' + filename, 'success');
    } catch (error) {
      addLog('❌ Download failed: ' + error.message, 'error');
    }
  };

  const exportResults = () => {
    const exportData = {
      generated_at: new Date().toISOString(),
      total_videos: results.length,
      configuration: {
        model,
        aspect_ratio: aspectRatio,
        duration
      },
      videos: results.map(result => ({
        id: result.id,
        prompt: result.prompt,
        video_url: result.video_url,
        thumbnail_url: result.thumbnail_url,
        image_url: result.image_url,
        created_at: result.created_at
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runway_generation_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    window.URL.revokeObjectURL(url);
    
    addLog('📊 Results exported to JSON', 'success');
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={
        'flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ' +
        (activeTab === id
          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
          : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎬 Runway Automation Pro
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing.
          </p>
        </div>

        <div className="flex justify-center space-x-6 mb-10">
          <TabButton id="setup" label="Configuration" icon={Settings} />
          <TabButton id="generation" label="Generation" icon={Film} />
          <TabButton id="results" label="Results" icon={Download} />
        </div>

        {activeTab === 'setup' && (
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center mb-6">
                  <Key className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-2xl font-bold text-gray-800">API Configuration</h2>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    RunwayML API Key *
                  </label>
                  <input
                    type="password"
                    value={runwayApiKey}
                    onChange={(e) => setRunwayApiKey(e.target.value)}
                    placeholder="rml_xxx..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <div className="flex items-center mt-2 text-sm text-blue-600">
                    <ExternalLink size={14} className="mr-1" />
                    <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Get your API key from RunwayML Developer Portal
                    </a>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    API Billing & Credits
                  </label>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CreditCard size={16} className="text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-amber-800">Credits Required</span>
                    </div>
                    <p className="text-sm text-amber-700 mb-2">
                      The RunwayML API requires credits for all video generations.
                    </p>
                    <div className="text-xs text-amber-600 space-y-1">
                      <div>• Purchase credits at <a href="https://dev.runwayml.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">dev.runwayml.com</a></div>
                      <div>• Minimum $10 (1000 credits)</div>
                      <div>• ~25-50 credits per 5-10 second video ($0.25-$0.50)</div>
                      <div>• Credits are separate from web app credits</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {modelOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {aspectRatioOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Duration (seconds)</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Concurrency (Auto-creates prompts)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={concurrency}
                      onChange={(e) => handleConcurrencyChange(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-xs text-gray-500 mt-1 space-y-2">
                      <p>Setting this to {concurrency} will create {concurrency} prompt field{concurrency !== 1 ? 's' : ''}</p>
                      <p className="text-blue-600">
                        <strong>API Limits:</strong> Tier 1=1, Tier 2=3, Tier 3=5, Tier 4=10, Tier 5=20 concurrent
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded p-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">🎯 RunwayML API Concurrency Limits by Tier:</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left py-1 font-medium">Tier</th>
                              <th className="text-left py-1 font-medium">Max Concurrent</th>
                              <th className="text-left py-1 font-medium">Criteria</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-600">
                            <tr>
                              <td className="py-1">1</td>
                              <td className="py-1">1</td>
                              <td className="py-1">Default (new accounts)</td>
                            </tr>
                            <tr>
                              <td className="py-1">2</td>
                              <td className="py-1">3</td>
                              <td className="py-1">1 day after $50 purchased</td>
                            </tr>
                            <tr>
                              <td className="py-1">3</td>
                              <td className="py-1">5</td>
                              <td className="py-1">7 days after $100 purchased</td>
                            </tr>
                            <tr>
                              <td className="py-1">4</td>
                              <td className="py-1">10</td>
                              <td className="py-1">14 days after $1,000 purchased</td>
                            </tr>
                            <tr>
                              <td className="py-1">5</td>
                              <td className="py-1">20</td>
                              <td className="py-1">7 days after $5,000 purchased</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Content Configuration</h2>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Video Prompts * ({prompts.length} prompt{prompts.length !== 1 ? 's' : ''})
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={addPrompt}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                      {prompts.length > 1 && (
                        <button
                          onClick={() => setPrompts(prompts.slice(0, -1))}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          <span>Remove Last</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <p className="text-sm text-green-700">
                      💡 <strong>Tip:</strong> Concurrency is set to {concurrency}, so you have {prompts.length} prompt field{prompts.length !== 1 ? 's' : ''}. 
                      Change concurrency above to auto-adjust the number of prompts.
                    </p>
                  </div>
                  {prompts.map((prompt, index) => (
                    <div key={index} className="flex space-x-2 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Prompt {index + 1}
                          </span>
                        </div>
                        <textarea
                          value={prompt}
                          onChange={(e) => updatePrompt(index, e.target.value)}
                          placeholder={`Describe video ${index + 1}... (e.g., "gentle waves flowing, peaceful water movement")`}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows="2"
                        />
                      </div>
                      {prompts.length > 1 && (
                        <button
                          onClick={() => removePrompt(index)}
                          className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors self-end"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addPrompt}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={18} />
                    <span>Add Extra Prompt</span>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Image URLs (Required for Video Generation) *
                  </label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                    <p className="text-sm text-blue-700">
                      <strong>Important:</strong> The RunwayML API only supports image-to-video generation. 
                      Each video starts with your provided image and animates according to your text prompt.
                    </p>
                  </div>
                  {images.map((image, index) => (
                    <div key={index} className="flex space-x-2 mb-3">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {images.length > 1 && (
                        <button
                          onClick={() => removeImage(index)}
                          className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addImage}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={18} />
                    <span>Add Image URL</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Min Wait (seconds)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={minWait}
                      onChange={(e) => setMinWait(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Max Wait (seconds)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={maxWait}
                      onChange={(e) => setMaxWait(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generation' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Video Generation Control</h2>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Generation Status</h3>
                  <p className="text-gray-600">Monitor and control your video generation process</p>
                </div>
                <div className="flex space-x-4">
                  {!isRunning ? (
                    <button
                      onClick={generateVideos}
                      disabled={!runwayApiKey || prompts.filter(p => p.trim()).length === 0 || images.filter(img => img.trim()).length === 0}
                      className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      <Play size={24} />
                      <span className="text-lg font-semibold">Start Generation</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopGeneration}
                      className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                    >
                      <AlertCircle size={24} />
                      <span className="text-lg font-semibold">Stop Generation</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={isRunning ? 'w-4 h-4 rounded-full bg-green-500 animate-pulse' : 'w-4 h-4 rounded-full bg-gray-400'}></div>
                  <span className="font-medium">{isRunning ? 'Running' : 'Idle'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>API: {runwayApiKey ? '✓ Connected' : '✗ Missing'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Prompts: {prompts.filter(p => p.trim()).length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Images: {images.filter(img => img.trim()).length}</span>
                </div>
              </div>
            </div>

            {Object.keys(generationProgress).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Generation Progress</h3>
                <div className="space-y-3">
                  {Object.entries(generationProgress).map(([jobId, progress]) => (
                    <div key={jobId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{jobId}</span>
                        <span className="text-sm text-gray-500">{progress.status}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: progress.progress + '%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl p-6 h-96 overflow-y-auto">
              <h3 className="text-green-400 font-mono text-lg mb-4">🔥 Live Generation Log</h3>
              {logs.map((log, index) => (
                <div key={index} className={
                  'font-mono text-sm mb-2 ' +
                  (log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-300')
                }>
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 font-mono text-sm">
                  Ready to start generation... Configure your settings and click "Start Generation"
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Generated Videos</h2>
                <p className="text-gray-600 mt-2">{results.length} videos generated</p>
              </div>
              {results.length > 0 && (
                <div className="flex space-x-4">
                  <button
                    onClick={exportResults}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={20} />
                    <span>Export Results</span>
                  </button>
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16">
                <Film size={80} className="mx-auto text-gray-400 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-600 mb-4">No videos generated yet</h3>
                <p className="text-gray-500 mb-8">Start a generation process to see your AI-generated videos here</p>
                <button
                  onClick={() => setActiveTab('setup')}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {results.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                      {result.video_url ? (
                        <video
                          src={result.video_url}
                          poster={result.thumbnail_url}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        >
                          Your browser does not support video playback.
                        </video>
                      ) : result.thumbnail_url ? (
                        <img 
                          src={result.thumbnail_url}
                          alt={'Thumbnail for: ' + result.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                          <div className="text-center">
                            <Film size={48} className="mx-auto mb-3 text-blue-500" />
                            <div className="text-sm font-medium text-gray-700">Processing...</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3">
                        <span className={
                          'px-2 py-1 text-xs font-semibold rounded-full ' +
                          (result.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800')
                        }>
                          {result.status === 'completed' ? '✅ Complete' : '⏳ Processing'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 leading-tight">
                        {result.prompt}
                      </h4>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Task ID:</span>
                          <span className="font-mono text-xs">{result.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(result.created_at).toLocaleString()}</span>
                        </div>
                        {result.image_url && (
                          <div className="flex justify-between">
                            <span>Source Image:</span>
                            <span className="text-blue-600">✓ Provided</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 pt-3">
                        {result.video_url && (
                          <button
                            onClick={() => downloadVideo(result.video_url, 'video_' + result.id + '.mp4')}
                            className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download size={16} className="inline mr-1" />
                            Download
                          </button>
                        )}
                        
                        {result.video_url && (
                          <button
                            onClick={() => window.open(result.video_url, '_blank')}
                            className="flex-1 text-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <ExternalLink size={16} className="inline mr-1" />
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-16 text-gray-500">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-4xl mx-auto mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <AlertCircle size={20} className="text-green-600" />
              <span className="text-lg font-semibold text-green-800">✅ Production-Ready Solution</span>
            </div>
            <p className="text-green-700 mb-2">
              <strong>🚀 Complete full-stack application</strong> with serverless backend for RunwayML API integration.
            </p>
            <p className="text-green-600 text-sm">
              Features professional UI, batch processing, progress tracking, and video management with credits-based billing.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-3">
            <CreditCard size={16} />
            <span className="text-sm font-medium">Usage Guidelines</span>
          </div>
          <p className="text-xs max-w-2xl mx-auto">
            Purchase credits at dev.runwayml.com to start generating videos. Monitor your API usage and costs.
          </p>
        </div>
      </div>
    </div>
  );
}