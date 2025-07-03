

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
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

export type AvailableLanguage = 'en' | 'pt';

export const defaultLanguage: AvailableLanguage = 'pt'; // Changed to Portuguese

export const availableLanguages: Record<AvailableLanguage, string> = {
  en: 'EN',
  pt: 'PT',
};

interface Translations {
  [key: string]: string | NestedTranslations;
}

interface NestedTranslations {
  [key: string]: string | NestedTranslations;
}

const en: Translations = {
  app: {
    resizerLabel: 'Resize video and results area',
  },
  upload: {
    title: 'Video Analyzer',
    description: 'Upload one video for standard analysis, or two videos to attempt stitching them into a panoramic view for analysis. You can also provide a YouTube link for Video 1 (analysis not supported for YouTube links).',
    dropVideo1: 'Drop Video 1 Here',
    dropVideo2: 'Drop Video 2 Here',
    dropVideo1Label: 'Drop video 1 here or click to select',
    dropVideo2Label: 'Drop video 2 here or click to select (optional)',
    optional: 'Optional',
    selectFileHint: 'Or click to select',
    orYoutube: 'Or enter Video 1 YouTube URL:',
    youtubeUrlPlaceholder: 'e.g., https://www.youtube.com/watch?v=...',
    youtubeUrlInputLabel: 'Video 1 YouTube URL',
    loadUrlButton: 'Load URL',
    youtubeLinkLoaded: 'YouTube Link: {{url}}',
    youtubeAnalysisNotSupported: 'Direct analysis of YouTube videos is not currently supported. Please upload a video file directly for analysis. Playback of this YouTube URL may also be limited in this player.',
    noFileForAnalysis: 'No video file available for analysis. Please upload a file.',
    invalidUrlError: 'Invalid URL provided. Please enter a valid HTTP/HTTPS URL.',
    fileProcessingError: 'An error occurred while processing the uploaded file. Please try again.',
    noVideo1ToAnalyze: 'No Video 1 (file or YouTube URL) is loaded to analyze.',
    noVideo2ToAnalyze: 'No Video 2 is loaded to analyze.',
    needTwoFilesForStitch: 'Two video files must be uploaded to use the stitch feature.',
    defaultFileName: 'Uploaded Video',
    videoLoadedUnknownName: 'Video loaded',
    processingVideo1: 'Processing Video 1...',
    processingVideo2: 'Processing Video 2...',
    errorVideo1: 'Error processing Video 1. Try again.',
    errorVideo2: 'Error processing Video 2. Try again.',
    video1Loaded: 'Video 1: {{fileName}}',
    video2Loaded: 'Video 2: {{fileName}}',
    loaded: 'Loaded', // Kept for potential other uses, though specific messages are better
    clear: 'Clear',
    clearVideo1: 'Clear video 1',
    clearVideo2: 'Clear video 2',
    analyzeVideo1: 'Analyze Video 1',
    analyzeVideo2: 'Analyze Video 2',
    stitchAndAnalyze: 'Stitch Videos & Analyze',
    analyzeVideo1Only: 'Analyze Video 1 Only',
    analyzeVideo2Only: 'Analyze Video 2 Only',
    stitchError: 'Failed to stitch videos. Please try different videos or analyze individually.',
    stitching: 'Stitching videos',
    stitchingWait: 'This may take a few moments.',
  },
  sidebar: {
    customPromptTitle: 'Custom prompt:',
    customPromptPlaceholder: 'Type a custom prompt...',
    customPromptLabel: 'Custom prompt for video analysis',
    chartTitle: 'Chart this video by:',
    customChartPlaceholder: 'Or type a custom prompt for the chart...',
    customChartLabel: 'Custom prompt for chart generation',
    generate: 'Generate',
    generateLabel: 'Generate analysis',
    back: 'Back',
    backLabel: 'Back to main analysis modes',
    exploreTitle: 'Explore this video via:',
    collapseLabel: 'Collapse sidebar',
    expandLabel: 'Expand sidebar',
  },
  analysis: {
    loadingModel: 'Waiting for model',
    loadingTracking: 'Generating tracking data...',
    errorGeneral: 'An error occurred during analysis. Please try again.',
    table: {
      time: 'Time',
      description: 'Description',
      objects: 'Objects',
      actions: 'Actions', 
    },
    chart: {
        defaultYLabel: 'Value'
    },
    jumpTo: 'Jump to {{time}}, description: {{description}}',
    noData: 'No analysis data to display for the selected mode. Try generating again or select a different mode.',
    noTrackingData: 'No tracking data available. Try generating tracking analysis.',
    changeVideos: 'Change Video(s)',
    changeVideosLabel: 'Upload different video(s)',
    exportJson: 'Export JSON',
    exportJsonLabel: 'Export tracking data as JSON',
    exportCsv: 'Export CSV',
    exportCsvLabel: 'Export tracking data as CSV',
    trackingDataAvailable: 'Player and ball tracking data generated.', 
    downloadClip: 'Download Clip',
    downloadClipLabel: 'Download clip for event at {{time}}',
    uniquePlayersListTitle: 'Detected Unique Players:',
    selectPlayerPrompt: 'Select a player ID to see their moments.',
    playerMomentsTitle: 'Moments for Player {{playerId}}:',
    noMomentsForPlayer: 'No moments found for Player {{playerId}}.',
    noPlayersDetected: 'No players detected in this video segment.',
    playerAppears: 'Player {{playerId}} appears',
  },
  videoPlayer: {
    progressLabel: 'Video progress',
    scrubberLabel: 'Video scrubber',
    markerLabel: 'Jump to marker at {{time}}: {{description}}',
    pauseLabel: 'Pause video',
    playLabel: 'Play video',
    processing: 'Processing video...',
    error: 'Error loading video. This might be a non-standard video file or a URL this player cannot handle (e.g., YouTube page URL).',
    noVideo: 'No video selected for analysis.',
    uploadHint: 'Upload a video file or provide a YouTube URL for Video 1 to begin.',
    clippingStartMessage: 'Clipping video...',
    clippingSuccessMessage: 'Clip download started!',
    clippingErrorMessage: 'Error creating clip. Please try again.',
  },
  chart: {
    noData: 'No data to display for chart.',
    jumpToTimeLabel: 'Jump to time {{time}}',
    jumpToDataPointLabel: 'Jump to time {{time}}, value {{value}}',
  },
  modes: {
    avCaptions: {
      name: 'A/V captions',
      prompt: 'For each scene in this video, generate captions that describe the scene along with any spoken text placed in quotation marks. Place each caption into an object sent to set_timecodes with the timecode of the caption in the video.',
    },
    narration: {
      name: 'Narration',
      prompt: "Generate an exciting and vibrant football (soccer) commentary for this video, in the style of a passionate sports announcer. Describe the plays with energy and enthusiasm, conveying the thrill of the game as if it were a live broadcast. Break down the commentary into short segments. For each segment, call the set_timecodes function with the corresponding timecode in the video and the narration text.",
    },
    keyMoments: {
      name: 'Key moments',
      prompt: 'Identify and list 5 to 10 of the most significant key moments from this video. For each moment, provide a concise, informative description of what is happening. Call set_timecodes with the timecode and description for each identified key moment.',
    },
    table: {
      name: 'Table',
      prompt: 'Choose 5 key shots from this video and call set_timecodes_with_objects with the timecode, text description of 10 words or less, and a list of objects visible in the scene (with representative emojis).',
    },
    chart: {
      name: 'Chart',
      prompt: 'Generate chart data for this video based on the following instructions: {{input}}. Call set_timecodes_with_numeric_values once with the list of data values and timecodes.',
      subModes: {
        excitement: {
          name: 'Excitement',
          prompt: 'for each scene, estimate the level of excitement on a scale of 1 to 10',
        },
        importance: {
          name: 'Importance',
          prompt: 'for each scene, estimate the level of overall importance to the video on a scale of 1 to 10',
        },
        numPeople: { 
          name: 'Number of people',
          prompt: 'for each scene, count the number of people visible',
        },
        custom: { 
          name: 'Custom',
          prompt: 'Generate a custom chart based on the provided prompt.',
        },
      },
    },
    custom: {
      name: 'Custom',
      prompt: 'Call set_timecodes once using the following instructions: {{input}}',
    },
    playerBallTracking: {
      name: 'Player & Ball Tracking',
      prompt: "Analyze the provided soccer video footage. Identify all players and the ball visible in significant moments or at approximately 1-second intervals. Assign a persistent unique ID to each detected player (e.g., 'player_1', 'player_2', ...). Use 'ball_0' as the ID for the ball. For each detected player and the ball, provide their bounding box coordinates [xmin, ymin, xmax, ymax] normalized between 0 and 1 relative to the video dimensions, and their center [x,y] coordinates, also normalized. Also, provide a confidence score (0-1) for each detection. Structure this information as a list of frame data objects, where each object contains a 'timestamp' (e.g., '00:00:01.234') and a 'detections' array. Call the 'set_tracking_data' function once with all this data.",
    }
  },
};

const pt: Translations = {
  app: {
    resizerLabel: 'Redimensionar área do vídeo e resultados',
  },
  upload: {
    title: 'Analisador de Vídeo',
    description: 'Envie um vídeo para análise padrão ou dois vídeos para tentar uni-los em uma visão panorâmica para análise. Você também pode fornecer um link do YouTube para o Vídeo 1 (análise não suportada para links do YouTube).',
    dropVideo1: 'Solte o Vídeo 1 Aqui',
    dropVideo2: 'Solte o Vídeo 2 Aqui',
    dropVideo1Label: 'Solte o vídeo 1 aqui ou clique para selecionar',
    dropVideo2Label: 'Solte o vídeo 2 aqui ou clique para selecionar (opcional)',
    optional: 'Opcional',
    selectFileHint: 'Ou clique para selecionar',
    orYoutube: 'Ou insira o URL do YouTube para o Vídeo 1:',
    youtubeUrlPlaceholder: 'ex: https://www.youtube.com/watch?v=...',
    youtubeUrlInputLabel: 'URL do YouTube do Vídeo 1',
    loadUrlButton: 'Carregar URL',
    youtubeLinkLoaded: 'Link YouTube: {{url}}',
    youtubeAnalysisNotSupported: 'A análise direta de vídeos do YouTube não é suportada no momento. Por favor, envie um arquivo de vídeo diretamente para análise. A reprodução desta URL do YouTube também pode ser limitada neste player.',
    noFileForAnalysis: 'Nenhum arquivo de vídeo disponível para análise. Por favor, envie um arquivo.',
    invalidUrlError: 'URL inválida fornecida. Por favor, insira uma URL HTTP/HTTPS válida.',
    fileProcessingError: 'Ocorreu um erro ao processar o arquivo enviado. Por favor, tente novamente.',
    noVideo1ToAnalyze: 'Nenhum Vídeo 1 (arquivo ou URL do YouTube) carregado para analisar.',
    noVideo2ToAnalyze: 'Nenhum Vídeo 2 carregado para analisar.',
    needTwoFilesForStitch: 'Dois arquivos de vídeo devem ser enviados para usar o recurso de união.',
    defaultFileName: 'Vídeo Enviado',
    videoLoadedUnknownName: 'Vídeo carregado',
    processingVideo1: 'Processando Vídeo 1...',
    processingVideo2: 'Processando Vídeo 2...',
    errorVideo1: 'Erro ao processar Vídeo 1. Tente novamente.',
    errorVideo2: 'Erro ao processar Vídeo 2. Tente novamente.',
    video1Loaded: 'Vídeo 1: {{fileName}}',
    video2Loaded: 'Vídeo 2: {{fileName}}',
    loaded: 'Carregado',
    clear: 'Limpar',
    clearVideo1: 'Limpar vídeo 1',
    clearVideo2: 'Limpar vídeo 2',
    analyzeVideo1: 'Analisar Vídeo 1',
    analyzeVideo2: 'Analisar Vídeo 2',
    stitchAndAnalyze: 'Unir Vídeos e Analisar',
    analyzeVideo1Only: 'Analisar Somente Vídeo 1',
    analyzeVideo2Only: 'Analisar Somente Vídeo 2',
    stitchError: 'Falha ao unir os vídeos. Por favor, tente vídeos diferentes ou analise individualmente.',
    stitching: 'Unindo vídeos',
    stitchingWait: 'Isso pode levar alguns instantes.',
  },
  sidebar: {
    customPromptTitle: 'Prompt personalizado:',
    customPromptPlaceholder: 'Digite um prompt personalizado...',
    customPromptLabel: 'Prompt personalizado para análise de vídeo',
    chartTitle: 'Gerar gráfico deste vídeo por:',
    customChartPlaceholder: 'Ou digite um prompt personalizado para o gráfico...',
    customChartLabel: 'Prompt personalizado para geração de gráfico',
    generate: 'Gerar',
    generateLabel: 'Gerar análise',
    back: 'Voltar',
    backLabel: 'Voltar aos modos de análise principais',
    exploreTitle: 'Explorar este vídeo via:',
    collapseLabel: 'Recolher painel lateral',
    expandLabel: 'Expandir painel lateral',
  },
  analysis: {
    loadingModel: 'Aguardando modelo',
    loadingTracking: 'Gerando dados de rastreamento...',
    errorGeneral: 'Ocorreu um erro durante a análise. Por favor, tente novamente.',
    table: {
      time: 'Tempo',
      description: 'Descrição',
      objects: 'Objetos',
      actions: 'Ações', 
    },
    chart: {
        defaultYLabel: 'Valor'
    },
    jumpTo: 'Pular para {{time}}, descrição: {{description}}',
    noData: 'Nenhum dado de análise para exibir para o modo selecionado. Tente gerar novamente ou selecione um modo diferente.',
    noTrackingData: 'Nenhum dado de rastreamento disponível. Tente gerar a análise de rastreamento.',
    changeVideos: 'Trocar Vídeo(s)',
    changeVideosLabel: 'Enviar vídeo(s) diferente(s)',
    exportJson: 'Exportar JSON',
    exportJsonLabel: 'Exportar dados de rastreamento como JSON',
    exportCsv: 'Exportar CSV',
    exportCsvLabel: 'Exportar dados de rastreamento como CSV',
    trackingDataAvailable: 'Dados de rastreamento de jogadores e bola gerados.',
    downloadClip: 'Baixar Trecho',
    downloadClipLabel: 'Baixar trecho do evento em {{time}}',
    uniquePlayersListTitle: 'Jogadores Únicos Detectados:',
    selectPlayerPrompt: 'Selecione o ID de um jogador para ver seus momentos.',
    playerMomentsTitle: 'Momentos do Jogador {{playerId}}:',
    noMomentsForPlayer: 'Nenhum momento encontrado para o Jogador {{playerId}}.',
    noPlayersDetected: 'Nenhum jogador detectado neste segmento do vídeo.',
    playerAppears: 'Jogador {{playerId}} aparece',
  },
  videoPlayer: {
    progressLabel: 'Progresso do vídeo',
    scrubberLabel: 'Controle de progresso do vídeo',
    markerLabel: 'Pular para marcador em {{time}}: {{description}}',
    pauseLabel: 'Pausar vídeo',
    playLabel: 'Reproduzir vídeo',
    processing: 'Processando vídeo...',
    error: 'Erro ao carregar vídeo. Este pode ser um arquivo de vídeo não padrão ou uma URL que este player não consegue manipular (ex: URL de página do YouTube).',
    noVideo: 'Nenhum vídeo selecionado para análise.',
    uploadHint: 'Envie um arquivo de vídeo ou forneça uma URL do YouTube para o Vídeo 1 para começar.',
    clippingStartMessage: 'Cortando vídeo...',
    clippingSuccessMessage: 'Download do trecho iniciado!',
    clippingErrorMessage: 'Erro ao criar trecho. Tente novamente.',
  },
  chart: {
    noData: 'Sem dados para exibir no gráfico.',
    jumpToTimeLabel: 'Pular para o tempo {{time}}',
    jumpToDataPointLabel: 'Pular para o tempo {{time}}, valor {{value}}',
  },
  modes: {
    avCaptions: {
      name: 'Legendas A/V',
      prompt: 'Para cada cena neste vídeo, gere legendas que descrevam a cena junto com qualquer texto falado colocado entre aspas. Coloque cada legenda em um objeto enviado para set_timecodes com o timecode da legenda no vídeo.',
    },
    narration: {
      name: 'Narração',
      prompt: "Crie uma narração emocionante e vibrante para este vídeo de futebol, no estilo inconfundível do narrador Galvão Bueno. Descreva as jogadas com paixão, use bordões se apropriado (ex: 'Haja coração!', 'Pode isso, Arnaldo?'), e transmita a emoção do jogo como se fosse uma transmissão de rádio. Divida a narração em segmentos curtos e, para cada segmento, chame a função set_timecodes com o tempo (timecode) correspondente no vídeo e o texto (text) da narração.",
    },
    keyMoments: {
      name: 'Momentos chave',
      prompt: 'Identifique e liste de 5 a 10 dos momentos chave mais significativos deste vídeo. Para cada momento, forneça uma descrição concisa e informativa do que está acontecendo. Chame set_timecodes com o timecode e a descrição para cada momento chave identificado.',
    },
    table: {
      name: 'Tabela',
      prompt: 'Escolha 5 cenas chave deste vídeo e chame set_timecodes_with_objects com o timecode, descrição textual de 10 palavras ou menos, e uma lista de objetos visíveis na cena (com emojis representativos).',
    },
    chart: {
      name: 'Gráfico',
      prompt: 'Gere dados de gráfico para este vídeo com base nas seguintes instruções: {{input}}. Chame set_timecodes_with_numeric_values uma vez com a lista de valores de dados e timecodes.',
      subModes: {
        excitement: {
          name: 'Empolgação',
          prompt: 'para cada cena, estime o nível de empolgação em uma escala de 1 a 10',
        },
        importance: {
          name: 'Importância',
          prompt: 'para cada cena, estime o nível de importância geral para o vídeo em uma escala de 1 a 10',
        },
        numPeople: {
          name: 'Número de pessoas',
          prompt: 'para cada cena, conte o número de pessoas visíveis',
        },
        custom: {
          name: 'Personalizado',
          prompt: 'Gere um gráfico personalizado com base no prompt fornecido.',
        },
      },
    },
    custom: {
      name: 'Personalizado',
      prompt: 'Chame set_timecodes uma vez usando as seguintes instruções: {{input}}',
    },
    playerBallTracking: {
      name: 'Rastreamento de Jogador e Bola',
      prompt: "Analise as imagens de vídeo de futebol fornecidas. Identifique todos os jogadores e a bola visíveis em momentos significativos ou em intervalos de aproximadamente 1 segundo. Atribua um ID único persistente a cada jogador detectado (por exemplo, 'player_1', 'player_2', ...). Use 'ball_0' como ID para a bola. Para cada jogador e bola detectados, forneça suas coordenadas da caixa delimitadora [xmin, ymin, xmax, ymax] normalizadas entre 0 e 1 em relação às dimensões do vídeo, e suas coordenadas centrais [x,y], também normalizadas. Além disso, forneça uma pontuação de confiança (0-1) para cada detecção. Estruture essas informações como uma lista de objetos de dados de quadro, onde cada objeto contém um 'timestamp' (por exemplo, '00:00:01.234') e um array de 'detections'. Chame a função 'set_tracking_data' uma vez com todos esses dados.",
    }
  },
};

export const translations: Record<AvailableLanguage, Translations> = { en, pt };