import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),

  signup: (name: string, email: string, password: string) =>
    apiClient.post("/auth/signup", { name, email, password }),

  verifyToken: () => apiClient.get("/auth/verify"),
};

export const projectAPI = {
  getAll: () => apiClient.get("/projects"),
  get: (id: string) => apiClient.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    apiClient.post("/projects", data),
  update: (id: string, data: any) => apiClient.put(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  join: (projectId: string) => apiClient.post("/projects/join", { projectId }),
};

export const groupAPI = {
  getByProject: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/groups`),
  get: (groupId: string) => apiClient.get(`/groups/${groupId}`), // Added
  create: (projectId: string, data: { name: string; description?: string }) =>
    apiClient.post(`/projects/${projectId}/groups`, data),
  update: (groupId: string, data: any) =>
    apiClient.put(`/groups/${groupId}`, data),
  delete: (groupId: string) => apiClient.delete(`/groups/${groupId}`),
};

export const messageAPI = {
  getByGroup: (groupId: string, page = 1, limit = 50) =>
    apiClient.get(`/groups/${groupId}/messages`, { params: { page, limit } }),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const aiAPI = {
  classify: (messages: any[], context?: any) =>
    axios.post(`${AI_SERVICE_URL}/ai/classify`, { messages, context }),
  ask: (query_type: string, messages: any[], query?: string, context?: any) =>
    axios.post(`${AI_SERVICE_URL}/ai/ask`, {
      query_type,
      messages,
      query,
      context,
    }),
};

export const contextAPI = {
  getAll: (params?: { category?: string; groupId?: string; limit?: number }) =>
    apiClient.get("/context", { params }),
};
