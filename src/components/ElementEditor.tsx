import React from 'react';
import { SceneElement } from '../types';
import { Trash2, Plus } from 'lucide-react';
import { elementRegistry } from './elements/registry';
import { BASE_FIELDS, FieldSpec } from './elements/specs';

interface ElementEditorProps {
  element: SceneElement;
  onChange: (updatedElement: SceneElement) => void;
  onDelete: () => void;
}

const INPUT_CLASSES =
  'w-full bg-slate-900 border border-slate-700 p-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition-colors';

// Fields that need breathing room span both grid columns; short scalar
// controls share a row two-up, matching the original hand-written layout.
function fieldSpanClass(kind: FieldSpec['kind']): string {
  return kind === 'textarea' || kind === 'url' || kind === 'list' ? 'col-span-2' : '';
}

function defaultValueForKind(kind: FieldSpec['kind'], options?: FieldSpec['options']): unknown {
  switch (kind) {
    case 'number':
    case 'range':
      return 0;
    case 'toggle':
      return false;
    case 'select':
      return options?.[0]?.value ?? '';
    case 'color':
      return '#ffffff';
    case 'list':
      return [];
    default:
      return '';
  }
}

interface FieldInputProps {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    onChange(Number.isNaN(parsed) ? value : parsed);
  };

  return (
    <div className={fieldSpanClass(field.kind)}>
      <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">{field.label}</label>
      {field.kind === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASSES}
        />
      )}
      {field.kind === 'url' && (
        <input
          type="text"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASSES}
        />
      )}
      {field.kind === 'textarea' && (
        <textarea
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={INPUT_CLASSES}
        />
      )}
      {field.kind === 'number' && (
        <input
          type="number"
          value={Number(value ?? 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={handleNumericChange}
          className={INPUT_CLASSES}
        />
      )}
      {field.kind === 'range' && (
        <input
          type="range"
          value={Number(value ?? 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={handleNumericChange}
          className="w-full accent-emerald-500"
        />
      )}
      {field.kind === 'toggle' && (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
      )}
      {field.kind === 'color' && (
        <input
          type="color"
          value={String(value ?? '#ffffff')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 h-9 focus:border-emerald-500 focus:outline-none transition-colors"
        />
      )}
      {field.kind === 'select' && (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASSES}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {field.kind === 'list' && (
        <ListFieldInput
          itemFields={field.itemFields ?? []}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

interface ListFieldInputProps {
  itemFields: FieldSpec[];
  value: unknown;
  onChange: (value: unknown) => void;
}

function ListFieldInput({ itemFields, value, onChange }: ListFieldInputProps) {
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

  const handleItemChange = (index: number, key: string, itemValue: unknown) => {
    const nextItems = items.map((item, i) => (i === index ? { ...item, [key]: itemValue } : item));
    onChange(nextItems);
  };

  const handleAdd = () => {
    const blankItem: Record<string, unknown> = {};
    itemFields.forEach((itemField) => {
      blankItem[itemField.key] = defaultValueForKind(itemField.kind, itemField.options);
    });
    onChange([...items, blankItem]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="border border-slate-700 bg-slate-900 p-2 flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2">
              {itemFields.map((itemField) => (
                <FieldInput
                  key={itemField.key}
                  field={itemField}
                  value={item[itemField.key]}
                  onChange={(itemValue) => handleItemChange(index, itemField.key, itemValue)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-slate-400 hover:text-red-400 transition-colors mt-1"
              title="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 w-full border border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 p-2 text-xs flex justify-center items-center gap-1 transition-colors uppercase tracking-wider"
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );
}

export function ElementEditor({ element, onChange, onDelete }: ElementEditorProps) {
  const definition = elementRegistry[element.type];
  const Icon = definition?.icon;
  const elementLabel = definition?.label ?? element.type;
  const typeFields = definition?.fields ?? [];

  const handleFieldChange = (key: string, value: unknown) => {
    onChange({ ...element, [key]: value } as SceneElement);
  };

  const elementRecord = element as unknown as Record<string, unknown>;

  return (
    <div className="border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4 mb-3 relative">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold tracking-wide text-emerald-400 uppercase flex items-center gap-2">
          {Icon && <Icon size={14} />}
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
        {typeFields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={elementRecord[field.key]}
            onChange={(value) => handleFieldChange(field.key, value)}
          />
        ))}
        {BASE_FIELDS.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={elementRecord[field.key]}
            onChange={(value) => handleFieldChange(field.key, value)}
          />
        ))}
      </div>
    </div>
  );
}
