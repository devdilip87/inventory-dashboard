// Response type enum for different API response types
export enum ResponseType {
  ANOMALY_DETECTION = 'anomaly-detection',
  EXPLAIN_FORECAST = 'explain-forecast',
  TOP_DEMAND_ITEMS = 'top-demand-items',
  SPECIFIC_ITEM = 'specific-item',
  LOW_DEMAND_RISK = 'low-demand-risk',
  REGIONAL_ANALYSIS = 'regional-analysis'
}

// Display headings for each response type
export const ResponseTypeHeadings: Record<ResponseType, string> = {
  [ResponseType.ANOMALY_DETECTION]: 'Anomaly Detection',
  [ResponseType.EXPLAIN_FORECAST]: 'Explain Forecast',
  [ResponseType.TOP_DEMAND_ITEMS]: 'Top Demand Items',
  [ResponseType.SPECIFIC_ITEM]: 'Forecast for Specific Item',
  [ResponseType.LOW_DEMAND_RISK]: 'Low Demand Risk Analysis',
  [ResponseType.REGIONAL_ANALYSIS]: 'Region Demand Analysis'
};

// Helper to validate and get response type from query param
export const getResponseTypeFromUrl = (): ResponseType => {
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');

  if (typeParam && Object.values(ResponseType).includes(typeParam as ResponseType)) {
    return typeParam as ResponseType;
  }

  return ResponseType.TOP_DEMAND_ITEMS; // Default
};
