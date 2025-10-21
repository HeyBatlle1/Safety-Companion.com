import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Wind, Users, AlertTriangle, TrendingUp, TrendingDown, Minus, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/common/ToastContainer';

interface JHAUpdateFormProps {
  baselineAnalysisId: string;
  onUpdateComplete: (comparisonResult: any) => void;
  onCancel: () => void;
}

export function JHAUpdateForm({ baselineAnalysisId, onUpdateComplete, onCancel }: JHAUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [changedCategories, setChangedCategories] = useState<string[]>([]);
  const [newWindSpeed, setNewWindSpeed] = useState('');
  const [newCrewMembers, setNewCrewMembers] = useState('');
  const [newHazards, setNewHazards] = useState('');
  const [riskAssessment, setRiskAssessment] = useState<'safer' | 'same' | 'riskier'>('same');

  const handleCategoryToggle = (category: string) => {
    setChangedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (changedCategories.length === 0) {
      showToast('Please select at least one category that changed.', 'error');
      return;
    }

    if (changedCategories.includes('weather') && !newWindSpeed) {
      showToast('Please provide current wind speed for weather changes.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get Supabase token
      const token = sessionStorage.getItem('supabase_token');
      
      const response = await fetch('/api/jha-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          baselineAnalysisId,
          changedCategories,
          newWindSpeed: changedCategories.includes('weather') ? newWindSpeed : undefined,
          newCrewMembers: changedCategories.includes('personnel') && newCrewMembers
            ? newCrewMembers.split('\n').filter(Boolean)
            : undefined,
          newHazards: changedCategories.includes('hazards') && newHazards
            ? newHazards.split('\n').filter(Boolean)
            : undefined,
          riskAssessment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process update');
      }

      const result = await response.json();

      showToast(`JHA comparison analysis completed. Decision: ${result.goNoGoDecision?.toUpperCase() || 'REVIEW'}`, 'success');

      onUpdateComplete(result);

    } catch (error) {
      console.error('Update error:', error);
      showToast(error instanceof Error ? error.message : 'Update failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <RefreshCw className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Create Daily Update</h2>
          <p className="text-sm text-gray-400">Update baseline JHA with current conditions</p>
        </div>
      </div>

      {/* Question 1: What Changed? */}
      <div className="space-y-3">
        <Label className="text-white text-base font-medium">
          1. What changed since the baseline JHA?
        </Label>
        <div className="space-y-2 pl-4">
          {[
            { id: 'weather', label: 'Weather Conditions', icon: Wind },
            { id: 'personnel', label: 'Crew/Personnel', icon: Users },
            { id: 'hazards', label: 'New Hazards Discovered', icon: AlertTriangle },
            { id: 'equipment', label: 'Equipment Changes', icon: RefreshCw },
          ].map(({ id, label, icon: Icon }) => (
            <div key={id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={id}
                checked={changedCategories.includes(id)}
                onChange={() => handleCategoryToggle(id)}
                className="w-4 h-4 rounded border-gray-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                data-testid={`checkbox-change-${id}`}
              />
              <label
                htmlFor={id}
                className="flex items-center space-x-2 text-gray-300 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Question 2: New Wind Speed (conditional) */}
      {changedCategories.includes('weather') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="windSpeed" className="text-white text-base font-medium">
            2. Current wind speed?
          </Label>
          <Input
            id="windSpeed"
            value={newWindSpeed}
            onChange={(e) => setNewWindSpeed(e.target.value)}
            placeholder="e.g., 15 mph, gusting to 22 mph"
            className="bg-slate-700/50 border-blue-500/30 text-white"
            data-testid="input-wind-speed"
          />
          <p className="text-xs text-gray-400">Provide current wind conditions and any gusts</p>
        </motion.div>
      )}

      {/* Question 3: New Crew (conditional) */}
      {changedCategories.includes('personnel') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="crew" className="text-white text-base font-medium">
            3. New crew members or changes?
          </Label>
          <Textarea
            id="crew"
            value={newCrewMembers}
            onChange={(e) => setNewCrewMembers(e.target.value)}
            placeholder="List new crew members (one per line)&#10;Example:&#10;John Doe - Foreman (replaced Mike)&#10;Jane Smith - Glazier (new)"
            className="bg-slate-700/50 border-blue-500/30 text-white min-h-[100px]"
            data-testid="textarea-crew-changes"
          />
          <p className="text-xs text-gray-400">List each crew change on a new line</p>
        </motion.div>
      )}

      {/* Question 4: New Hazards (conditional) */}
      {changedCategories.includes('hazards') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="hazards" className="text-white text-base font-medium">
            4. New hazards discovered?
          </Label>
          <Textarea
            id="hazards"
            value={newHazards}
            onChange={(e) => setNewHazards(e.target.value)}
            placeholder="Describe new hazards (one per line)&#10;Example:&#10;Icy walkway on north side&#10;Loose scaffold board on level 3&#10;Power line closer than anticipated"
            className="bg-slate-700/50 border-blue-500/30 text-white min-h-[100px]"
            data-testid="textarea-new-hazards"
          />
          <p className="text-xs text-gray-400">Describe each hazard clearly on a new line</p>
        </motion.div>
      )}

      {/* Question 5: Risk Assessment (always shown) */}
      <div className="space-y-3">
        <Label className="text-white text-base font-medium">
          5. Your gut check: Is the site safer, same, or riskier than baseline?
        </Label>
        <div className="space-y-2 pl-4">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              value="safer"
              id="safer"
              checked={riskAssessment === 'safer'}
              onChange={(e) => setRiskAssessment(e.target.value as any)}
              className="w-4 h-4 border-gray-600 bg-slate-700 text-green-600 focus:ring-2 focus:ring-green-500"
              data-testid="radio-safer"
            />
            <label
              htmlFor="safer"
              className="flex items-center space-x-2 text-gray-300 cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 text-green-400" />
              <span>Safer - Conditions improved</span>
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              value="same"
              id="same"
              checked={riskAssessment === 'same'}
              onChange={(e) => setRiskAssessment(e.target.value as any)}
              className="w-4 h-4 border-gray-600 bg-slate-700 text-yellow-600 focus:ring-2 focus:ring-yellow-500"
              data-testid="radio-same"
            />
            <label
              htmlFor="same"
              className="flex items-center space-x-2 text-gray-300 cursor-pointer"
            >
              <Minus className="w-4 h-4 text-yellow-400" />
              <span>Same - No significant change</span>
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              value="riskier"
              id="riskier"
              checked={riskAssessment === 'riskier'}
              onChange={(e) => setRiskAssessment(e.target.value as any)}
              className="w-4 h-4 border-gray-600 bg-slate-700 text-red-600 focus:ring-2 focus:ring-red-500"
              data-testid="radio-riskier"
            />
            <label
              htmlFor="riskier"
              className="flex items-center space-x-2 text-gray-300 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span>Riskier - Conditions worsened</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-blue-500/20">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || changedCategories.length === 0}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          data-testid="button-submit-update"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Running Analysis...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Update Analysis
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
