import { useState, useRef, useEffect } from 'react'
import { DemandForecastingWidget } from './widgets/DemandForecastingWidget'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import type { ApiResponse, ForecastRecord } from './types/apiResponse'
import { getResponseType, hasForecastData, hasRegionalAnalysis, hasAnomalies, hasLowDemandRisk } from './types/apiResponse'

// Import all JSON files
import anomalyDetectionJson from './jsonOutputs/anomaly-detection.json'
import explainForecastJson from './jsonOutputs/explain-forecast.json'
import forecastDataJson from './jsonOutputs/forecast_data.json'
import specificItemJson from './jsonOutputs/forecast-speciffic-item.json'
import lowDemandRiskJson from './jsonOutputs/low_demand_risk_items.json'
import regionalAnalysisJson from './jsonOutputs/regional-analysis.json'

interface ForecastData {
  summary: string;
  forecast_data: ForecastRecord[];
  recommendation: string;
  query_type?: string;
  reasoning_steps?: any[];
  regional_analysis?: any[];
  anomalies?: any[];
  low_demand_risk_items?: any[];
  metadata?: any;
}

// JSON files mapping
const jsonFiles = {
  'anomaly-detection': anomalyDetectionJson,
  'explain-forecast': explainForecastJson,
  'forecast-data': forecastDataJson,
  'specific-item': specificItemJson,
  'low-demand-risk': lowDemandRiskJson,
  'regional-analysis': regionalAnalysisJson,
}

type JsonFileKey = keyof typeof jsonFiles

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedJsonFile, setSelectedJsonFile] = useState<JsonFileKey>('forecast-data')
  const [forecastData, setForecastData] = useState<ForecastData>({
    summary: "",
    forecast_data: [],
    recommendation: "",
    query_type: "Top Demand Items"
  })
  const widgetRef = useRef<{ handleRefresh: () => void }>(null)
  const hasInitializedRef = useRef(false)

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  const normalizeApiResponse = (apiResponse: ApiResponse): ForecastData => {
    const responseType = getResponseType(apiResponse);
    
    // Base normalized structure
    const normalized: ForecastData = {
      summary: apiResponse.summary || "",
      forecast_data: [],
      recommendation: "",
      query_type: responseType,
      reasoning_steps: apiResponse.reasoning_steps,
      metadata: ('metadata' in apiResponse) ? apiResponse.metadata : undefined
    };

    // Handle different response types
    if (hasForecastData(apiResponse)) {
      // Top Demand Items or Explain Forecast
      normalized.forecast_data = apiResponse.results.forecast_data.map((item: any) => ({
        item: item.item || "",
        category: item.category || "",
        region: item.region || "",
        forecasted_demand: Number(item.forecasted_demand) || 0,
        on_hand_inventory: Number(item.on_hand_inventory) || 0,
        expected_inventory: Number(item.expected_inventory) || 0,
        confidence_score: Number(item.confidence_score) || 0,
        anomaly_flag: item.anomaly_flag || false,
        insight_reasoning: item.insight_reasoning || ""
      }));
      normalized.recommendation = apiResponse.results.forecast_data[0]?.recommendation || "";
    } 
    else if (hasRegionalAnalysis(apiResponse)) {
      // Regional Analysis - convert regions to forecast records
      normalized.regional_analysis = apiResponse.results.regional_analysis;
      normalized.forecast_data = apiResponse.results.regional_analysis.map((region: any) => ({
        item: region.region || "",
        category: region.country || "",
        region: region.region || "",
        forecasted_demand: Number(region.total_forecasted_demand) || 0,
        on_hand_inventory: Number(region.total_on_hand_inventory) || 0,
        expected_inventory: Number(region.total_expected_inventory) || 0,
        confidence_score: Number(region.coverage_percentage) / 100 || 0,
        anomaly_flag: Number(region.anomaly_count) > 0,
        insight_reasoning: region.top_categories?.map((c: any) => c.category).join(", ") || ""
      }));
    } 
    else if (hasAnomalies(apiResponse)) {
      // Anomaly Detection - convert anomalies to forecast records
      normalized.anomalies = apiResponse.results.anomalies;
      normalized.forecast_data = apiResponse.results.anomalies.map((anomaly: any) => ({
        item: anomaly.item || "",
        category: anomaly.category || "",
        region: anomaly.region || "",
        sku: anomaly.sku || "",
        forecasted_demand: Number(anomaly.forecasted_demand) || 0,
        on_hand_inventory: Number(anomaly.on_hand_inventory) || 0,
        expected_inventory: Number(anomaly.expected_inventory) || 0,
        confidence_score: 0.85,
        anomaly_flag: true,
        insight_reasoning: anomaly.description || anomaly.severity || ""
      }));
    } 
    else if (hasLowDemandRisk(apiResponse)) {
      // Low Demand Risk - convert risk items to forecast records
      normalized.low_demand_risk_items = apiResponse.results.low_demand_risk_items;
      normalized.forecast_data = apiResponse.results.low_demand_risk_items.map((item: any) => ({
        item: item.item || "",
        category: item.category || "",
        region: item.region || "",
        sku: item.sku || "",
        forecasted_demand: Number(item.forecasted_demand) || 0,
        on_hand_inventory: Number(item.total_inventory) || 0,
        expected_inventory: Number(item.expected_inventory) || 0,
        confidence_score: Math.max(0, Math.min(1, 1 - Number(item.risk_score) || 0)),
        anomaly_flag: item.risk_level?.toLowerCase() === 'critical',
        insight_reasoning: item.recommended_action || item.risk_level || ""
      }));
    }

    return normalized;
  };

  const fetchForecastData = async () => {
    try {
      // Load JSON from jsonOutputs folder
      const apiResponse: ApiResponse = jsonFiles[selectedJsonFile] as any;
      const normalizedData = normalizeApiResponse(apiResponse);
      setForecastData(normalizedData);
    } catch (error) {
      console.error('Error loading forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchForecastData();
    } else {
      // Reload data when selected file changes
      fetchForecastData();
    }
  }, [selectedJsonFile]);

  const handleRefresh = () => {
    setIsLoading(true)
    fetchForecastData()
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Header 
        isDarkTheme={isDarkTheme} 
        onThemeToggle={toggleTheme}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* JSON File Selector (Testing - Remove Later) */}
          <div className={`mb-6 p-4 rounded-lg border ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <label className={`block text-sm font-medium mb-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Test JSON Response:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {(Object.keys(jsonFiles) as JsonFileKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedJsonFile(key)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                    selectedJsonFile === key
                      ? 'bg-blue-600 text-white'
                      : isDarkTheme
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {key.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <DemandForecastingWidget 
            isDarkTheme={isDarkTheme} 
            ref={widgetRef}
            data={forecastData}
          />
        </div>
      </main>

      <Footer isDarkTheme={isDarkTheme} />
    </div>
  )
}

export default App