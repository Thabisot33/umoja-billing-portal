export interface Admin {
  id: number;
  name: string;
  username: string;
  Password?: string;
  admin_id?: number; // From Supabase raw response
}

export interface Customer {
  id: number;
  name: string;
  status: string;
  billing_type: string;
  phone: string;
  street_1?: string;
  city?: string;
  gps?: string;
}

export interface Billing {
  customer_id: number;
  deposit: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  customer_id: number;
  status: string;
}

export interface CustomerNote {
  id?: number;
  customer_id: number;
  datetime: string;
  administrator_id: number;
  name: string; // Admin name
  type: string;
  title: string;
  comment: string;
  is_done: string;
  is_send: string;
  is_pinned: string;
}

export interface ChangeLog {
  new_status: string;
  date: string;
  time: string;
}

export enum ProductFilter {
  ALL = 'all',
  G5010 = '2',
  BAICELL = '1'
}

export enum CityFilter {
  ALL = 'all',
  POLOKWANE = 'Polokwane',
  JOHANNESBURG = 'Johannesburg'
}
