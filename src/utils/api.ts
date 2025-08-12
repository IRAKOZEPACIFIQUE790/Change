// API configuration and utilities
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// API endpoints
export const API_ENDPOINTS = {
  // Public endpoints
  PUBLIC: {
    HEALTH: `${API_BASE_URL}/public/health`,
    MENU: `${API_BASE_URL}/public/menu`,
    CATEGORIES: `${API_BASE_URL}/public/menu/categories`,
    FEATURED: `${API_BASE_URL}/public/menu/featured`,
  },

  // Admin endpoints
  ADMIN: {
    REGISTER: `${API_BASE_URL}/admin/register`,
    LOGIN: `${API_BASE_URL}/admin/login`,
    MENU_ITEMS: `${API_BASE_URL}/admin/menu-items`,
    ORDERS: `${API_BASE_URL}/admin/orders`,
    STATS_TOP_ITEMS: `${API_BASE_URL}/admin/stats/top-items`,
  },

  // User endpoints
  USER: {
    REGISTER: `${API_BASE_URL}/user/register`,
    LOGIN: `${API_BASE_URL}/user/login`,
    PROFILE: `${API_BASE_URL}/user/profile`,
    ORDERS: `${API_BASE_URL}/user/orders`,
  },
};

// API utility functions
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token =
    localStorage.getItem("userToken") || localStorage.getItem("adminToken");

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// Specific API functions
export const publicAPI = {
  getHealth: () => apiRequest(API_ENDPOINTS.PUBLIC.HEALTH),
  getMenu: (params?: URLSearchParams) => {
    const url = params
      ? `${API_ENDPOINTS.PUBLIC.MENU}?${params}`
      : API_ENDPOINTS.PUBLIC.MENU;
    return apiRequest(url);
  },
  getCategories: () => apiRequest(API_ENDPOINTS.PUBLIC.CATEGORIES),
  getFeatured: () => apiRequest(API_ENDPOINTS.PUBLIC.FEATURED),
};

export const userAPI = {
  register: (data: any) =>
    apiRequest(API_ENDPOINTS.USER.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: any) =>
    apiRequest(API_ENDPOINTS.USER.LOGIN, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProfile: () => apiRequest(API_ENDPOINTS.USER.PROFILE),
  updateProfile: (data: any) =>
    apiRequest(API_ENDPOINTS.USER.PROFILE, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  createOrder: (data: any) =>
    apiRequest(API_ENDPOINTS.USER.ORDERS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getOrders: () => apiRequest(API_ENDPOINTS.USER.ORDERS),
  cancelOrder: (id: string) =>
    apiRequest(`${API_ENDPOINTS.USER.ORDERS}/${id}/cancel`, {
      method: "PUT",
    }),
};

export const adminAPI = {
  register: (data: any) =>
    apiRequest(API_ENDPOINTS.ADMIN.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: any) =>
    apiRequest(API_ENDPOINTS.ADMIN.LOGIN, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMenuItems: () => apiRequest(API_ENDPOINTS.ADMIN.MENU_ITEMS),
  createMenuItem: (data: any) =>
    apiRequest(API_ENDPOINTS.ADMIN.MENU_ITEMS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenuItem: (id: string, data: any) =>
    apiRequest(`${API_ENDPOINTS.ADMIN.MENU_ITEMS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMenuItem: (id: string) =>
    apiRequest(`${API_ENDPOINTS.ADMIN.MENU_ITEMS}/${id}`, {
      method: "DELETE",
    }),
  getOrders: () => apiRequest(API_ENDPOINTS.ADMIN.ORDERS),
  updateOrderStatus: (id: string, status: string) =>
    apiRequest(`${API_ENDPOINTS.ADMIN.ORDERS}/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getTopItems: (
    params: {
      days?: number | string;
      status?: string;
      rankBy?: "quantity" | "revenue";
      limit?: number | string;
    } = {}
  ) => {
    const usp = new URLSearchParams();
    if (params.days != null) usp.set("days", String(params.days));
    if (params.status) usp.set("status", params.status);
    if (params.rankBy) usp.set("rankBy", params.rankBy);
    if (params.limit != null) usp.set("limit", String(params.limit));
    const url = usp.toString()
      ? `${API_ENDPOINTS.ADMIN.STATS_TOP_ITEMS}?${usp}`
      : API_ENDPOINTS.ADMIN.STATS_TOP_ITEMS;
    return apiRequest(url);
  },
};
