/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import {FunctionDeclaration, GoogleGenAI, Type, File as GoogleGenAIFile} from '@google/genai';

const systemInstruction = `When given a video and a query, call the relevant \
function only once with the appropriate timecodes and text for the video`;

// Use process.env.API_KEY as per guidelines
const client = new GoogleGenAI({apiKey: process.env.API_KEY});

async function generateContent(
  text: string,
  functionDeclarations: FunctionDeclaration[],
  file: GoogleGenAIFile, 
) {
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17', 
    contents: [
      {
        role: 'user',
        parts: [
          {text},
          {
            fileData: {
              mimeType: file.mimeType, 
              fileUri: file.uri,       
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.5,
      tools: [{functionDeclarations}],
    },
  });

  return response;
}

async function uploadFile(file: File): Promise<GoogleGenAIFile> { 
  console.log('Uploading...');
  const uploadedFile = await client.files.upload({
    file: file, 
    config: {
      displayName: file.name,
      mimeType: file.type, 
    },
  });
  console.log('Uploaded.');
  console.log('Getting file status...');
  let getFile = await client.files.get({
    name: uploadedFile.name,
  });
  while (getFile.state === 'PROCESSING') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    getFile = await client.files.get({
      name: uploadedFile.name,
    });
  }
  console.log(`Final file status: ${getFile.state}`);
  if (getFile.state === 'FAILED') {
    console.error('File processing failed:', getFile); 
    throw new Error('File processing failed.');
  }
  console.log('File ready:', getFile.displayName);
  return getFile; 
}

export {generateContent, uploadFile};
