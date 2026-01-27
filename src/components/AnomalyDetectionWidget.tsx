import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

interface AnomalyItem {
  anomaly_id?: string;
  sku: string;
  item: string;  // JSON uses 'item' not 'item_name'
  item_name?: string;  // Keep for backwards compatibility
  category: string;
  region: string;
  severity: string;  // JSON uses string like "Critical", "High", "Medium", "Low"
  severity_score?: number;  // Optional numeric score
  confidence_score?: number;
  anomaly_type: string;
  warehouse_impact?: {
    warehouse_id: string;
    on_hand_inventory: number;
    expected_inventory: number;
    distribution_variance?: number;
  }[];
  inventory_gap?: number;
  forecasted_demand?: number;
  total_on_hand_inventory?: number;
  total_expected_inventory?: number;
  on_hand_inventory?: number;
  expected_inventory?: number;
  anomaly_description?: string;  // JSON uses this
  explanation?: string;  // Keep for backwards compatibility
  potential_causes?: string[];
  recommendation?: string;
}

interface AnomalyDetectionWidgetProps {
  isDarkTheme: boolean;
  data: {
    summary: string;
    anomalies_detected: AnomalyItem[];
    recommendations?: string[];
    metadata?: any;
  };
}

const getSeverityColor = (severity: string | number) => {
  // Handle both string severity and numeric score
  const severityStr = typeof severity === 'string' ? severity.toLowerCase() :
    (severity >= 0.8 ? 'critical' : severity >= 0.6 ? 'high' : severity >= 0.4 ? 'medium' : 'low');

  const colors: { [key: string]: string } = {
    'critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-green-100 text-green-800'
  };
  return colors[severityStr] || 'bg-gray-100 text-gray-800';
};

const getSeverityLabel = (severity: string | number) => {
  if (typeof severity === 'string') return severity;
  if (severity >= 0.8) return 'Critical';
  if (severity >= 0.6) return 'High';
  if (severity >= 0.4) return 'Medium';
  return 'Low';
};

const getAnomalyTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'Demand Spike': 'bg-purple-100 text-purple-800',
    'Inventory Mismatch': 'bg-blue-100 text-blue-800',
    'Distribution Anomaly': 'bg-indigo-100 text-indigo-800',
    'Pricing Inconsistency': 'bg-pink-100 text-pink-800',
    'Stockout Risk': 'bg-red-100 text-red-800',
    'Overstock': 'bg-green-100 text-green-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const AnomalyDetectionWidget = forwardRef(function AnomalyDetectionWidget(
  { isDarkTheme, data }: AnomalyDetectionWidgetProps,
  ref
) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAnomalies, setExpandedAnomalies] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      console.log('Refreshing anomaly detection widget');
    }
  }), []);

  const toggleExpanded = (sku: string) => {
    const newExpanded = new Set(expandedAnomalies);
    if (newExpanded.has(sku)) {
      newExpanded.delete(sku);
    } else {
      newExpanded.add(sku);
    }
    setExpandedAnomalies(newExpanded);
  };

  const anomalies = data.anomalies_detected || [];
  const criticalAnomalies = anomalies.filter(a => a.severity?.toLowerCase() === 'critical');
  const highAnomalies = anomalies.filter(a => a.severity?.toLowerCase() === 'high');
  const mediumAnomalies = anomalies.filter(a => a.severity?.toLowerCase() === 'medium');

  return (
    <div className={`w-full ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 mb-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <TabsTrigger value="overview" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="critical" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            Critical ({criticalAnomalies.length})
          </TabsTrigger>
          <TabsTrigger value="high" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            High ({highAnomalies.length})
          </TabsTrigger>
          <TabsTrigger value="details" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            All Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className={`p-6 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-semibold mb-4">Anomaly Summary</h3>
            <p className={`text-sm mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              {data.summary}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Anomalies
                </p>
                <p className="text-2xl font-bold mt-2">{anomalies.length}</p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-red-300' : 'text-red-600'}`}>
                  Critical
                </p>
                <p className="text-2xl font-bold mt-2 text-red-500">{criticalAnomalies.length}</p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-orange-900 bg-opacity-30' : 'bg-orange-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-orange-300' : 'text-orange-600'}`}>
                  High
                </p>
                <p className="text-2xl font-bold mt-2 text-orange-500">{highAnomalies.length}</p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  Medium
                </p>
                <p className="text-2xl font-bold mt-2 text-yellow-500">{mediumAnomalies.length}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Critical Tab */}
        <TabsContent value="critical" className="space-y-4">
          {criticalAnomalies.length === 0 ? (
            <Card className={`p-6 text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No critical anomalies detected</p>
            </Card>
          ) : (
            criticalAnomalies.map((anomaly, idx) => (
              <AnomalyCard
                key={idx}
                anomaly={anomaly}
                isDarkTheme={isDarkTheme}
                isExpanded={expandedAnomalies.has(anomaly.sku)}
                onToggle={() => toggleExpanded(anomaly.sku)}
              />
            ))
          )}
        </TabsContent>

        {/* High Tab */}
        <TabsContent value="high" className="space-y-4">
          {highAnomalies.length === 0 ? (
            <Card className={`p-6 text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No high severity anomalies</p>
            </Card>
          ) : (
            highAnomalies.map((anomaly, idx) => (
              <AnomalyCard
                key={idx}
                anomaly={anomaly}
                isDarkTheme={isDarkTheme}
                isExpanded={expandedAnomalies.has(anomaly.sku)}
                onToggle={() => toggleExpanded(anomaly.sku)}
              />
            ))
          )}
        </TabsContent>

        {/* All Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {anomalies.map((anomaly, idx) => (
            <AnomalyCard
              key={idx}
              anomaly={anomaly}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedAnomalies.has(anomaly.sku)}
              onToggle={() => toggleExpanded(anomaly.sku)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
});

interface AnomalyCardProps {
  anomaly: AnomalyItem;
  isDarkTheme: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly, isDarkTheme, isExpanded, onToggle }) => {
  const itemName = anomaly.item || anomaly.item_name || 'Unknown Item';
  const severity = anomaly.severity || 'Medium';
  const confidenceScore = anomaly.confidence_score;
  const description = anomaly.anomaly_description || anomaly.explanation;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isDarkTheme
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{itemName}</h4>
            <span className={`text-xs px-2 py-1 rounded ${getAnomalyTypeColor(anomaly.anomaly_type)}`}>
              {anomaly.anomaly_type}
            </span>
          </div>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            SKU: {anomaly.sku} | {anomaly.category} | {anomaly.region}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {confidenceScore !== undefined && (
            <div className={`text-right mr-4`}>
              <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Confidence</p>
              <p className={`text-lg font-bold text-blue-500`}>
                {(confidenceScore * 100).toFixed(0)}%
              </p>
            </div>
          )}
          <span className={`px-3 py-1 rounded text-xs font-semibold ${getSeverityColor(severity)}`}>
            {getSeverityLabel(severity)}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
          {anomaly.inventory_gap !== undefined && (
            <div className="mb-3">
              <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Inventory Gap
              </p>
              <p className={`text-sm font-bold ${anomaly.inventory_gap < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {anomaly.inventory_gap > 0 ? '+' : ''}{anomaly.inventory_gap} units
              </p>
            </div>
          )}

          {anomaly.forecasted_demand !== undefined && (
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Forecasted Demand
                </p>
                <p className="text-sm font-bold">{anomaly.forecasted_demand?.toLocaleString()}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  On-Hand Inventory
                </p>
                <p className="text-sm font-bold">{(anomaly.total_on_hand_inventory || anomaly.on_hand_inventory)?.toLocaleString()}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Expected Inventory
                </p>
                <p className="text-sm font-bold">{(anomaly.total_expected_inventory || anomaly.expected_inventory)?.toLocaleString()}</p>
              </div>
            </div>
          )}

          {description && (
            <div className="mb-3">
              <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Description
              </p>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {description}
              </p>
            </div>
          )}

          {anomaly.potential_causes && anomaly.potential_causes.length > 0 && (
            <div className="mb-3">
              <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Potential Causes
              </p>
              <ul className={`text-sm list-disc list-inside ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {anomaly.potential_causes.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>
          )}

          {anomaly.recommendation && (
            <div className="mb-3">
              <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Recommendation
              </p>
              <p className={`text-sm ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>
                {anomaly.recommendation}
              </p>
            </div>
          )}

          {anomaly.warehouse_impact && anomaly.warehouse_impact.length > 0 && (
            <div>
              <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Warehouse Impact
              </p>
              <div className="space-y-2">
                {anomaly.warehouse_impact.map((wh, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <p className="font-semibold">{wh.warehouse_id}</p>
                    <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'}>
                      On-Hand: {wh.on_hand_inventory} | Expected: {wh.expected_inventory}
                      {wh.distribution_variance && ` | Variance: ${wh.distribution_variance.toFixed(1)}%`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

AnomalyDetectionWidget.displayName = 'AnomalyDetectionWidget';

export default AnomalyDetectionWidget;
