import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { AlertTriangle, Package, TrendingUp, Warehouse, Sun, Moon, BarChart3, /* PieChart, */ Activity, RefreshCw } from "lucide-react"
import { withHost } from "../hoc/withHost";
//import type { WrappedComponentProps } from "../hoc/withHost";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
// import type { DemandForecastingOutput } from "../types";
// import { Group } from '@visx/group';
// import { Bar } from '@visx/shape';
// import { scaleLinear, scaleBand } from '@visx/scale';
// import { AxisLeft, AxisBottom } from '@visx/axis';
// import { Grid } from '@visx/grid';
// import { ParentSize } from '@visx/responsive';

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


import { supabase } from '../lib/supabase';

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

// const ConfidencePieChart = ({ data, width, height, isDarkTheme }: { data: ForecastRecord[], width: number, height: number, isDarkTheme: boolean }) => {
//   if (width < 100 || height < 100) {
//     return (
//       <div className="flex items-center justify-center w-full h-full">
//         <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
//           Chart requires more space to render
//         </p>
//       </div>
//     );
//   }

//   const margin = { top: 20, right: 20, bottom: 20, left: 20 };
//   const chartWidth = Math.max(0, width - margin.left - margin.right);
//   const chartHeight = Math.max(0, height - margin.top - margin.bottom);
//   const radius = Math.min(chartWidth, chartHeight) / 2;

//   if (radius <= 0) {
//     return (
//       <div className="flex items-center justify-center w-full h-full">
//         <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
//           Chart area too small
//         </p>
//       </div>
//     );
//   }

//   if (!data || data.length === 0) {
//     return (
//       <div className="flex items-center justify-center w-full h-full">
//         <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
//           No data available
//         </p>
//       </div>
//     );
//   }

//   const pieData = data.map(d => ({
//     label: d.item,
//     value: Math.max(0.01, d.confidence_score),
//     color: d.confidence_score >= 0.9 ? '#10b981' : d.confidence_score >= 0.7 ? '#f59e0b' : '#ef4444'
//   }));

//   const total = pieData.reduce((sum, d) => sum + d.value, 0);

//   if (total <= 0) {
//     return (
//       <div className="flex items-center justify-center w-full h-full">
//         <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
//           Invalid data values
//         </p>
//       </div>
//     );
//   }

//   const centerX = width / 2;
//   const centerY = height / 2;
//   let currentAngle = -Math.PI / 2;

//   const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
//     const x1 = centerX + Math.cos(startAngle) * outerRadius;
//     const y1 = centerY + Math.sin(startAngle) * outerRadius;
//     const x2 = centerX + Math.cos(endAngle) * outerRadius;
//     const y2 = centerY + Math.sin(endAngle) * outerRadius;
    
//     const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    
//     return [
//       `M ${centerX + Math.cos(startAngle) * innerRadius} ${centerY + Math.sin(startAngle) * innerRadius}`,
//       `L ${x1} ${y1}`,
//       `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
//       `L ${centerX + Math.cos(endAngle) * innerRadius} ${centerY + Math.sin(endAngle) * innerRadius}`,
//       `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${centerX + Math.cos(startAngle) * innerRadius} ${centerY + Math.sin(startAngle) * innerRadius}`,
//       'Z'
//     ].join(' ');
//   };

//   return (
//     <svg width={width} height={height}>
//       <g>
//         {pieData.map((item, i) => {
//           const angle = (item.value / total) * 2 * Math.PI;
//           const startAngle = currentAngle;
//           const endAngle = currentAngle + angle;
//           const percentage = Math.round((item.value / total) * 100);
          
//           const centroidAngle = startAngle + angle / 2;
//           const centroidX = centerX + Math.cos(centroidAngle) * (radius * 0.7);
//           const centroidY = centerY + Math.sin(centroidAngle) * (radius * 0.7);
          
//           currentAngle = endAngle;
          
//           return (
//             <g key={`arc-${i}`}>
//               <path
//                 d={createArcPath(startAngle, endAngle, radius * 0.4, radius)}
//                 fill={item.color}
//                 stroke={isDarkTheme ? '#374151' : '#ffffff'}
//                 strokeWidth={2}
//               />
//               {percentage > 5 && (
//                 <text
//                   x={centroidX}
//                   y={centroidY}
//                   textAnchor="middle"
//                   dominantBaseline="middle"
//                   fill={isDarkTheme ? '#ffffff' : '#000000'}
//                   fontSize={10}
//                   fontWeight="bold"
//                 >
//                   {percentage}%
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </g>
      
//       {/* Legend */}
//       <g transform={`translate(10, ${height - 80})`}>
//         {pieData.map((item, i) => (
//           <g key={`legend-${i}`}>
//             <rect
//               x={0}
//               y={i * 20}
//               width={12}
//               height={12}
//               fill={item.color}
//               stroke={isDarkTheme ? '#374151' : '#ffffff'}
//               strokeWidth={1}
//             />
//             <text
//               x={18}
//               y={i * 20 + 9}
//               fill={isDarkTheme ? '#ffffff' : '#000000'}
//               fontSize={11}
//               fontWeight="500"
//             >
//               {item.label} ({Math.round((item.value / total) * 100)}%)
//             </text>
//           </g>
//         ))}
//       </g>
//     </svg>
//   );
// };

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

export function DemandForecastingWidget() {
  //const [isDarkTheme, setIsDarkTheme] = useState(true);

  // const { hostData, incomingData } = props;
  // console.log("X Output:: Host Data", hostData);
  // console.log("X Output:: Incoming Data", incomingData);
  // const data: DemandForecastingOutput =
  //   (incomingData && incomingData["demand-forecast-input-handler"]?.data?.outputs[0]?.output as DemandForecastingOutput)
  //   || {
  //     summary: "",
  //     forecast_data: [],
  //     recommendation: ""
  //   };

  // console.log("DemandForecastingOutput **********", data);

  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [data, setData] = useState<{
    summary: string;
    forecast_data: ForecastRecord[];
    recommendation: string;
  }>({
    summary: "",
    forecast_data: [],
    recommendation: ""
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Reload the page
    window.location.reload();
  };

  useEffect(() => {
     async function fetchLatest() {
    const { data } = await supabase
      .from('demandForcast')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) setData(data.agent_response);
  }
  fetchLatest();
  }, []);

  // const data = {
  //   summary:
  //     "Based on historical trends and seasonal patterns, we're forecasting increased demand across electronics and home goods categories. The North region shows particularly strong growth potential, while inventory levels appear adequate for most products except smartphones which may face shortages.",
  //   forecast_data: [
  //     {
  //       item: "iPhone 15 Pro",
  //       category: "Electronics",
  //       region: "North",
  //       forecasted_demand: 1250,
  //       on_hand_inventory: 800,
  //       expected_inventory: 300,
  //       confidence_score: 0.92,
  //       anomaly_flag: true,
  //       insight_reasoning: "Unusually high demand detected due to upcoming holiday season and new product launch",
  //     },
  //     {
  //       item: "Samsung Galaxy S24",
  //       category: "Electronics",
  //       region: "South",
  //       forecasted_demand: 950,
  //       on_hand_inventory: 1200,
  //       expected_inventory: 200,
  //       confidence_score: 0.87,
  //       anomaly_flag: false,
  //       insight_reasoning: "Steady demand pattern consistent with historical data",
  //     },
  //     {
  //       item: "Coffee Maker Deluxe",
  //       category: "Home Goods",
  //       region: "East",
  //       forecasted_demand: 680,
  //       on_hand_inventory: 450,
  //       expected_inventory: 150,
  //       confidence_score: 0.78,
  //       anomaly_flag: false,
  //       insight_reasoning: "Seasonal uptick expected for kitchen appliances",
  //     },
  //     {
  //       item: "Wireless Headphones",
  //       category: "Electronics",
  //       region: "West",
  //       forecasted_demand: 1100,
  //       on_hand_inventory: 900,
  //       expected_inventory: 400,
  //       confidence_score: 0.94,
  //       anomaly_flag: false,
  //       insight_reasoning: "Strong consistent demand with high confidence prediction",
  //     },
  //   ],
  //   recommendation:
  //     "Immediate action required: Increase iPhone 15 Pro inventory in North region by 150 units to meet forecasted demand. Consider expediting shipments for electronics category. Monitor Samsung Galaxy S24 for potential overstock situation in South region.",
  // };

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

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const themeClasses = isDarkTheme 
    ? "bg-gray-900 text-white"      // ← text-white applied here
    : "bg-white text-gray-900";

  const cardThemeClasses = isDarkTheme 
    ? "bg-gray-800 border-gray-700" 
    : "bg-white border-gray-200";

  return (
    <div className={`w-full mx-auto space-y-6 ${themeClasses} min-h-screen p-6`}>
      {/* Theme Toggle Button */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'}`}
        >
          {isDarkTheme ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </>
          )}
        </Button>
      </div>

      {/* <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Output Page</h1>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {names.map((name) => <div key={name}>Agent: {name}</div>)}
        </div>

        <Logger hostData={hostData} incomingData={incomingData} />
      </div> */}
      {/* Summary Section */}
      <Card className={cardThemeClasses}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="h-5 w-5" />
            Demand Forecasting Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-muted-foreground'}`}>{data.summary}</p>
        </CardContent>
      </Card>

      {/* Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Forecast Bar Chart */}
        <Card className={cardThemeClasses}>
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

        {/* Confidence Score Pie Chart */}
        {/* <Card className={cardThemeClasses}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Confidence Score Distribution
            </CardTitle>
            <CardDescription>Confidence levels for each product forecast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ConfidencePieChart
                data={data.forecast_data}
                width={600}
                height={320}
                isDarkTheme={isDarkTheme}
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Inventory vs Demand Chart */}
        <Card className={cardThemeClasses}>
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

        {/* Regional Analysis */}
        <Card className={cardThemeClasses}>
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

        {/* <Card className={cardThemeClasses}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              <Package className="h-5 w-5" />
              Regional Demand Analysis
            </CardTitle>
            <CardDescription>Demand distribution across regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['North', 'South', 'East', 'West'].map(region => {
                const regionData = data.forecast_data.filter(item => item.region === region);
                const totalDemand = regionData.reduce((sum, item) => sum + item.forecasted_demand, 0);
                const avgConfidence = regionData.length > 0 
                  ? regionData.reduce((sum, item) => sum + item.confidence_score, 0) / regionData.length
                  : 0;
                
                return (
                  <div key={region} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <h4 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{region}</h4>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        {regionData.length} products
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
              })}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Forecast Data Table */}
      <Card className={cardThemeClasses}>
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
                  <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Product</TableHead>
                  <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Category</TableHead>
                  <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Region</TableHead>
                  <TableHead className={`text-right ${isDarkTheme ? 'text-gray-300' : ''}`}>Forecasted Demand</TableHead>
                  <TableHead className={`text-right ${isDarkTheme ? 'text-gray-300' : ''}`}>On Hand</TableHead>
                  <TableHead className={`text-right ${isDarkTheme ? 'text-gray-300' : ''}`}>Expected</TableHead>
                  <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Inventory Status</TableHead>
                  <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Confidence</TableHead>
                  <TableHead className={isDarkTheme ? 'text-gray-300' : ''}>Insights</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.forecast_data.map((record, index) => {
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

      {/* Recommendations Section */}
      {data.recommendation && (
        <Card className={cardThemeClasses}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              <Warehouse className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`leading-relaxed ${isDarkTheme ? 'text-blue-100' : 'text-blue-900'}`}>{data.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cardThemeClasses}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : ''}`}>{data.forecast_data.length}</div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Products Analyzed</p>
          </CardContent>
        </Card>
        <Card className={cardThemeClasses}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : ''}`}>
              {data.forecast_data.reduce((sum, item) => sum + item.forecasted_demand, 0).toLocaleString()}
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Total Forecasted Demand</p>
          </CardContent>
        </Card>
        <Card className={cardThemeClasses}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : ''}`}>
              {Math.round(
                (data.forecast_data.reduce((sum, item) => sum + item.confidence_score, 0) / data.forecast_data.length) *
                100,
              )}
              %
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Avg Confidence</p>
          </CardContent>
        </Card>
        <Card className={cardThemeClasses}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold text-amber-600 ${isDarkTheme ? 'text-amber-400' : ''}`}>
              {data.forecast_data.filter((item) => item.anomaly_flag).length}
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Anomalies Detected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
const OutputPage = withHost(DemandForecastingWidget);

export default OutputPage;