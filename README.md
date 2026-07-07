# Animation Studio Pro

A powerful, web-based animation editor built with React, Vite, and Tailwind CSS. The studio allows users to visually compose scenes, drag and drop assets, construct animations with multiple elements, and utilize an integrated AI chat assistant to generate or modify scene structures dynamically.

## Features

- **Visual Scene Editor**: Build complex sequences using intuitive drag-and-drop operations for scenes, slides, and transition elements.
- **Collapsible Workspace**: Highly responsive multi-column layout. Collapse or resize the asset sidebar, scene editor, preview panel, and chat interface to suit your workflow.
- **Dynamic Asset Library & Resource Manager**: Supports various asset types (Environments, Objects, Characters, Actions, Motions, Fonts, Components) on the left, and raw resources (Images, Videos, Links, Instructions, Sounds) on the right. Both can be open simultaneously and dragged into the workspace.
- **AI-Powered Chat Assistant**: Integrated side-panel assistant with voice input support. Drag resources directly into the chat to attach them to your message. Use slash commands and @mentions to reference assets and scenes.
- **Frame-by-Frame Scrubbing**: Detailed timeline controls in the central navbar to step through frames and control playback FPS.
- **Transition Management**: Fine-grained control over scene flow. Insert transition slides specifically between whole scenes to ensure smooth pacing.
- **Real-Time Preview**: (Coming Soon) Watch your crafted scenes and elements play back in real-time in the central stage area.

## Architecture

This application strictly follows a client-side architecture using modern React features:
- **React 18+** with functional components and Hooks (`useState`, `useEffect`, `useRef`).
- **Tailwind CSS** for streamlined, utility-first styling with responsive, mobile-first considerations, and a sleek dark mode UI.
- **Vite** for fast and efficient front-end tooling.
- **Lucide React** for consistent and clean SVG iconography.
- **TypeScript** ensures type safety across the complex `ProjectSchema` representing scenes and elements.

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the root directory.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Development

To run the application locally in development mode:
```bash
npm run dev
```
The server will start (typically on port 3000) and you can open the provided local URL in your browser.

### Building for Production

To create an optimized production build:
```bash
npm run build
```
The compiled static assets will be output to the `dist` directory.

### Previewing the Production Build

You can preview the built static app locally using standard server tools like `serve` or configure an Express setup as defined in our backend proxy examples.

## Key Components

- `App.tsx`: The central layout manager. Handles column resizing and maintains the global `schema` state.
- `EditorPanel.tsx`: The left column, containing scene/slide structure. Allows dragging elements and managing scenes and their transitions.
- `PreviewPanel.tsx`: The central column serving as the main stage. 
- `ChatPanel.tsx`: The right column providing the conversational AI interface with speech-to-text capabilities.
- `types.ts`: Defines the strict structural interfaces for scenes, elements, and the project schema.

## License

MIT License. See `LICENSE` for more information.
