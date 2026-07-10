import React, { useState } from 'react';
import { ProjectSchema, Scene, SceneElement, ElementType } from '../types';
import { Plus, Type, Box, MoveVertical, Layout, Trash2, Mountain, Users, Activity, Wind, Component, ChevronDown } from 'lucide-react';
import { ElementEditor } from './ElementEditor';
import { elementRegistry } from './elements/registry';

interface EditorPanelProps {
  schema: ProjectSchema;
  onChange: (schema: ProjectSchema) => void;
  onCollapse: () => void;
  isCollapsed?: boolean;
}

// Editor-only placeholder types: draggable/creatable here but not in
// elementRegistry — they stay out of the AI-emittable set until they have a
// real renderer (see .claude/skills/new-element-type/SKILL.md).
const PLACEHOLDER_TYPES: ElementType[] = ['environment', 'object', 'character', 'action', 'motion', 'font', 'component'];

const getElementIcon = (type: ElementType) => {
  const definition = elementRegistry[type];
  if (definition) {
    const Icon = definition.icon;
    return <Icon size={12} />;
  }
  switch (type) {
    case 'environment': return <Mountain size={12} />;
    case 'object': return <Box size={12} />;
    case 'character': return <Users size={12} />;
    case 'action': return <Activity size={12} />;
    case 'motion': return <Wind size={12} />;
    case 'font': return <Type size={12} />;
    case 'component': return <Component size={12} />;
    default: return <Layout size={12} />;
  }
};

const isElementType = (value: string): value is ElementType => {
  return value in elementRegistry || PLACEHOLDER_TYPES.includes(value as ElementType);
};

// Live types (text/cube/glbObject/image/video) are created via their
// registry `create()` factory — this used to be a second, drifting copy of
// those defaults. Placeholders fall back to a generic shape.
const createElement = (type: ElementType): SceneElement => {
  const definition = elementRegistry[type];
  if (definition) return definition.create();
  // Only placeholder types (guarded by isElementType) reach here — registry
  // lookup above can't narrow `type` for TS the way a literal check would.
  return { id: crypto.randomUUID(), type, start: 0, end: 1, startY: 100, endY: -100, startOpacity: 0, endOpacity: 1 } as SceneElement;
};

export function EditorPanel({ schema, onChange, onCollapse, isCollapsed = false }: EditorPanelProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [expandedElementId, setExpandedElementId] = useState<string | null>(null);

  const handleAddScene = () => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      height: 200, // Default to 200vh so it has 2 thumbnails
      elements: []
    };
    onChange({
      ...schema,
      scenes: [...schema.scenes, newScene]
    });
  };

  const toggleSceneExpand = (sceneId: string) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const handleDeleteScene = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange({
      ...schema,
      scenes: schema.scenes.filter(s => s.id !== id)
    });
  };

  const handleDrop = (e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (isElementType(type)) {
      const sceneIndex = schema.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex !== -1) {
        const scene = schema.scenes[sceneIndex];
        const newElement = createElement(type);
        
        const newScenes = [...schema.scenes];
        newScenes[sceneIndex] = {
          ...scene,
          elements: [...scene.elements, newElement]
        };
        
        onChange({
          ...schema,
          scenes: newScenes
        });
      }
    }
  };

  const handleAddTransition = (index: number) => {
    const newScenes = [...schema.scenes];
    newScenes[index] = { ...newScenes[index], transition: true };
    onChange({ ...schema, scenes: newScenes });
  };

  const handleRemoveTransition = (index: number) => {
    const newScenes = [...schema.scenes];
    newScenes[index] = { ...newScenes[index], transition: false };
    onChange({ ...schema, scenes: newScenes });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleSceneCardClick = (e: React.MouseEvent, sceneId: string) => {
    if ((e.target as HTMLElement).closest('[data-role="delete-scene"]')) return;
    setExpandedSceneId(prev => (prev === sceneId ? null : sceneId));
  };

  const toggleElementExpand = (elementId: string) => {
    setExpandedElementId(prev => (prev === elementId ? null : elementId));
  };

  const handleElementChange = (sceneId: string, elementId: string, updated: SceneElement) => {
    const sceneIndex = schema.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    const scene = schema.scenes[sceneIndex];
    const elementIndex = scene.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;

    const newElements = [...scene.elements];
    newElements[elementIndex] = updated;

    const newScenes = [...schema.scenes];
    newScenes[sceneIndex] = { ...scene, elements: newElements };

    onChange({ ...schema, scenes: newScenes });
  };

  const handleElementDelete = (sceneId: string, elementId: string) => {
    const sceneIndex = schema.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    const scene = schema.scenes[sceneIndex];

    const newScenes = [...schema.scenes];
    newScenes[sceneIndex] = { ...scene, elements: scene.elements.filter(el => el.id !== elementId) };

    onChange({ ...schema, scenes: newScenes });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800 relative select-none">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {schema.scenes.map((scene, i) => {
          const numThumbnails = Math.max(1, Math.ceil(scene.height / 100));
          const isExpanded = expandedScenes.has(scene.id);
          
          const uniqueAssetTypes = Array.from(new Set(scene.elements.map(e => e.type)));

          return (
            <React.Fragment key={scene.id}>
              {i > 0 && (
                <>
                  {!schema.scenes[i - 1].transition ? (
                    <div className="flex justify-center items-center py-1 relative">
                      <div className="w-px h-3 bg-slate-700"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center items-center py-0.5 relative">
                        <div className="w-px h-2 bg-slate-700"></div>
                      </div>
                      
                      <div className={`flex ${isCollapsed ? 'gap-0 flex-col items-center' : 'gap-3'} relative group`}>
                        {!isCollapsed && (
                          <div className="w-6 text-right text-xs text-slate-500 font-mono mt-2"></div>
                        )}
                        <div className={`flex-1 relative ${isCollapsed ? 'w-full' : ''}`}>
                          <div 
                            className={`relative bg-slate-800/20 border border-dashed border-slate-700/50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors ${isCollapsed ? 'aspect-[1/0.3]' : 'aspect-[16/2.7]'}`}
                            onClick={() => handleRemoveTransition(i - 1)}
                            title="Remove Transition"
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'transition'); e.dataTransfer.effectAllowed = 'copy'; }}
                          >
                            {!isCollapsed && <span className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold">Transition</span>}
                            {isCollapsed && <MoveVertical size={10} className="text-slate-600" />}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center items-center py-0.5 relative">
                        <div className="w-px h-2 bg-slate-700"></div>
                      </div>
                    </>
                  )}
                </>
              )}
              
              <div
                className={`flex ${isCollapsed ? 'gap-0 flex-col items-center' : 'gap-3'} relative group`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, scene.id)}
                onClickCapture={(e) => handleSceneCardClick(e, scene.id)}
              >
                {!isCollapsed && (
                  <div className="w-6 text-right text-xs text-slate-500 font-mono mt-2">{i + 1}</div>
                )}
                <div className={`flex-1 relative ${isCollapsed ? 'w-full' : ''}`}>
                  {!isCollapsed && (
                    <button
                      data-role="delete-scene"
                      onClick={(e) => handleDeleteScene(e, scene.id)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-slate-800"
                      title="Delete Scene"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {/* If stacked and not expanded */}
                  {numThumbnails > 1 && !isExpanded && !isCollapsed ? (
                    <div 
                      className="cursor-pointer"
                      onClick={() => toggleSceneExpand(scene.id)}
                    >
                      <div className="absolute top-2 left-2 right-[-8px] bottom-[-8px] bg-slate-800 border border-slate-700 rounded-lg z-0 opacity-50"></div>
                      <div className="absolute top-1 left-1 right-[-4px] bottom-[-4px] bg-slate-800 border border-slate-700 rounded-lg z-0 opacity-75"></div>
                      
                      <div 
                        className={`relative z-10 aspect-video bg-slate-900 border-2 rounded-lg overflow-hidden transition-colors flex flex-col items-center justify-center cursor-grab ${selectedThumbnail === scene.id ? 'border-teal-500 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedThumbnail(scene.id); toggleSceneExpand(scene.id); }}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'scene'); e.dataTransfer.effectAllowed = 'copy'; }}
                      >
                        <span className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Scene {i + 1}</span>
                        <span className="text-slate-600 text-[10px] uppercase tracking-widest bg-slate-950 px-2 py-1 rounded-full">{numThumbnails} slides</span>
                        
                        {/* Asset Icons */}
                        <div className="absolute bottom-2 left-2 flex gap-1 bg-slate-800/80 p-1 rounded backdrop-blur-sm">
                          {uniqueAssetTypes.map(type => (
                            <span key={type} className="text-slate-400" title={type}>
                              {getElementIcon(type)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Expanded or single (or collapsed)
                    <div className={`flex flex-col ${isCollapsed ? 'gap-2' : 'gap-4'}`}>
                      {Array.from({ length: numThumbnails }).map((_, partIndex) => {
                        const thumbnailId = `${scene.id}-${partIndex}`;
                        return (
                          <div 
                            key={partIndex} 
                            className={`relative ${isCollapsed ? 'aspect-square' : 'aspect-video'} bg-slate-900 border-2 rounded-lg overflow-hidden transition-colors cursor-grab ${selectedThumbnail === thumbnailId ? 'border-teal-500 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`} 
                            onClick={() => {
                              setSelectedThumbnail(thumbnailId);
                              if (numThumbnails > 1 && partIndex === 0 && !isCollapsed) toggleSceneExpand(scene.id);
                            }}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'slide'); e.dataTransfer.effectAllowed = 'copy'; }}
                          >
                            {!isCollapsed && (
                              <div className="absolute top-2 left-2 text-[10px] text-slate-500 font-mono">
                                {partIndex === 0 ? `Scene ${i + 1}` : `${i + 1}.${partIndex + 1}`}
                              </div>
                            )}
                            
                            {!isCollapsed && (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold">{partIndex * 100}vh - {(partIndex + 1) * 100}vh</span>
                              </div>
                            )}

                            {isCollapsed && (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-slate-500 text-[8px] font-mono">{partIndex === 0 ? `S${i + 1}` : `${i + 1}.${partIndex + 1}`}</span>
                              </div>
                            )}
                            
                            {/* Asset Icons */}
                            {uniqueAssetTypes.length > 0 && !isCollapsed && (
                              <div className="absolute bottom-2 left-2 flex gap-1 bg-slate-800/80 p-1 rounded backdrop-blur-sm">
                                {uniqueAssetTypes.map(type => (
                                  <span key={type} className="text-slate-400" title={type}>
                                    {getElementIcon(type)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {uniqueAssetTypes.length > 0 && isCollapsed && (
                               <div className="absolute bottom-1 left-1 flex flex-wrap gap-0.5 bg-slate-800/80 p-0.5 rounded backdrop-blur-sm">
                               {uniqueAssetTypes.slice(0, 3).map(type => (
                                 <span key={type} className="text-slate-400 scale-75 origin-bottom-left" title={type}>
                                   {getElementIcon(type)}
                                 </span>
                               ))}
                             </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {!isCollapsed && expandedSceneId === scene.id && (
                <div className="flex gap-3 relative">
                  <div className="w-6 shrink-0" />
                  <div className="flex-1 border border-slate-800 bg-slate-900/60 rounded-lg p-2 flex flex-col gap-1">
                    {scene.elements.length === 0 && (
                      <span className="text-[10px] text-slate-600 uppercase tracking-widest text-center py-2">
                        No elements
                      </span>
                    )}
                    {scene.elements.map((el) => {
                      const definition = elementRegistry[el.type];
                      const Icon = definition?.icon;
                      const elementLabel = definition?.label ?? el.type;
                      const isElementExpanded = expandedElementId === el.id;

                      return (
                        <div key={el.id} className="flex flex-col">
                          <div
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-800/60 text-xs text-slate-300 transition-colors"
                            onClick={() => toggleElementExpand(el.id)}
                          >
                            <span className="text-teal-400 flex items-center">
                              {Icon ? <Icon size={12} /> : <Layout size={12} />}
                            </span>
                            <span className="flex-1 truncate">{elementLabel}</span>
                            <span className="text-slate-600 font-mono text-[10px]">{el.id.slice(0, 6)}</span>
                            <ChevronDown
                              size={12}
                              className={`text-slate-500 transition-transform shrink-0 ${isElementExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                          {isElementExpanded && (
                            <ElementEditor
                              element={el}
                              onChange={(updated) => handleElementChange(scene.id, el.id, updated)}
                              onDelete={() => handleElementDelete(scene.id, el.id)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="p-3">
        <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row items-center'} gap-2`}>
          <button
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'scene'); e.dataTransfer.effectAllowed = 'copy'; }}
            onClick={handleAddScene}
            className="flex-1 p-2 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-teal-400 hover:border-teal-500/50 transition-colors flex items-center justify-center gap-1 cursor-grab"
            title="Add Scene"
          >
            <Plus size={18} />
            {!isCollapsed && <span className="text-xs">Scene</span>}
          </button>
          <button
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'slide'); e.dataTransfer.effectAllowed = 'copy'; }}
            className="flex-1 p-2 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-teal-400 hover:border-teal-500/50 transition-colors flex items-center justify-center gap-1 cursor-grab"
            title="Add Slide"
          >
            <Plus size={18} />
            {!isCollapsed && <span className="text-xs">Slide</span>}
          </button>
          <button
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'transition'); e.dataTransfer.effectAllowed = 'copy'; }}
            className="flex-1 p-2 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-teal-400 hover:border-teal-500/50 transition-colors flex items-center justify-center gap-1 cursor-grab"
            title="Add Transition"
          >
            <Plus size={18} />
            {!isCollapsed && <span className="text-xs">Transition</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
