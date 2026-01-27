import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { AlertTriangle, Package, TrendingUp, BarChart3, Activity, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { RecommendationsPanel, Recommendation } from "../components/RecommendationsPanel";

interface ForecastRecord {
  item: string;
  category?: string;
  region: string;
  forecasted_demand: number;
  on_hand_inventory: number;
  expected_inventory: number;
  confidence_score: number;
  anomaly_flag?: boolean;
  insight_reasoning?: string;
}


import { Tabs } from "@/ui/tabs"

// Chart Components using pure SVG
const BarChart = ({ data, width, height, isDarkTheme }: { data: ForecastRecord[], width: number, height: number, isDarkTheme: boolean }) => {
  if (width < 100 || height < 100) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart requires more space to render
        </p>
      </div>
    );
  }

  const margin = { top: 20, right: 20, bottom: 60, left: 60 }; // Increased bottom margin for text
  const chartWidth = Math.max(0, width - margin.left - margin.right);
  const chartHeight = Math.max(0, height - margin.top - margin.bottom);

  if (chartWidth <= 0 || chartHeight <= 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart area too small
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.forecasted_demand), 1);
  const barWidth = Math.min(chartWidth / data.length * 0.6, 60); // Limit bar width
  const barSpacing = (chartWidth - (barWidth * data.length)) / (data.length + 1); // Even spacing

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = (chartHeight / 4) * i;
          return (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke={isDarkTheme ? '#374151' : '#e5e7eb'}
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}
        
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.forecasted_demand / maxValue) * chartHeight;
          const x = barSpacing + i * (barWidth + barSpacing);
          const y = chartHeight - barHeight;
          
          return (
            <g key={`bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={isDarkTheme ? '#3b82f6' : '#2563eb'}
                rx={4}
              />
              {/* Product name with better positioning and rotation */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fill={isDarkTheme ? '#9ca3af' : '#6b7280'}
                fontSize={10}
              >
                {d.item.length > 12 ? d.item.substring(0, 12) + '...' : d.item}
              </text>
            </g>
          );
        })}
        
        {/* Y-axis labels */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = (chartHeight / 4) * i;
          const value = Math.round((maxValue / 4) * (4 - i));
          return (
            <text
              key={`y-label-${i}`}
              x={-10}
              y={y + 4}
              textAnchor="end"
              fill={isDarkTheme ? '#9ca3af' : '#6b7280'}
              fontSize={10}
            >
              {value}
            </text>
          );
        })}
      </g>
    </svg>
  );
};


const InventoryStatusChart = ({ data, width, height, isDarkTheme }: { data: ForecastRecord[], width: number, height: number, isDarkTheme: boolean }) => {
  if (width < 100 || height < 100) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart requires more space to render
        </p>
      </div>
    );
  }

  const margin = { top: 20, right: 20, bottom: 60, left: 60 }; // Increased bottom margin for text
  const chartWidth = Math.max(0, width - margin.left - margin.right);
  const chartHeight = Math.max(0, height - margin.top - margin.bottom);

  if (chartWidth <= 0 || chartHeight <= 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart area too small
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.forecasted_demand, d.on_hand_inventory + d.expected_inventory)), 1);
  const barWidth = Math.min(chartWidth / data.length * 0.6, 60); // Limit bar width
  const barSpacing = (chartWidth - (barWidth * data.length)) / (data.length + 1); // Even spacing

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = (chartHeight / 4) * i;
          return (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke={isDarkTheme ? '#374151' : '#e5e7eb'}
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}
        
        {/* Bars */}
        {data.map((d, i) => {
          const forecastHeight = (d.forecasted_demand / maxValue) * chartHeight;
          const inventoryHeight = ((d.on_hand_inventory + d.expected_inventory) / maxValue) * chartHeight;
          const x = barSpacing + i * (barWidth + barSpacing);
          
          return (
            <g key={`group-${i}`}>
              <rect
                x={x}
                y={chartHeight - forecastHeight}
                width={barWidth}
                height={forecastHeight}
                fill={isDarkTheme ? '#ef4444' : '#dc2626'}
                rx={4}
                opacity={0.8}
              />
              <rect
                x={x}
                y={chartHeight - inventoryHeight}
                width={barWidth}
                height={inventoryHeight}
                fill={isDarkTheme ? '#10b981' : '#059669'}
                rx={4}
                opacity={0.8}
              />
              {/* Product name with better positioning and rotation */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fill={isDarkTheme ? '#9ca3af' : '#6b7280'}
                fontSize={10}
                // transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 20})`}
              >
                {d.item.length > 12 ? d.item.substring(0, 12) + '...' : d.item}
              </text>
            </g>
          );
        })}
        
        {/* Y-axis labels */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = (chartHeight / 4) * i;
          const value = Math.round((maxValue / 4) * (4 - i));
          return (
            <text
              key={`y-label-${i}`}
              x={-10}
              y={y + 4}
              textAnchor="end"
              fill={isDarkTheme ? '#9ca3af' : '#6b7280'}
              fontSize={10}
            >
              {value}
            </text>
          );
        })}
      </g>
    </svg>
  );
};

export const DemandForecastingWidget = forwardRef(function DemandForecastingWidget(
  { isDarkTheme: propIsDarkTheme, data: propData }: { isDarkTheme?: boolean; data?: { summary: string; forecast_data: ForecastRecord[]; recommendations?: Recommendation[] } } = {},
  ref
) {
  const isDarkTheme = propIsDarkTheme ?? true;
  const [activeTab, setActiveTab] = useState("summary");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const data = propData || {
    summary: "",
    forecast_data: [],
    recommendations: []
  };

  // Reset tab when data changes - depend on propData object reference
  useEffect(() => {
    console.log('=== Widget Received New Data ===');
    console.log('Summary length:', propData?.summary?.length || 0);
    console.log('Forecast data length:', propData?.forecast_data?.length || 0);
    setActiveTab("summary");
  }, [propData]); // Changed from [data?.summary] to [propData]

  const handleRefresh = () => {
    window.location.reload();
  };

  useImperativeHandle(ref, () => ({
    handleRefresh
  }), []);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "text-green-600"
    if (score >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const getInventoryStatus = (forecasted: number, onHand: number, expected: number) => {
    const total = onHand + expected
    if (total >= forecasted) return { status: "Adequate", color: "bg-green-100 text-green-800" }
    if (total >= forecasted * 0.8) return { status: "Low", color: "bg-yellow-100 text-yellow-800" }
    return { status: "Critical", color: "bg-red-100 text-red-800" }
  }

  // Sorting functionality
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!sortColumn) return data.forecast_data;

    return [...data.forecast_data].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case 'item':
          aVal = a.item?.toLowerCase() || '';
          bVal = b.item?.toLowerCase() || '';
          break;
        case 'category':
          aVal = a.category?.toLowerCase() || '';
          bVal = b.category?.toLowerCase() || '';
          break;
        case 'region':
          aVal = a.region?.toLowerCase() || '';
          bVal = b.region?.toLowerCase() || '';
          break;
        case 'forecasted_demand':
          aVal = a.forecasted_demand || 0;
          bVal = b.forecasted_demand || 0;
          break;
        case 'on_hand_inventory':
          aVal = a.on_hand_inventory || 0;
          bVal = b.on_hand_inventory || 0;
          break;
        case 'expected_inventory':
          aVal = a.expected_inventory || 0;
          bVal = b.expected_inventory || 0;
          break;
        case 'confidence_score':
          aVal = a.confidence_score || 0;
          bVal = b.confidence_score || 0;
          break;
        case 'inventory_status':
          const statusA = getInventoryStatus(a.forecasted_demand, a.on_hand_inventory, a.expected_inventory);
          const statusB = getInventoryStatus(b.forecasted_demand, b.on_hand_inventory, b.expected_inventory);
          aVal = statusA.status;
          bVal = statusB.status;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ column, children, className = '' }: { column: string; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${isDarkTheme ? 'text-gray-300' : ''} ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon column={column} />
      </div>
    </TableHead>
  );

  return (
    <div className={`w-full mx-auto ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`flex items-center rounded-lg p-1 ${isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : isDarkTheme
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'charts'
                ? 'bg-blue-600 text-white'
                : isDarkTheme
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Charts
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white'
                : isDarkTheme
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Regional Analysis
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white'
                : isDarkTheme
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'recommendations'
                ? 'bg-blue-600 text-white'
                : isDarkTheme
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recommendations
          </button>
        </div>

        {/* Content wrapper with theme background */}
        <div className={`mt-6 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>

        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <Card className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <TrendingUp className="h-5 w-5" />
                Demand Forecasting Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`leading-relaxed mb-6 ${isDarkTheme ? 'text-gray-300' : 'text-muted-foreground'}`}>{data.summary}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    Products Analyzed
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{data.forecast_data.length}</p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Forecasted Demand
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {data.forecast_data.reduce((sum, item) => sum + item.forecasted_demand, 0).toLocaleString()}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Confidence
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {data.forecast_data.length > 0
                      ? Math.round((data.forecast_data.reduce((sum, item) => sum + item.confidence_score, 0) / data.forecast_data.length) * 100)
                      : 0}%
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-amber-900 bg-opacity-30' : 'bg-amber-50'}`}>
                  <p className={`text-xs font-semibold ${isDarkTheme ? 'text-amber-300' : 'text-amber-600'}`}>
                    Anomalies Detected
                  </p>
                  <p className="text-2xl font-bold mt-2 text-amber-500">
                    {data.forecast_data.filter((item) => item.anomaly_flag).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* TAB 2: CHARTS */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand Forecast Bar Chart */}
            <Card className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <BarChart3 className="h-5 w-5" />
                  Demand Forecast by Product
                </CardTitle>
                <CardDescription>Forecasted demand quantities for each product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80">
                  <BarChart
                    data={data.forecast_data}
                    width={500}
                    height={320}
                    isDarkTheme={isDarkTheme}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory vs Demand Chart */}
            <Card className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="h-5 w-5" />
                  Inventory vs Demand Comparison
                </CardTitle>
                <CardDescription>Forecasted demand vs available inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80">
                  <InventoryStatusChart
                    data={data.forecast_data}
                    width={550}
                    height={320}
                    isDarkTheme={isDarkTheme}
                  />
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>Forecasted Demand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>Available Inventory</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {/* TAB 3: REGIONAL ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <Card className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Package className="h-5 w-5" />
                Regional Demand Analysis
              </CardTitle>
              <CardDescription>Demand distribution across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // Dynamically extract unique regions from the forecast data
                  const uniqueRegions = [...new Set(data.forecast_data.map(item => item.region))];
                  
                  return uniqueRegions.map(region => {
                    const regionData = data.forecast_data.filter(item => item.region === region);
                    const totalDemand = regionData.reduce((sum, item) => sum + item.forecasted_demand, 0);
                    const avgConfidence = regionData.length > 0 
                      ? regionData.reduce((sum, item) => sum + item.confidence_score, 0) / regionData.length
                      : 0;
                    
                    return (
                      <div key={region} className={`flex justify-between items-center p-3 rounded-lg border ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div>
                          <h4 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{region}</h4>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {regionData.length} product{regionData.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {totalDemand.toLocaleString()}
                          </p>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {Math.round(avgConfidence * 100)}% confidence
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: FORECAST DETAILS TABLE */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <Card className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Package className="h-5 w-5" />
                Forecast Details
              </CardTitle>
              <CardDescription>Detailed demand forecasting data by product and region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={isDarkTheme ? 'border-gray-700' : ''}>
                      <SortableHeader column="item">Product</SortableHeader>
                      <SortableHeader column="category">Category</SortableHeader>
                      <SortableHeader column="region">Region</SortableHeader>
                      <SortableHeader column="forecasted_demand" className="text-right">Forecasted Demand</SortableHeader>
                      <SortableHeader column="on_hand_inventory" className="text-right">On Hand</SortableHeader>
                      <SortableHeader column="expected_inventory" className="text-right">Expected</SortableHeader>
                      <SortableHeader column="inventory_status">Inventory Status</SortableHeader>
                      <SortableHeader column="confidence_score">Confidence</SortableHeader>
                      <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Insights</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedData().map((record, index) => {
                      const inventoryStatus = getInventoryStatus(
                        record.forecasted_demand,
                        record.on_hand_inventory,
                        record.expected_inventory,
                      )

                      return (
                        <TableRow key={index} className={isDarkTheme ? 'border-gray-700 hover:bg-gray-700' : ''}>
                          <TableCell className={`font-medium ${isDarkTheme ? 'text-white' : ''}`}>
                            <div className="flex items-center gap-2">
                              {record.anomaly_flag && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                              {record.item}
                            </div>
                          </TableCell>
                          <TableCell className={isDarkTheme ? 'text-gray-300' : ''}>{record.category && <Badge variant="outline" className={isDarkTheme ? 'text-white' : 'text-gray-900'}>{record.category}</Badge>}</TableCell>
                          <TableCell className={isDarkTheme ? 'text-gray-300' : ''}>{record.region}</TableCell>
                          <TableCell className={`text-right font-medium ${isDarkTheme ? 'text-white' : ''}`}>
                            {record.forecasted_demand.toLocaleString()}
                          </TableCell>
                          <TableCell className={`text-right ${isDarkTheme ? 'text-gray-300' : ''}`}>{record.on_hand_inventory.toLocaleString()}</TableCell>
                          <TableCell className={`text-right ${isDarkTheme ? 'text-gray-300' : ''}`}>{record.expected_inventory.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={inventoryStatus.color}>{inventoryStatus.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={record.confidence_score * 100} className="w-16 h-2" />
                              <span className={`text-sm font-medium ${getConfidenceColor(record.confidence_score)}`}>
                                {Math.round(record.confidence_score * 100)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {record.insight_reasoning && (
                              <p className={`text-sm truncate ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`} title={record.insight_reasoning}>
                                {record.insight_reasoning}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <RecommendationsPanel
              recommendations={data.recommendations || []}
              isDarkTheme={isDarkTheme}
            />
          </div>
        )}
        </div>
      </Tabs>
    </div>
  );
});

DemandForecastingWidget.displayName = 'DemandForecastingWidget';

export default DemandForecastingWidget;