const fs = require('fs');

const auth = `import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'manager';

interface AuthState {
  user: User | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
    setRole((data?.role as AppRole) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else setRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, isAuthenticated: !!user, signIn, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
`;

const store = `import { supabase } from '@/integrations/supabase/client';

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
`;

fs.writeFileSync('src/hooks/use-auth.tsx', auth, { encoding: 'utf8' });
fs.writeFileSync('src/lib/store.ts', store, { encoding: 'utf8' });
console.log('done');
