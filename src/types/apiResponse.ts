// Common types shared across all responses
export interface QueryMetadata {
  query_type: string;
  timestamp: string;
  filters_applied: {
    categories?: string[];
    regions?: string[];
    seasons?: string[];
    time_horizon?: string[] | string;
    item_name_sku?: string;
    warehouse_id?: string;
  };
}

export interface ReasoningStep {
  step_number: number;
  description: string;
  data_sources: string[];
  calculations: string;
  insights: string;
}

export interface ExternalSources {
  external_sources_used: boolean;
  external_sources_description: string;
  mock_data_sufficiency: string;
  additional_data_needed: string[];
}

// Forecast Data Response Type
export interface ForecastRecord {
  item: string;
  sku?: string;
  category: string;
  region: string;
  season?: string;
  forecasted_demand: number;
  on_hand_inventory: number;
  expected_inventory: number;
  total_inventory?: number;
  confidence_score: number;
  anomaly_flag: boolean;
  insight_reasoning?: string;
  warehouse_breakdown?: WarehouseBreakdown[];
  recommendation?: string;
}

export interface WarehouseBreakdown {
  warehouse_id: string;
  on_hand_inventory: number;
  expected_inventory: number;
  total_available: number;
  allocation_recommendation?: string;
}

export interface ForecastDataResponse {
  query_metadata: QueryMetadata;
  summary: string;
  reasoning_steps: ReasoningStep[];
  external_sources_used: ExternalSources;
  results: {
    forecast_data: ForecastRecord[];
  };
}

// Anomaly Detection Response Type
export interface AnomalyRecord {
  item: string;  // Primary field used by widget
  item_name?: string;  // Backwards compatibility
  sku: string;
  category: string;
  region: string;
  anomaly_type: string;
  severity: string;  // Primary field: "Critical", "High", "Medium", "Low"
  severity_score?: number;  // Optional numeric score
  confidence_score?: number;
  forecasted_demand?: number;
  on_hand_inventory?: number;
  expected_inventory?: number;
  total_on_hand_inventory?: number;
  total_expected_inventory?: number;
  inventory_gap?: number;
  anomaly_description?: string;
  description?: string;
  explanation?: string;
  potential_causes?: string[];
  recommendation?: string;
  warehouse_impact?: {
    warehouse_id: string;
    on_hand_inventory: number;
    expected_inventory: number;
    distribution_variance?: number;
  }[];
}

export interface AnomalyDetectionResponse {
  query_metadata: QueryMetadata;
  summary: string;
  reasoning_steps: ReasoningStep[];
  external_sources_used: ExternalSources;
  results: {
    anomaly_data: AnomalyRecord[];  // CHANGE: Updated from anomalies_detected to anomalies_data
  };
  recommendations?: any[];
  metadata?: any;
}


// Regional Analysis Response Type
export interface RegionalAnalysis {
  region: string;
  country: string;
  total_forecasted_demand: number;
  total_on_hand_inventory: number;
  total_expected_inventory: number;
  inventory_gap: number;
  coverage_percentage: number;
  top_categories: Array<{
    category: string;
    demand: number;
    percentage: number;
  }>;
  items_count: number;
  overstock_items_count: number;
  high_dsi_items_count: number;
  anomaly_count: number;
}

export interface RegionalAnalysisResponse {
  query_metadata: QueryMetadata;
  summary: string;
  reasoning_steps: ReasoningStep[];
  external_sources_used: ExternalSources;
  results: {
    regional_analysis: RegionalAnalysis[];
  };
}

// Low Demand Risk Response Type
export interface LowDemandRiskItem {
  item: string;
  sku: string;
  category: string;
  region: string;
  total_inventory: number;
  expected_inventory: number;
  forecasted_demand: number;
  inventory_gap: number;
  risk_score: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  high_dsi: 'Yes' | 'No';
  overstock: 'Yes' | 'No';
  seasonal_high_demand?: 'Yes' | 'No';
  recommended_for_promotion?: 'Yes' | 'No';
  financial_exposure?: number;
  recommended_action: string;
}

export interface LowDemandRiskResponse {
  query_metadata: QueryMetadata;
  summary: string;
  reasoning_steps: ReasoningStep[];
  external_sources_used: ExternalSources;
  results: {
    low_demand_risk_items: LowDemandRiskItem[];
  };
}

// Explain Forecast Response Type
export interface ExplainForecastMetadata {
  confidence_level: number;
  data_quality_score: number;
  data_source: string;
  execution_time_ms: number;
  total_beach_wear_skus?: number;
  total_product_skus?: number;
  total_records_analyzed: number;
}

export interface TimeSeries {
  date: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ExplainForecastData {
  item: string;
  sku: string;
  category: string;
  region: string;
  season: string;
  forecasted_demand: number;
  on_hand_inventory: number;
  expected_inventory: number;
  inventory_gap: number;
  confidence_score: number;
  anomaly_flag: boolean;
  insight_reasoning: string;
  recommendation: string;
  time_series_forecast: TimeSeries[];
  warehouse_breakdown: WarehouseBreakdown[];
}

export interface ExplainForecastResponse {
  query_metadata: QueryMetadata;
  metadata?: any;
  summary: string;
  reasoning_steps: ReasoningStep[];
  external_sources_used?: ExternalSources;
  results: {
    category_specific_insights: Array<{
      category: string;
      inventory_gap: number;
      key_insights: string;
      recommendation: string;
      top_performing_items: string[];
      total_available_inventory: number;
      total_forecasted_demand: number;
    }>;
    forecast_explanation?: {
      overall_trend?: string;
      seasonal_patterns?: string;
      regional_variations?: string;
      key_drivers?: string[];
    };
    regional_forecast_summary?: Array<{
      region: string;
      total_forecasted_demand: number;
      total_available_inventory: number;
      top_categories?: string[];
      inventory_status?: string;
      key_recommendations?: string[];
    }>;
  };
  recommendations?: any[];
}

// Specific Item Forecast Response Type (similar to ExplainForecast but for single item)
export interface SpecificItemForecastResponse {
  query_metadata: QueryMetadata;
  summary: string;
  reasoning_steps: ReasoningStep[];
  external_sources_used: ExternalSources;
  results: {
    forecast_data: ExplainForecastData[];
  };
}

// Union type for all possible API responses
export type ApiResponse = 
  | ForecastDataResponse 
  | AnomalyDetectionResponse 
  | RegionalAnalysisResponse 
  | LowDemandRiskResponse 
  | ExplainForecastResponse 
  | SpecificItemForecastResponse;

// Helper function to determine response type
export const getResponseType = (response: ApiResponse): string => {
  return response.query_metadata?.query_type || 'Unknown';
};

// Helper to check if response contains forecast data
export const hasForecastData = (response: ApiResponse): response is ForecastDataResponse | ExplainForecastResponse | SpecificItemForecastResponse => {
  return 'results' in response && 'forecast_data' in response.results;
};

// Helper to check if response contains regional analysis
export const hasRegionalAnalysis = (response: ApiResponse): response is RegionalAnalysisResponse => {
  return 'results' in response && 'regional_analysis' in response.results;
};

// Helper to check if response contains anomalies
// Helper to check if response contains anomalies
export const hasAnomalies = (response: ApiResponse): response is AnomalyDetectionResponse => {
  return 'results' in response && 'anomaly_data' in response.results;
};


// Helper to check if response contains risk items
export const hasLowDemandRisk = (response: ApiResponse): response is LowDemandRiskResponse => {
  return 'results' in response && 'low_demand_risk_items' in response.results;
};

// Helper to check if response is explain forecast
export const isExplainForecast = (response: ApiResponse): response is ExplainForecastResponse => {
  return 'results' in response && 'category_specific_insights' in response.results;
};
