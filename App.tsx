


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
import React, {useRef, useState, useCallback, useEffect, useMemo} from 'react';
import {generateContent, uploadFile} from './api';
import Chart from './Chart.jsx';
import functions from './functions';
import getModes from './modes'; // Changed import
import {timeToSecs, exportTrackingDataToJson, exportTrackingDataToCsv, FrameData, Detection} from './utils';
import VideoPlayer from './VideoPlayer.jsx';
import type { File as GoogleGenAIFile } from '@google/genai';
import { useTranslation } from './i18n.jsx';

interface CachedAnalysis {
  timecodeList?: any[] | null;
  trackingData?: FrameData[] | null;
}

const MIN_TOP_SECTION_PERCENT = 20;
const MAX_TOP_SECTION_PERCENT = 80;

export default function App() {
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const modes = useMemo(() => getModes(t), [t]);
  const chartModes = useMemo(() => Object.keys(modes.Chart.subModes!), [modes.Chart.subModes]);


  const [vidUrl1, setVidUrl1] = useState<string | null>(null);
  const [file1, setFile1] = useState<GoogleGenAIFile | null>(null);
  const [isLoadingVideo1, setIsLoadingVideo1] = useState(false);
  const [videoError1, setVideoError1] = useState(false);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const [videoDimensions1, setVideoDimensions1] = useState<{width: number, height: number} | null>(null);
  const [youtubeUrlInput1, setYoutubeUrlInput1] = useState('');
  const [isYoutubeActive1, setIsYoutubeActive1] = useState(false);


  const [vidUrl2, setVidUrl2] = useState<string | null>(null);
  const [file2, setFile2] = useState<GoogleGenAIFile | null>(null);
  const [isLoadingVideo2, setIsLoadingVideo2] = useState(false);
  const [videoError2, setVideoError2] = useState(false);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoFile, setActiveVideoFile] = useState<GoogleGenAIFile | null>(null);
  const [activeVideoDimensions, setActiveVideoDimensions] = useState<{width: number, height: number} | null>(null);

  const [isStitching, setIsStitching] = useState(false);
  const [stitchError, setStitchError] = useState('');
  const [uploadPageError, setUploadPageError] = useState(''); // For general errors on upload page

  const [timecodeList, setTimecodeList] = useState<any[] | null>(null);
  const [trackingData, setTrackingData] = useState<FrameData[] | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [uniquePlayerIds, setUniquePlayerIds] = useState<string[] | null>(null);
  const [selectedPlayerIdForTracking, setSelectedPlayerIdForTracking] = useState<string | null>(null);


  const [requestedTimecode, setRequestedTimecode] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<keyof typeof modes>(Object.keys(modes)[0] as keyof typeof modes);
  const [activeMode, setActiveMode] = useState<keyof typeof modes | undefined>();
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const [chartMode, setChartMode] = useState<(keyof typeof modes.Chart.subModes)>(chartModes[0] as keyof typeof modes.Chart.subModes);
  const [chartPrompt, setChartPrompt] = useState('');
  const [chartLabel, setChartLabel] = useState('');
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null); // Ref for the main container

  // State for clip download feature
  const [clipRequest, setClipRequest] = useState<{ time: number, elementKey: string, videoUrl: string } | null>(null);
  const [pendingClipDownload, setPendingClipDownload] = useState<{ time: number, videoUrl: string } | null>(null);
  const [isClippingGlobal, setIsClippingGlobal] = useState(false);

  // Cache for analysis results
  const [analysisCache, setAnalysisCache] = useState<Map<string, Map<string, CachedAnalysis>>>(new Map());

  // State for resizable layout
  const [topSectionHeight, setTopSectionHeight] = useState(60); // Initial height percentage for the top section
  const [isResizing, setIsResizing] = useState(false);

  const baseFilename = useMemo(() => {
    const currentFile = activeVideoFile;
    if (!currentFile) {
      if (activeVideoUrl && activeVideoUrl.includes('youtube.com') || activeVideoUrl && activeVideoUrl.includes('youtu.be')) {
        try {
          const url = new URL(activeVideoUrl);
          let videoId = url.searchParams.get('v');
          if (!videoId && url.hostname === 'youtu.be') {
            videoId = url.pathname.substring(1);
          }
          return videoId ? `youtube_${videoId}` : 'youtube_video';
        } catch (e) {
          return 'youtube_video';
        }
      }
      return 'video_tracking';
    }

    const dn = currentFile.displayName; 
    if (typeof dn === 'string') {
      return dn.replace(/\.[^/.]+$/, "");
    }
    if (typeof dn === 'number') {
      return String(dn);
    }
    return String(currentFile.name).replace(/\.[^/.]+$/, "");
  }, [activeVideoFile, activeVideoUrl]);
  
  useEffect(() => {
    if (modes && Object.keys(modes).length > 0) {
        if (!modes[selectedMode]) {
             setSelectedMode(Object.keys(modes)[0] as keyof typeof modes);
        }
    }
  }, [modes, selectedMode]);

  useEffect(() => {
    if (modes?.Chart?.subModes && Object.keys(modes.Chart.subModes).length > 0) {
        if(!modes.Chart.subModes[chartMode]){
            setChartMode(Object.keys(modes.Chart.subModes)[0] as keyof typeof modes.Chart.subModes);
        }
    }
  }, [modes?.Chart?.subModes, chartMode]);

  useEffect(() => {
    setClipRequest(null);
    setPendingClipDownload(null);
    setIsClippingGlobal(false);
  }, [activeVideoUrl]);

  useEffect(() => {
    if (activeMode && modes[activeMode]?.isTracking && trackingData) {
      const playerIds = new Set<string>();
      trackingData.forEach(frame => {
        frame.detections.forEach(det => {
          if (det.type === 'player') {
            playerIds.add(det.id);
          }
        });
      });
      setUniquePlayerIds(Array.from(playerIds).sort());
    } else {
      setUniquePlayerIds(null);
      setSelectedPlayerIdForTracking(null);
    }
  }, [trackingData, activeMode, modes]);


  const isCustomMode = selectedMode === 'Custom';
  const isChartMode = selectedMode === 'Chart';
  const isCustomChartMode = isChartMode && chartMode === 'Custom';
  const hasSubMode = isCustomMode || isChartMode;
  const isTrackingModeActive = activeMode && modes[activeMode]?.isTracking === true;

  const getCacheIdentifierForMode = useCallback((
    modeKeyToIdentify: keyof typeof modes, 
    currentCustomPrompt: string,
    currentChartMode: keyof typeof modes.Chart.subModes, 
    currentChartPrompt: string
  ): string => {
    const modeKeyStr = String(modeKeyToIdentify); 

    if (modeKeyStr === 'Custom') {
      return `${modeKeyStr}_${currentCustomPrompt}`;
    }
    if (modeKeyStr === 'Chart') {
        if (currentChartMode === 'Custom') { 
            return `${modeKeyStr}_ChartCustom_${currentChartPrompt}`;
        }
        return `${modeKeyStr}_${currentChartMode}`; 
    }
    return modeKeyStr; 
  }, []);

  useEffect(() => {
    // Only cache if activeVideoFile exists (i.e., not a YouTube link without downloaded file)
    if (activeVideoFile && activeMode && modes[activeMode]) {
      const videoCacheKey = String(activeVideoFile.name); 
      const modeCacheIdentifier = getCacheIdentifierForMode(
        activeMode as keyof typeof modes, 
        customPrompt, 
        chartMode, 
        chartPrompt
      );

      const currentVideoAnalyses = analysisCache.get(videoCacheKey) || new Map<string, CachedAnalysis>();
      const existingModeData = currentVideoAnalyses.get(modeCacheIdentifier);

      let dataToCache: CachedAnalysis | null = null;

      if (modes[activeMode].isTracking) {
        if (trackingData !== null && trackingData !== existingModeData?.trackingData) {
          dataToCache = { trackingData: trackingData, timecodeList: null };
        }
      } else {
        if (timecodeList !== null && timecodeList !== existingModeData?.timecodeList) {
          dataToCache = { timecodeList: timecodeList, trackingData: null };
        }
      }
      
      if (!existingModeData && ( (modes[activeMode].isTracking && trackingData !== null) || (!modes[activeMode].isTracking && timecodeList !== null) )) {
          dataToCache = modes[activeMode].isTracking ? { trackingData: trackingData, timecodeList: null } : { timecodeList: timecodeList, trackingData: null };
      }

      if (dataToCache) {
        const updatedVideoAnalyses = new Map(currentVideoAnalyses);
        updatedVideoAnalyses.set(modeCacheIdentifier, dataToCache);

        const newCache = new Map(analysisCache);
        newCache.set(videoCacheKey, updatedVideoAnalyses);
        setAnalysisCache(newCache);
      }
    }
  }, [
      timecodeList, 
      trackingData, 
      activeMode, 
      activeVideoFile, 
      customPrompt, 
      chartMode, 
      chartPrompt, 
      analysisCache, 
      modes,
      getCacheIdentifierForMode 
    ]);


  const setTimecodes = ({timecodes}: {timecodes: any[]}) =>
    setTimecodeList(
      timecodes.map((tc) => ({...tc, text: tc.text?.replaceAll("\\'", "'") || ''})),
    );
  
  const handleSetTrackingData = ({ frame_data }: { frame_data: FrameData[] }) => {
    setTrackingData(frame_data);
    setSelectedPlayerIdForTracking(null); 
  };

  const onModeSelect = useCallback(async (modeKey: keyof typeof modes) => {
    // If activeVideoFile is null (e.g. YouTube link), analysisMessage should already be set.
    // This function should bail early.
    if (!activeVideoFile) {
        // analysisMessage is likely already set by analyzeSingleVideo if it's a YouTube URL
        // If not, and we somehow got here with no file, ensure lists are clear and no loading state.
        if (!analysisMessage) {
            setAnalysisMessage(t('upload.noFileForAnalysis'));
        }
        setTimecodeList(null);
        setTrackingData(null);
        setIsLoadingAnalysis(false);
        setIsLoadingTracking(false);
        scrollRef.current?.scrollTo({top: 0});
        return;
    }

    const videoCacheKey = String(activeVideoFile.name);
    const currentModeConfig = modes[modeKey];

    if (!currentModeConfig) {
        console.error("Selected mode not found in modes configuration:", modeKey);
        setIsLoadingAnalysis(false);
        setIsLoadingTracking(false);
        return;
    }
    
    const modeCacheIdentifier = getCacheIdentifierForMode(modeKey, customPrompt, chartMode, chartPrompt);

    const cachedVideoAnalyses = analysisCache.get(videoCacheKey);
    if (cachedVideoAnalyses) {
      const cachedResult = cachedVideoAnalyses.get(modeCacheIdentifier);
      if (cachedResult) {
        setActiveMode(modeKey); 
        setTimecodeList(cachedResult.timecodeList !== undefined ? cachedResult.timecodeList : null);
        setTrackingData(cachedResult.trackingData !== undefined ? cachedResult.trackingData : null);
        setClipRequest(null);
        setIsLoadingAnalysis(false);
        setIsLoadingTracking(false);
        setSelectedPlayerIdForTracking(null);
        setAnalysisMessage(null); // Clear any previous messages if loading from cache
        
        if (modeKey === 'Chart' && modes.Chart.subModes) {
             const chartSubModeKey = chartMode as keyof typeof modes.Chart.subModes;
             const subModeConfig = modes.Chart.subModes[chartSubModeKey];
             if (chartMode === 'Custom') {
                setChartLabel(chartPrompt);
             } else if (typeof subModeConfig === 'object' && subModeConfig.displayName) {
                setChartLabel(subModeConfig.displayName);
             } else if (typeof subModeConfig === 'string') { 
                setChartLabel(chartSubModeKey);
             }
        }
        scrollRef.current?.scrollTo({top: 0});
        return;
      }
    }
    
    setActiveMode(modeKey);
    setTimecodeList(null); 
    setTrackingData(null); 
    setClipRequest(null);
    setSelectedPlayerIdForTracking(null);
    setAnalysisMessage(null); // Clear message before new analysis

    currentModeConfig.isTracking ? setIsLoadingTracking(true) : setIsLoadingAnalysis(true);

    let prompt;
    let functionCallbacks = functions({
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}: {timecodes: any[]}) =>
          setTimecodeList(timecodes),
        set_tracking_data: handleSetTrackingData,
      });

    if (modeKey === 'Custom' && 'prompt' in currentModeConfig && typeof currentModeConfig.prompt === 'function') {
        prompt = currentModeConfig.prompt(customPrompt);
    } else if (modeKey === 'Chart' && 'prompt' in currentModeConfig && typeof currentModeConfig.prompt === 'function' && modes.Chart.subModes) {
        const chartSubModeKey = chartMode as keyof typeof modes.Chart.subModes;
        const subModePromptOrConfig = modes.Chart.subModes[chartSubModeKey];
        let subModePromptText: string | undefined;

        if (typeof subModePromptOrConfig === 'string') { 
            subModePromptText = subModePromptOrConfig;
        } else if (typeof subModePromptOrConfig === 'object' && subModePromptOrConfig.prompt) {
            subModePromptText = subModePromptOrConfig.prompt;
        }
        
        if (subModePromptText) {
             prompt = currentModeConfig.prompt(
                (chartMode === 'Custom') ? chartPrompt : subModePromptText
             );
             setChartLabel((chartMode === 'Custom') ? chartPrompt : (typeof subModePromptOrConfig === 'object' ? subModePromptOrConfig.displayName : chartSubModeKey));
        } else {
             console.error("Invalid subMode prompt for Chart:", chartSubModeKey);
             setIsLoadingAnalysis(false);
             setIsLoadingTracking(false); 
             return;
        }
    } else if ('prompt' in currentModeConfig && typeof currentModeConfig.prompt === 'string') {
        prompt = currentModeConfig.prompt;
    } else {
        console.error("Invalid mode configuration for prompt:", modeKey);
        setIsLoadingAnalysis(false);
        setIsLoadingTracking(false);
        return;
    }

    try {
        const resp = await generateContent(
          prompt,
          functionCallbacks, 
          activeVideoFile, // This is asserted to be non-null by the check above
        );

        const call = resp.functionCalls?.[0];
        if (call) {
          const callArgs = call.args as any; 
          const callbackToExecute = functionCallbacks.find(fc => fc.name === call.name)?.callback;
          if (callbackToExecute) {
            callbackToExecute(callArgs);
          } else {
            console.error(`Callback for function ${call.name} not found.`);
            if (currentModeConfig.isTracking) setIsLoadingTracking(false); else setIsLoadingAnalysis(false);
          }
        } else {
             if (currentModeConfig.isTracking) setIsLoadingTracking(false); else setIsLoadingAnalysis(false);
             if (currentModeConfig.isTracking) setTrackingData([]); else setTimecodeList([]);
        }
    } catch (error) {
        console.error("Error during content generation or function call:", error);
        setAnalysisMessage(t('analysis.errorGeneral'));
         if (currentModeConfig.isTracking) setIsLoadingTracking(false); else setIsLoadingAnalysis(false);
    }
    
    if (currentModeConfig.isTracking) {
        setIsLoadingTracking(false);
    } else {
        setIsLoadingAnalysis(false);
    }
    scrollRef.current?.scrollTo({top: 0});
  }, [activeVideoFile, modes, customPrompt, chartMode, chartPrompt, analysisCache, getCacheIdentifierForMode, functions, t, analysisMessage]);

  const uploadSingleVideo = async (droppedFile: File, videoSlot: 1 | 2) => {
    const videoElement = document.createElement('video');
    videoElement.onloadedmetadata = () => {
        if (videoSlot === 1) {
            setVideoDimensions1({width: videoElement.videoWidth, height: videoElement.videoHeight });
        }
    };

    if (videoSlot === 1) {
      setIsYoutubeActive1(false); // Clear YouTube state if a file is uploaded for slot 1
      setYoutubeUrlInput1('');
      setAnalysisMessage(null);
      setIsLoadingVideo1(true);
      setVideoError1(false);
      const url = URL.createObjectURL(droppedFile);
      setVidUrl1(url);
      videoElement.src = url;
    } else { // Video Slot 2
      setIsLoadingVideo2(true);
      setVideoError2(false);
      const url = URL.createObjectURL(droppedFile);
      setVidUrl2(url);
      videoElement.src = url;
    }
    setUploadPageError(''); 
    setClipRequest(null);
    setPendingClipDownload(null);

    try {
      const res = await uploadFile(droppedFile);
      if (videoSlot === 1) {
        setFile1(res);
        setIsLoadingVideo1(false);
      } else {
        setFile2(res);
        setIsLoadingVideo2(false);
      }
    } catch (e) {
      if (videoSlot === 1) {
        setVideoError1(true);
        setIsLoadingVideo1(false);
      } else {
        setVideoError2(true);
        setIsLoadingVideo2(false);
      }
       setUploadPageError(t('upload.fileProcessingError'));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, videoSlot: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadPageError('');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      uploadSingleVideo(droppedFile, videoSlot);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, videoSlot: 1 | 2) => {
    setUploadPageError('');
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      uploadSingleVideo(selectedFile, videoSlot);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLoadYoutubeUrl1 = () => {
    setUploadPageError('');
    if (youtubeUrlInput1.trim()) {
      if (!youtubeUrlInput1.startsWith('http://') && !youtubeUrlInput1.startsWith('https://')) {
        setUploadPageError(t('upload.invalidUrlError'));
        return;
      }
      if (vidUrl1 && !isYoutubeActive1) URL.revokeObjectURL(vidUrl1); // Revoke if previous was a file blob

      setVidUrl1(youtubeUrlInput1);
      setFile1(null);
      setVideoDimensions1(null);
      setIsYoutubeActive1(true);
      setIsLoadingVideo1(false);
      setVideoError1(false);
      if (fileInputRef1.current) fileInputRef1.current.value = '';
      setAnalysisMessage(null);
    }
  };
  
  const resetVideo = (videoSlot: 1 | 2) => {
    setUploadPageError('');
    const urlToRevoke = videoSlot === 1 ? vidUrl1 : vidUrl2;
    const isYoutubeLinkBeingReset = videoSlot === 1 && isYoutubeActive1;

    // Only revoke if it's an object URL (not a YouTube http/https URL)
    if (urlToRevoke && urlToRevoke.startsWith('blob:') && !isYoutubeLinkBeingReset) {
        URL.revokeObjectURL(urlToRevoke);
    }

    let videoUrlThatWasReset: string | null = null;

    if (videoSlot === 1) {
      videoUrlThatWasReset = vidUrl1;
      setVidUrl1(null);
      setFile1(null);
      setIsLoadingVideo1(false);
      setVideoError1(false);
      setVideoDimensions1(null);
      setYoutubeUrlInput1('');
      setIsYoutubeActive1(false);
    } else {
      videoUrlThatWasReset = vidUrl2;
      setVidUrl2(null);
      setFile2(null);
      setIsLoadingVideo2(false);
      setVideoError2(false);
    }

    if (activeVideoUrl === videoUrlThatWasReset) {
        setActiveVideoUrl(null);
        setActiveVideoFile(null);
        setActiveVideoDimensions(null);
        setTimecodeList(null);
        setTrackingData(null);
        setSelectedPlayerIdForTracking(null);
        setUniquePlayerIds(null);
        setActiveMode(undefined);
        setClipRequest(null);
        setPendingClipDownload(null);
        setAnalysisMessage(null);
    }
  };

  const analyzeSingleVideo = (videoSlot: 1 | 2) => {
    setClipRequest(null);
    setPendingClipDownload(null);
    setAnalysisMessage(null); // Clear any previous analysis messages
    setUploadPageError('');

    let newActiveUrl: string | null = null;
    let newActiveFile: GoogleGenAIFile | null = null;
    let newActiveDimensions: {width: number, height: number} | null = null;
    let preAnalysisMessage: string | null = null;

    if (videoSlot === 1) {
      if (isYoutubeActive1 && vidUrl1) { 
        newActiveUrl = vidUrl1;
        newActiveFile = null; 
        newActiveDimensions = null; 
        preAnalysisMessage = t('upload.youtubeAnalysisNotSupported');
      } else if (file1 && vidUrl1) { 
        newActiveUrl = vidUrl1;
        newActiveFile = file1;
        newActiveDimensions = videoDimensions1;
      } else {
        setUploadPageError(t('upload.noVideo1ToAnalyze'));
        return;
      }
    } else if (videoSlot === 2) {
        if (file2 && vidUrl2) {
            const videoElement = document.createElement('video');
            videoElement.onloadedmetadata = () => {
                setActiveVideoDimensions({width: videoElement.videoWidth, height: videoElement.videoHeight });
            };
            videoElement.src = vidUrl2; // This triggers loading metadata
            newActiveUrl = vidUrl2;
            newActiveFile = file2;
            // Dimensions will be set by onloadedmetadata
        } else {
            setUploadPageError(t('upload.noVideo2ToAnalyze'));
            return;
        }
    }


    if (newActiveUrl) { 
      setActiveVideoUrl(newActiveUrl);
      setActiveVideoFile(newActiveFile); 
      if (newActiveDimensions) setActiveVideoDimensions(newActiveDimensions);
      else if (videoSlot === 1 && !isYoutubeActive1) setActiveVideoDimensions(null); // If file1 but no dimensions yet
      else if (videoSlot === 2) { /* dimensions set by onloadedmetadata or remain null */ }
      else { setActiveVideoDimensions(null); } // For YouTube or if dimensions not available

      setAnalysisMessage(preAnalysisMessage); 

      setTimecodeList(null);
      setTrackingData(null);
      setSelectedPlayerIdForTracking(null);
      setUniquePlayerIds(null);

      // Proceed to select a default mode even if analysis won't run (e.g. for YouTube)
      // onModeSelect will handle the !activeVideoFile case.
      const defaultModeKey = 'Key moments'; 
      if (modes[defaultModeKey]) {
        setSelectedMode(defaultModeKey);
        onModeSelect(defaultModeKey); 
      } else {
        const firstModeKey = Object.keys(modes)[0] as keyof typeof modes;
        setSelectedMode(firstModeKey);
        onModeSelect(firstModeKey);
      }
    }
  };

  const handleStitchVideos = async () => {
    if (!file1 || !file2) {
        setUploadPageError(t('upload.needTwoFilesForStitch'));
        return;
    }
    setUploadPageError('');
    setIsStitching(true);
    setStitchError(''); // Clear previous stitch specific error
    setActiveVideoUrl(null);
    setActiveVideoFile(null);
    setActiveVideoDimensions(null);
    setTimecodeList(null);
    setTrackingData(null);
    setSelectedPlayerIdForTracking(null);
    setUniquePlayerIds(null);
    setActiveMode(undefined);
    setClipRequest(null);
    setPendingClipDownload(null);
    setAnalysisMessage(null);

    await new Promise(resolve => setTimeout(resolve, 3000));
    const isSuccess = Math.random() > 0.1; 

    if (isSuccess && vidUrl1 && file1 && videoDimensions1) {
      setActiveVideoUrl(vidUrl1); 
      setActiveVideoFile(file1);
      setActiveVideoDimensions(videoDimensions1); 
      setStitchError('');
      setTimecodeList(null);
      setTrackingData(null);
      setSelectedPlayerIdForTracking(null);
      setUniquePlayerIds(null);
      const defaultModeKey = 'Key moments';
      if (modes[defaultModeKey]) {
        setSelectedMode(defaultModeKey);
        onModeSelect(defaultModeKey);
      }
    } else {
      setUploadPageError(t('upload.stitchError')); // Use general upload page error
    }
    setIsStitching(false);
  };
  
  const renderVideoDropZone = (videoSlot: 1 | 2) => {
    const url = videoSlot === 1 ? vidUrl1 : vidUrl2;
    const isLoading = videoSlot === 1 ? isLoadingVideo1 : isLoadingVideo2;
    const error = videoSlot === 1 ? videoError1 : videoError2;
    const file = videoSlot === 1 ? file1 : file2; // file1 is null if YouTube is active
    const inputRef = videoSlot === 1 ? fileInputRef1 : fileInputRef2;
    const isCurrentSlotYoutubeActive = videoSlot === 1 && isYoutubeActive1;
    
    let displayText = '';
    if (url) {
        if (isCurrentSlotYoutubeActive) {
            displayText = t('upload.youtubeLinkLoaded', {url});
        } else if (file) { // Check file exists before accessing properties
            let fileNameToDisplay = file.displayName || file.name || t('upload.defaultFileName');
            if (typeof fileNameToDisplay === 'number') fileNameToDisplay = String(fileNameToDisplay);
            displayText = t(videoSlot === 1 ? 'upload.video1Loaded' : 'upload.video2Loaded', { fileName: fileNameToDisplay });
        } else {
            // This case should ideally not be hit if url is present, but as a fallback:
            displayText = t('upload.videoLoadedUnknownName');
        }
    }


    return (
      <div
        className={c("videoDropZone", { 'youtubeActive': isCurrentSlotYoutubeActive && !!url })}
        onDrop={(e) => handleDrop(e, videoSlot)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onClick={() => !url && inputRef.current?.click()} // Only click to open if no URL loaded
        onKeyDown={(e) => { if (!url && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click(); }}
        aria-label={t(videoSlot === 1 ? 'upload.dropVideo1Label' : 'upload.dropVideo2Label')}
        role="button"
        tabIndex={url ? -1 : 0} // Not focusable if URL is loaded
      >
        <input
          type="file"
          accept="video/*"
          ref={inputRef}
          onChange={(e) => handleFileChange(e, videoSlot)}
          className="hiddenFileInput"
          aria-hidden="true"
        />
        {isLoading ? (
          <p>{t(videoSlot === 1 ? 'upload.processingVideo1' : 'upload.processingVideo2')}</p>
        ) : error ? (
          <p className="errorText">{t(videoSlot === 1 ? 'upload.errorVideo1' : 'upload.errorVideo2')}</p>
        ) : url ? (
          <div className="videoPreview" onClick={(e) => e.stopPropagation()}>
            <p>{displayText}</p>
            <button 
              onClick={(e) => { 
                e.stopPropagation();
                resetVideo(videoSlot);
              }} 
              className="clearButton" 
              aria-label={t(videoSlot === 1 ? 'upload.clearVideo1' : 'upload.clearVideo2')}
            >
              <span className="icon">close</span> {t('upload.clear')}
            </button>
          </div>
        ) : (
          <div className="dropZoneContent">
            <span className="icon dropIcon">upload_file</span>
            <p>{t(videoSlot === 1 ? 'upload.dropVideo1' : 'upload.dropVideo2')}{videoSlot === 2 ? ` (${t('upload.optional')})` : ''}</p>
            <p className="selectFileHint">{t('upload.selectFileHint')}</p>
          </div>
        )}
      </div>
    );
  };

  const renderLanguageSelector = () => {
    return (
      <div className="languageSelector">
        {(Object.keys(availableLanguages) as Array<keyof typeof availableLanguages>).map((langCode) => (
          <button
            key={langCode}
            onClick={() => setLanguage(langCode)}
            className={c('button', { active: language === langCode })}
            aria-pressed={language === langCode}
          >
            {availableLanguages[langCode]}
          </button>
        ))}
      </div>
    );
  };

  const currentAnalysisOrLoading = isLoadingAnalysis || isLoadingTracking;

  const playerMoments = useMemo(() => {
    if (!isTrackingModeActive || !selectedPlayerIdForTracking || !trackingData) {
      return [];
    }
    const moments: { time: string, text: string }[] = [];
    const addedTimestamps = new Set<string>();

    trackingData.forEach(frame => {
      if (frame.detections.some(det => det.id === selectedPlayerIdForTracking && det.type === 'player')) {
        if (!addedTimestamps.has(frame.timestamp)) {
          moments.push({ time: frame.timestamp, text: t('analysis.playerAppears', {playerId: selectedPlayerIdForTracking}) });
          addedTimestamps.add(frame.timestamp);
        }
      }
    });
    return moments.sort((a, b) => timeToSecs(a.time) - timeToSecs(b.time));
  }, [isTrackingModeActive, selectedPlayerIdForTracking, trackingData, t]);

  // Resizer event handlers
  const handleResizerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsResizing(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !mainRef.current) return;
      const mainRect = mainRef.current.getBoundingClientRect();
      const newTopHeightPx = e.clientY - mainRect.top;
      const totalHeightPx = mainRect.height;
      
      let newTopHeightPercent = (newTopHeightPx / totalHeightPx) * 100;
      newTopHeightPercent = Math.max(MIN_TOP_SECTION_PERCENT, Math.min(newTopHeightPercent, MAX_TOP_SECTION_PERCENT));
      setTopSectionHeight(newTopHeightPercent);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing || !mainRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const mainRect = mainRef.current.getBoundingClientRect();
      const newTopHeightPx = touch.clientY - mainRect.top;
      const totalHeightPx = mainRect.height;

      let newTopHeightPercent = (newTopHeightPx / totalHeightPx) * 100;
      newTopHeightPercent = Math.max(MIN_TOP_SECTION_PERCENT, Math.min(newTopHeightPercent, MAX_TOP_SECTION_PERCENT));
      setTopSectionHeight(newTopHeightPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    const handleTouchEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing]);

  const handleResizerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newHeight = topSectionHeight;
    const step = 5; 
    if (e.key === 'ArrowUp') {
      newHeight -= step;
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      newHeight += step;
      e.preventDefault();
    } else if (e.key === 'Home') {
      newHeight = MIN_TOP_SECTION_PERCENT;
      e.preventDefault();
    } else if (e.key === 'End') {
      newHeight = MAX_TOP_SECTION_PERCENT;
      e.preventDefault();
    }
  
    if (newHeight !== topSectionHeight) {
      newHeight = Math.max(MIN_TOP_SECTION_PERCENT, Math.min(newHeight, MAX_TOP_SECTION_PERCENT));
      setTopSectionHeight(newHeight);
    }
  };


  if (!activeVideoUrl && !isStitching) {
    return (
      <main ref={mainRef}> 
        {renderLanguageSelector()}
        <div className="dualUploadContainer">
          <h1>{t('upload.title')}</h1>
          <p>{t('upload.description')}</p>
          <div className="dropZoneContainer">
            <div className="videoInputSlot">
              {renderVideoDropZone(1)}
              {!vidUrl1 && !isLoadingVideo1 && ( // Show YouTube input only if no file/URL loaded for slot 1
                <div className="youtubeUrlInputContainer">
                  <p className="youtubeOrSeparator">{t('upload.orYoutube')}</p>
                  <input
                    type="text"
                    className="youtubeUrlInput"
                    placeholder={t('upload.youtubeUrlPlaceholder')}
                    value={youtubeUrlInput1}
                    onChange={(e) => setYoutubeUrlInput1(e.target.value)}
                    aria-label={t('upload.youtubeUrlInputLabel')}
                  />
                  <button
                    className="button loadUrlButton"
                    onClick={handleLoadYoutubeUrl1}
                    disabled={!youtubeUrlInput1.trim()}
                  >
                    <span className="icon">link</span> {t('upload.loadUrlButton')}
                  </button>
                </div>
              )}
            </div>
            {renderVideoDropZone(2)}
          </div>
          {uploadPageError && <p className="errorText stitchError">{uploadPageError}</p>}
          <div className="uploadActions">
            {(vidUrl1 || file1) && !file2 && ( // Allow analyze if vidUrl1 (YouTube) or file1 exists
              <button className="button primaryButton" onClick={() => analyzeSingleVideo(1)}>
                {t('upload.analyzeVideo1')}
              </button>
            )}
            {file2 && !(vidUrl1 || file1) && ( // Only vid2 exists
               <button className="button primaryButton" onClick={() => analyzeSingleVideo(2)}>
                {t('upload.analyzeVideo2')}
              </button>
            )}
            {(vidUrl1 || file1) && file2 && ( // Both slots have something (vid1 could be YouTube or file)
              <>
                <button 
                  className="button primaryButton" 
                  onClick={handleStitchVideos}
                  disabled={!file1 || !file2} // Stitch requires actual files
                >
                  <span className="icon">flip_camera_android</span> {t('upload.stitchAndAnalyze')}
                </button>
                 <button className="button" onClick={() => analyzeSingleVideo(1)}>
                  {t('upload.analyzeVideo1Only')}
                </button>
                 <button className="button" onClick={() => analyzeSingleVideo(2)}>
                  {t('upload.analyzeVideo2Only')}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }
  
  if (isStitching) {
     return (
      <main ref={mainRef}> 
        {renderLanguageSelector()}
        <div className="loadingContainer">
          <div className="loading">
            {t('upload.stitching')}<span>...</span>
          </div>
          <p>{t('upload.stitchingWait')}</p>
        </div>
      </main>
    );
  }

  return (
    <main 
      ref={mainRef}
      onDrop={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => {}}
      onDragLeave={() => {}}>
      
      {activeVideoUrl && !isStitching && (
        <>
          <section className="top" style={{ height: `${topSectionHeight}%` }}>
            {renderLanguageSelector()}
            {activeVideoUrl && !isLoadingVideo1 && !isLoadingVideo2 && (
              <>
                <div className={c('modeSelector', {hide: !showSidebar})}>
                  {hasSubMode && selectedMode ? ( 
                    <>
                      <div>
                        {isCustomMode ? (
                          <>
                            <h2>{t('sidebar.customPromptTitle')}</h2>
                            <textarea
                              placeholder={t('sidebar.customPromptPlaceholder')}
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onModeSelect(selectedMode);
                                }
                              }}
                              rows={5}
                              aria-label={t('sidebar.customPromptLabel')}
                              disabled={!activeVideoFile} // Disable if no actual file for analysis
                            />
                          </>
                        ) : ( // isChartMode
                          <>
                            <h2>{t('sidebar.chartTitle')}</h2>
                            <div className="modeList">
                              {chartModes.map((modeName) => {
                                const subConfig = modes.Chart.subModes![modeName as keyof typeof modes.Chart.subModes];
                                const buttonDisplayName = String((typeof subConfig === 'object' ? subConfig.displayName : modeName) || modeName);
                                return (
                                  <button
                                    key={modeName}
                                    className={c('button', {
                                      active: modeName === chartMode,
                                    })}
                                    onClick={() => setChartMode(modeName as keyof typeof modes.Chart.subModes)}
                                    aria-pressed={modeName === chartMode}
                                    disabled={!activeVideoFile} // Disable if no actual file
                                    >
                                    {buttonDisplayName}
                                  </button>
                                );
                              })}
                            </div>
                            <textarea
                              className={c({active: isCustomChartMode})}
                              placeholder={t('sidebar.customChartPlaceholder')}
                              value={chartPrompt}
                              onChange={(e) => setChartPrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onModeSelect(selectedMode);
                                }
                              }}
                              onFocus={() => setChartMode('Custom')}
                              rows={2}
                              aria-label={t('sidebar.customChartLabel')}
                              disabled={!activeVideoFile} // Disable if no actual file
                            />
                          </>
                        )}
                        <button
                          className="button generateButton"
                          onClick={() => onModeSelect(selectedMode)}
                          disabled={
                            !activeVideoFile || // Primary disable condition
                            currentAnalysisOrLoading ||
                            isClippingGlobal ||
                            (isCustomMode && !customPrompt.trim()) ||
                            (isChartMode &&
                              isCustomChartMode &&
                              !chartPrompt.trim())
                          }
                          aria-label={t('sidebar.generateLabel')}
                          >
                          <span className="icon">play_arrow</span> {t('sidebar.generate')}
                        </button>
                      </div>
                      <div className="backButton">
                        <button
                          onClick={() => {
                            const firstModeKey = Object.keys(modes)[0] as keyof typeof modes;
                            setSelectedMode(firstModeKey);
                            setSelectedPlayerIdForTracking(null); 
                          }}
                          aria-label={t('sidebar.backLabel')}
                          >
                          <span className="icon">chevron_left</span>
                          {t('sidebar.back')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h2>{t('sidebar.exploreTitle')}</h2>
                        <div className="modeList">
                          {Object.entries(modes).map(([modeName, {emoji, displayName}]) => (
                            <button
                              key={modeName}
                              className={c('button', {
                                active: modeName === selectedMode,
                              })}
                              onClick={() => {
                                const newModeKey = modeName as keyof typeof modes;
                                setSelectedMode(newModeKey);
                                setSelectedPlayerIdForTracking(null); 
                              
                                const modeConfig = modes[newModeKey];
                                const isNewModeCustom = newModeKey === 'Custom';
                                const isNewModeChart = newModeKey === 'Chart';
                              
                                // Auto-trigger mode select if cached and it's not a custom/chart mode (which requires further input)
                                if (activeVideoFile && modeConfig && !isNewModeCustom && !isNewModeChart) {
                                  const videoCacheKey = String(activeVideoFile.name);
                                  const modeCacheIdentifier = getCacheIdentifierForMode(
                                    newModeKey,
                                    customPrompt, 
                                    chartMode,    
                                    chartPrompt  
                                  );
                                  const cachedVideoAnalyses = analysisCache.get(videoCacheKey);
                                  if (cachedVideoAnalyses && cachedVideoAnalyses.get(modeCacheIdentifier)) {
                                    onModeSelect(newModeKey);
                                  }
                                }
                              }}
                              aria-pressed={modeName === selectedMode}
                              disabled={!activeVideoFile && !(modeName === 'Custom' || modes[modeName as keyof typeof modes]?.subModes)}
                              >
                              <span className="emoji" role="img" aria-label={displayName || modeName}>{emoji}</span> {displayName || modeName}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <button
                          className="button generateButton"
                          onClick={() => onModeSelect(selectedMode)}
                          disabled={!activeVideoFile || currentAnalysisOrLoading || isClippingGlobal}
                          aria-label={t('sidebar.generateLabel')}
                          >
                          <span className="icon">play_arrow</span> {t('sidebar.generate')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  className="collapseButton"
                  onClick={() => setShowSidebar(!showSidebar)}
                  aria-label={showSidebar ? t('sidebar.collapseLabel') : t('sidebar.expandLabel')}
                  aria-expanded={showSidebar}
                  >
                  <span className="icon">
                    {showSidebar ? 'chevron_left' : 'chevron_right'}
                  </span>
                </button>
              </>
            )}

            <VideoPlayer
              url={activeVideoUrl}
              requestedTimecode={requestedTimecode}
              timecodeList={timecodeList}
              trackingData={trackingData}
              videoDimensions={activeVideoDimensions}
              jumpToTimecode={setRequestedTimecode}
              isLoadingVideo={false} 
              videoError={false} 
              isReady={!!activeVideoUrl}
              clipCommand={activeVideoFile ? pendingClipDownload : null} // Only allow clipping if there's an actual file
              onClipProcessEnd={() => { 
                setPendingClipDownload(null); 
                setIsClippingGlobal(false);
                setClipRequest(null); 
              }}
              selectedPlayerIdForTracking={isTrackingModeActive ? selectedPlayerIdForTracking : null}
            />
          </section>

          <div
            className="resizer"
            onMouseDown={handleResizerMouseDown}
            onTouchStart={handleResizerTouchStart}
            onKeyDown={handleResizerKeyDown}
            role="separator"
            aria-orientation="horizontal"
            aria-label={t('app.resizerLabel')}
            aria-valuenow={topSectionHeight}
            aria-valuemin={MIN_TOP_SECTION_PERCENT}
            aria-valuemax={MAX_TOP_SECTION_PERCENT}
            tabIndex={0}
          >
          </div>
          
          <div className="tools" style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <section
              className={c('output', activeMode ? 'mode' + String(activeMode).replace(/[^a-zA-Z0-9]/g, '') : undefined)}
              ref={scrollRef}
              aria-live="polite"
              aria-busy={currentAnalysisOrLoading || isClippingGlobal}
              >
              {currentAnalysisOrLoading ? (
                <div className="loading">
                  {isLoadingAnalysis ? t('analysis.loadingModel') : t('analysis.loadingTracking')}
                  <span>...</span>
                </div>
              ) : analysisMessage && activeVideoUrl && !activeVideoFile ? (
                <div className="noticeMessage">{analysisMessage}</div>
              ) : isTrackingModeActive ? (
                <div className="trackingOutput">
                  {uniquePlayerIds && uniquePlayerIds.length > 0 ? (
                    <>
                      <h3>{t('analysis.uniquePlayersListTitle')}</h3>
                      <div className="playerSelectionList">
                        {uniquePlayerIds.map(playerId => (
                          <button
                            key={playerId}
                            className={c('button playerChip', {active: selectedPlayerIdForTracking === playerId})}
                            onClick={() => {
                                setSelectedPlayerIdForTracking(playerId);
                                setClipRequest(null); 
                            }}
                            aria-pressed={selectedPlayerIdForTracking === playerId}
                          >
                            {playerId}
                          </button>
                        ))}
                      </div>
                      {selectedPlayerIdForTracking ? (
                        playerMoments.length > 0 ? (
                          <>
                            <h4>{t('analysis.playerMomentsTitle', {playerId: selectedPlayerIdForTracking})}</h4>
                            <ul>
                              {playerMoments.map(({time, text}, i) => {
                                const itemKey = `playermoment-${selectedPlayerIdForTracking}-${i}`;
                                const secs = timeToSecs(time);
                                return (
                                  <li key={itemKey} className="outputItem">
                                    <div className="outputItemContent">
                                      <button
                                        onClick={() => {
                                          setRequestedTimecode(secs);
                                          if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                                        }}
                                        aria-label={t('analysis.jumpTo', { time, description: text })}
                                      >
                                        <time dateTime={time}>{time}</time>
                                        <p className="text">{text}</p>
                                      </button>
                                      {activeVideoFile && clipRequest && clipRequest.elementKey === itemKey && clipRequest.videoUrl === activeVideoUrl && (
                                        <button
                                          className="button downloadClipButton"
                                          onClick={() => {
                                            if (clipRequest) {
                                              setPendingClipDownload({ time: clipRequest.time, videoUrl: clipRequest.videoUrl });
                                              setIsClippingGlobal(true);
                                            }
                                          }}
                                          disabled={isClippingGlobal}
                                          aria-label={t('analysis.downloadClipLabel', {time})}
                                        >
                                          <span className="icon">download</span> {t('analysis.downloadClip')}
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </>
                        ) : (
                          <p>{t('analysis.noMomentsForPlayer', {playerId: selectedPlayerIdForTracking})}</p>
                        )
                      ) : (
                        <p>{t('analysis.selectPlayerPrompt')}</p>
                      )}
                    </>
                  ) : (
                    trackingData && trackingData.length > 0 ? <p>{t('analysis.noPlayersDetected')}</p> : <p>{t('analysis.noTrackingData')}</p>
                  )}
                </div>
              ) : timecodeList && timecodeList.length > 0 ? ( 
                activeMode === 'Table' ? (
                  <table>
                    <thead>
                      <tr>
                        <th>{t('analysis.table.time')}</th>
                        <th>{t('analysis.table.description')}</th>
                        <th>{t('analysis.table.objects')}</th>
                        <th>{t('analysis.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timecodeList.map(({time, text, objects}, i) => {
                        const itemKey = `table-item-${i}`;
                        const secs = timeToSecs(time);
                        return (
                        <tr
                          key={itemKey}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setRequestedTimecode(secs);
                            if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') {
                            setRequestedTimecode(secs);
                            if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                          }}}
                          aria-label={t('analysis.jumpTo', { time, description: text })}
                          >
                          <td>
                            <time dateTime={time}>{time}</time>
                          </td>
                          <td>{text}</td>
                          <td>{objects?.join(', ') || ''}</td>
                          <td>
                            {activeVideoFile && clipRequest && clipRequest.elementKey === itemKey && clipRequest.videoUrl === activeVideoUrl && (
                              <button
                                className="button downloadClipButton"
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  if (clipRequest) {
                                    setPendingClipDownload({ time: clipRequest.time, videoUrl: clipRequest.videoUrl });
                                    setIsClippingGlobal(true);
                                  }
                                }}
                                disabled={isClippingGlobal}
                                aria-label={t('analysis.downloadClipLabel', {time})}
                              >
                                <span className="icon">download</span> {t('analysis.downloadClip')}
                              </button>
                            )}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                ) : activeMode === 'Chart' ? (
                  <Chart
                    data={timecodeList}
                    yLabel={chartLabel || t('analysis.chart.defaultYLabel')}
                    jumpToTimecode={(secs, itemKeySuffix) => {
                      setRequestedTimecode(secs);
                      const itemKey = `chart-item-${itemKeySuffix}`;
                      if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                    }}
                    activeClipKey={activeVideoFile ? clipRequest?.elementKey : null}
                    onDownloadClick={(secs, itemKeySuffix) => {
                      const itemKey = `chart-item-${itemKeySuffix}`;
                      if (activeVideoFile && activeVideoUrl && clipRequest && clipRequest.elementKey === itemKey && clipRequest.time === secs) {
                            setPendingClipDownload({ time: clipRequest.time, videoUrl: clipRequest.videoUrl });
                            setIsClippingGlobal(true);
                      }
                    }}
                    isClippingGlobal={isClippingGlobal}
                    canDownload={!!activeVideoFile}
                  />
                ) : activeMode && modes[activeMode]?.isList ? (
                  <ul>
                    {timecodeList.map(({time, text}, i) => {
                      const itemKey = `list-item-${i}`;
                      const secs = timeToSecs(time);
                      return (
                      <li key={itemKey} className="outputItem">
                        <div className="outputItemContent">
                          <button
                            onClick={() => {
                              setRequestedTimecode(secs);
                              if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                            }}
                            aria-label={t('analysis.jumpTo', { time, description: text })}
                            >
                            <time dateTime={time}>{time}</time>
                            <p className="text">{text}</p>
                          </button>
                          {activeVideoFile && clipRequest && clipRequest.elementKey === itemKey && clipRequest.videoUrl === activeVideoUrl && (
                            <button
                              className="button downloadClipButton"
                              onClick={() => {
                                if (clipRequest) {
                                  setPendingClipDownload({ time: clipRequest.time, videoUrl: clipRequest.videoUrl });
                                  setIsClippingGlobal(true);
                                }
                              }}
                              disabled={isClippingGlobal}
                              aria-label={t('analysis.downloadClipLabel', {time})}
                            >
                              <span className="icon">download</span> {t('analysis.downloadClip')}
                            </button>
                          )}
                        </div>
                      </li>
                    )})}
                  </ul>
                ) : ( 
                  timecodeList.map(({time, text}, i) => {
                    const itemKey = `sentence-item-${i}`;
                    const secs = timeToSecs(time);
                    return (
                    <React.Fragment key={itemKey}>
                      <span
                        className="sentence"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setRequestedTimecode(secs);
                          if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') {
                          setRequestedTimecode(secs);
                          if (activeVideoFile && activeVideoUrl) setClipRequest({ time: secs, elementKey: itemKey, videoUrl: activeVideoUrl });
                        }}}
                        aria-label={t('analysis.jumpTo', { time, description: text })}
                        >
                        <time dateTime={time}>{time}</time>
                        <span>{text}</span>
                      </span>
                      {activeVideoFile && clipRequest && clipRequest.elementKey === itemKey && clipRequest.videoUrl === activeVideoUrl && (
                            <button
                              className="button downloadClipButton inlineDownloadClipButton"
                              onClick={() => {
                                if (clipRequest) {
                                  setPendingClipDownload({ time: clipRequest.time, videoUrl: clipRequest.videoUrl });
                                  setIsClippingGlobal(true);
                                }
                              }}
                              disabled={isClippingGlobal}
                              aria-label={t('analysis.downloadClipLabel', {time})}
                            >
                              <span className="icon">download</span> {t('analysis.downloadClip')}
                            </button>
                      )}
                      {' '}
                    </React.Fragment>
                  )})
                )
              ) : activeMode && !currentAnalysisOrLoading && !analysisMessage ? (  // Only show "no data" if no specific message
                (modes[activeMode]?.isTracking && (!trackingData || trackingData.length === 0)) ? <p>{t('analysis.noTrackingData')}</p> :
                (!modes[activeMode]?.isTracking && (!timecodeList || timecodeList.length === 0)) ? <p>{t('analysis.noData')}</p> : null
              ) : null }
            </section>
            {activeVideoUrl && (
              <div className="bottomActions">
                {activeVideoFile && trackingData && trackingData.length > 0 && activeMode && modes[activeMode]?.isTracking && (
                  <div className="exportActions">
                    <button 
                      className="button" 
                      onClick={() => exportTrackingDataToJson(trackingData, baseFilename)}
                      aria-label={t('analysis.exportJsonLabel')}
                      disabled={isClippingGlobal}
                    >
                      <span className="icon">data_object</span> {t('analysis.exportJson')}
                    </button>
                    <button 
                      className="button" 
                      onClick={() => exportTrackingDataToCsv(trackingData, baseFilename)}
                      aria-label={t('analysis.exportCsvLabel')}
                      disabled={isClippingGlobal}
                    >
                      <span className="icon">table_view</span> {t('analysis.exportCsv')}
                    </button>
                  </div>
                )}
                <button
                  className="button switchVideoButton"
                  onClick={() => {
                    if (activeVideoUrl && activeVideoUrl.startsWith('blob:')) URL.revokeObjectURL(activeVideoUrl);
                    if (vidUrl1 && vidUrl1.startsWith('blob:')) URL.revokeObjectURL(vidUrl1);
                    if (vidUrl2 && vidUrl2.startsWith('blob:')) URL.revokeObjectURL(vidUrl2);
                    
                    setActiveVideoUrl(null);
                    setActiveVideoFile(null);
                    setActiveVideoDimensions(null);
                    setTimecodeList(null);
                    setTrackingData(null);
                    setSelectedPlayerIdForTracking(null);
                    setUniquePlayerIds(null);
                    setActiveMode(undefined);
                    setFile1(null); 
                    setVidUrl1(null);
                    setFile2(null);
                    setVidUrl2(null);
                    setVideoDimensions1(null);
                    setIsYoutubeActive1(false);
                    setYoutubeUrlInput1('');
                    setClipRequest(null); 
                    setPendingClipDownload(null);
                    setIsClippingGlobal(false);
                    setAnalysisMessage(null);
                    setUploadPageError('');
                    if (modes && Object.keys(modes).length > 0) {
                        setSelectedMode(Object.keys(modes)[0] as keyof typeof modes);
                    }
                  }}
                  aria-label={t('analysis.changeVideosLabel')}
                  disabled={isClippingGlobal}
                >
                  <span className="icon">switch_video</span> {t('analysis.changeVideos')}
                </button>
              </div>
              )}
          </div>
        </>
      )}
    </main>
  );
}