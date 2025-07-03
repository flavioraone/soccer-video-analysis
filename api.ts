
import { FunctionDeclaration, GenerateContentResponse, GoogleGenAI, File as GoogleGenAIFile } from '@google/genai';

const API_URL = 'https://us-central1-soccer-analysis-464816.cloudfunctions.net/api/generateContent';

async function generateContent(
  text: string,
  functionDeclarations: FunctionDeclaration[],
  file: GoogleGenAIFile, // This type is now just for local reference, not direct upload
): Promise<GenerateContentResponse> {

  const formData = new FormData();
  formData.append('text', text);
  formData.append('functionDeclarations', JSON.stringify(functionDeclarations));
  
  // The 'file' object in the original code was a File object from the browser.
  // We need to fetch the blob from the file URI to send it.
  // This assumes 'file' is the result of the original `uploadFile` which is now a proxy.
  // The original uploadFile is no longer needed as the backend handles the Google upload.
  
  // We need the actual file object to send. Let's adapt the flow.
  // The `uploadFile` function will now just be a wrapper to get the File object.
  // The main logic will be in this function.
  
  // This function will now take the raw File object.
  // The 'file' parameter type is changed to reflect this.
  
  // This function is not used anymore as the new backend combines upload and generation.
  // Let's refactor the calling code to use a single function.
  
  throw new Error("This function is deprecated. Use the new combined function.");
}

async function uploadAndGenerate(
  text: string,
  functionDeclarations: FunctionDeclaration[],
  file: File, // The actual file from the input
): Promise<GenerateContentResponse> {
    console.log("Sending data to the secure backend...");
    const formData = new FormData();
    formData.append('text', text);
    formData.append('functionDeclarations', JSON.stringify(functionDeclarations));
    formData.append('file', file);

    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error(`Backend request failed: ${response.statusText}`);
    }

    console.log("Backend processing complete.");
    return response.json();
}


// The original uploadFile is no longer needed because the new backend endpoint
// handles both the upload to Google and the content generation in a single step.
// We keep a similar function signature in `uploadAndGenerate` to simplify the transition.
async function uploadFile(file: File): Promise<GoogleGenAIFile> {
    // This function is now a no-op, as the upload is handled by the backend.
    // The calling component (`App.tsx`) needs to be updated to call `uploadAndGenerate` directly.
    // For now, we'll throw an error to indicate this needs to be changed.
    throw new Error("uploadFile is deprecated. Update App.tsx to use uploadAndGenerate.");
}

export { uploadAndGenerate, uploadFile, generateContent };
