import type {
  User,
  LoginResponse,
  RegisterResponse,
  Dataset,
  DatasetUploadResponse,
  DatasetListResponse,
  Defect,
  DefectCreate,
  DefectUpdate,
  DefectListResponse,
  DefectSummary,
  SeverityResponse,
  ResolutionTimeResponse,
  ReopenRateResponse,
  LeakageResponse,
  ModuleRisksResponse,
  LifecycleResponse,
  LifecycleDefectsResponse,
  SeverityResolutionResponse,
  ComputeAnalyticsResponse,
  IndexResponse,
  AskResponse,
  SuggestionsResponse,
  AIQueriesResponse,
  GenerateReportResponse,
  ReportsResponse,
  UserDetail,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export { getCookie, setCookie, deleteCookie };

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getCookie("token");
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    deleteCookie("token");
    deleteCookie("user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || errorData.message || "Request failed",
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyRegistration: (data: { email: string; otp_code: string }) =>
    request<LoginResponse>("/auth/verify-registration", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { email: string; otp_code: string; new_password: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendOtp: (data: { email: string }) =>
    request<{ message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/auth/me"),
};

// Datasets API
export const datasets = {
  list: (page: number = 1, pageSize: number = 10) =>
    request<DatasetListResponse>(`/datasets/?page=${page}&page_size=${pageSize}`),

  get: (datasetId: number) =>
    request<Dataset>(`/datasets/${datasetId}`),

  upload: (file: File, uploadType: "manual" | "jira" | "azure_devops") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_type", uploadType);
    return request<DatasetUploadResponse>("/datasets/upload", {
      method: "POST",
      body: formData,
    });
  },

  delete: (datasetId: number) =>
    request<void>(`/datasets/${datasetId}`, { method: "DELETE" }),
};

// Defects API
export const defects = {
  list: (params: {
    dataset_id?: number;
    page?: number;
    page_size?: number;
    severity?: string;
    status?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.dataset_id) searchParams.append("dataset_id", params.dataset_id.toString());
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.page_size) searchParams.append("page_size", params.page_size.toString());
    if (params.severity) searchParams.append("severity", params.severity);
    if (params.status) searchParams.append("status", params.status);
    if (params.search) searchParams.append("search", params.search);
    return request<DefectListResponse>(`/defects/?${searchParams.toString()}`);
  },

  get: (defectId: number) =>
    request<Defect>(`/defects/${defectId}`),

  create: (data: DefectCreate) =>
    request<Defect>("/defects/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (defectId: number, data: DefectUpdate) =>
    request<Defect>(`/defects/${defectId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (defectId: number) =>
    request<void>(`/defects/${defectId}`, { method: "DELETE" }),
};

// Analytics API
export const analytics = {
  compute: (datasetId: number) =>
    request<ComputeAnalyticsResponse>(`/analytics/compute/${datasetId}`, {
      method: "POST",
    }),

  summary: (datasetId: number) =>
    request<DefectSummary>(`/analytics/${datasetId}/summary`),

  severity: (datasetId: number) =>
    request<SeverityResponse>(`/analytics/${datasetId}/severity`),

  resolutionTime: (datasetId: number) =>
    request<ResolutionTimeResponse>(`/analytics/${datasetId}/resolution-time`),

  reopenRate: (datasetId: number) =>
    request<ReopenRateResponse>(`/analytics/${datasetId}/reopen-rate`),

  leakage: (datasetId: number) =>
    request<LeakageResponse>(`/analytics/${datasetId}/leakage`),

  moduleRisks: (datasetId: number) =>
    request<ModuleRisksResponse>(`/analytics/${datasetId}/module-risks`),

  lifecycle: (datasetId: number) =>
    request<LifecycleResponse>(`/analytics/${datasetId}/lifecycle`),

  lifecycleDefects: (datasetId: number, page: number = 1, pageSize: number = 10) =>
    request<LifecycleDefectsResponse>(
      `/analytics/${datasetId}/lifecycle/defects?page=${page}&page_size=${pageSize}`
    ),

  severityResolution: (datasetId: number) =>
    request<SeverityResolutionResponse>(`/analytics/${datasetId}/severity-resolution`),
};

// AI API
export const ai = {
  index: (datasetId: number) =>
    request<IndexResponse>(`/ai/index/${datasetId}`, { method: "POST" }),

  ask: (data: { dataset_id: number; question: string; top_k?: number }) =>
    request<AskResponse>("/ai/ask", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  suggestions: (datasetId: number) =>
    request<SuggestionsResponse>(`/ai/suggestions/${datasetId}`),

  queries: (datasetId: number, page: number = 1, pageSize: number = 10) =>
    request<AIQueriesResponse>(
      `/ai/queries/${datasetId}?page=${page}&page_size=${pageSize}`
    ),
};

// Reports API
export const reports = {
  generate: (data: { dataset_id: number; format: "pdf" | "csv" | "excel" }) =>
    request<GenerateReportResponse>("/reports/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (datasetId: number) =>
    request<ReportsResponse>(`/reports/${datasetId}`),

  downloadUrl: (reportId: number) => {
    const token = getCookie("token");
    return `${API_BASE_URL}/reports/download/${reportId}?token=${token}`;
  },
};

// Users API
export const users = {
  list: (page: number = 1, pageSize: number = 10, search?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    if (search) params.append("search", search);
    return request<{ users: UserDetail[]; total: number }>(`/users/?${params.toString()}`);
  },

  get: (userId: number) =>
    request<UserDetail>(`/users/${userId}`),

  updateMe: (data: { name?: string; email?: string }) =>
    request<UserDetail>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateRole: (userId: number, role: "user" | "admin") =>
    request<UserDetail>(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  delete: (userId: number) =>
    request<void>(`/users/${userId}`, { method: "DELETE" }),
};
