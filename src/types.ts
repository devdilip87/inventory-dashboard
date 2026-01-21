export interface ForecastRecord {
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

export interface DemandForecastingOutput {
  summary: string;
  forecast_data: ForecastRecord[];
  recommendation: string;
}

export interface WrappedComponentProps {
  hostData?: any;
  incomingData?: any;
}

export interface FormField {
    title?: string;
    type: string;
    description: string;
}
  
export interface FormSchema {
    [key: string]: FormField;
}

export interface InputSchema {
    description: string;
    required: string[];
    properties: FormSchema;
}

export interface ViewDisplay {
    title: string;
    iconURL?: string;
    position: number;
    column: number;
    expand?: boolean;
    height?: number;
}

export interface ViewRendering {
    type: "iframe";
    source: {
        url: string;
    };
    additionalData?: Record<string, unknown>;
}

export interface ViewInputHandler {
    id: string;
    name: string;
    description: string;
    type: string;
}

export interface IncomingEdge {
    edgeId: string;
    sourceHandleId: string;
    targetHandleId: string;
    sourceBlockId: string;
    targetBlockId: string;
}

export interface ViewConfig {
    id: string;
    schemaVersion: string;
    display: ViewDisplay;
    rendering: ViewRendering;
    metadata: Record<string, unknown>;
    inputHandlers: ViewInputHandler[];
    schema?: Record<string, unknown>;
}

export interface Workspace {
    id: string;
    mode: string;
}

export interface AgentTask {
    description: string;
    id: string;
    name: boolean;
}

export interface AgentTool {
    description: string;
    id: string;
    name: string;
}

export interface AgentInputData {
    schema: Record<string, unknown>;
    data: Record<string, unknown>;
}

export interface AgentNode {
    agentId: string;
    name: string;
    description?: string;
    displayName: string;
    iconUrl?: string;
    input_schema: InputSchema;
    llm?: string;
    output_schema: Record<string, unknown>;
    system_prompt?: string;
    tools?: AgentTool[];
    tasks?: AgentTask[];
}

export interface DemandForecastingOutput {
    summary: string;
    forecast_data: Array<{
        item: string;
        category?: string;
        region: string;
        forecasted_demand: number;
        on_hand_inventory: number;
        expected_inventory: number;
        confidence_score: number;
        anomaly_flag?: boolean;
        insight_reasoning?: string;
    }>;
    recommendation: string;
}

export interface IHostData {
    blockId?: string;
    projectId?: string;
    project?: { id?: string };
    workspace?: Workspace;
    client?: { id?: string };
    appConfig?: ViewConfig;
    incomingEdges?: IncomingEdge[];
    agentNodes?: AgentNode[];
    source: string;
}

export interface SupabaseDemandForecast {
  id: number;
  agent_response: DemandForecastingOutput;
  created_at: string;
  updated_at: string;
}

