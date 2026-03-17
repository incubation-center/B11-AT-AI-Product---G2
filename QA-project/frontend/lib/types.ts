// User types
export interface User {
  user_id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  is_verified: boolean;
  created_at: string;
}

export interface UserDetail extends User {}

// Auth types
export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface LoginResponse {
  user: User;
  token: AuthToken;
}

export interface RegisterResponse {
  message: string;
}

// Dataset types
export interface Dataset {
  dataset_id: number;
  user_id: number;
  file_name: string;
  file_type: string;
  upload_type: "manual" | "jira" | "azure_devops";
  uploaded_at: string;
  defect_count?: number;
}

export interface DatasetUploadResponse {
  dataset: Dataset;
  defects_imported: number;
  message: string;
}

export interface DatasetListResponse {
  datasets: Dataset[];
  total: number;
}

// Defect types
export interface Defect {
  defect_id: number;
  dataset_id: number;
  bug_id?: string;
  title: string;
  module?: string;
  severity?: string;
  priority?: string;
  environment?: string;
  status?: string;
  created_date?: string;
  resolved_date?: string;
  closed_date?: string;
}

export interface DefectCreate {
  dataset_id: number;
  bug_id?: string;
  title: string;
  module?: string;
  severity?: string;
  priority?: string;
  environment?: string;
  status?: string;
  created_date?: string;
  resolved_date?: string;
  closed_date?: string;
}

export interface DefectUpdate {
  bug_id?: string;
  title?: string;
  module?: string;
  severity?: string;
  priority?: string;
  environment?: string;
  status?: string;
  created_date?: string;
  resolved_date?: string;
  closed_date?: string;
}

export interface DefectListResponse {
  defects: Defect[];
  total: number;
  page: number;
  page_size: number;
}

// Analytics types
export interface DefectSummary {
  dataset_id: number;
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  reopened: number;
  unresolved: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
  percentage: number;
}

export interface SeverityResponse {
  dataset_id: number;
  distribution: SeverityDistribution[];
  total: number;
}

export interface ResolutionTimeResponse {
  dataset_id: number;
  total_resolved: number;
  avg_days?: number;
  median_days?: number;
  min_days?: number;
  max_days?: number;
  percentile_90?: number;
}

export interface ReopenRateResponse {
  dataset_id: number;
  total_defects: number;
  reopened_count: number;
  reopen_rate_percent: number;
  quality_indicator: string;
}

export interface EnvironmentBreakdown {
  environment: string;
  count: number;
}

export interface LeakageResponse {
  dataset_id: number;
  total_defects: number;
  leaked_count: number;
  leakage_rate_percent: number;
  environment_breakdown: EnvironmentBreakdown[];
  risk_level: string;
}

export interface ModuleRisk {
  risk_id: number;
  module_name: string;
  bug_count: number;
  reopen_rate?: number;
  risk_score?: number;
  risk_level: string;
  computed_at?: string;
}

export interface ModuleRisksResponse {
  dataset_id: number;
  modules: ModuleRisk[];
  total_modules: number;
}

export interface StatusFlow {
  transition: string;
  count: number;
}

export interface LifecycleResponse {
  dataset_id: number;
  total_tracked: number;
  total_reopened: number;
  avg_resolution_days?: number;
  max_resolution_days?: number;
  min_resolution_days?: number;
  status_flow: StatusFlow[];
}

export interface LifecycleDefect {
  lifecycle_id: number;
  defect_id: number;
  bug_id?: string;
  title?: string;
  module?: string;
  current_status?: string;
  from_status?: string;
  to_status?: string;
  changed_at?: string;
  reopen_count: number;
  resolution_days?: number;
}

export interface LifecycleDefectsResponse {
  dataset_id: number;
  items: LifecycleDefect[];
  total: number;
  page: number;
  page_size: number;
}

export interface SeverityResolutionData {
  severity: string;
  count: number;
  avg_resolution_days?: number;
  min_resolution_days?: number;
  max_resolution_days?: number;
}

export interface SeverityResolutionResponse {
  dataset_id: number;
  data: SeverityResolutionData[];
}

export interface ComputeAnalyticsResponse {
  message: string;
  dataset_id: number;
  lifecycle_records: number;
  reopen_rate?: number;
  avg_resolution_time?: number;
  defect_leakage_rate?: number;
  module_risks_computed: number;
}

// AI types
export interface IndexResponse {
  message: string;
  dataset_id: number;
  chunks_created: number;
  vectors_upserted: number;
  defects_processed: number;
}

export interface AskResponse {
  query_id: number;
  question: string;
  answer: string;
  sources: string[];
  dataset_name?: string;
}

export interface SuggestionsResponse {
  dataset_id: number;
  dataset_name?: string;
  suggestions: string;
  chunks_analyzed: number;
}

export interface AIQuery {
  query_id: number;
  question: string;
  answer?: string;
  source_reference?: string;
  asked_at?: string;
}

export interface AIQueriesResponse {
  items: AIQuery[];
  total: number;
  page: number;
  page_size: number;
}

// Report types
export interface ReportMeta {
  report_id: number;
  dataset_id: number;
  report_type: "pdf" | "csv" | "excel";
  file_name: string;
  generated_at: string;
}

export interface GenerateReportResponse {
  message: string;
  report: ReportMeta;
}

export interface ReportsResponse {
  dataset_id: number;
  reports: ReportMeta[];
  total: number;
}
