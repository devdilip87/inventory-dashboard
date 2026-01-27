import { useState, useRef, useEffect } from 'react'
import { DemandForecastingWidget } from './widgets/DemandForecastingWidget'
import { AnomalyDetectionWidget } from './components/AnomalyDetectionWidget'
import { ExplainForecastWidget } from './components/ExplainForecastWidget'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import type { ApiResponse, ForecastRecord } from './types/apiResponse'
import { getResponseType, hasForecastData, hasRegionalAnalysis, hasAnomalies, hasLowDemandRisk, isExplainForecast } from './types/apiResponse'
import { ResponseType, getResponseTypeFromUrl, ResponseTypeHeadings } from './types/responseTypes'

// Import all JSON files
import anomalyDetectionJson from './jsonOutputs/anomaly-detection.json'
import explainForecastJson from './jsonOutputs/explain-forecast.json'
import forecastDataJson from './jsonOutputs/forecast_data.json'
import specificItemJson from './jsonOutputs/forecast-speciffic-item.json'
import lowDemandRiskJson from './jsonOutputs/low_demand_risk_items.json'
import regionalAnalysisJson from './jsonOutputs/regional-analysis.json'

interface Recommendation {
  priority: string;
  action: string;
  rationale: string;
  impact: string;
  affected_items?: string[];
  affected_regions?: string[];
  affected_warehouses?: string[];
  affected_products?: number;
}

interface ForecastData {
  summary: string;
  forecast_data: ForecastRecord[];
  recommendations?: Recommendation[];
  query_type?: string;
  reasoning_steps?: any[];
  regional_analysis?: any[];
  anomalies?: any[];
  low_demand_risk_items?: any[];
  metadata?: any;
}

// JSON files mapping
const jsonFiles: Record<ResponseType, unknown> = {
  [ResponseType.ANOMALY_DETECTION]: anomalyDetectionJson,
  [ResponseType.EXPLAIN_FORECAST]: explainForecastJson,
  [ResponseType.FORECAST_DATA]: forecastDataJson,
  [ResponseType.SPECIFIC_ITEM]: specificItemJson,
  [ResponseType.LOW_DEMAND_RISK]: lowDemandRiskJson,
  [ResponseType.REGIONAL_ANALYSIS]: regionalAnalysisJson,
}

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResponseType, setSelectedResponseType] = useState<ResponseType>(getResponseTypeFromUrl)
  const [rawApiResponse, setRawApiResponse] = useState<ApiResponse | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData>({
    summary: "",
    forecast_data: [],
    recommendations: [],
    query_type: "Top Demand Items"
  })
  const widgetRef = useRef<{ handleRefresh: () => void }>(null)
  const hasInitializedRef = useRef(false)

  // Listen for URL changes (popstate event)
  useEffect(() => {
    const handleUrlChange = () => {
      setSelectedResponseType(getResponseTypeFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  const normalizeApiResponse = (apiResponse: ApiResponse): ForecastData => {
    const responseType = getResponseType(apiResponse);
    
    // Base normalized structure
    const normalized: ForecastData = {
      summary: apiResponse.summary || "",
      forecast_data: [],
      recommendations: ('recommendations' in apiResponse) ? (apiResponse as any).recommendations : [],
      query_type: responseType,
      reasoning_steps: apiResponse.reasoning_steps,
      metadata: ('metadata' in apiResponse) ? apiResponse.metadata : undefined
    };

    // Skip normalization for responses that have their own dedicated widgets
    if (hasAnomalies(apiResponse) || isExplainForecast(apiResponse)) {
      // These responses will be rendered with their dedicated components
      // So we don't need to normalize them to ForecastData format
      return normalized;
    }

    // Handle different response types
    if (hasForecastData(apiResponse) && 'forecast_data' in apiResponse.results) {
      // Top Demand Items or Specific Item
      const forecastDataArray = (apiResponse.results as any).forecast_data;
      if (Array.isArray(forecastDataArray)) {
        normalized.forecast_data = forecastDataArray.map((item: any) => ({
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
      }
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
      // Load JSON from jsonOutputs folder based on response type
      const apiResponse: ApiResponse = jsonFiles[selectedResponseType] as ApiResponse;
      setRawApiResponse(apiResponse);
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
      // Reload data when response type changes
      fetchForecastData();
    }
  }, [selectedResponseType]);

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
          {/* Response Type Heading */}
          <h1 className={`text-2xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            {ResponseTypeHeadings[selectedResponseType]}
          </h1>

          {/* Render appropriate widget based on response type from URL query param */}
          {rawApiResponse && hasAnomalies(rawApiResponse) ? (
            <AnomalyDetectionWidget
              isDarkTheme={isDarkTheme}
              ref={widgetRef}
              data={{
                summary: rawApiResponse.summary || "",
                anomalies_detected: rawApiResponse.results.anomalies_detected || [],
                recommendations: (rawApiResponse as any).recommendations,
                metadata: (rawApiResponse as any).metadata
              }}
            />
          ) : rawApiResponse && isExplainForecast(rawApiResponse) ? (
            <ExplainForecastWidget
              isDarkTheme={isDarkTheme}
              ref={widgetRef}
              data={{
                summary: rawApiResponse.summary || "",
                category_specific_insights: rawApiResponse.results.category_specific_insights || [],
                forecast_explanation: rawApiResponse.results.forecast_explanation,
                regional_forecast_summary: rawApiResponse.results.regional_forecast_summary,
                recommendations: (rawApiResponse as any).recommendations,
                metadata: (rawApiResponse as any).metadata
              }}
            />
          ) : (
            <DemandForecastingWidget 
              isDarkTheme={isDarkTheme} 
              ref={widgetRef}
              data={forecastData}
            />
          )}
        </div>
      </main>

      <Footer isDarkTheme={isDarkTheme} />
    </div>
  )
}

export default App