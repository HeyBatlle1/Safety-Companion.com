import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Checkbox component removed - using custom implementation
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Calendar, Download, FileText, TrendingUp, AlertTriangle, Shield, DollarSign, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Progress component inline since it's not available
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

interface PatternAnalysis {
  analysisId: string;
  timeframe: string;
  totalRecords: number;
  keyPatterns: {
    riskTrends: string[];
    behavioralPatterns: string[];
    complianceIssues: string[];
    departmentRisks: Array<{ department: string; riskLevel: string; issues: string[] }>;
    seasonalTrends: string[];
    emergingRisks: string[];
  };
  riskMetrics: {
    avgRiskScore: number;
    riskTrend: 'improving' | 'stable' | 'declining';
    highRiskPercentage: number;
    complianceScore: number;
    predictedIncidents: number;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    trainingNeeds: string[];
  };
  actuarialData: {
    premiumRiskFactor: number;
    claimsLikelihood: number;
    costProjections: {
      expectedClaims: number;
      preventionInvestment: number;
      netSavings: number;
    };
  };
  exportTimestamp: string;
}

interface AnalysisRecord {
  id: string;
  createdAt: string;
  query: string;
  response: string;
  type: string;
  riskScore?: number;
  sentimentScore?: number;
  urgencyLevel?: string;
  safetyCategories?: string[];
  keywordTags?: string[];
  confidenceScore?: number;
  behaviorIndicators?: string[];
  complianceScore?: number;
  metadata?: any;
}

export const PatternAnalysisPage: React.FC = () => {
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'annual'>('quarterly');
  
  // Load analysis history
  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch('/api/analysis-history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const handleRecordSelect = (recordId: string, selected: boolean) => {
    if (selected) {
      setSelectedRecords(prev => [...prev, recordId]);
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
    }
  };

  const selectAllRecords = () => {
    setSelectedRecords(analysisHistory.map(record => record.id));
  };

  const clearSelection = () => {
    setSelectedRecords([]);
  };

  const analyzePatterns = async () => {
    if (selectedRecords.length === 0) {
      alert('Please select at least one analysis record');
      return;
    }

    setLoading(true);
    try {
      const selectedData = analysisHistory.filter(record => 
        selectedRecords.includes(record.id)
      );

      const response = await fetch('/api/analytics/pattern-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          records: selectedData,
          timeframe,
          analysisType: 'comprehensive'
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setPatternAnalysis(analysis);
      } else {
        alert('Pattern analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Pattern analysis error:', error);
      alert('Pattern analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!patternAnalysis) return;

    const dataStr = JSON.stringify(patternAnalysis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pattern_analysis_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Big Picture Pattern Analysis
            </h1>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Analyze multiple historical records to identify quarterly, monthly, or annual safety patterns for actuarial and safety purposes.
          </p>
        </div>

        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger value="selection" className="data-[state=active]:bg-blue-600">
              Data Selection
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600">
              Pattern Analysis
            </TabsTrigger>
          </TabsList>

          {/* Data Selection Tab */}
          <TabsContent value="selection" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Select Analysis Records</span>
                </CardTitle>
                <CardDescription>
                  Choose multiple analysis records to identify patterns and trends across time periods.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                      <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="monthly">Monthly Analysis</SelectItem>
                        <SelectItem value="quarterly">Quarterly Analysis</SelectItem>
                        <SelectItem value="annual">Annual Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {selectedRecords.length} of {analysisHistory.length} selected
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllRecords}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSelection}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Analysis Records List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analysisHistory.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700 border border-slate-600"
                    >
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleRecordSelect(record.id, !selectedRecords.includes(record.id))}
                      >
                        {selectedRecords.includes(record.id) ? (
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-500 rounded" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white truncate">
                            {record.query || 'Analysis Record'}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {record.type}
                            </Badge>
                            {record.riskScore && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRiskColor(record.riskScore)}`}
                              >
                                Risk: {record.riskScore}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Analysis Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={analyzePatterns}
                    disabled={loading || selectedRecords.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {loading ? 'Analyzing Patterns...' : `Analyze ${selectedRecords.length} Records`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pattern Analysis Results Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {patternAnalysis ? (
              <>
                {/* Analysis Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm text-gray-400">Avg Risk Score</p>
                          <p className={`text-lg font-bold ${getRiskColor(patternAnalysis.riskMetrics.avgRiskScore)}`}>
                            {patternAnalysis.riskMetrics.avgRiskScore}/100
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(patternAnalysis.riskMetrics.riskTrend)}
                        <div>
                          <p className="text-sm text-gray-400">Risk Trend</p>
                          <p className="text-lg font-bold text-white capitalize">
                            {patternAnalysis.riskMetrics.riskTrend}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-sm text-gray-400">High Risk %</p>
                          <p className="text-lg font-bold text-yellow-400">
                            {patternAnalysis.riskMetrics.highRiskPercentage}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-400">Expected Claims</p>
                          <p className="text-lg font-bold text-green-400">
                            ${patternAnalysis.actuarialData.costProjections.expectedClaims.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Patterns */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Key Patterns Identified</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Risk Trends</h4>
                        <ul className="space-y-1">
                          {patternAnalysis.keyPatterns.riskTrends.map((trend, index) => (
                            <li key={index} className="text-sm text-gray-300">• {trend}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Behavioral Patterns</h4>
                        <ul className="space-y-1">
                          {patternAnalysis.keyPatterns.behavioralPatterns.map((pattern, index) => (
                            <li key={index} className="text-sm text-gray-300">• {pattern}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2">Emerging Risks</h4>
                        <ul className="space-y-1">
                          {patternAnalysis.keyPatterns.emergingRisks.map((risk, index) => (
                            <li key={index} className="text-sm text-gray-300">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Actionable Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2">Immediate Actions</h4>
                        <ul className="space-y-1">
                          {patternAnalysis.recommendations.immediate.map((action, index) => (
                            <li key={index} className="text-sm text-gray-300">• {action}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Short-term Strategy</h4>
                        <ul className="space-y-1">
                          {patternAnalysis.recommendations.shortTerm.map((strategy, index) => (
                            <li key={index} className="text-sm text-gray-300">• {strategy}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Training Needs</h4>
                        <ul className="space-y-1">
                          {patternAnalysis.recommendations.trainingNeeds.map((need, index) => (
                            <li key={index} className="text-sm text-gray-300">• {need}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actuarial Data */}
                  <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>Insurance & Actuarial Data</span>
                        <Button 
                          onClick={exportAnalysis}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Analysis
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-green-400 mb-3">Premium Risk Factor</h4>
                          <div className="text-2xl font-bold text-white mb-2">
                            {patternAnalysis.actuarialData.premiumRiskFactor.toFixed(2)}x
                          </div>
                          <Progress 
                            value={(patternAnalysis.actuarialData.premiumRiskFactor - 0.5) * 50} 
                            className="mb-2"
                          />
                          <p className="text-xs text-gray-400">Industry standard multiplier</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-3">Claims Likelihood</h4>
                          <div className="text-2xl font-bold text-white mb-2">
                            {patternAnalysis.actuarialData.claimsLikelihood}%
                          </div>
                          <Progress value={patternAnalysis.actuarialData.claimsLikelihood} className="mb-2" />
                          <p className="text-xs text-gray-400">Probability of incident claims</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-blue-400 mb-3">Net Prevention Savings</h4>
                          <div className="text-2xl font-bold text-white mb-2">
                            ${patternAnalysis.actuarialData.costProjections.netSavings.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>Expected Claims: ${patternAnalysis.actuarialData.costProjections.expectedClaims.toLocaleString()}</div>
                            <div>Prevention Cost: ${patternAnalysis.actuarialData.costProjections.preventionInvestment.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Analysis Results</h3>
                  <p className="text-gray-400 mb-4">
                    Select analysis records and run pattern analysis to see comprehensive insights.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setPatternAnalysis(null)}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    Go to Data Selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default PatternAnalysisPage;