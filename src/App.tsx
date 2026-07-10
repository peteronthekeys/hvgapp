/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectSchema } from './types';
import { migrateSchema } from './schema/migrate';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel, PreviewPlaybackHandle } from './components/PreviewPanel';
import { PlaybackOverlay } from './components/PlaybackOverlay';
import { ChatPanel } from './components/ChatPanel';
import { PanelLeftOpen, PanelRightOpen, PanelLeftClose, PanelRightClose, Mountain, Box, Users, Activity, Wind, Type, Component, Play, StepBack, StepForward, Image as ImageIcon, Video, Link, FileText, Music, Download } from 'lucide-react';
import { exportSite } from './export/exportSite';

const INITIAL_SCHEMA: ProjectSchema = {
  scenes: [
    {
      id: crypto.randomUUID(),
      height: 200,
      elements: [
        {
          id: crypto.randomUUID(),
          type: 'text',
          content: 'Scroll Me',
          start: 0,
          end: 0.5,
          startY: 100,
          endY: 0,
          startOpacity: 0,
          endOpacity: 1
        },
        {
          id: crypto.randomUUID(),
          type: 'cube',
          start: 0.5,
          end: 1,
          startY: 100,
          endY: -100,
          startOpacity: 0,
          endOpacity: 1
        }
      ]
    }
  ]
};

export default function App() {
  const [schema, setSchema] = useState<ProjectSchema>(() => migrateSchema(INITIAL_SCHEMA));
  const [editorWidth, setEditorWidth] = useState(450);
  const [chatWidth, setChatWidth] = useState(350);
  const [isEditorExpanded, setIsEditorExpanded] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [activeAssetTab, setActiveAssetTab] = useState<string | null>(null);
  const [activeResourceTab, setActiveResourceTab] = useState<string | null>(null);
  const [scrub, setScrub] = useState(1);
  const [fps, setFps] = useState(30);
  const [isPlayback, setIsPlayback] = useState(false);
  const studioPlaybackRef = useRef<PreviewPlaybackHandle | null>(null);

  const applySchema = useCallback((next: unknown) => setSchema(migrateSchema(next)), []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as any).__studio = { getSchema: () => schema, setSchema: applySchema, playback: studioPlaybackRef };
  }, [schema, applySchema]);

  const assetTypes = [
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'video', icon: Video, label: 'Video' },
    { id: 'environment', icon: Mountain, label: 'Environments' },
    { id: 'object', icon: Box, label: 'Objects' },
    { id: 'character', icon: Users, label: 'Characters' },
    { id: 'action', icon: Activity, label: 'Actions' },
    { id: 'motion', icon: Wind, label: 'Motions' },
    { id: 'font', icon: Type, label: 'Fonts' },
    { id: 'component', icon: Component, label: 'Components' }
  ];

  const resourceTypes = [
    { id: 'image', icon: ImageIcon, label: 'Images' },
    { id: 'video', icon: Video, label: 'Videos' },
    { id: 'link', icon: Link, label: 'Links' },
    { id: 'instruction', icon: FileText, label: 'Instructions' },
    { id: 'sound', icon: Music, label: 'Sounds' }
  ];

  const getAssetDropType = (id: string) => id === 'object' ? 'glbObject' : id;

  const seekToFrame = (frame: number) => {
    studioPlaybackRef.current?.seek((frame - 1) / 999);
  };

  const stepFrame = (direction: 1 | -1) => {
    const step = Math.max(1, Math.round(1000 / (fps * 8)));
    const next = Math.min(1000, Math.max(1, scrub + direction * step));
    setScrub(next);
    seekToFrame(next);
  };

  const startResizeEditor = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = editorWidth;
    
    const onMouseMove = (ev: MouseEvent) => {
      setEditorWidth(Math.max(300, Math.min(800, startWidth + (ev.clientX - startX))));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizeChat = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;
    
    const onMouseMove = (ev: MouseEvent) => {
      setChatWidth(Math.max(300, Math.min(800, startWidth - (ev.clientX - startX))));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/80 flex items-center px-4 shrink-0 justify-between z-40 relative">
        {/* Far Left */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditorExpanded(!isEditorExpanded)}
            className="text-slate-400 hover:text-teal-400 transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800"
            title="Toggle Editor"
          >
            {isEditorExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          
          <div className="w-px h-5 bg-slate-800 mx-2"></div>
          
          {assetTypes.map(({ id, icon: Icon, label }) => (
            <button 
              key={id}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', getAssetDropType(id)); e.dataTransfer.effectAllowed = 'copy'; }}
              onClick={() => setActiveAssetTab(activeAssetTab === id ? null : id)}
              className={`text-slate-400 hover:text-teal-400 transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800 cursor-grab ${activeAssetTab === id ? 'bg-slate-800 text-teal-400' : ''}`}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        
        {/* Center - Absolute for perfect centering */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 w-[33vw]">
          <button onClick={() => setIsPlayback(true)} className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center w-8 h-8 shrink-0 rounded hover:bg-slate-800" title="Play/Pause">
            <Play size={16} fill="currentColor" />
          </button>
          
          <button onClick={() => stepFrame(-1)} className="text-slate-400 hover:text-teal-400 transition-colors flex items-center justify-center w-8 h-8 shrink-0 rounded hover:bg-slate-800" title="Previous Frame">
            <StepBack size={14} />
          </button>

          <div className="flex-1 flex items-center px-2">
            <input
              type="range"
              min="1"
              max="1000"
              value={scrub}
              onChange={(e) => {
                const value = Number(e.target.value);
                setScrub(value);
                seekToFrame(value);
              }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              title="Frame Slider"
            />
          </div>

          <button onClick={() => stepFrame(1)} className="text-slate-400 hover:text-teal-400 transition-colors flex items-center justify-center w-8 h-8 shrink-0 rounded hover:bg-slate-800" title="Next Frame">
            <StepForward size={14} />
          </button>

          <div className="flex items-center gap-1 shrink-0 ml-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
            <input
              type="number"
              min="1"
              max="120"
              value={fps}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                setFps(Number.isNaN(parsed) ? 30 : Math.min(120, Math.max(1, parsed)));
              }}
              className="w-10 bg-transparent text-xs text-slate-300 text-right focus:outline-none focus:text-teal-400 font-mono"
              title="FPS"
            />
            <span className="text-[10px] text-slate-500 uppercase font-mono">fps</span>
          </div>
        </div>

        {/* Far Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportSite(schema).catch((err: unknown) => {
                window.alert(err instanceof Error ? err.message : 'Export failed');
              });
            }}
            className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800"
            title="Export site"
          >
            <Download size={16} />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-2"></div>

          {resourceTypes.map(({ id, icon: Icon, label }) => (
            <button 
              key={id}
              onClick={() => {
                setActiveResourceTab(activeResourceTab === id ? null : id);
              }}
              className={`text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800 ${activeResourceTab === id ? 'bg-slate-800 text-emerald-400' : ''}`}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
          
          <div className="w-px h-5 bg-slate-800 mx-2"></div>
          
          <button 
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800"
            title="Toggle Chat"
          >
            {isChatExpanded ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </div>

      {/* Sub Menu */}
      {(activeAssetTab || activeResourceTab) && (
        <div className="h-24 border-b border-slate-800 bg-slate-900/90 flex shrink-0 z-30 relative shadow-md">
          {activeAssetTab && (
            <div className={`flex items-center px-4 gap-4 overflow-x-auto ${activeResourceTab ? 'w-1/2 border-r border-slate-800' : 'w-full'}`}>
              {Array.from({ length: activeAssetTab === 'object' ? 1 : 15 }).map((_, i) => (
                <div 
                  key={`asset-${i}`} 
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', getAssetDropType(activeAssetTab)); e.dataTransfer.effectAllowed = 'copy'; }}
                  className="h-16 w-16 bg-slate-800 border border-slate-700 hover:border-teal-500 rounded flex-shrink-0 cursor-grab transition-colors flex items-center justify-center relative overflow-hidden group"
                >
                  <span className="text-slate-500 text-xs font-mono group-hover:text-teal-400">
                    {activeAssetTab === 'object' ? 'GLB' : `${activeAssetTab.substring(0, 3).toUpperCase()}${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {activeResourceTab && (
            <div className={`flex items-center px-4 gap-4 overflow-x-auto ${activeAssetTab ? 'w-1/2 justify-end' : 'w-full justify-end'}`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={`resource-${i}`} 
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', `resource:${activeResourceTab}:${i + 1}`); e.dataTransfer.effectAllowed = 'copy'; }}
                  className="h-16 w-16 bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded flex-shrink-0 cursor-grab transition-colors flex items-center justify-center relative overflow-hidden group"
                >
                  <span className="text-slate-500 text-xs font-mono group-hover:text-emerald-400">{activeResourceTab.substring(0, 3).toUpperCase()}{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Editor Column */}
        {isEditorExpanded ? (
          <>
            <div style={{ width: editorWidth }} className="shrink-0 border-r border-slate-800 shadow-2xl z-30 flex flex-col bg-slate-950 h-full overflow-hidden">
              <EditorPanel schema={schema} onChange={applySchema} onCollapse={() => setIsEditorExpanded(false)} />
            </div>
            <div 
              className="w-1 cursor-col-resize hover:bg-teal-500/50 bg-slate-800 shrink-0 z-40 transition-colors h-full"
              onMouseDown={startResizeEditor}
            />
          </>
        ) : (
          <div className="w-16 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col z-30 shadow-2xl h-full overflow-hidden">
             <EditorPanel schema={schema} onChange={applySchema} onCollapse={() => setIsEditorExpanded(true)} isCollapsed={true} />
          </div>
        )}

        {/* Preview Column */}
        {isPlayback ? (
          <div className="flex-1 relative z-10 min-w-0 h-full bg-slate-950" />
        ) : (
          <div className="flex-1 relative z-10 min-w-0 h-full">
            <PreviewPanel schema={schema} playbackRef={studioPlaybackRef} />
          </div>
        )}

        {/* Chat Column */}
        {isChatExpanded ? (
          <>
            <div 
              className="w-1 cursor-col-resize hover:bg-emerald-500/50 bg-slate-800 shrink-0 z-40 transition-colors h-full"
              onMouseDown={startResizeChat}
            />
            <div style={{ width: chatWidth }} className="shrink-0 border-l border-slate-800 shadow-2xl z-30 flex flex-col bg-slate-950 h-full overflow-hidden">
              <ChatPanel schema={schema} onChange={applySchema} onCollapse={() => setIsChatExpanded(false)} />
            </div>
          </>
        ) : null}

      </div>

      {isPlayback && (
        <PlaybackOverlay schema={schema} fps={fps} onClose={() => setIsPlayback(false)} />
      )}
    </div>
  );
}
