import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Progress component inline since it's not available
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
import { AlertTriangle, TrendingUp, TrendingDown, Shield, DollarSign, Users, Download, Activity } from 'lucide-react';

interface AnalyticsData {
  highRiskActivities: any[];
  metrics: {
    totalAnalyses: number;
    avgRiskScore: number;
    highRiskCount: number;
    complianceScore: number;
    riskTrend: string;
  };
}

export function InsuranceAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard/demo-company');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportInsuranceData = async (industryCode: string) => {
    setExporting(true);
    try {
      const response = await fetch(`/api/analytics/export/${industryCode}`);
      if (response.ok) {
        const data = await response.json();
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insurance-risk-data-${industryCode}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="insurance-analytics-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insurance Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered risk assessment data for insurance underwriting
          </p>
        </div>
        <Button 
          onClick={() => exportInsuranceData('construction')}
          disabled={exporting}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-export-data"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-analyses">
              {analyticsData?.metrics.totalAnalyses || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Safety interactions analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskScoreColor(analyticsData?.metrics.avgRiskScore || 0)}`} data-testid="text-avg-risk-score">
              {analyticsData?.metrics.avgRiskScore || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {getRiskLevel(analyticsData?.metrics.avgRiskScore || 0)} risk level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Activities</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-high-risk-count">
              {analyticsData?.metrics.highRiskCount || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Score ≥ 70 in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-compliance-score">
              {analyticsData?.metrics.complianceScore || 0}%
            </div>
            <Progress value={analyticsData?.metrics.complianceScore || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">High Risk Activities</TabsTrigger>
          <TabsTrigger value="patterns">Risk Patterns</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent High Risk Activities</CardTitle>
              <CardDescription>
                Safety interactions with risk scores ≥ 70 (last 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.highRiskActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <p>No high-risk activities detected</p>
                    <p className="text-sm">All safety interactions show good compliance</p>
                  </div>
                ) : (
                  analyticsData?.highRiskActivities.map((activity, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2" data-testid={`activity-${index}`}>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={activity.urgencyLevel === 'critical' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {activity.urgencyLevel} Risk
                        </Badge>
                        <span className={`font-bold ${getRiskScoreColor(activity.riskScore)}`}>
                          Risk Score: {activity.riskScore}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Query:</strong> {activity.query}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Type:</strong> {activity.type}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {activity.safetyCategories?.slice(0, 3).map((category: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis Patterns</CardTitle>
              <CardDescription>
                Insurance-relevant behavioral and compliance patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Risk Trend Analysis</h4>
                  <div className="flex items-center space-x-2">
                    {analyticsData?.metrics.riskTrend === 'declining' ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    )}
                    <span className="capitalize">{analyticsData?.metrics.riskTrend || 'stable'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Insurance Factors</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Premium Risk Factor</span>
                      <span className="font-mono">
                        {analyticsData?.metrics.avgRiskScore ? 
                          (1.0 + (analyticsData.metrics.avgRiskScore - 50) / 100).toFixed(2) : 
                          '1.00'
                        }x
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incident Likelihood</span>
                      <span className="font-mono">
                        {Math.round((analyticsData?.metrics.avgRiskScore || 25) / 4)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export for Insurance Companies</CardTitle>
              <CardDescription>
                Anonymized risk assessment data for actuarial analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Available Data Sets</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Risk behavior patterns</li>
                    <li>• Safety compliance scores</li>
                    <li>• Incident prediction metrics</li>
                    <li>• Department-level risk analysis</li>
                    <li>• Training effectiveness data</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Export Options</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => exportInsuranceData('construction')}
                      variant="outline"
                      className="w-full justify-start"
                      disabled={exporting}
                      data-testid="button-export-construction"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Construction Industry Data
                    </Button>
                    <Button 
                      onClick={() => exportInsuranceData('manufacturing')}
                      variant="outline"
                      className="w-full justify-start"
                      disabled={exporting}
                      data-testid="button-export-manufacturing"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manufacturing Data
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Data Privacy</h5>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  All exported data is anonymized and aggregated. No personally identifiable information 
                  is included. Data complies with privacy regulations and industry standards.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}