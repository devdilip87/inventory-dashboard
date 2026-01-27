import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export interface Recommendation {
  priority: string;
  action: string;
  rationale: string;
  impact: string;
  affected_items?: string[];
  affected_regions?: string[];
  affected_warehouses?: string[];
  affected_products?: number;
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  isDarkTheme: boolean;
}

const getPriorityColor = (priority: string) => {
  const priorityLower = priority.toLowerCase();
  switch (priorityLower) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getPriorityBorderColor = (priority: string) => {
  const priorityLower = priority.toLowerCase();
  switch (priorityLower) {
    case 'critical':
      return 'border-l-red-500';
    case 'high':
      return 'border-l-orange-500';
    case 'medium':
      return 'border-l-yellow-500';
    case 'low':
      return 'border-l-green-500';
    default:
      return 'border-l-gray-500';
  }
};

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  isDarkTheme,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className={`p-6 text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No recommendations available</p>
      </Card>
    );
  }

  // Group recommendations by priority
  const criticalRecs = recommendations.filter(r => r.priority?.toLowerCase() === 'critical');
  const highRecs = recommendations.filter(r => r.priority?.toLowerCase() === 'high');
  const mediumRecs = recommendations.filter(r => r.priority?.toLowerCase() === 'medium');
  const lowRecs = recommendations.filter(r => r.priority?.toLowerCase() === 'low');

  const renderRecommendation = (rec: Recommendation, idx: number) => (
    <Card
      key={idx}
      className={`p-4 border-l-4 ${getPriorityBorderColor(rec.priority)} ${
        isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h4 className={`font-semibold flex-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
          {rec.action}
        </h4>
        <Badge className={`${getPriorityColor(rec.priority)} shrink-0`}>
          {rec.priority}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <p className={`text-xs font-semibold mb-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Rationale
          </p>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            {rec.rationale}
          </p>
        </div>

        <div>
          <p className={`text-xs font-semibold mb-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Expected Impact
          </p>
          <p className={`text-sm ${isDarkTheme ? 'text-green-400' : 'text-green-700'}`}>
            {rec.impact}
          </p>
        </div>

        {rec.affected_items && rec.affected_items.length > 0 && (
          <div>
            <p className={`text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Affected Items
            </p>
            <div className="flex flex-wrap gap-1">
              {rec.affected_items.map((item, itemIdx) => (
                <Badge
                  key={itemIdx}
                  className={`text-xs ${isDarkTheme ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {rec.affected_regions && rec.affected_regions.length > 0 && (
          <div>
            <p className={`text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Affected Regions
            </p>
            <div className="flex flex-wrap gap-1">
              {rec.affected_regions.map((region, regIdx) => (
                <Badge
                  key={regIdx}
                  className={`text-xs ${isDarkTheme ? 'bg-purple-900 text-purple-100' : 'bg-purple-100 text-purple-800'}`}
                >
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {rec.affected_warehouses && rec.affected_warehouses.length > 0 && (
          <div>
            <p className={`text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Affected Warehouses
            </p>
            <div className="flex flex-wrap gap-1">
              {rec.affected_warehouses.map((wh, whIdx) => (
                <Badge
                  key={whIdx}
                  className={`text-xs ${isDarkTheme ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-800'}`}
                >
                  {wh}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'}`}>
          <p className={`text-2xl font-bold text-red-500`}>{criticalRecs.length}</p>
          <p className={`text-xs ${isDarkTheme ? 'text-red-300' : 'text-red-600'}`}>Critical</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-orange-900 bg-opacity-30' : 'bg-orange-50'}`}>
          <p className={`text-2xl font-bold text-orange-500`}>{highRecs.length}</p>
          <p className={`text-xs ${isDarkTheme ? 'text-orange-300' : 'text-orange-600'}`}>High</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'}`}>
          <p className={`text-2xl font-bold text-yellow-500`}>{mediumRecs.length}</p>
          <p className={`text-xs ${isDarkTheme ? 'text-yellow-300' : 'text-yellow-600'}`}>Medium</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'}`}>
          <p className={`text-2xl font-bold text-green-500`}>{lowRecs.length}</p>
          <p className={`text-xs ${isDarkTheme ? 'text-green-300' : 'text-green-600'}`}>Low</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {criticalRecs.map((rec, idx) => renderRecommendation(rec, idx))}
        {highRecs.map((rec, idx) => renderRecommendation(rec, idx + criticalRecs.length))}
        {mediumRecs.map((rec, idx) => renderRecommendation(rec, idx + criticalRecs.length + highRecs.length))}
        {lowRecs.map((rec, idx) => renderRecommendation(rec, idx + criticalRecs.length + highRecs.length + mediumRecs.length))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
