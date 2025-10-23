import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WindConditionsQuestion, type WindConditionsData } from '@/components/JHA/WindConditionsQuestion';
import { TemperatureQuestion, type TemperatureData } from '@/components/JHA/TemperatureQuestion';

export default function StructuredQuestionsDemo() {
  const navigate = useNavigate();

  // Wind conditions state
  const [windData, setWindData] = useState<WindConditionsData>({
    currentSpeed: '',
    forecastedGusts: '',
    source: '',
    stoppageThreshold: '20',
    monitoringPlan: []
  });

  // Temperature state
  const [tempData, setTempData] = useState<TemperatureData>({
    currentTemp: '',
    humidity: '',
    heatIndex: '',
    windChill: '',
    thermalRisk: 'none',
    precautions: [],
    fatigueIndicators: {
      waterBreakFrequency: '',
      restAreaTemp: '',
      workerFatigueLevel: ''
    }
  });

  const handleSubmit = () => {
    console.log('Wind Data:', windData);
    console.log('Temperature Data:', tempData);
    alert('Check console for structured data output!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/60 backdrop-blur-sm border-b border-blue-500/20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Structured Questions Demo</h1>
                <p className="text-sm text-gray-400">
                  Production-ready question optimization system
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Introduction */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-3">🎯 The Problem We're Solving</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-400">❌ Before (Vague)</h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-300 mb-2">Question: "Current Wind Conditions"</p>
                <textarea
                  className="w-full bg-slate-700/50 border-slate-600 text-gray-400 rounded p-2 text-sm"
                  placeholder="Enter response..."
                  disabled
                />
                <p className="text-xs text-red-300 mt-2">Worker types: "windy"</p>
                <p className="text-xs text-red-300">Agent result: Insufficient data ❌</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-400">✅ After (Structured)</h3>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-300 mb-2">Question: "Wind Conditions & Monitoring"</p>
                <div className="space-y-1 text-xs text-gray-300">
                  <p>• Current: 18 mph</p>
                  <p>• Forecast: 25 mph by 2pm</p>
                  <p>• Source: On-site anemometer</p>
                  <p>• Monitoring: Every 15 min</p>
                </div>
                <p className="text-xs text-green-300 mt-2">Agent result: Quality 9/10, Risk 68/100 ✅</p>
              </div>
            </div>
          </div>
        </div>

        {/* Q5: Wind Conditions */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Q5: Wind Conditions & Monitoring</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </h2>
            <p className="text-sm text-gray-400">Structured sub-fields, photo hints, agent context, critical warnings</p>
          </div>
          <WindConditionsQuestion data={windData} onChange={setWindData} />
        </div>

        {/* Q6: Temperature */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Q6: Temperature & Thermal Stress</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </h2>
            <p className="text-sm text-gray-400">Dynamic precautions, fatigue indicators, thermal risk assessment</p>
          </div>
          <TemperatureQuestion data={tempData} onChange={setTempData} />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setWindData({
                currentSpeed: '',
                forecastedGusts: '',
                source: '',
                stoppageThreshold: '20',
                monitoringPlan: []
              });
              setTempData({
                currentTemp: '',
                humidity: '',
                heatIndex: '',
                windChill: '',
                thermalRisk: 'none',
                precautions: [],
                fatigueIndicators: {
                  waterBreakFrequency: '',
                  restAreaTemp: '',
                  workerFatigueLevel: ''
                }
              });
            }}
            data-testid="button-reset"
          >
            Reset Form
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-submit"
          >
            View Structured Data (Console)
          </Button>
        </div>

        {/* Key Features */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">🎯 Production Features Implemented</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              '✅ Structured sub-fields (no vague text boxes)',
              '✅ Specific placeholder examples',
              '✅ Photo hints (exact shots needed)',
              '✅ Agent context notes (the "why")',
              '✅ Critical warnings (safety limits)',
              '✅ Mobile-optimized (44px touch targets)',
              '✅ Data validation (number ranges)',
              '✅ Dynamic UI (conditional sections)',
              '✅ Professional styling (enterprise-grade)',
              '✅ Reusable components (scalable pattern)'
            ].map((feature, index) => (
              <div key={index} className="text-sm text-gray-300">
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-3">📋 Next Questions to Optimize</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Q1: Project Details & Work Scope</p>
            <p>• Q2: Crew Composition & Experience</p>
            <p>• Q3: Equipment & Inspections</p>
            <p>• Q4: Site Hazards & Barricades</p>
            <p>• Q7-Q15: Remaining safety factors</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Each question follows the same 5-component framework for consistency and quality.
          </p>
        </div>
      </div>
    </div>
  );
}
