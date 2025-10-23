import { Camera, Lightbulb, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PhotoHintsProps {
  hints: string[];
}

export function PhotoHints({ hints }: PhotoHintsProps) {
  return (
    <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
      <div className="flex items-start space-x-2 mb-2">
        <Camera className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-blue-300">Helpful Photos:</p>
      </div>
      <ul className="space-y-1 ml-6">
        {hints.map((hint, index) => (
          <li key={index} className="text-xs text-gray-400 flex items-start">
            <span className="text-blue-400 mr-2">✓</span>
            <span>{hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AgentNoteProps {
  children: React.ReactNode;
}

export function AgentNote({ children }: AgentNoteProps) {
  return (
    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div className="flex items-start space-x-2">
        <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-300">
          <span className="font-semibold">Agent Note:</span> {children}
        </p>
      </div>
    </div>
  );
}

interface CriticalWarningProps {
  children: React.ReactNode;
}

export function CriticalWarning({ children }: CriticalWarningProps) {
  return (
    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start space-x-2">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-300 mb-1">🚨 CRITICAL</p>
          <p className="text-sm text-red-200">{children}</p>
        </div>
      </div>
    </div>
  );
}

interface StructuredNumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  hint?: string;
  required?: boolean;
  testId?: string;
}

export function StructuredNumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  min,
  max,
  hint,
  required,
  testId
}: StructuredNumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-white text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className="bg-slate-700/50 border-blue-500/30 text-white"
          data-testid={testId}
        />
        {unit && <span className="text-gray-400 text-sm min-w-fit">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

interface StructuredSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  testId?: string;
}

export function StructuredSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  required,
  testId
}: StructuredSelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-white text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className="bg-slate-700/50 border-blue-500/30 text-white"
          data-testid={testId}
        >
          <SelectValue placeholder={placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-blue-500/30">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="text-white hover:bg-slate-700"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

interface StructuredCheckboxGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  required?: boolean;
}

export function StructuredCheckboxGroup({
  label,
  options,
  selectedValues,
  onChange,
  hint,
  required
}: StructuredCheckboxGroupProps) {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-white text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <div className="space-y-2 pl-1">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2 min-h-[44px]">
            <input
              type="checkbox"
              id={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="w-5 h-5 rounded border-gray-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
              data-testid={`checkbox-${option.value}`}
            />
            <label 
              htmlFor={option.value}
              className="text-sm text-gray-300 cursor-pointer py-2"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
