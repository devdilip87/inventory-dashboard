import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

interface CategoryInsight {
  category: string;
  inventory_gap: number;
  key_insights: string;
  recommendation: string;
  top_performing_items: string[];
  total_available_inventory: number;
  total_forecasted_demand: number;
}

interface ForecastExplanation {
  overall_trend?: string;
  seasonal_patterns?: string;
  regional_variations?: string;
  key_drivers?: string[];
}

interface RegionalSummary {
  region: string;
  country?: string;
  total_forecasted_demand: number;
  total_available_inventory: number;
  inventory_gap?: number;
  top_categories?: string[];
  inventory_status?: string;
  key_trends?: string;
  recommendation?: string;
  key_recommendations?: string[];
}

interface ExplainForecastWidgetProps {
  isDarkTheme: boolean;
  data: {
    summary: string;
    category_specific_insights: CategoryInsight[];
    forecast_explanation?: ForecastExplanation;
    regional_forecast_summary?: RegionalSummary[];
    metadata?: any;
  };
}

const getInventoryStatus = (gap: number) => {
  if (gap < -100) return { label: 'Critical Shortage', color: 'bg-red-100 text-red-800' };
  if (gap < 0) return { label: 'Shortage', color: 'bg-orange-100 text-orange-800' };
  if (gap === 0) return { label: 'Balanced', color: 'bg-green-100 text-green-800' };
  if (gap < 50) return { label: 'Slight Overstock', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Overstock', color: 'bg-blue-100 text-blue-800' };
};

export const ExplainForecastWidget = forwardRef(function ExplainForecastWidget(
  { isDarkTheme, data }: ExplainForecastWidgetProps,
  ref
) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      console.log('Refreshing explain forecast widget');
    }
  }), []);

  const toggleCategoryExpanded = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const insights = data.category_specific_insights || [];
  const totalDemand = insights.reduce((sum, i) => sum + i.total_forecasted_demand, 0);
  const totalInventory = insights.reduce((sum, i) => sum + i.total_available_inventory, 0);
  const totalGap = totalInventory - totalDemand;

  return (
    <div className={`w-full ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 mb-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <TabsTrigger value="overview" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            Categories ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="regions" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            Regions
          </TabsTrigger>
          <TabsTrigger value="explanation" className={isDarkTheme ? 'data-[state=active]:bg-gray-700' : ''}>
            Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className={`p-6 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Forecast Summary</h3>
            <p className={`text-sm mb-6 leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              {data.summary}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Demand
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{totalDemand.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>units</p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Inventory
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{totalInventory.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>units</p>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  totalGap < 0
                    ? isDarkTheme
                      ? 'bg-red-900 bg-opacity-30'
                      : 'bg-red-50'
                    : isDarkTheme
                    ? 'bg-green-900 bg-opacity-30'
                    : 'bg-green-50'
                }`}
              >
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gap
                </p>
                <p className={`text-2xl font-bold mt-2 ${totalGap < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {totalGap > 0 ? '+' : ''}{totalGap.toLocaleString()}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Coverage
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {((totalInventory / totalDemand) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          {insights.length === 0 ? (
            <Card className={`p-6 text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No category insights available</p>
            </Card>
          ) : (
            insights.map((insight, idx) => (
              <CategoryCard
                key={idx}
                insight={insight}
                isDarkTheme={isDarkTheme}
                isExpanded={expandedCategories.has(insight.category)}
                onToggle={() => toggleCategoryExpanded(insight.category)}
              />
            ))
          )}
        </TabsContent>

        {/* Regions Tab */}
        <TabsContent value="regions" className="space-y-4">
          {data.regional_forecast_summary && data.regional_forecast_summary.length > 0 ? (
            data.regional_forecast_summary.map((region, idx) => (
              <RegionalCard key={idx} region={region} isDarkTheme={isDarkTheme} />
            ))
          ) : (
            <Card className={`p-6 text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No regional summary available</p>
            </Card>
          )}
        </TabsContent>

        {/* Explanation Tab */}
        <TabsContent value="explanation" className="space-y-4">
          {data.forecast_explanation ? (
            <ExplanationCard explanation={data.forecast_explanation} isDarkTheme={isDarkTheme} />
          ) : (
            <Card className={`p-6 text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No forecast explanation available</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

interface CategoryCardProps {
  insight: CategoryInsight;
  isDarkTheme: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ insight, isDarkTheme, isExpanded, onToggle }) => {
  const status = getInventoryStatus(insight.inventory_gap);
  const coveragePercent = ((insight.total_available_inventory / insight.total_forecasted_demand) * 100).toFixed(0);

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
          <h4 className={`font-semibold text-lg mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{insight.category}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded font-semibold ${status.color}`}>
              {status.label}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded ${
                parseFloat(coveragePercent) >= 100
                  ? 'bg-green-100 text-green-800'
                  : parseFloat(coveragePercent) >= 80
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {coveragePercent}% Coverage
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-4">
            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Inventory Gap</p>
            <p
              className={`text-lg font-bold ${
                insight.inventory_gap < 0 ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {insight.inventory_gap > 0 ? '+' : ''}{insight.inventory_gap}
            </p>
          </div>

          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'} space-y-4`}>
          <div>
            <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Key Insights
            </p>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {insight.key_insights}
            </p>
          </div>

          <div>
            <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Recommendation
            </p>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {insight.recommendation}
            </p>
          </div>

          <div>
            <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Top Performing Items
            </p>
            <div className="flex flex-wrap gap-2">
              {insight.top_performing_items.map((item, idx) => (
                <Badge
                  key={idx}
                  className={`${isDarkTheme ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className={`p-2 rounded text-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Demand</p>
              <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{insight.total_forecasted_demand.toLocaleString()}</p>
            </div>
            <div className={`p-2 rounded text-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Available</p>
              <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{insight.total_available_inventory.toLocaleString()}</p>
            </div>
            <div className={`p-2 rounded text-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Gap</p>
              <p className={insight.inventory_gap < 0 ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>
                {insight.inventory_gap > 0 ? '+' : ''}{insight.inventory_gap}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

interface RegionalCardProps {
  region: RegionalSummary;
  isDarkTheme: boolean;
}

const RegionalCard: React.FC<RegionalCardProps> = ({ region, isDarkTheme }) => {
  const coveragePercent = ((region.total_available_inventory / region.total_forecasted_demand) * 100).toFixed(0);
  const gap = region.inventory_gap ?? (region.total_available_inventory - region.total_forecasted_demand);
  const status = getInventoryStatus(gap);

  return (
    <Card className={`p-4 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className={`font-semibold text-lg ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{region.region}</h4>
          {region.country && (
            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{region.country}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded font-semibold ${status.color}`}>
            {region.inventory_status || status.label}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded font-semibold ${
              parseFloat(coveragePercent) >= 100
                ? 'bg-green-100 text-green-800'
                : parseFloat(coveragePercent) >= 80
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {coveragePercent}% Coverage
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Forecasted Demand</p>
          <p className={`font-semibold mt-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{region.total_forecasted_demand.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Available Inventory</p>
          <p className={`font-semibold mt-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{region.total_available_inventory.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Inventory Gap</p>
          <p className={`font-semibold mt-1 ${gap < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {gap > 0 ? '+' : ''}{gap.toLocaleString()}
          </p>
        </div>
      </div>

      {region.key_trends && (
        <div className="mb-3">
          <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Key Trends
          </p>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            {region.key_trends}
          </p>
        </div>
      )}

      {region.top_categories && region.top_categories.length > 0 && (
        <div className="mb-3">
          <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Top Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {region.top_categories.map((cat, idx) => (
              <Badge key={idx} className={`${isDarkTheme ? 'bg-purple-900 text-purple-100' : 'bg-purple-100 text-purple-800'}`}>
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(region.recommendation || (region.key_recommendations && region.key_recommendations.length > 0)) && (
        <div>
          <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Recommendation
          </p>
          {region.recommendation ? (
            <p className={`text-sm ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>
              {region.recommendation}
            </p>
          ) : (
            <ul className={`text-sm space-y-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              {region.key_recommendations?.map((rec, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
};

interface ExplanationCardProps {
  explanation: ForecastExplanation;
  isDarkTheme: boolean;
}

const ExplanationCard: React.FC<ExplanationCardProps> = ({ explanation, isDarkTheme }) => {
  return (
    <Card className={`p-6 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Forecast Explanation</h3>

      <div className="space-y-4">
        {explanation.overall_trend && (
          <div>
            <h4 className={`text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Overall Trend
            </h4>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
              {explanation.overall_trend}
            </p>
          </div>
        )}

        {explanation.seasonal_patterns && (
          <div>
            <h4 className={`text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Seasonal Patterns
            </h4>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
              {explanation.seasonal_patterns}
            </p>
          </div>
        )}

        {explanation.regional_variations && (
          <div>
            <h4 className={`text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Regional Variations
            </h4>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
              {explanation.regional_variations}
            </p>
          </div>
        )}

        {explanation.key_drivers && explanation.key_drivers.length > 0 && (
          <div>
            <h4 className={`text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Key Drivers
            </h4>
            <ul className={`text-sm space-y-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {explanation.key_drivers.map((driver, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

ExplainForecastWidget.displayName = 'ExplainForecastWidget';

export default ExplainForecastWidget;
