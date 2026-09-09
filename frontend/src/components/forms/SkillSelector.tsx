import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { metaApi } from '../../api/client';

interface SkillSelectorProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  optional?: boolean;
}

const OTHER = 'Other';

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export default function SkillSelector({ id, label, values, onChange, optional = true }: Readonly<SkillSelectorProps>) {
  const [skills, setSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [otherSelected, setOtherSelected] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    metaApi.options()
      .then(options => { if (mounted) setSkills(options.skills || []); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const addValue = (rawValue: string) => {
    const value = rawValue.trim().replace(/\s+/g, ' ');
    if (!value || normalize(value) === normalize(OTHER)) return;
    const canonical = skills.find(skill => normalize(skill) === normalize(value));
    const resolved = canonical || value;
    if (!values.some(existing => normalize(existing) === normalize(resolved))) {
      onChange([...values, resolved]);
    }
  };

  const handleSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelected('');
    if (value === OTHER) {
      setOtherSelected(true);
      setCustomValue('');
      return;
    }
    setOtherSelected(false);
    addValue(value);
  };

  const addCustom = () => {
    addValue(customValue);
    setCustomValue('');
    setSelected('');
    setOtherSelected(false);
  };

  return (
    <div>
      <label htmlFor={id} className="label text-xs">
        {label} {!optional && <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>}
      </label>
      <select id={id} className="input select text-sm" value={selected} onChange={handleSelection} disabled={loading}>
        <option value="">{loading ? 'Loading skills…' : 'Select a skill to add…'}</option>
        {skills.filter(skill => !values.some(value => normalize(value) === normalize(skill))).map(skill => (
          <option key={skill} value={skill}>{skill}</option>
        ))}
        <option value={OTHER}>{OTHER}</option>
      </select>
      {otherSelected && (
        <div className="flex gap-2 mt-2">
          <input
            id={`${id}-custom`}
            className="input text-sm"
            value={customValue}
            onChange={event => setCustomValue(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } }}
            placeholder="Enter a specific skill"
            maxLength={100}
          />
          <button type="button" className="btn btn-secondary text-sm shrink-0" onClick={addCustom} disabled={!customValue.trim()}>
            Add
          </button>
        </div>
      )}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {values.map(value => (
            <span key={value} className="badge badge-primary">
              {value}
              <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter(item => item !== value))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
