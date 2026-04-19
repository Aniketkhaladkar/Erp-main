import { supabase } from '@/integrations/supabase/client';

export const BU_IDS = {
  tek: 'bu-tek-001',
  strategies: 'bu-strategies-001',
} as const;

// Business unit name lookup
export async function getBusinessUnitId(unit: 'tek' | 'strategies'): Promise<string> {
  const name = unit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';
  const { data } = await supabase.from('business_units').select('id').eq('name', name).single();
  return data?.id ?? BU_IDS[unit];
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export const leads = {
  list: (buId: string) => supabase.from('leads').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false }),
  insert: (data: any) => supabase.from('leads').insert(data),
  update: (id: string, data: any) => supabase.from('leads').update(data).eq('id', id),
  delete: (id: string) => supabase.from('leads').delete().eq('id', id),
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clients = {
  list: (buId: string) => supabase.from('clients').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false }),
  listAll: () => supabase.from('clients').select('*'),
  insert: (data: any) => supabase.from('clients').insert(data),
  update: (id: string, data: any) => supabase.from('clients').update(data).eq('id', id),
  delete: (id: string) => supabase.from('clients').delete().eq('id', id),
};

// ── Team Members ──────────────────────────────────────────────────────────────
export const teamMembers = {
  list: (buId: string) => supabase.from('team_members').select('*').eq('business_unit_id', buId).order('name'),
  insert: (data: any) => supabase.from('team_members').insert(data),
  update: (id: string, data: any) => supabase.from('team_members').update(data).eq('id', id),
  delete: (id: string) => supabase.from('team_members').delete().eq('id', id),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projects = {
  list: (buId: string) => supabase.from('projects').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false }),
  insert: (data: any) => supabase.from('projects').insert(data),
  update: (id: string, data: any) => supabase.from('projects').update(data).eq('id', id),
  delete: (id: string) => supabase.from('projects').delete().eq('id', id),
};

// ── Expense Tools ─────────────────────────────────────────────────────────────
export const expenseTools = {
  list: (buId: string) => supabase.from('expense_tools').select('*').eq('business_unit_id', buId).order('end_date'),
  listAll: () => supabase.from('expense_tools').select('amount'),
  insert: (data: any) => supabase.from('expense_tools').insert(data),
  update: (id: string, data: any) => supabase.from('expense_tools').update(data).eq('id', id),
  delete: (id: string) => supabase.from('expense_tools').delete().eq('id', id),
};

// ── Assets ────────────────────────────────────────────────────────────────────
export const assets = {
  list: (buId: string) => supabase.from('assets').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false }),
  listAll: () => supabase.from('assets').select('price'),
  insert: (data: any) => supabase.from('assets').insert(data),
  update: (id: string, data: any) => supabase.from('assets').update(data).eq('id', id),
  delete: (id: string) => supabase.from('assets').delete().eq('id', id),
};

// ── Buy List ──────────────────────────────────────────────────────────────────
export const buyList = {
  list: (buId: string) => supabase.from('buy_list').select('*').eq('business_unit_id', buId),
  insert: (data: any) => supabase.from('buy_list').insert(data),
  update: (id: string, data: any) => supabase.from('buy_list').update(data).eq('id', id),
  delete: (id: string) => supabase.from('buy_list').delete().eq('id', id),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoices = {
  list: (buId: string) => supabase.from('invoices').select('*, clients(brand_name, email)').eq('business_unit_id', buId).order('created_at', { ascending: false }),
  listAll: () => supabase.from('invoices').select('total, status, business_unit_id').eq('status', 'paid'),
  insert: (data: any) => supabase.from('invoices').insert(data).select('id').single(),
  update: (id: string, data: any) => supabase.from('invoices').update(data).eq('id', id),
  delete: (id: string) => supabase.from('invoices').delete().eq('id', id),
  insertItems: (items: any[]) => supabase.from('invoice_items').insert(items),
  deleteItems: (invoiceId: string) => supabase.from('invoice_items').delete().eq('invoice_id', invoiceId),
};

// ── Invoice Reminders ─────────────────────────────────────────────────────────
export const invoiceReminders = {
  insert: (data: any) => supabase.from('invoice_reminders').insert(data),
};
