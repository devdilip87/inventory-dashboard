import { useState, useEffect, useCallback } from 'react'
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { Alert, AlertDescription } from "../ui/alert"
import { Button } from "../ui/button"
import { CheckCircle, Clock, AlertTriangle, XCircle, Bell, Settings, Users, Zap, Activity, Mail, BarChart3, PieChart, Database, ExternalLink, Sun, Moon, RefreshCw, Megaphone } from "lucide-react"
import { Footer } from '../components/Footer'
import { supabase } from '../lib/supabase'

interface CampaignIssue {
  issue: string
  recommended_action: string
}

interface ReasoningStep {
  step_number: number
  description: string
  data_sources: string[]
  calculations: string
  insights: string
}

interface ExternalSourcesUsed {
  external_sources_used: boolean
  external_sources_description: string
  mock_data_sufficiency?: string
  additional_data_needed?: string[]
}

interface Source {
  tool: string
  endpoint: string
  params: object
  time_window: string
  records: number
}

interface CampaignOrchestrationOutput {
  summary: string
  reasoning_steps: ReasoningStep[]
  external_sources_used: ExternalSourcesUsed
  sources: Source[]
  notifications_sent: string[]
  system_sync_status: "Complete" | "Partial" | "Pending" | "Failed"
  issues_detected?: CampaignIssue[]
}

interface SavedCampaignResponse {
  id: number
  created_at: string
  campaign_name: string | null
  start_date: string | null
  end_date: string | null
  agent_response: CampaignOrchestrationOutput
}

// Chart Components using pure SVG
const SyncStatusChart = ({ data, width, height, isDarkTheme }: { data: CampaignOrchestrationOutput, width: number, height: number, isDarkTheme: boolean }) => {
  if (width < 100 || height < 100) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart requires more space to render
        </p>
      </div>
    );
  }

  const margin = { top: 20, right: 20, bottom: 100, left: 60 };
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

  const syncData = [
    { name: "CRM System", status: data.system_sync_status === "Complete" ? 100 : data.system_sync_status === "Partial" ? 75 : data.system_sync_status === "Pending" ? 25 : 0 },
    { name: "Marketing Platform", status: data.system_sync_status === "Complete" ? 100 : data.system_sync_status === "Partial" ? 85 : data.system_sync_status === "Pending" ? 30 : 0 },
    { name: "Analytics Engine", status: data.system_sync_status === "Complete" ? 100 : data.system_sync_status === "Partial" ? 90 : data.system_sync_status === "Pending" ? 40 : 0 },
    { name: "Notification System", status: data.notifications_sent.length > 0 ? 100 : 0 },
    { name: "Issue Resolution", status: data.issues_detected?.length === 0 ? 100 : data.issues_detected?.length === 1 ? 80 : 60 }
  ];

  const maxValue = 100;
  const barWidth = Math.min(chartWidth / syncData.length * 0.6, 60);
  const barSpacing = (chartWidth - (barWidth * syncData.length)) / (syncData.length + 1);

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
        {syncData.map((d, i) => {
          const barHeight = (d.status / maxValue) * chartHeight;
          const x = barSpacing + i * (barWidth + barSpacing);
          const y = chartHeight - barHeight;
          const color = d.status >= 90 ? (isDarkTheme ? '#10b981' : '#059669') :
                       d.status >= 70 ? (isDarkTheme ? '#f59e0b' : '#d97706') :
                       d.status >= 50 ? (isDarkTheme ? '#3b82f6' : '#2563eb') :
                       (isDarkTheme ? '#ef4444' : '#dc2626');

          const labelX = x + barWidth / 2;
          const labelY = chartHeight + 15;

          return (
            <g key={`bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={4}
              />
              {/* System name - rotated */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="end"
                fill={isDarkTheme ? '#9ca3af' : '#6b7280'}
                fontSize={9}
                transform={`rotate(-45, ${labelX}, ${labelY})`}
              >
                {d.name}
              </text>
              {/* Percentage */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fill={isDarkTheme ? '#ffffff' : '#000000'}
                fontSize={10}
                fontWeight="bold"
              >
                {d.status}%
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
              {value}%
            </text>
          );
        })}
      </g>
    </svg>
  );
};

const NotificationPieChart = ({ data, width, height, isDarkTheme }: { data: CampaignOrchestrationOutput, width: number, height: number, isDarkTheme: boolean }) => {
  if (width < 100 || height < 100) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart requires more space to render
        </p>
      </div>
    );
  }

  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = Math.max(0, width - margin.left - margin.right);
  const chartHeight = Math.max(0, height - margin.top - margin.bottom);
  const radius = Math.min(chartWidth, chartHeight) / 2;

  if (radius <= 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          Chart area too small
        </p>
      </div>
    );
  }

  const notificationData = [
    { label: "Notified", value: data.notifications_sent.length, color: isDarkTheme ? '#10b981' : '#059669' },
    { label: "Pending", value: Math.max(0, 5 - data.notifications_sent.length), color: isDarkTheme ? '#6b7280' : '#9ca3af' }
  ];

  const total = notificationData.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
          No notification data
        </p>
      </div>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;
  let currentAngle = -Math.PI / 2;

  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const x1 = centerX + Math.cos(startAngle) * outerRadius;
    const y1 = centerY + Math.sin(startAngle) * outerRadius;
    const x2 = centerX + Math.cos(endAngle) * outerRadius;
    const y2 = centerY + Math.sin(endAngle) * outerRadius;

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

    return [
      `M ${centerX + Math.cos(startAngle) * innerRadius} ${centerY + Math.sin(startAngle) * innerRadius}`,
      `L ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${centerX + Math.cos(endAngle) * innerRadius} ${centerY + Math.sin(endAngle) * innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${centerX + Math.cos(startAngle) * innerRadius} ${centerY + Math.sin(startAngle) * innerRadius}`,
      'Z'
    ].join(' ');
  };

  return (
    <svg width={width} height={height}>
      <g>
        {notificationData.map((item, i) => {
          const angle = (item.value / total) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          const percentage = Math.round((item.value / total) * 100);

          const centroidAngle = startAngle + angle / 2;
          const centroidX = centerX + Math.cos(centroidAngle) * (radius * 0.7);
          const centroidY = centerY + Math.sin(centroidAngle) * (radius * 0.7);

          currentAngle = endAngle;

          return (
            <g key={`arc-${i}`}>
              <path
                d={createArcPath(startAngle, endAngle, radius * 0.4, radius)}
                fill={item.color}
                stroke={isDarkTheme ? '#374151' : '#ffffff'}
                strokeWidth={2}
              />
              {percentage > 5 && (
                <text
                  x={centroidX}
                  y={centroidY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isDarkTheme ? '#ffffff' : '#000000'}
                  fontSize={12}
                  fontWeight="bold"
                >
                  {percentage}%
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Legend */}
      <g transform={`translate(10, ${height - 60})`}>
        {notificationData.map((item, i) => (
          <g key={`legend-${i}`}>
            <rect
              x={0}
              y={i * 20}
              width={12}
              height={12}
              fill={item.color}
              stroke={isDarkTheme ? '#374151' : '#ffffff'}
              strokeWidth={1}
            />
            <text
              x={18}
              y={i * 20 + 9}
              fill={isDarkTheme ? '#ffffff' : '#000000'}
              fontSize={11}
              fontWeight="500"
            >
              {item.label} ({item.value})
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

// Default data when no response is available
const defaultCampaignData: CampaignOrchestrationOutput = {
  summary: "Campaign orchestration completed successfully. All systems have been synchronized, stakeholders notified, and the campaign is ready for launch across all specified channels and regions.",
  reasoning_steps: [
    {
      step_number: 1,
      description: "Validated campaign parameters and cross-referenced with system capabilities",
      data_sources: ["orchestrate_campaign tool", "System configuration data"],
      calculations: "Verified channel availability, region coverage, and SKU inventory levels",
      insights: "All target regions and channels are operational and ready for campaign deployment"
    },
    {
      step_number: 2,
      description: "Coordinated stakeholder notifications and system synchronization",
      data_sources: ["Notification system", "CRM integration"],
      calculations: "Calculated optimal notification timing and system sync priorities",
      insights: "Successfully synchronized 5 systems and notified 8 stakeholders across all regions"
    }
  ],
  external_sources_used: {
    external_sources_used: false,
    external_sources_description: "Only mock data from orchestrate_campaign tool was used. No external sources were consulted.",
    mock_data_sufficiency: "Sufficient",
    additional_data_needed: []
  },
  sources: [
    {
      tool: "orchestrate_campaign",
      endpoint: "https://41nipubgc2.execute-api.us-east-1.amazonaws.com/dev/api/files/excel-inv-sales/supply-chain-retail-mock-data/Use_Cases_Mock_Data.xlsx",
      params: {},
      time_window: "2025-01-01..2025-01-31",
      records: 300
    }
  ],
  notifications_sent: [
    "Marketing Team",
    "Sales Operations",
    "Regional Managers",
    "IT Support",
    "Analytics Team",
    "Customer Service",
    "Finance Team",
    "Legal Compliance"
  ],
  system_sync_status: "Complete",
  issues_detected: []
};

export default function CampaignResultPage() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [campaignName, setCampaignName] = useState<string>("Campaign Orchestration")
  const [campaignDates, setCampaignDates] = useState<{ start: string | null; end: string | null }>({ start: null, end: null })
  const [savedResponses, setSavedResponses] = useState<SavedCampaignResponse[]>([])
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null)
  const [data, setData] = useState<CampaignOrchestrationOutput>(defaultCampaignData)

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

  const loadResponseData = useCallback((response: SavedCampaignResponse) => {
    setLastFetchTime(new Date(response.created_at));
    setCampaignName(response.campaign_name || "Campaign Orchestration");
    setCampaignDates({
      start: response.start_date,
      end: response.end_date
    });

    try {
      setData(response.agent_response);
    } catch (error) {
      console.error('Error loading campaign data:', error);
      setData(defaultCampaignData);
    }
  }, []);

  const fetchLastResponses = async () => {
    try {
      const { data: responseData } = await supabase
        .from('campaignResult')
        .select('id, created_at, campaign_name, start_date, end_date, agent_response')
        .order('created_at', { ascending: false })
        .limit(4);

      if (responseData && responseData.length > 0) {
        setSavedResponses(responseData as SavedCampaignResponse[]);
        setSelectedResponseId(responseData[0].id);
      } else {
        // No data found, use default
        setSavedResponses([]);
        setSelectedResponseId(null);
        setData(defaultCampaignData);
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching campaign responses:', error);
      // Use default data on error
      setData(defaultCampaignData);
      setLastFetchTime(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseSelect = (responseId: number) => {
    setSelectedResponseId(responseId);
  };

  // Load data when selectedResponseId changes
  useEffect(() => {
    if (selectedResponseId !== null && savedResponses.length > 0) {
      const selected = savedResponses.find(r => r.id === selectedResponseId);
      if (selected) {
        loadResponseData(selected);
      }
    }
  }, [selectedResponseId, savedResponses, loadResponseData]);

  // Fetch data on initial load
  useEffect(() => {
    setIsLoading(true);
    fetchLastResponses();
  }, []);

  // Update time ago string periodically
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Complete":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          progress: 100,
          description: "All systems synchronized successfully",
        }
      case "Partial":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
          progress: 75,
          description: "Most systems synchronized, some pending",
        }
      case "Pending":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Activity,
          progress: 25,
          description: "System synchronization in progress",
        }
      case "Failed":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          progress: 0,
          description: "System synchronization failed",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Clock,
          progress: 0,
          description: "Status unknown",
        }
    }
  }

  const statusInfo = getStatusInfo(data.system_sync_status)
  const StatusIcon = statusInfo.icon
  const issueCount = data.issues_detected?.length || 0
  const notificationCount = data.notifications_sent.length

  // Calculate overall readiness score
  const baseScore = statusInfo.progress
  const issueDeduction = issueCount * 10
  const readinessScore = Math.max(0, Math.min(100, baseScore - issueDeduction))

  const getReadinessStatus = (score: number) => {
    if (score >= 90) return { status: "Ready to Launch", color: "text-green-600" }
    if (score >= 70) return { status: "Nearly Ready", color: "text-yellow-600" }
    if (score >= 50) return { status: "Needs Attention", color: "text-orange-600" }
    return { status: "Not Ready", color: "text-red-600" }
  }

  const readinessStatus = getReadinessStatus(readinessScore)

  const cardThemeClasses = isDarkTheme
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-purple-900' : 'bg-purple-100'}`}>
              <Megaphone className={`h-6 w-6 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Campaign Orchestration
              </h1>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Campaign management and stakeholder coordination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className={isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
            >
              {isDarkTheme ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Timestamp and Dropdown Bar */}
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
                  Recent Campaigns:
                </label>
                <select
                  value={selectedResponseId ?? ''}
                  onChange={(e) => handleResponseSelect(Number(e.target.value))}
                  className={`px-3 py-2 rounded border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkTheme
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {savedResponses.map((response, index) => (
                    <option key={response.id} value={response.id}>
                      {index === 0 ? '★ ' : ''}{response.campaign_name || `Campaign ${index + 1}`}
                      {' '}({new Date(response.created_at).toLocaleDateString()} {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Campaign Name Heading */}
          <div className="mb-6">
            <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              {campaignName}
            </h1>
            {(campaignDates.start || campaignDates.end) && (
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Campaign Period: {campaignDates.start ? new Date(campaignDates.start).toLocaleDateString() : 'N/A'} - {campaignDates.end ? new Date(campaignDates.end).toLocaleDateString() : 'N/A'}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {/* Summary Section */}
            <Card className={cardThemeClasses}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="h-5 w-5" />
                  Campaign Orchestration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`leading-relaxed mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-muted-foreground'}`}>{data.summary}</p>

                {/* Overall Readiness Indicator */}
                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : ''}`}>Campaign Readiness</span>
                    <span className={`text-sm font-bold ${readinessStatus.color}`}>{readinessStatus.status}</span>
                  </div>
                  <Progress value={readinessScore} className="h-2" />
                  <div className={`flex justify-between text-xs mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    <span>0%</span>
                    <span className="font-medium">{readinessScore}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className={cardThemeClasses}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={`h-5 w-5 ${statusInfo.progress === 100 ? "text-green-600" : statusInfo.progress >= 50 ? "text-yellow-600" : "text-red-600"}`}
                    />
                    <div>
                      <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : ''}`}>{data.system_sync_status}</div>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>System Sync</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cardThemeClasses}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className={`text-2xl font-bold ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>{notificationCount}</div>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Teams Notified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cardThemeClasses}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${issueCount > 0 ? "text-red-600" : "text-green-600"}`} />
                    <div>
                      <div className={`text-2xl font-bold ${issueCount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {issueCount}
                      </div>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Issues Detected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cardThemeClasses}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className={`text-2xl font-bold ${readinessStatus.color}`}>{readinessScore}%</div>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Ready Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reasoning Steps Section */}
            {data.reasoning_steps && data.reasoning_steps.length > 0 && (
              <Card className={cardThemeClasses}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <BarChart3 className="h-5 w-5" />
                    Campaign Orchestration Process
                  </CardTitle>
                  <CardDescription>Detailed breakdown of the logic and reasoning steps used to prepare the campaign orchestration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.reasoning_steps.map((step, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isDarkTheme ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {step.step_number}
                          </div>
                          <div className="flex-1 space-y-3">
                            <h4 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                              {step.description}
                            </h4>

                            {step.data_sources && step.data_sources.length > 0 && (
                              <div>
                                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Data Sources:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {step.data_sources.map((source, sourceIndex) => (
                                    <Badge key={sourceIndex} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.calculations && (
                              <div>
                                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Calculations:</p>
                                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{step.calculations}</p>
                              </div>
                            )}

                            {step.insights && (
                              <div>
                                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Insights:</p>
                                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{step.insights}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Sources Section */}
            {data.external_sources_used && (
              <Card className={cardThemeClasses}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <Activity className="h-5 w-5" />
                    Data Source Analysis
                  </CardTitle>
                  <CardDescription>Information about data sources used and their sufficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${
                      data.external_sources_used.external_sources_used
                        ? (isDarkTheme ? 'bg-amber-900 border-amber-700' : 'bg-amber-50 border-amber-200')
                        : (isDarkTheme ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200')
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {data.external_sources_used.external_sources_used ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                        <span className={`font-medium ${
                          data.external_sources_used.external_sources_used
                            ? (isDarkTheme ? 'text-amber-100' : 'text-amber-900')
                            : (isDarkTheme ? 'text-green-100' : 'text-green-900')
                        }`}>
                          {data.external_sources_used.external_sources_used ? 'External Sources Used' : 'Mock Data Only'}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        data.external_sources_used.external_sources_used
                          ? (isDarkTheme ? 'text-amber-200' : 'text-amber-800')
                          : (isDarkTheme ? 'text-green-200' : 'text-green-800')
                      }`}>
                        {data.external_sources_used.external_sources_description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className={`font-medium mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Data Sufficiency</h4>
                        <Badge variant="outline" className={
                          data.external_sources_used.mock_data_sufficiency === 'Sufficient'
                            ? 'border-green-500 text-green-700'
                            : 'border-amber-500 text-amber-700'
                        }>
                          {data.external_sources_used.mock_data_sufficiency}
                        </Badge>
                      </div>

                      {data.external_sources_used.additional_data_needed && data.external_sources_used.additional_data_needed.length > 0 && (
                        <div>
                          <h4 className={`font-medium mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Additional Data Needed</h4>
                          <div className="space-y-1">
                            {data.external_sources_used.additional_data_needed.map((dataType, index) => (
                              <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                                {dataType}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources Section */}
            {data.sources && data.sources.length > 0 && (
              <Card className={cardThemeClasses}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <Database className="h-5 w-5" />
                    Data Sources Used
                  </CardTitle>
                  <CardDescription>Detailed information about internal and external data sources consulted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.sources.map((source, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={isDarkTheme ? 'text-purple-200 border-purple-300' : 'text-purple-700 border-purple-300'}>
                                {source.tool}
                              </Badge>
                              {source.tool !== 'orchestrate_campaign' && (
                                <ExternalLink className="h-4 w-4 text-purple-500" />
                              )}
                            </div>

                            <div>
                              <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Endpoint:</p>
                              <p className={`text-sm font-mono ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} break-all`}>
                                {source.endpoint}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Time Window:</p>
                                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {source.time_window}
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Records Retrieved:</p>
                                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {source.records.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Parameters:</p>
                                <p className={`text-sm font-mono ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} break-all`}>
                                  {JSON.stringify(source.params, null, 2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visualization Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Sync Status Chart */}
              <Card className={cardThemeClasses}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <BarChart3 className="h-5 w-5" />
                    System Synchronization Status
                  </CardTitle>
                  <CardDescription>Integration status with key campaign systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <SyncStatusChart
                      data={data}
                      width={500}
                      height={320}
                      isDarkTheme={isDarkTheme}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Status Pie Chart */}
              <Card className={cardThemeClasses}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <PieChart className="h-5 w-5" />
                    Notification Status
                  </CardTitle>
                  <CardDescription>Stakeholder notification distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <NotificationPieChart
                      data={data}
                      width={600}
                      height={320}
                      isDarkTheme={isDarkTheme}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Sync Status */}
            <Card className={cardThemeClasses}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <Settings className="h-5 w-5" />
                  System Synchronization Details
                </CardTitle>
                <CardDescription>Integration status with key campaign systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg border ${statusInfo.color}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <StatusIcon className="h-6 w-6" />
                    <div>
                      <h3 className={`font-semibold text-lg`}>{data.system_sync_status}</h3>
                      <p className={`text-sm opacity-80`}>{statusInfo.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Synchronization Progress</span>
                      <span className={`font-medium`}>{statusInfo.progress}%</span>
                    </div>
                    <Progress value={statusInfo.progress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues Detected */}
            {data.issues_detected && data.issues_detected.length > 0 && (
              <Card className={cardThemeClasses}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Issues Requiring Attention
                  </CardTitle>
                  <CardDescription>Campaign-blocking issues that need immediate resolution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.issues_detected.map((issue, index) => (
                      <Alert key={index} className={`border-l-4 border-l-red-500 ${isDarkTheme ? 'bg-red-900 border-red-700' : ''}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold ${isDarkTheme ? 'text-white' : ''}`}>Issue #{index + 1}</span>
                              <Badge variant="destructive">Action Required</Badge>
                            </div>
                            <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-muted-foreground'}`}>{issue.issue}</p>
                            <div className={`p-3 rounded border-l-2 border-purple-500 ${isDarkTheme ? 'bg-purple-900' : 'bg-purple-50'}`}>
                              <p className={`text-sm font-medium ${isDarkTheme ? 'text-purple-100' : 'text-purple-900'}`}>
                                <strong>Recommended Action:</strong> {issue.recommended_action}
                              </p>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Sent */}
            <Card className={cardThemeClasses}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <Users className="h-5 w-5 text-purple-600" />
                  Stakeholder Notifications
                </CardTitle>
                <CardDescription>Teams and departments that have been notified about the campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.notifications_sent.map((stakeholder, index) => (
                    <div key={index} className={`flex items-center gap-2 p-3 rounded-lg border ${isDarkTheme ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className={`text-sm font-medium ${isDarkTheme ? 'text-green-100' : 'text-green-800'}`}>{stakeholder}</span>
                      <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                    </div>
                  ))}
                </div>

                {data.notifications_sent.length === 0 && (
                  <div className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications sent yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Readiness Checklist */}
            <Card className={cardThemeClasses}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <CheckCircle className="h-5 w-5" />
                  Campaign Readiness Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <CheckCircle className={`h-5 w-5 ${statusInfo.progress === 100 ? "text-green-600" : "text-gray-400"}`} />
                    <div className="flex-1">
                      <span className={`font-medium ${isDarkTheme ? 'text-white' : ''}`}>System Synchronization</span>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>All systems integrated and synchronized</p>
                    </div>
                    <Badge variant={statusInfo.progress === 100 ? "default" : "secondary"}>{data.system_sync_status}</Badge>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <CheckCircle className={`h-5 w-5 ${notificationCount > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <div className="flex-1">
                      <span className={`font-medium ${isDarkTheme ? 'text-white' : ''}`}>Stakeholder Notifications</span>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>All relevant teams have been notified</p>
                    </div>
                    <Badge variant={notificationCount > 0 ? "default" : "secondary"}>{notificationCount} Sent</Badge>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <CheckCircle className={`h-5 w-5 ${issueCount === 0 ? "text-green-600" : "text-red-600"}`} />
                    <div className="flex-1">
                      <span className={`font-medium ${isDarkTheme ? 'text-white' : ''}`}>Issue Resolution</span>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>All blocking issues resolved</p>
                    </div>
                    <Badge variant={issueCount === 0 ? "default" : "destructive"}>
                      {issueCount} {issueCount === 1 ? "Issue" : "Issues"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer isDarkTheme={isDarkTheme} />
    </div>
  )
}
