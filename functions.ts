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
import {FunctionDeclaration, Type} from '@google/genai';

const functions: FunctionDeclaration[] = [
  {
    name: 'set_timecodes',
    description: 'Set the timecodes for the video with associated text',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
              },
            },
            required: ['time', 'text'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_timecodes_with_objects',
    description:
      'Set the timecodes for the video with associated text and object list',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
              },
              objects: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
            },
            required: ['time', 'text', 'objects'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_timecodes_with_numeric_values',
    description:
      'Set the timecodes for the video with associated numeric values',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              value: {
                type: Type.NUMBER,
              },
            },
            required: ['time', 'value'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_tracking_data',
    description: 'Set the player and ball tracking data for the video, including detections per frame.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        frame_data: {
          type: Type.ARRAY,
          description: "An array of objects, where each object represents a frame's tracking data.",
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: {
                type: Type.STRING,
                description: "Timestamp of the frame (e.g., '00:00:01.234').",
              },
              detections: {
                type: Type.ARRAY,
                description: "List of detections in this frame.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: {
                      type: Type.STRING,
                      description: "Persistent ID for the object (e.g., 'player_1', 'ball_0').",
                    },
                    type: {
                      type: Type.STRING,
                      description: "Type of the object ('player' or 'ball').",
                    },
                    bbox: {
                      type: Type.ARRAY,
                      description: "Bounding box coordinates [xmin, ymin, xmax, ymax], normalized (0-1).",
                      items: { type: Type.NUMBER },
                    },
                    xy: {
                      type: Type.ARRAY,
                      description: "Center coordinates [x, y] of the object, normalized (0-1).",
                      items: { type: Type.NUMBER },
                    },
                    confidence: {
                      type: Type.NUMBER,
                      description: "Detection confidence score (0-1).",
                    },
                  },
                  required: ['id', 'type', 'bbox', 'xy', 'confidence'],
                },
              },
            },
            required: ['timestamp', 'detections'],
          },
        },
      },
      required: ['frame_data'],
    },
  },
];

export default (fnMap) =>
  functions.map((fn) => ({
    ...fn,
    callback: fnMap[fn.name],
  }));
