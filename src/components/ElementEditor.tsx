import React from 'react';
import { SceneElement } from '../types';
import { Trash2 } from 'lucide-react';

interface ElementEditorProps {
  element: SceneElement;
  onChange: (updatedElement: SceneElement) => void;
  onDelete: () => void;
}

export function ElementEditor({ element, onChange, onDelete }: ElementEditorProps) {
  const elementLabel = element.type === 'text'
    ? 'Text Block'
    : element.type === 'glbObject'
      ? 'GLB Object'
      : '3D Cube';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    if (type === 'number') {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    }

    onChange({
      ...element,
      [name]: parsedValue,
    } as SceneElement);
  };

  return (
    <div className="border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4 mb-3 relative">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold tracking-wide text-emerald-400 uppercase">
          {elementLabel}
        </h4>
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-400 transition-colors"
          title="Delete Element"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {element.type === 'text' && (
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Content</label>
            <input
              type="text"
              name="content"
              value={element.content}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        {element.type === 'glbObject' && (
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Model Path</label>
            <input
              type="text"
              name="modelPath"
              value={element.modelPath}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>
        )}
        
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Start %</label>
          <input
            type="number"
            name="start"
            step="0.05"
            min="0"
            max="1"
            value={element.start}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">End %</label>
          <input
            type="number"
            name="end"
            step="0.05"
            min="0"
            max="1"
            value={element.end}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Start Y</label>
          <input
            type="number"
            name="startY"
            value={element.startY}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">End Y</label>
          <input
            type="number"
            name="endY"
            value={element.endY}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Start Opacity</label>
          <input
            type="number"
            name="startOpacity"
            step="0.1"
            min="0"
            max="1"
            value={element.startOpacity}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">End Opacity</label>
          <input
            type="number"
            name="endOpacity"
            step="0.1"
            min="0"
            max="1"
            value={element.endOpacity}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
