import { forwardRef, useImperativeHandle, useState } from 'react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface ForecastRecord {
  item: string;
  category?: string;
  region: string;
  forecasted_demand: number;
  on_hand_inventory: number;
  expected_inventory: number;
  confidence_score: number;
  anomaly_flag?: boolean;
  insight_reasoning?: string;
  sku?: string;
}

interface DemandForecastingWidgetProps {
  isDarkTheme: boolean;
  data: {
    summary: string;
    forecast_data: ForecastRecord[];
    recommendation: string;
    query_type?: string;
    reasoning_steps?: any[];
    regional_analysis?: any[];
    anomalies?: any[];
    low_demand_risk_items?: any[];
    metadata?: any;
  };
}

const getConfidenceColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-500'
  if (score >= 0.6) return 'text-yellow-500'
  return 'text-red-500'
}

const getInventoryStatus = (on_hand: number, expected: number): string => {
  if (on_hand >= expected * 0.9) return 'Adequate'
  if (on_hand >= expected * 0.5) return 'Low'
  return 'Critical'
}

export const DemandForecastingWidget = forwardRef<
  { handleRefresh: () => void },
  DemandForecastingWidgetProps
>(({ isDarkTheme, data }, ref) => {
  const [activeTab, setActiveTab] = useState('summary')

  useImperativeHandle(ref, () => ({
    handleRefresh: () => window.location.reload(),
  }))

  const bgClass = isDarkTheme ? 'bg-gray-900' : 'bg-white'
  const textClass = isDarkTheme ? 'text-gray-100' : 'text-gray-900'
  const borderClass = isDarkTheme ? 'border-gray-700' : 'border-gray-200'

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'charts', label: 'Charts', icon: '📈' },
    { id: 'regional', label: 'Regional Analysis', icon: '🗺️' },
    { id: 'details', label: 'Details', icon: '📋' },
    { id: 'stats', label: 'Stats', icon: '📉' },
  ]

  return (
    <div className="space-y-6">
      {/* Response Type Badge */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${textClass}`}>Demand Forecast</h2>
        <Badge className={isDarkTheme ? 'bg-purple-900 text-purple-100' : 'bg-purple-100 text-purple-900'}>
          {data.query_type || 'Top Demand Items'}
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className={`flex flex-wrap gap-2 border-b ${borderClass} pb-4`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? isDarkTheme
                  ? 'bg-blue-900 text-blue-100'
                  : 'bg-blue-100 text-blue-900'
                : isDarkTheme
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <h3 className={`text-lg font-semibold mb-2 ${textClass}`}>Overview</h3>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>{data.summary}</p>
            </Card>

            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <h3 className={`text-lg font-semibold mb-2 ${textClass}`}>Recommendation</h3>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>{data.recommendation}</p>
            </Card>

            {data.reasoning_steps && data.reasoning_steps.length > 0 && (
              <Card className={`p-6 ${bgClass} border ${borderClass}`}>
                <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Reasoning Steps</h3>
                <ol className="space-y-2">
                  {data.reasoning_steps.map((step: any, index: number) => (
                    <li key={index} className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-semibold">{index + 1}.</span> {step.description || step}
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Demand Distribution</h3>
              <div className="h-48 flex items-end justify-around gap-2">
                {data.forecast_data.slice(0, 5).map((record, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-blue-500 rounded-t"
                      style={{
                        width: '40px',
                        height: `${Math.max(20, (record.forecasted_demand / 1000) * 150)}px`,
                      }}
                    />
                    <span className={`text-xs text-center ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
                      {record.item.substring(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Inventory Status</h3>
              <div className="space-y-3">
                {data.forecast_data.slice(0, 5).map((record, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        {record.item.substring(0, 15)}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          getInventoryStatus(record.on_hand_inventory, record.expected_inventory) === 'Adequate'
                            ? 'text-green-500'
                            : getInventoryStatus(record.on_hand_inventory, record.expected_inventory) === 'Low'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {getInventoryStatus(record.on_hand_inventory, record.expected_inventory)}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      <div
                        className="h-full rounded bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{
                          width: `${Math.min(100, (record.on_hand_inventory / record.expected_inventory) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Regional Analysis Tab */}
        {activeTab === 'regional' && (
          <Card className={`p-6 ${bgClass} border ${borderClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Regional Breakdown</h3>
            {data.regional_analysis && data.regional_analysis.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkTheme ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Region</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total Demand</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Coverage</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Anomalies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regional_analysis.map((region: any, idx: number) => (
                      <tr key={idx} className={isDarkTheme ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                        <td className={`py-2 ${textClass}`}>{region.region}</td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {region.total_forecasted_demand?.toLocaleString()}
                        </td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {region.coverage_percentage?.toFixed(1)}%
                        </td>
                        <td className={`py-2 ${region.anomaly_count > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {region.anomaly_count || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No regional data available</p>
            )}
          </Card>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <Card className={`p-6 ${bgClass} border ${borderClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Forecast Details</h3>
            {data.forecast_data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkTheme ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Item</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Category</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Region</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Forecasted</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>On Hand</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Expected</th>
                      <th className={`text-left py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast_data.map((record, idx) => (
                      <tr key={idx} className={isDarkTheme ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                        <td className={`py-2 ${textClass}`}>{record.item}</td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{record.category || '-'}</td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{record.region}</td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {record.forecasted_demand?.toLocaleString()}
                        </td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {record.on_hand_inventory?.toLocaleString()}
                        </td>
                        <td className={`py-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {record.expected_inventory?.toLocaleString()}
                        </td>
                        <td className={`py-2 font-semibold ${getConfidenceColor(record.confidence_score)}`}>
                          {(record.confidence_score * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No forecast data available</p>
            )}
          </Card>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Total Items</p>
              <p className={`text-3xl font-bold ${textClass}`}>{data.forecast_data.length}</p>
            </Card>

            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Total Demand</p>
              <p className={`text-3xl font-bold ${textClass}`}>
                {(data.forecast_data.reduce((sum, r) => sum + r.forecasted_demand, 0) / 1000).toFixed(1)}K
              </p>
            </Card>

            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Avg Confidence</p>
              <p className={`text-3xl font-bold text-blue-500`}>
                {(
                  (data.forecast_data.reduce((sum, r) => sum + r.confidence_score, 0) /
                    data.forecast_data.length) *
                  100
                ).toFixed(0)}%
              </p>
            </Card>

            <Card className={`p-6 ${bgClass} border ${borderClass}`}>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Anomalies</p>
              <p className={`text-3xl font-bold ${data.forecast_data.filter(r => r.anomaly_flag).length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {data.forecast_data.filter(r => r.anomaly_flag).length}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
})

DemandForecastingWidget.displayName = 'DemandForecastingWidget'
