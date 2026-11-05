import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { metaApi } from '../../api/client';

interface SkillSelectorProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  optional?: boolean;
}

const DEFAULT_POPULAR_SKILLS = [
  'Customer service',
  'Booking',
  'Cooking',
  'Driving',
  'Tour guiding',
  'Housekeeping',
  'Carpentry',
  'Boat operation',
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export default function SkillSelector({ id, label, values, onChange, optional = true }: Readonly<SkillSelectorProps>) {
  const [availableSkills, setAvailableSkills] = useState<string[]>(DEFAULT_POPULAR_SKILLS);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    let mounted = true;
    metaApi.options()
      .then(options => {
        if (mounted && options.skills && options.skills.length > 0) {
          // Merge unique skills
          const combined = Array.from(new Set([...DEFAULT_POPULAR_SKILLS, ...options.skills]));
          setAvailableSkills(combined);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const toggleSkill = (skill: string) => {
    const isSelected = values.some(v => normalize(v) === normalize(skill));
    if (isSelected) {
      onChange(values.filter(v => normalize(v) !== normalize(skill)));
    } else {
      onChange([...values, skill]);
    }
  };

  const addCustomSkill = () => {
    const trimmed = customValue.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;
    if (!values.some(v => normalize(v) === normalize(trimmed))) {
      onChange([...values, trimmed]);
      if (!availableSkills.some(s => normalize(s) === normalize(trimmed))) {
        setAvailableSkills(prev => [...prev, trimmed]);
      }
    }
    setCustomValue('');
    setShowOtherInput(false);
  };

  return (
    <div id={id} className="space-y-2">
      <label className="label text-xs">
        {label} {!optional && <span className="text-danger">*</span>}
      </label>

      {/* Selectable Skill Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {availableSkills.map(skill => {
          const isSelected = values.some(v => normalize(v) === normalize(skill));
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`chip ${isSelected ? 'chip-active' : ''}`}
            >
              <span>{skill}</span>
              {isSelected && <X className="w-3 h-3 ml-1.5 opacity-60 hover:opacity-100" />}
            </button>
          );
        })}

        {/* Other / Custom Chip */}
        <button
          type="button"
          onClick={() => setShowOtherInput(prev => !prev)}
          className={`chip ${showOtherInput ? 'border-primary' : ''}`}
        >
          <Plus className="w-3 h-3 mr-1 text-muted-foreground" />
          <span>Other…</span>
        </button>
      </div>

      {/* Custom Skill Input */}
      {showOtherInput && (
        <div className="flex gap-2 mt-2 pt-2 animate-fade-in max-w-md">
          <input
            id={`${id}-custom`}
            type="text"
            className="input text-sm"
            placeholder="Type a skill and press Enter"
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomSkill();
              }
            }}
            maxLength={60}
            autoFocus
          />
          <button
            type="button"
            className="btn btn-primary text-xs px-4 shrink-0"
            onClick={addCustomSkill}
            disabled={!customValue.trim()}
          >
            Add
          </button>
          <button
            type="button"
            className="btn btn-secondary text-xs px-3 shrink-0"
            onClick={() => {
              setShowOtherInput(false);
              setCustomValue('');
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
