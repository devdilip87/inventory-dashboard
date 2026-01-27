import { useState, useRef, useEffect, useCallback } from 'react'
import { DemandForecastingWidget } from './widgets/DemandForecastingWidget'
import { AnomalyDetectionWidget } from './components/AnomalyDetectionWidget'
import { ExplainForecastWidget } from './components/ExplainForecastWidget'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import type { ApiResponse, ForecastRecord } from './types/apiResponse'
import { getResponseType, hasForecastData, hasRegionalAnalysis, hasAnomalies, hasLowDemandRisk, isExplainForecast } from './types/apiResponse'
import { ResponseTypeHeadings, getResponseTypeFromUrl } from './types/responseTypes'
import { supabase } from './lib/supabase'

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

interface SavedResponse {
  id: string
  created_at: string
  agent_response: ApiResponse
}

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [rawApiResponse, setRawApiResponse] = useState<ApiResponse | null>(null)
  const [selectedQueryType, setSelectedQueryType] = useState<string>(getResponseTypeFromUrl)
  const [forecastData, setForecastData] = useState<ForecastData>({
    summary: "",
    forecast_data: [],
    recommendations: [],
    query_type: "Top Demand Items"
  })
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
  const [selectedResponseId, setSelectedResponseId] = useState<string>("")
  const widgetRef = useRef<{ handleRefresh: () => void }>(null)

  // Listen for URL changes (popstate event)
  useEffect(() => {
    const handleUrlChange = () => {
      const newQueryType = getResponseTypeFromUrl();
      setSelectedQueryType(newQueryType);
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  const getTimeAgoString = (date: Date | null): string => {
    if (!date) return "Never"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  // Get the heading based on the current query type from URL
  const getResponseHeading = (): string => {
    const enumValue = selectedQueryType as keyof typeof ResponseTypeHeadings;
    return ResponseTypeHeadings[enumValue] || 'Top Demand Items';
  }

  const normalizeApiResponse = (apiResponse: ApiResponse): ForecastData => {
    const responseType = getResponseType(apiResponse);

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
      return normalized;
    }

    // Handle different response types
    if (hasForecastData(apiResponse) && 'forecast_data' in apiResponse.results) {
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

  const loadResponseData = useCallback((response: SavedResponse) => {
    setLastFetchTime(new Date(response.created_at));

    try {
      const apiResponse: ApiResponse = response.agent_response;
      setRawApiResponse(apiResponse);
      const normalizedData = normalizeApiResponse(apiResponse);
      setForecastData(normalizedData);
    } catch (error) {
      console.error('Error normalizing response data:', error);
      setRawApiResponse(null);
      setForecastData({
        summary: "Error loading data",
        forecast_data: [],
        recommendations: [],
        query_type: "Error"
      });
    }
  }, []);

  const fetchLastResponses = async (queryType: string) => {
    try {
      const { data } = await supabase
        .from('demandForecastByCategory')
        .select('id, created_at, agent_response')
        .eq('query_type', queryType)
        .order('created_at', { ascending: false })
        .limit(4);

      if (data && data.length > 0) {
        setSavedResponses(data as SavedResponse[]);
        setSelectedResponseId(data[0].id);
      } else {
        // No data found for this query type
        setSavedResponses([]);
        setSelectedResponseId("");
        setRawApiResponse(null);
        setForecastData({
          summary: `No data available for ${queryType}`,
          forecast_data: [],
          recommendations: [],
          query_type: queryType
        });
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseSelect = (responseId: string) => {
    setSelectedResponseId(responseId);
  };

  // Load data when selectedResponseId changes
  useEffect(() => {
    if (selectedResponseId && savedResponses.length > 0) {
      const selected = savedResponses.find(r => String(r.id) === String(selectedResponseId));
      if (selected) {
        loadResponseData(selected);
      }
    }
  }, [selectedResponseId, savedResponses, loadResponseData]);

  // Fetch data on initial load and when query type changes
  useEffect(() => {
    setIsLoading(true);
    setSavedResponses([]);
    setSelectedResponseId("");
    fetchLastResponses(selectedQueryType);
  }, [selectedQueryType]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchTime) {
        setLastFetchTime(new Date(lastFetchTime));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastFetchTime]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchLastResponses(selectedQueryType);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Header
        isDarkTheme={isDarkTheme}
        onThemeToggle={toggleTheme}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <div className={`px-4 py-4 border-b ${isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {lastFetchTime && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Records generated <span className={`font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-900'}`}>{getTimeAgoString(lastFetchTime)}</span>
                </span>
              </div>
            )}

            {savedResponses.length > 0 && (
              <div className="flex items-center gap-3">
                <label className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>
                  Recent Responses:
                </label>
                <select
                  value={selectedResponseId}
                  onChange={(e) => handleResponseSelect(e.target.value)}
                  className={`px-3 py-2 rounded border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkTheme
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {savedResponses.map((response, index) => (
                    <option key={response.id} value={response.id}>
                      {index === 0 ? '★ Latest ' : `Response ${index + 1} `}
                      ({new Date(response.created_at).toLocaleDateString()} {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Response Type Heading */}
          <h1 className={`text-2xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            {getResponseHeading()}
          </h1>

          {/* Render appropriate widget based on response type */}
          {rawApiResponse && hasAnomalies(rawApiResponse) ? (
            <AnomalyDetectionWidget
              key={`anomaly-${selectedResponseId}`}
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
              key={`explain-${selectedResponseId}`}
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
              key={`demand-${selectedResponseId}`}
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
