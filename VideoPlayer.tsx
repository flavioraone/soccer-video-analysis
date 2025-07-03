
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import c from 'classnames';
import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {timeToSecs, FrameData, Detection} from './utils';
import { useTranslation } from './i18n.jsx';

// Augment HTMLVideoElement interface to include captureStream
declare global {
  interface HTMLVideoElement {
    captureStream(frameRate?: number): MediaStream;
  }
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}


const formatTime = (t: number) =>
  `${Math.floor(t / 60)}:${Math.floor(t % 60)
    .toString()
    .padStart(2, '0')}`;

interface TimecodeEntry {
  time: string;
  text: string;
  value?: number;
  objects?: string[];
}

interface VideoPlayerProps {
  url: string | null;
  timecodeList: TimecodeEntry[] | null;
  requestedTimecode: number | null;
  isLoadingVideo: boolean;
  videoError: boolean;
  jumpToTimecode: (time: number) => void;
  isReady: boolean;
  trackingData?: FrameData[] | null;
  videoDimensions?: {width: number; height: number} | null;
  clipCommand: { time: number, videoUrl: string } | null; // New prop for clip download
  onClipProcessEnd: () => void; // New prop to signal clip process end
  selectedPlayerIdForTracking?: string | null; // New prop
}

export default function VideoPlayer({
  url,
  timecodeList,
  requestedTimecode,
  isLoadingVideo,
  videoError,
  jumpToTimecode,
  isReady,
  trackingData,
  videoDimensions,
  clipCommand,
  onClipProcessEnd,
  selectedPlayerIdForTracking,
}: VideoPlayerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [scrubberTime, setScrubberTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<string | null | undefined>(null);
  
  const [isClippingInternal, setIsClippingInternal] = useState(false);
  const [clippingMessage, setClippingMessage] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const currentVideoTime = videoRef.current?.currentTime || 0;
  const currentPercent = duration > 0 ? (currentVideoTime / duration) * 100 : 0;

  const timecodeListReversed = useMemo(
    () => timecodeList?.slice().reverse(),
    [timecodeList],
  );

  const setVideo = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current || isClippingInternal) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => console.error("Error attempting to play video:", error));
    }
  }, [isPlaying, isClippingInternal]);

  const updateDuration = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }

  const updateTime = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const currentDuration = videoRef.current.duration;

    if (!isScrubbing && currentDuration > 0) {
      setScrubberTime(currentTime / currentDuration);
    }

    if (timecodeListReversed) {
      setCurrentCaption(
        timecodeListReversed.find(
          (tc) => timeToSecs(tc.time) <= currentTime,
        )?.text,
      );
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  useEffect(() => {
    setScrubberTime(0);
    setIsPlaying(false);
    setCurrentCaption(null);
    if (videoRef.current && url) {
        videoRef.current.load();
    }
  }, [url]);

  useEffect(() => {
    if (videoRef.current && requestedTimecode !== null && Number.isFinite(requestedTimecode)) {
      videoRef.current.currentTime = requestedTimecode;
      if (duration > 0) {
        setScrubberTime(requestedTimecode / duration);
      }
    }
  }, [requestedTimecode, duration]);

  useEffect(() => {
    const onKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA' &&
        e.key === ' ' &&
        videoRef.current && !isClippingInternal
      ) {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keypress', onKeyPress);
    return () => {
      document.removeEventListener('keypress', onKeyPress);
    };
  }, [togglePlay, isClippingInternal]);


  // Effect for handling clip command
  useEffect(() => {
    if (!clipCommand || !videoRef.current || !url) {
      if (clipCommand && !url) { 
        onClipProcessEnd(); 
      }
      return;
    }

    if (isClippingInternal) return; 

    if (url !== clipCommand.videoUrl) {
        console.warn("Clip command for different video URL. Aborting clip.");
        onClipProcessEnd(); 
        return;
    }

    const videoEl = videoRef.current;
    const eventTimeSecs = clipCommand.time;

    const clipStartTime = Math.max(0, eventTimeSecs - 2);
    const clipEndTime = Math.min(videoEl.duration, eventTimeSecs + 3);

    if (clipEndTime <= clipStartTime || !Number.isFinite(videoEl.duration) || videoEl.duration === 0) {
      console.error('Invalid clip times or video duration for clipping.');
      setClippingMessage(t('videoPlayer.clippingErrorMessage'));
      setIsClippingInternal(true); 
      setTimeout(() => {
        setIsClippingInternal(false);
        onClipProcessEnd();
      }, 3000);
      return;
    }

    setIsClippingInternal(true);
    setClippingMessage(t('videoPlayer.clippingStartMessage'));
    recordedChunksRef.current = [];

    const originalPlayerTime = videoEl.currentTime;
    const wasPlayerPlaying = !videoEl.paused;
    const wasPlayerMuted = videoEl.muted;

    videoEl.pause();
    videoEl.muted = true; 
    videoEl.currentTime = clipStartTime;

    const performClip = () => {
      try {
        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 
        ];
        const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
        const fileExtension = supportedMimeType.startsWith('video/mp4') ? 'mp4' : 'webm';

        if (typeof videoEl.captureStream !== 'function') {
            console.error('videoEl.captureStream is not a function. Cannot record.');
            setClippingMessage(t('videoPlayer.clippingErrorMessage'));
            restorePlayerState();
            setTimeout(() => {
                setIsClippingInternal(false);
                onClipProcessEnd();
            }, 3000);
            return;
        }
        
        const stream = videoEl.captureStream();
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const clipBlob = new Blob(recordedChunksRef.current, { type: supportedMimeType });
          const downloadUrl = URL.createObjectURL(clipBlob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = downloadUrl;
          a.download = `clip_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(downloadUrl);
          a.remove();

          setClippingMessage(t('videoPlayer.clippingSuccessMessage'));
          restorePlayerState();
          setTimeout(() => {
            setIsClippingInternal(false);
            onClipProcessEnd();
          }, 2000); 
        };
        
        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setClippingMessage(t('videoPlayer.clippingErrorMessage'));
          restorePlayerState();
           setTimeout(() => {
            setIsClippingInternal(false);
            onClipProcessEnd();
          }, 3000);
        };

        const handleClippingTimeUpdate = () => {
          if (videoEl.currentTime >= clipEndTime) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            videoEl.removeEventListener('timeupdate', handleClippingTimeUpdate);
          }
        };
        videoEl.addEventListener('timeupdate', handleClippingTimeUpdate);
        
        mediaRecorderRef.current.start();
        videoEl.play().catch(err => {
            console.error("Error playing video for clipping:", err);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
            videoEl.removeEventListener('timeupdate', handleClippingTimeUpdate);
            setClippingMessage(t('videoPlayer.clippingErrorMessage'));
            restorePlayerState();
            setTimeout(() => {
                setIsClippingInternal(false);
                onClipProcessEnd();
            }, 3000);
        });

      } catch (error) {
        console.error('Error setting up MediaRecorder:', error);
        setClippingMessage(t('videoPlayer.clippingErrorMessage'));
        restorePlayerState();
        setTimeout(() => {
          setIsClippingInternal(false);
          onClipProcessEnd();
        }, 3000);
      }
    };
    
    const restorePlayerState = () => {
        videoEl.pause(); 
        videoEl.currentTime = eventTimeSecs; 
        videoEl.muted = wasPlayerMuted;
        if (wasPlayerPlaying && !isClippingInternal) { 
            videoEl.play().catch(e => console.error("Error restoring play state", e));
        }
    };

    const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        performClip();
    }
    videoEl.addEventListener('seeked', onSeeked);
    const seekTimeout = setTimeout(() => {
        videoEl.removeEventListener('seeked', onSeeked);
        console.warn("Seeked event timeout, attempting to clip anyway.");
        performClip();
    }, 1000); 

    return () => {
        clearTimeout(seekTimeout);
        videoEl.removeEventListener('seeked', onSeeked);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if(isClippingInternal){
            videoEl.pause();
            videoEl.currentTime = originalPlayerTime;
            videoEl.muted = wasPlayerMuted;
        }
    };

  }, [clipCommand, url, duration, t, onClipProcessEnd]);


  // Effect to size and position the canvas overlay precisely over the video element
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && videoDimensions) {
      // Set intrinsic size of canvas
      let newCanvasWidth = 0;
      let newCanvasHeight = 0;

      // Prioritize actual video element dimensions if available and valid
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        newCanvasWidth = video.videoWidth;
        newCanvasHeight = video.videoHeight;
      } else if (videoDimensions.width > 0 && videoDimensions.height > 0) {
        // Fallback to videoDimensions from props if video element's props aren't ready
        newCanvasWidth = videoDimensions.width;
        newCanvasHeight = videoDimensions.height;
      }

      if (newCanvasWidth > 0 && newCanvasHeight > 0) {
        if (canvas.width !== newCanvasWidth) {
          canvas.width = newCanvasWidth;
        }
        if (canvas.height !== newCanvasHeight) {
          canvas.height = newCanvasHeight;
        }
      }

      const updateCanvasStyle = () => {
        if (video && canvas) { // Re-check refs inside observer/listener
          canvas.style.width = `${video.offsetWidth}px`;
          canvas.style.height = `${video.offsetHeight}px`;
          canvas.style.top = `${video.offsetTop}px`;
          canvas.style.left = `${video.offsetLeft}px`;
        }
      };

      // Initial style update
      updateCanvasStyle();

      // Use ResizeObserver to detect changes in video element's rendered size
      const resizeObserver = new ResizeObserver(updateCanvasStyle);
      resizeObserver.observe(video);

      // Fallback for window resize, though ResizeObserver is more targeted
      window.addEventListener('resize', updateCanvasStyle);

      return () => {
        resizeObserver.unobserve(video);
        window.removeEventListener('resize', updateCanvasStyle);
      };
    } else if (canvas) {
      // If video or videoDimensions are not ready, clear canvas style and potentially size
      canvas.style.width = '0px';
      canvas.style.height = '0px';
      canvas.style.top = '0px';
      canvas.style.left = '0px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0,0,canvas.width, canvas.height);
      }
    }
  }, [videoDimensions]); // Re-run when videoDimensions (and thus video metadata) are available


  // Effect for drawing tracking data onto the canvas
  useEffect(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;

    if (!canvasEl || !videoEl || !trackingData || trackingData.length === 0 || !videoDimensions) {
        if(canvasEl) {
            const ctx = canvasEl.getContext('2d');
            // Ensure canvas has valid dimensions before clearing, otherwise clearRect might error or do nothing
            if (ctx && canvasEl.width > 0 && canvasEl.height > 0) {
              ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            }
        }
        return;
    }
    
    // Canvas intrinsic dimensions should have been set by the sizing useEffect.
    // If not (e.g. videoDimensions became null), we should not draw.
    if (canvasEl.width === 0 || canvasEl.height === 0) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const currentTimeSec = videoEl.currentTime;
    
    let bestMatchFrame: FrameData | undefined = undefined;
    let minTimeDiff = 0.25; 

    for (const frame of trackingData) {
        const frameTime = timeToSecs(frame.timestamp);
        const diff = Math.abs(frameTime - currentTimeSec);

        if (diff < minTimeDiff) {
            minTimeDiff = diff;
            bestMatchFrame = frame;
        }
        if (frameTime > currentTimeSec + 0.5 && bestMatchFrame) break; 
    }
    
    if (bestMatchFrame) {
      const detectionsToDraw = selectedPlayerIdForTracking
        ? bestMatchFrame.detections.filter(det => det.id === selectedPlayerIdForTracking && det.type === 'player')
        : bestMatchFrame.detections;

      detectionsToDraw.forEach(det => {
        const playerColor = getComputedStyle(document.documentElement).getPropertyValue('--tracking-player-color').trim() || 'cyan';
        const ballColor = getComputedStyle(document.documentElement).getPropertyValue('--tracking-ball-color').trim() || 'orange';

        ctx.strokeStyle = det.type === 'ball' ? ballColor : playerColor;
        ctx.lineWidth = 2;
        ctx.fillStyle = det.type === 'ball' ? ballColor : playerColor;
        ctx.font = '12px Segoe UI, sans-serif';

        // Bbox coordinates are normalized (0-1). Scale them by canvas intrinsic dimensions.
        const x = det.bbox[0] * canvasEl.width;
        const y = det.bbox[1] * canvasEl.height;
        const w = (det.bbox[2] - det.bbox[0]) * canvasEl.width;
        const h = (det.bbox[3] - det.bbox[1]) * canvasEl.height;

        ctx.strokeRect(x, y, w, h);
        
        if (det.type === 'player' || !selectedPlayerIdForTracking) {
            let textY = y > 12 ? y - 3 : y + h + 12;
            if (textY + 5 > canvasEl.height) textY = y - 3; 
            if (textY < 12 && y + h + 12 < canvasEl.height) textY = y + h +12; 
            ctx.fillText(det.id, x, textY);
        }
      });
    }
  }, [scrubberTime, trackingData, videoDimensions, requestedTimecode, isPlaying, duration, selectedPlayerIdForTracking]);


  return (
    <div className="videoPlayer">
      {isClippingInternal && (
        <div className="clippingMessage" role="alert">
          {clippingMessage}
        </div>
      )}
      {isReady && url ? (
        <>
          <div className="videoAreaContainer">
            <div className="videoArea">
                <video
                key={url}
                src={url}
                ref={setVideo}
                onClick={togglePlay}
                preload="auto"
                crossOrigin="anonymous"
                onDurationChange={updateDuration}
                onTimeUpdate={updateTime}
                onPlay={onPlay}
                onPause={onPause}
                onLoadedMetadata={updateDuration}
                onLoadedData={updateDuration}
                controls={false}
                />
                {/* Canvas is positioned by the useEffect hook, not just CSS */}
                <canvas ref={canvasRef} />
            </div>
            {currentCaption && !isClippingInternal && ( 
              <div className="videoCaption" aria-live="polite">{currentCaption}</div>
            )}
          </div>

          <div className="videoControls">
            <div className="videoScrubber" role="slider" aria-label={t('videoPlayer.progressLabel')} aria-valuenow={Math.round(currentPercent)} aria-valuemin={0} aria-valuemax={100}>
              <input
                style={{'--pct': `${currentPercent}%`} as React.CSSProperties}
                type="range"
                min="0"
                max="1"
                value={scrubberTime}
                step="0.000001"
                onChange={(e) => {
                  if (!videoRef.current || !Number.isFinite(duration) || duration === 0 || isClippingInternal) return;
                  const newTimeFraction = e.target.valueAsNumber;
                  setScrubberTime(newTimeFraction);
                  videoRef.current.currentTime = newTimeFraction * duration;
                }}
                onPointerDown={() => { if(!isClippingInternal) setIsScrubbing(true); }}
                onPointerUp={() => { if(!isClippingInternal) setIsScrubbing(false); }}
                aria-label={t('videoPlayer.scrubberLabel')}
                disabled={isClippingInternal}
              />
            </div>
            <div className="timecodeMarkers">
              {timecodeList?.map(({time, text, value}, i) => {
                if (!Number.isFinite(duration) || duration === 0) return null;
                const secs = timeToSecs(time);
                const pct = (secs / duration) * 100;
                 if (!Number.isFinite(pct)) return null;

                return (
                  <div
                    className="timecodeMarker"
                    key={i}
                    style={{left: `${pct}%`}}
                    role="button"
                    tabIndex={isClippingInternal ? -1 : 0}
                    onClick={() => { if(!isClippingInternal) jumpToTimecode(secs);}}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if(!isClippingInternal) jumpToTimecode(secs); }}}
                    aria-label={t('videoPlayer.markerLabel', { time, description: value || text })}
                    >
                    <div
                      className="timecodeMarkerTick"
                      >
                      <div />
                    </div>
                    <div
                      className={c('timecodeMarkerLabel', {right: pct > 50})}>
                      <div>{time}</div>
                      <p>{value || text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="videoTime">
              <button onClick={togglePlay} aria-label={isPlaying ? t('videoPlayer.pauseLabel') : t('videoPlayer.playLabel')} disabled={isClippingInternal}>
                <span className="icon">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              {formatTime(currentVideoTime)} / {formatTime(Number.isFinite(duration) ? duration : 0)}
            </div>
          </div>
        </>
      ) : (
        <div className="emptyVideo">
          <p>
            {isLoadingVideo
              ? t('videoPlayer.processing')
              : videoError
                ? t('videoPlayer.error')
                : t('videoPlayer.noVideo')}
          </p>
          {!isReady && !isLoadingVideo && !videoError && (
             <p className="subtleHint">{t('videoPlayer.uploadHint')}</p>
          )}
        </div>
      )}
    </div>
  );
}
