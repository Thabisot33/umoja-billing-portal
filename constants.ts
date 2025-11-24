// Supabase Config
export const SUPABASE_URL = "https://axfyxdxtjlalwzxbgpoz.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Znl4ZHh0amxhbHd6eGJncG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4MjExOCwiZXhwIjoyMDc4NDU4MTE4fQ.RFpdrJd6aBHsUIFXfF-_mHDDT3c3vzq5DHUJ6Lyx_Hk";

// External API Config
export const API_BASE = "https://portal.umoja.network/api/2.0/admin";
export const AUTH_HEADER = "Basic NGQwNzQwZGE2NjFjYjRlYTQzMjM2NmM5MGZhZGUxOWU6MmE0ZDkzOGVkNTYyMjg5MmExNDdmMjZjMmVlNTI2MmI=";

export const ENDPOINTS = {
  CUSTOMERS: `${API_BASE}/customers/customer`,
  BILLING: `${API_BASE}/customers/customer-billing/`,
  INVENTORY: `${API_BASE}/inventory/items`,
  COMMENTS: `${API_BASE}/customers/customer-notes`,
  TASKS: `${API_BASE}/scheduling/tasks`,
  LOGS: (id: number) => `${API_BASE}/customers/customer/${id}/logs-changes`,
};

export const COLORS = {
  primary: '#ff0080', // hsl(328, 100%, 50%)
};