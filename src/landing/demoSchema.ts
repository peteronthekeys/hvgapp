import { ProjectSchema, DEFAULT_GLB_OBJECT_MODEL_PATH } from '../types';

/**
 * Canned project for the landing page's live-engine embed. Only the three
 * renderable element types (text / cube / glbObject) per the type-drift law.
 */
export const DEMO_SCHEMA: ProjectSchema = {
  scenes: [
    {
      id: 'demo-a',
      height: 250,
      elements: [
        {
          id: 'demo-a-text',
          type: 'text',
          content: 'Scroll writes the story',
          start: 0,
          end: 0.45,
          startY: 0,
          endY: -120,
          startOpacity: 1,
          endOpacity: 0.2,
        },
        {
          id: 'demo-a-cube',
          type: 'cube',
          start: 0.35,
          end: 1,
          startY: 150,
          endY: -150,
          startOpacity: 0,
          endOpacity: 1,
        },
      ],
    },
    {
      id: 'demo-b',
      height: 200,
      elements: [
        {
          id: 'demo-b-orb',
          type: 'glbObject',
          modelPath: DEFAULT_GLB_OBJECT_MODEL_PATH,
          start: 0,
          end: 0.85,
          startY: 160,
          endY: -60,
          startOpacity: 0,
          endOpacity: 1,
        },
        {
          id: 'demo-b-text',
          type: 'text',
          content: 'Rendered live — right here',
          start: 0.4,
          end: 0.9,
          startY: 80,
          endY: -20,
          startOpacity: 0,
          endOpacity: 1,
        },
      ],
    },
  ],
};
