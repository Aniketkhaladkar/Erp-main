
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'manager');
CREATE TYPE public.lead_category AS ENUM ('corporate', 'commercial', 'creator');
CREATE TYPE public.lead_status AS ENUM ('contacted', 'not_contacted');
CREATE TYPE public.billing_label AS ENUM ('monthly', 'one_time');
CREATE TYPE public.employment_label AS ENUM ('freelancing', 'salaried');
CREATE TYPE public.task_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.task_status AS ENUM ('to_do', 'in_progress', 'done');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave');
CREATE TYPE public.project_status_tek AS ENUM ('upcoming', 'in_progress', 'completed');
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'annually', 'one_time');
CREATE TYPE public.asset_condition AS ENUM ('new', 'good', 'fair', 'needs_repair');
CREATE TYPE public.buy_list_status AS ENUM ('requested', 'approved', 'purchased', 'rejected');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- Business units table
CREATE TABLE public.business_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles per security best practice)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_authenticated_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
$$;

-- Leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  category lead_category NOT NULL DEFAULT 'corporate',
  status lead_status NOT NULL DEFAULT 'not_contacted',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  category lead_category NOT NULL DEFAULT 'corporate',
  billing_label billing_label NOT NULL DEFAULT 'monthly',
  onboarded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  employment_label employment_label NOT NULL DEFAULT 'salaried',
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table (for team member uploads)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status_label project_status_tek DEFAULT 'upcoming',
  billing_label billing_label,
  start_date DATE,
  deadline DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project members junction
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'to_do',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, date)
);

-- Expense tools table (Solvix Tek only)
CREATE TABLE public.expense_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  category TEXT DEFAULT 'software',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets table (Solvix Strategies only)
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  use_purpose TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  condition asset_condition DEFAULT 'new',
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Buy list table (Solvix Strategies only)
CREATE TABLE public.buy_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  estimated_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL,
  priority task_priority NOT NULL DEFAULT 'medium',
  requested_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  status buy_list_status NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 18,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice reminders table
CREATE TABLE public.invoice_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  sent_to_email TEXT NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies: All authenticated members can read, admin/manager can write
-- Business units
CREATE POLICY "Authenticated users can view business units" ON public.business_units FOR SELECT TO authenticated USING (public.is_authenticated_member());

-- User roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Leads
CREATE POLICY "Members can view leads" ON public.leads FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update leads" ON public.leads FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Clients
CREATE POLICY "Members can view clients" ON public.clients FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Team members
CREATE POLICY "Members can view team_members" ON public.team_members FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update team_members" ON public.team_members FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Documents
CREATE POLICY "Members can view documents" ON public.documents FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can delete documents" ON public.documents FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Projects
CREATE POLICY "Members can view projects" ON public.projects FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update projects" ON public.projects FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete projects" ON public.projects FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Project members
CREATE POLICY "Members can view project_members" ON public.project_members FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert project_members" ON public.project_members FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can delete project_members" ON public.project_members FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Tasks
CREATE POLICY "Members can view tasks" ON public.tasks FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Attendance
CREATE POLICY "Members can view attendance" ON public.attendance FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (public.is_authenticated_member());

-- Expense tools
CREATE POLICY "Members can view expense_tools" ON public.expense_tools FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert expense_tools" ON public.expense_tools FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update expense_tools" ON public.expense_tools FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete expense_tools" ON public.expense_tools FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Assets
CREATE POLICY "Members can view assets" ON public.assets FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update assets" ON public.assets FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete assets" ON public.assets FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Buy list
CREATE POLICY "Members can view buy_list" ON public.buy_list FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert buy_list" ON public.buy_list FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update buy_list" ON public.buy_list FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete buy_list" ON public.buy_list FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Invoices
CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Invoice items
CREATE POLICY "Members can view invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (public.is_authenticated_member());

-- Invoice reminders
CREATE POLICY "Members can view invoice_reminders" ON public.invoice_reminders FOR SELECT TO authenticated USING (public.is_authenticated_member());
CREATE POLICY "Members can insert invoice_reminders" ON public.invoice_reminders FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_member());

-- Timestamp update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expense_tools_updated_at BEFORE UPDATE ON public.expense_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buy_list_updated_at BEFORE UPDATE ON public.buy_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed business units
INSERT INTO public.business_units (name) VALUES ('Solvix Tek'), ('Solvix Strategies');

-- Indexes for performance
CREATE INDEX idx_leads_business_unit ON public.leads(business_unit_id);
CREATE INDEX idx_leads_category ON public.leads(category);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_clients_business_unit ON public.clients(business_unit_id);
CREATE INDEX idx_team_members_business_unit ON public.team_members(business_unit_id);
CREATE INDEX idx_projects_business_unit ON public.projects(business_unit_id);
CREATE INDEX idx_tasks_team_member ON public.tasks(team_member_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_attendance_team_member ON public.attendance(team_member_id);
CREATE INDEX idx_expense_tools_business_unit ON public.expense_tools(business_unit_id);
CREATE INDEX idx_assets_business_unit ON public.assets(business_unit_id);
CREATE INDEX idx_buy_list_business_unit ON public.buy_list(business_unit_id);
CREATE INDEX idx_invoices_business_unit ON public.invoices(business_unit_id);
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
