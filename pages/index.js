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
                  
                  <div className="card-body p-4" style={{ paddingTop: '30px !important' }}>
                    <div className="mb-4"></div>
                    <div className="card text-white mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '8px' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark text-uppercase d-flex align-items-center" style={{ fontSize: '0.875rem', height: '100%' }}>CONNECTION STATUS</span>
                          <div className="d-flex gap-5 align-items-center text-center">
                            <span className="text-dark"><strong>API:</strong> {runwayApiKey ? '✓ Connected' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Prompt:</strong> {prompt.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            <span className="text-dark"><strong>Image:</strong> {imageUrl.trim() ? '✓ Ready' : '✗ Missing'}</span>
                            {organizationInfo && (
                              <span className="text-dark"><strong>Credits:</strong> {organizationInfo.creditBalance} available</span>
                            )}
                            <div className="d-flex align-items-center">
                              <div className={`me-2 rounded-circle ${isRunning ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}>
                                {isRunning && (
                                  <div className="w-100 h-100 rounded-circle bg-primary"></div>
                                )}
                                const downloadAllVideos = async () => {
    const videosWithUrls = results.filter(result => result.video_url && result.status === 'completed');
    
    if (videosWithUrls.length === 0) {
      addLog('❌ No completed videos available for download', 'error');
      return;
    }

    setIsDownloadingAll(true);
    addLog(`📦 Creating zip archive with ${videosWithUrls.length} videos...`, 'info');

    try {
      // Dynamic import of JSZip to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Create timestamp for unique folder naming
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }).replace(/[/:]/g, '-').replace(', ', '_');

      const folderName = `Runway Videos (${timestamp})`;
      const folder = zip.folder(folderName);
      const videosFolder = folder.folder('Videos');
      const jsonFolder = folder.folder('JSON');

      // Sort videos by generation and video number for organized download
      const sortedVideos = videosWithUrls
        .map(result => ({
          ...result,
          filename: generateFilename(result.jobId, result.id),
          upscaledFilename: result.upscaled_video_url ? generateFilename(result.jobId, result.id, true) : null
        }))
        .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

      // Add each video to the zip with progress tracking
      for (let i = 0; i < sortedVideos.length; i++) {
        const result = sortedVideos[i];
        try {
          // Add original video
          addLog(`📥 Adding ${result.filename} to archive... (${i + 1}/${sortedVideos.length})`, 'info');
          
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch video`);
          }
          
          const blob = await response.blob();
          
          // Verify blob size before adding to zip
          if (blob.size === 0) {
            throw new Error('Empty video file received');
          }
          
          // Add video to Videos folder
          videosFolder.file(result.filename, blob);
          
          // Add upscaled video if available
          if (result.upscaled_video_url && result.upscaledFilename) {
            addLog(`📥 Adding 4K version ${result.upscaledFilename} to archive...`, 'info');
            
            const upscaledResponse = await fetch(result.upscaled_video_url);
            if (upscaledResponse.ok) {
              const upscaledBlob = await upscaledResponse.blob();
              if (upscaledBlob.size > 0) {
                videosFolder.file(result.upscaledFilename, upscaledBlob);
              }
            }
          }
          
          // Add metadata file to JSON folder
          const metadata = {
            id: result.id,
            prompt: result.prompt,
            jobId: result.jobId,
            created_at: result.created_at,
            image_url: result.image_url,
            processingTime: result.processingTime || 'unknown',
            favorited: true,
            has_4k_version: !!result.upscaled_video_url,
            upscale_task_id: result.upscale_task_id || null
          };
          
          jsonFolder.file(result.filename.replace('.mp4', '_metadata.json'), JSON.stringify(metadata, null, 2));
          
        } catch (error) {
          addLog(`⚠️ Failed to add ${result.filename}: ${error.message}`, 'warning');
        }
      }

      addLog('🔄 Generating zip file...', 'info');
      
      // Generate zip with no compression for faster processing
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
        compressionOptions: { level: 0 }
      });

      // Calculate final zip size
      const zipSizeMB = (zipBlob.size / 1024 / 1024).toFixed(1);
      addLog(`📦 Zip file created: ${zipSizeMB}MB`, 'info');

      // Create download link and trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded zip archive: ${folderName}.zip (${zipSizeMB}MB)`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to create zip archive: ' + error.message, 'error');
      console.error('Zip creation error:', error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const exportResults = () => {
    const exportData = {
      generated_at: new Date().toISOString(),
      total_videos: results.length,
      completed_videos: results.filter(r => r.status === 'completed').length,
      favorited_videos: results.filter(r => favoriteVideos.has(r.id)).length,
      upscaled_videos: results.filter(r => r.upscaled_video_url).length,
      configuration: {
        model,
        aspect_ratio: aspectRatio,
        duration,
        concurrency
      },
      organization_info: organizationInfo || null,
      statistics: {
        generation_counter: generationCounter,
        video_counter: videoCounter,
        average_processing_time: results.length > 0 ? 
          Math.round(results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length) + 's' : 
          'N/A'
      },
      videos: results.map(result => ({
        id: result.id,
        prompt: result.prompt,
        video_url: result.video_url,
        thumbnail_url: result.thumbnail_url,
        upscaled_video_url: result.upscaled_video_url || null,
        upscaled_thumbnail_url: result.upscaled_thumbnail_url || null,
        upscale_task_id: result.upscale_task_id || null,
        image_url: result.image_url,
        status: result.status,
        created_at: result.created_at,
        jobId: result.jobId,
        processingTime: result.processingTime,
        favorited: favoriteVideos.has(result.id),
        filename: generateFilename(result.jobId, result.id),
        upscaled_filename: result.upscaled_video_url ? generateFilename(result.jobId, result.id, true) : null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runway_generation_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    addLog('📊 Results exported to JSON with enhanced metadata', 'success');
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Runway Automation - Batch Video Generation</title>
        <meta name="description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download all 4K videos as MP4 and JSON." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A90E2'><path d='M21 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18zM20 5H4v14h16V5zm-8 2v2h2V7h-2zm-4 0v2h2V7H8zm8 0v2h2V7h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z'/></svg>" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runway-automation.vercel.app/" />
        <meta property="og:title" content="Runway Automation - Batch Video Generation" />
        <meta property="og:description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download all 4K videos as MP4 and JSON." />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://runway-automation.vercel.app/" />
        <meta property="twitter:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="twitter:description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download all 4K videos as MP4 and JSON." />
        <meta property="twitter:image" content="/og-image.png" />

        {/* Additional SEO tags */}
        <meta name="keywords" content="RunwayML, AI video generation, automation, video creation, artificial intelligence, machine learning" />
        <meta name="author" content="Runway Automation" />
        <meta name="robots" content="index, follow" />
        
        {/* Theme color for mobile browsers */}
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
        <style>{`
          .tooltip .tooltip-inner {
            background-color: rgba(0, 0, 0, 1) !important;
            color: white !important;
          }
          .tooltip.bs-tooltip-top .tooltip-arrow::before,
          .tooltip.bs-tooltip-bottom .tooltip-arrow::before,
          .tooltip.bs-tooltip-start .tooltip-arrow::before,
          .tooltip.bs-tooltip-end .tooltip-arrow::before {
            border-color: rgba(0, 0, 0, 1) transparent !important;
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
          </div>_url: result.image_url,
            processingTime: result.processingTime || 'unknown',
            has_4k_version: !!result.upscaled_video_url,
            upscale_task_id: result.upscale_task_id || null
          };
          
          jsonFolder.file(result.filename.replace('.mp4', '_metadata.json'), JSON.stringify(metadata, null, 2));
          
        } catch (error) {
          addLog(`⚠️ Failed to add ${result.filename}: ${error.message}`, 'warning');
        }
      }

      addLog('🔄 Generating zip file...', 'info');
      
      // Generate zip with no compression for faster processing
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
        compressionOptions: { level: 0 }
      });

      // Calculate final zip size
      const zipSizeMB = (zipBlob.size / 1024 / 1024).toFixed(1);
      addLog(`📦 Zip file created: ${zipSizeMB}MB`, 'info');

      // Create download link and trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded zip archive: ${folderName}.zip (${zipSizeMB}MB)`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to create zip archive: ' + error.message, 'error');
      console.error('Zip creation error:', error);
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
    addLog(`📦 Creating zip archive with ${upscaledVideos.length} 4K videos...`, 'info');

    try {
      // Dynamic import of JSZip to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Create timestamp for unique folder naming
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }).replace(/[/:]/g, '-').replace(', ', '_');

      const folderName = `4K Videos (${timestamp})`;
      const folder = zip.folder(folderName);
      const videosFolder = folder.folder('Videos');
      const jsonFolder = folder.folder('JSON');

      // Sort videos by generation and video number for organized download
      const sortedVideos = upscaledVideos
        .map(result => ({
          ...result,
          upscaledFilename: generateFilename(result.jobId, result.id, true)
        }))
        .sort((a, b) => a.upscaledFilename.localeCompare(b.upscaledFilename, undefined, { numeric: true }));

      // Add each 4K video to the zip with progress tracking
      for (let i = 0; i < sortedVideos.length; i++) {
        const result = sortedVideos[i];
        try {
          addLog(`📥 Adding 4K video ${result.upscaledFilename} to archive... (${i + 1}/${sortedVideos.length})`, 'info');
          
          const response = await fetch(result.upscaled_video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch 4K video`);
          }
          
          const blob = await response.blob();
          
          // Verify blob size before adding to zip
          if (blob.size === 0) {
            throw new Error('Empty 4K video file received');
          }
          
          // Add 4K video to Videos folder
          videosFolder.file(result.upscaledFilename, blob);
          
          // Add metadata file to JSON folder
          const metadata = {
            id: result.id,
            prompt: result.prompt,
            jobId: result.jobId,
            created_at: result.created_at,
            image_url: result.image_url,
            processingTime: result.processingTime || 'unknown',
            upscale_task_id: result.upscale_task_id,
            resolution: '4K',
            original_video_url: result.video_url
          };
          
          jsonFolder.file(result.upscaledFilename.replace('.mp4', '_metadata.json'), JSON.stringify(metadata, null, 2));
          
        } catch (error) {
          addLog(`⚠️ Failed to add 4K video ${result.upscaledFilename}: ${error.message}`, 'warning');
        }
      }

      addLog('🔄 Generating 4K zip file...', 'info');
      
      // Generate zip with no compression for faster processing
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
        compressionOptions: { level: 0 }
      });

      // Calculate final zip size
      const zipSizeMB = (zipBlob.size / 1024 / 1024).toFixed(1);
      addLog(`📦 4K zip file created: ${zipSizeMB}MB`, 'info');

      // Create download link and trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog(`✅ Downloaded 4K zip archive: ${folderName}.zip (${zipSizeMB}MB)`, 'success');
      
    } catch (error) {
      addLog('❌ Failed to create 4K zip archive: ' + error.message, 'error');
      console.error('4K zip creation error:', error);
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
    addLog(`📦 Creating zip archive with ${favoritedVideos.length} favorited videos...`, 'info');

    try {
      // Dynamic import of JSZip to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Create timestamp for unique folder naming
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }).replace(/[/:]/g, '-').replace(', ', '_');

      const folderName = `Favorited Videos (${timestamp})`;
      const folder = zip.folder(folderName);
      const videosFolder = folder.folder('Videos');
      const jsonFolder = folder.folder('JSON');

      // Sort videos by generation and video number for organized download
      const sortedVideos = favoritedVideos
        .map(result => ({
          ...result,
          filename: generateFilename(result.jobId, result.id),
          upscaledFilename: result.upscaled_video_url ? generateFilename(result.jobId, result.id, true) : null
        }))
        .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

      // Add each video to the zip with progress tracking
      for (let i = 0; i < sortedVideos.length; i++) {
        const result = sortedVideos[i];
        try {
          // Add original video
          addLog(`📥 Adding ${result.filename} to archive... (${i + 1}/${sortedVideos.length})`, 'info');
          
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch video`);
          }
          
          const blob = await response.blob();
          
          // Verify blob size before adding to zip
          if (blob.size === 0) {
            throw new Error('Empty video file received');
          }
          
          // Add video to Videos folder
          videosFolder.file(result.filename, blob);
          
          // Add upscaled video if available
          if (result.upscaled_video_url && result.upscaledFilename) {
            addLog(`📥 Adding 4K version ${result.upscaledFilename} to archive...`, 'info');
            
            const upscaledResponse = await fetch(result.upscaled_video_url);
            if (upscaledResponse.ok) {
              const upscaledBlob = await upscaledResponse.blob();
              if (upscaledBlob.size > 0) {
                videosFolder.file(result.upscaledFilename, upscaledBlob);
              }
            }
          }
          
          // Add metadata file to JSON folder
          const metadata = {
            id: result.id,
            prompt: result.prompt,
            jobId: result.jobId,
            created_at: result.created_at,
            imageimport React, { useState, useEffect, useRef } from 'react';
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
            
            let errorMessage = errorData.error || 'API Error: ' + response.status;
            
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

            if (response.status === 400 && errorMessage.includes('not have enough credits')) {
              throw new Error('Insufficient credits: ' + errorMessage);
            }
            
            if (response.status === 400 && errorMessage.toLowerCase().includes('safety')) {
              throw new Error('Content safety violation: ' + errorMessage);
            }
            
            if (errorMessage.includes('Invalid asset aspect ratio')) {
              errorMessage = 'Image aspect ratio issue: ' + errorMessage + ' Try using an image that is closer to square, landscape, or portrait format (not ultra-wide or ultra-tall).';
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
    let isThrottled = false;
    let throttledStartTime = null;
    let lastKnownStatus = 'unknown';
    let stuckInPendingCount = 0;
    const maxStuckInPending = 15;
    let processingStartTime = null;

    while (pollCount < maxPolls) {
      try {
        const timeoutMs = consecutiveErrors > 0 ? 30000 : 
                          isThrottled ? 45000 : 
                          lastKnownStatus === 'RUNNING' ? 20000 : 15000;
        
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
          if (response.status === 429) {
            const backoffTime = 45000 + (consecutiveErrors * 20000) + (Math.random() * 15000);
            addLog(`⚠️ Job ${jobIndex + 1} rate limited (${response.status}), backing off for ${Math.round(backoffTime/1000)}s...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            consecutiveErrors++;
            pollCount++;
            continue;
          } else if (response.status >= 500) {
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
        
        if (task.status === 'THROTTLED') {
          if (!isThrottled) {
            isThrottled = true;
            throttledStartTime = Date.now();
            addLog('⏸️ Job ' + (jobIndex + 1) + ' is queued (throttled) - waiting for available slot...', 'info');
          }
          
          const throttledDuration = Math.floor((Date.now() - throttledStartTime) / 1000);
          setGenerationProgress(prev => ({
            ...prev,
            [jobId]: { 
              status: 'throttled', 
              progress: 5,
              message: `Queued for ${Math.floor(throttledDuration / 60)}m ${throttledDuration % 60}s` 
            }
          }));
          
          if (throttledDuration > 0 && throttledDuration % 180 === 0) {
            addLog('⏸️ Job ' + (jobIndex + 1) + ' still queued after ' + Math.floor(throttledDuration / 60) + ' minute(s)', 'info');
          }
          
          await new Promise(resolve => setTimeout(resolve, 4000));
          pollCount++;
          continue;
        }
        
        if (isThrottled && task.status !== 'THROTTLED') {
          const queueTime = Math.floor((Date.now() - throttledStartTime) / 1000);
          addLog('▶️ Job ' + (jobIndex + 1) + ' started processing after ' + Math.floor(queueTime / 60) + 'm ' + (queueTime % 60) + 's in queue', 'info');
          isThrottled = false;
          stuckInPendingCount = 0;
          processingStartTime = Date.now();
        }
        
        if (task.status === 'PENDING') {
          if (lastKnownStatus === 'PENDING') {
            stuckInPendingCount++;
          } else {
            stuckInPendingCount = 1;
            if (!processingStartTime) processingStartTime = Date.now();
          }
          
          if (stuckInPendingCount >= maxStuckInPending) {
            addLog(`⚠️ Job ${jobIndex + 1} stuck in PENDING for ${stuckInPendingCount} cycles, using longer polling interval...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 12000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } else if (task.status === 'RUNNING') {
          if (!processingStartTime) processingStartTime = Date.now();
          stuckInPendingCount = 0;
          await new Promise(resolve => setTimeout(resolve, 8000));
        } else {
          stuckInPendingCount = 0;
        }
        
        lastKnownStatus = task.status;
        
        let progress = 10;
        const now = Date.now();
        let runningTime = 0;
        
        if (task.status === 'PENDING') {
          progress = Math.min(20 + (stuckInPendingCount * 1.5), 35);
        } else if (task.status === 'RUNNING') {
          runningTime = processingStartTime ? Math.floor((now - processingStartTime) / 1000) : 0;
          const expectedDuration = duration * 8;
          const runningProgress = Math.min((runningTime / expectedDuration) * 60, 60);
          progress = Math.min(35 + runningProgress, 95);
        } else if (task.status === 'SUCCEEDED') {
          progress = 100;
        }
        
        setGenerationProgress(prev => ({
          ...prev,
          [jobId]: { 
            status: task.status.toLowerCase(), 
            progress: Math.round(progress),
            message: task.status === 'RUNNING' ? 
              `Processing... (${Math.floor(runningTime / 60)}m ${runningTime % 60}s)` : 
              task.status === 'PENDING' && stuckInPendingCount > 8 ? 
                'Processing (high load)...' :
              task.status.toLowerCase()
          }
        }));

        if (task.status === 'SUCCEEDED') {
          const totalTime = processingStartTime ? Math.floor((now - processingStartTime) / 1000) : 0;
          addLog('✓ Job ' + (jobIndex + 1) + ' completed successfully in ' + Math.floor(totalTime / 60) + 'm ' + (totalTime % 60) + 's', 'success');
          
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
            jobId: jobId,
            processingTime: totalTime
          };

          setResults(prev => [...prev, completedVideo]);
          return completedVideo;
        }

        if (task.status === 'FAILED') {
          const failureReason = task.failure_reason || task.failureCode || task.error || 'Generation failed - no specific reason provided';
          
          let enhancedFailureReason = failureReason;
          if (failureReason.includes('SAFETY')) {
            enhancedFailureReason = 'Content safety violation: ' + failureReason;
          } else if (failureReason.includes('INTERNAL.BAD_OUTPUT')) {
            enhancedFailureReason = 'Output quality issue: ' + failureReason + ' (Try different prompt/image)';
          } else if (failureReason.includes('INTERNAL')) {
            enhancedFailureReason = 'Internal processing error: ' + failureReason + ' (Retryable)';
          }
          
          addLog('✗ Job ' + (jobIndex + 1) + ' failed on Runway: ' + enhancedFailureReason, 'error');
          
          setGenerationProgress(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });
          
          throw new Error(enhancedFailureReason);
        }

        const pollInterval = 
          task.status === 'PENDING' && stuckInPendingCount > 8 ? 12000 :
          task.status === 'RUNNING' ? 4000 :
          task.status === 'THROTTLED' ? 10000 :
          isThrottled ? 12000 :
          5000;
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
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
        
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' polling timeout, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' network error, retrying... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' rate limited, waiting longer... (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
          await new Promise(resolve => setTimeout(resolve, 90000));
        } else {
          addLog('⚠️ Job ' + (jobIndex + 1) + ' error: ' + error.message + ' (attempt ' + consecutiveErrors + '/' + maxConsecutiveErrors + ')', 'warning');
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

    const totalTime = Math.floor((pollCount * 15) / 60);
    throw new Error('Generation timeout after ' + totalTime + ' minutes');
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
              
              <div className="mb-3">
                <p className="mb-2"><strong>Generation Details:</strong></p>
                <ul className="small mb-0 ps-3">
                  <li>{totalJobs} × {model} ({duration}s) = {estimatedCreditsNeeded} credits</li>
                  <li>You need {estimatedCreditsNeeded - currentBalance} more credits</li>
                  <li>Estimated cost: ${((estimatedCreditsNeeded - currentBalance) * 0.01).toFixed(2)}</li>
                </ul>
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
            
            {organizationInfo && (
              <div className="row g-3 mb-3">
                <div className="col-4">
                  <div className="text-center p-3 border rounded">
                    <div className="h5 mb-1 text-success">{organizationInfo.creditBalance}</div>
                    <small className="text-muted">Current Credits</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-3 border rounded">
                    <div className="h5 mb-1 text-primary">{estimateCreditsNeeded(totalJobs, model, duration)}</div>
                    <small className="text-muted">Credits Needed</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-3 border rounded">
                    <div className="h5 mb-1 text-info">{organizationInfo.creditBalance - estimateCreditsNeeded(totalJobs, model, duration)}</div>
                    <small className="text-muted">Remaining</small>
                  </div>
                </div>
              </div>
            )}
            
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
            