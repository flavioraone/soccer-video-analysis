
import * as functions from "firebase-functions";
import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleGenerativeAI, FunctionDeclaration, Part } from "@google/generative-ai";
import * as dotenv from "dotenv";
import busboy from "busboy";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

const app = express();
app.use(cors({ origin: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const systemInstruction = `When given a video and a query, call the relevant function only once with the appropriate timecodes and text for the video`;

app.post("/generateContent", (req: Request, res: Response) => {
    const bb = busboy({ headers: req.headers });
    let tempFilePath: string;

    const fields: { [key: string]: any } = {};
    const filePromises: Promise<Part>[] = [];

    bb.on('field', (fieldname, val) => {
        fields[fieldname] = val;
    });

    bb.on('file', (fieldname, file, filenameInfo) => {
        const { filename, mimeType } = filenameInfo;
        
        tempFilePath = path.join(os.tmpdir(), filename);
        const writeStream = fs.createWriteStream(tempFilePath);
        file.pipe(writeStream);

        const filePromise = new Promise<Part>((resolve, reject) => {
            writeStream.on('finish', () => {
                const filePart: Part = {
                    inlineData: {
                        data: fs.readFileSync(tempFilePath).toString("base64"),
                        mimeType
                    }
                };
                resolve(filePart);
            });
            writeStream.on('error', reject);
        });
        filePromises.push(filePromise);
    });

    bb.on('finish', async () => {
        try {
            const text = fields['text'];
            const functionDeclarations: FunctionDeclaration[] = JSON.parse(fields['functionDeclarations']);

            if (!text || !functionDeclarations) {
                return res.status(400).send("Missing required text or functionDeclarations.");
            }
            if (filePromises.length === 0) {
                 return res.status(400).send("Missing file.");
            }

            const fileParts = await Promise.all(filePromises);
            
            const model = genAI.getGenerativeModel({
                 model: "gemini-1.5-flash-preview-0514",
                 systemInstruction: {
                    role: "system",
                    parts: [{ text: systemInstruction }]
                 },
                 tools: [{ functionDeclarations }],
            });

            const result = await model.generateContent([text, ...fileParts]);
            
            return res.status(200).json(result.response);
        
        } catch (error) {
            console.error("Error processing request:", error);
            return res.status(500).send("Internal Server Error");
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    });

    req.pipe(bb);
});


export const api = functions.https.onRequest(app);
