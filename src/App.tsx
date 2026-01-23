import { useState, useRef, useEffect } from 'react'
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
      normalized.forecast_data = apiResponse.results.forecast_data;
      normalized.recommendation = apiResponse.results.forecast_data[0]?.recommendation || "";
    } 
    else if (hasRegionalAnalysis(apiResponse)) {
      // Convert regional analysis to tabular format
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
      // Convert anomalies to tabular format
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
      // Convert risk items to tabular format
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

  const fetchForecastData = async () => {
    try {
      const { data } = await supabase
        .from('demandForcast')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        // Normalize the API response to our internal format
        const apiResponse: ApiResponse = data.agent_response;
        const normalizedData = normalizeApiResponse(apiResponse);
        setForecastData(normalizedData);
        // Use created_at from database
        setLastFetchTime(new Date(data.created_at));
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchForecastData();
    }
  }, []);

  // Update timestamp display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchTime) {
        setLastFetchTime(new Date(lastFetchTime)); // Trigger re-render
      }
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [lastFetchTime]);

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

      {/* Records Generated Notification */}
      {lastFetchTime && (
        <div className={`px-4 py-3 border-b ${isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="container mx-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Records generated <span className={`font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-900'}`}>{getTimeAgoString(lastFetchTime)}</span>
            </span>
          </div>
        </div>
      )}
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
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