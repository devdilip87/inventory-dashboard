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