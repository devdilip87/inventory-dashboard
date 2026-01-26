import { useState, useRef, useEffect, useCallback } from 'react'
import { DemandForecastingWidget } from './widgets/DemandForecastingWidget'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { supabase } from './lib/supabase'
import type { ApiResponse, ForecastRecord } from './types/apiResponse'
import { getResponseType, hasForecastData, hasRegionalAnalysis, hasAnomalies, hasLowDemandRisk } from './types/apiResponse'

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

interface SavedResponse {
  id: string
  created_at: string
  agent_response: ApiResponse
}

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData>({
    summary: "",
    forecast_data: [],
    recommendation: "",
    query_type: "Top Demand Items"
  })
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
  const [selectedResponseId, setSelectedResponseId] = useState<string>("")
  const widgetRef = useRef<{ handleRefresh: () => void }>(null)
  const hasInitializedRef = useRef(false)

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

  const normalizeApiResponse = (apiResponse: ApiResponse): ForecastData => {
    const responseType = getResponseType(apiResponse);
    
    const normalized: ForecastData = {
      summary: apiResponse.summary || "",
      forecast_data: [],
      recommendation: "",
      query_type: responseType,
      reasoning_steps: apiResponse.reasoning_steps,
      metadata: ('metadata' in apiResponse) ? apiResponse.metadata : undefined
    };

    if (hasForecastData(apiResponse)) {
      normalized.forecast_data = apiResponse.results.forecast_data;
      normalized.recommendation = apiResponse.results.forecast_data[0]?.recommendation || "";
    } 
    else if (hasRegionalAnalysis(apiResponse)) {
      normalized.regional_analysis = apiResponse.results.regional_analysis;
      normalized.forecast_data = apiResponse.results.regional_analysis.map((region: any) => ({
        item: region.region,
        category: region.country,
        region: region.region,
        forecasted_demand: region.total_forecasted_demand,
        on_hand_inventory: region.total_on_hand_inventory,
        expected_inventory: region.total_expected_inventory,
        confidence_score: region.coverage_percentage / 100,
        anomaly_flag: region.anomaly_count > 0
      })) as ForecastRecord[];
    } 
    else if (hasAnomalies(apiResponse)) {
      normalized.anomalies = apiResponse.results.anomalies;
      normalized.forecast_data = apiResponse.results.anomalies.map((anomaly: any) => ({
        item: anomaly.item,
        category: anomaly.category,
        region: anomaly.region,
        sku: anomaly.sku,
        forecasted_demand: anomaly.forecasted_demand,
        on_hand_inventory: anomaly.on_hand_inventory,
        expected_inventory: anomaly.expected_inventory,
        confidence_score: 0.85,
        anomaly_flag: true,
        insight_reasoning: anomaly.description
      })) as ForecastRecord[];
    } 
    else if (hasLowDemandRisk(apiResponse)) {
      normalized.low_demand_risk_items = apiResponse.results.low_demand_risk_items;
      normalized.forecast_data = apiResponse.results.low_demand_risk_items.map((item: any) => ({
        item: item.item,
        category: item.category,
        region: item.region,
        sku: item.sku,
        forecasted_demand: item.forecasted_demand,
        on_hand_inventory: item.total_inventory,
        expected_inventory: item.expected_inventory,
        confidence_score: 1 - item.risk_score,
        anomaly_flag: item.risk_level === 'Critical',
        insight_reasoning: item.recommended_action
      })) as ForecastRecord[];
    }

    return normalized;
  };

  const loadResponseData = useCallback((response: SavedResponse) => {
    setLastFetchTime(new Date(response.created_at));

    try {
      const apiResponse: ApiResponse = response.agent_response;
      const normalizedData = normalizeApiResponse(apiResponse);
      setForecastData(normalizedData);
    } catch (error) {
      console.error('Error normalizing response data:', error);
      setForecastData({
        summary: "Error loading data",
        forecast_data: [],
        recommendation: "",
        query_type: "Error"
      });
    }
  }, []);

  const fetchLastResponses = async () => {
    try {
      const { data } = await supabase
        .from('demandForcast')
        .select('id, created_at, agent_response')
        .order('created_at', { ascending: false })
        .limit(4);

      if (data && data.length > 0) {
        setSavedResponses(data as SavedResponse[]);
        setSelectedResponseId(data[0].id);
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
      // Use String() to handle number/string type mismatch from select element
      const selected = savedResponses.find(r => String(r.id) === String(selectedResponseId));
      if (selected) {
        loadResponseData(selected);
      }
    }
  }, [selectedResponseId, savedResponses, loadResponseData]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setIsLoading(true);
      fetchLastResponses();
    }
  }, []);

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
    fetchLastResponses();
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
          <DemandForecastingWidget
            key={`widget-${selectedResponseId}`}
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