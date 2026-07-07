import React from 'react';
import { Scene, SceneElement, ElementType } from '../types';
import { ElementEditor } from './ElementEditor';
import { Plus, Trash2, Box, Type } from 'lucide-react';

interface SceneEditorProps {
  scene: Scene;
  sceneIndex: number;
  onChange: (updatedScene: Scene) => void;
  onDelete: () => void;
}

export function SceneEditor({ scene, sceneIndex, onChange, onDelete }: SceneEditorProps) {
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 100;
    onChange({ ...scene, height: val });
  };

  const handleAddElement = (type: ElementType) => {
    const newElement: SceneElement = type === 'text' 
      ? { id: crypto.randomUUID(), type: 'text', content: 'New Text', start: 0, end: 1, startY: 100, endY: 0, startOpacity: 0, endOpacity: 1 }
      : { id: crypto.randomUUID(), type: 'cube', start: 0, end: 1, startY: 100, endY: -100, startOpacity: 0, endOpacity: 1 };
    
    onChange({
      ...scene,
      elements: [...scene.elements, newElement]
    });
  };

  const handleUpdateElement = (updatedElement: SceneElement) => {
    onChange({
      ...scene,
      elements: scene.elements.map(el => el.id === updatedElement.id ? updatedElement : el)
    });
  };

  const handleDeleteElement = (id: string) => {
    onChange({
      ...scene,
      elements: scene.elements.filter(el => el.id !== id)
    });
  };

  return (
    <div className="border-l-4 border-teal-500 bg-slate-900 p-5 mb-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
          <span className="text-teal-500 font-mono text-sm border border-teal-500/30 bg-teal-500/10 px-2 py-1">#{sceneIndex + 1}</span> 
          Scene
        </h3>
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-sm"
        >
          <Trash2 size={16} /> <span className="uppercase tracking-wider text-xs">Remove</span>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Height (vh)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10"
            max="1000"
            value={scene.height}
            onChange={handleHeightChange}
            className="w-32 bg-slate-800 border border-slate-700 p-2 text-slate-100 focus:border-teal-500 focus:outline-none transition-colors font-mono"
          />
          <span className="text-slate-500 font-mono">vh</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {scene.elements.map(el => (
          <ElementEditor
            key={el.id}
            element={el}
            onChange={handleUpdateElement}
            onDelete={() => handleDeleteElement(el.id)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAddElement('text')}
          className="flex-1 border border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 p-2 text-sm flex justify-center items-center gap-2 transition-colors uppercase tracking-wider"
        >
          <Type size={16} /> Add Text
        </button>
        <button
          onClick={() => handleAddElement('cube')}
          className="flex-1 border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 text-sm flex justify-center items-center gap-2 transition-colors uppercase tracking-wider"
        >
          <Box size={16} /> Add Cube
        </button>
      </div>
    </div>
  );
}
