const fs = require('fs');

const tekDash = `import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, UserPlus, FolderKanban, Wrench, Receipt } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { Link } from '@tanstack/react-router';

function StatCard({ title, value, icon: Icon, to }: { title: string; value: string | number; icon: React.ElementType; to: string }) {
  return (
    <Link to={to as any}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TekDashboardPage() {
  const buId = useBusinessUnit('tek');
  const [stats, setStats] = useState({ revenue: 0, leads: 0, clients: 0, team: 0, projects: 0, expenses: 0, invoices: 0 });

  useEffect(() => {
    if (!buId) return;
    Promise.all([
      supabase.from('invoices').select('total').eq('business_unit_id', buId).eq('status', 'paid'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('expense_tools').select('amount').eq('business_unit_id', buId),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
    ]).then(([inv, leads, clients, team, projects, expenses, allInv]) => {
      setStats({
        revenue: (inv.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0),
        leads: leads.count ?? 0,
        clients: clients.count ?? 0,
        team: team.count ?? 0,
        projects: projects.count ?? 0,
        expenses: (expenses.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0),
        invoices: allInv.count ?? 0,
      });
    });
  }, [buId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Solvix Tek — Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(stats.revenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(stats.expenses)}</div></CardContent>
        </Card>
        <StatCard title="Total Leads" value={stats.leads} icon={UserPlus} to="/tek/leads" />
        <StatCard title="Total Clients" value={stats.clients} icon={Users} to="/tek/clients" />
        <StatCard title="Team Members" value={stats.team} icon={Users} to="/tek/team" />
        <StatCard title="Projects" value={stats.projects} icon={FolderKanban} to="/tek/projects" />
        <StatCard title="Invoices" value={stats.invoices} icon={Receipt} to="/tek/invoices" />
      </div>
    </div>
  );
}
`;

const strDash = `import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, UserPlus, FolderKanban, Package, Receipt } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { Link } from '@tanstack/react-router';

function StatCard({ title, value, icon: Icon, to }: { title: string; value: string | number; icon: React.ElementType; to: string }) {
  return (
    <Link to={to as any}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function StrategiesDashboardPage() {
  const buId = useBusinessUnit('strategies');
  const [stats, setStats] = useState({ revenue: 0, assets: 0, leads: 0, clients: 0, team: 0, projects: 0, invoices: 0 });

  useEffect(() => {
    if (!buId) return;
    Promise.all([
      supabase.from('invoices').select('total').eq('business_unit_id', buId).eq('status', 'paid'),
      supabase.from('assets').select('price').eq('business_unit_id', buId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
    ]).then(([inv, assets, leads, clients, team, projects, allInv]) => {
      setStats({
        revenue: (inv.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0),
        assets: (assets.data ?? []).reduce((s: number, a: any) => s + Number(a.price), 0),
        leads: leads.count ?? 0,
        clients: clients.count ?? 0,
        team: team.count ?? 0,
        projects: projects.count ?? 0,
        invoices: allInv.count ?? 0,
      });
    });
  }, [buId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Solvix Strategies — Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(stats.revenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(stats.assets)}</div></CardContent>
        </Card>
        <StatCard title="Total Leads" value={stats.leads} icon={UserPlus} to="/strategies/leads" />
        <StatCard title="Total Clients" value={stats.clients} icon={Users} to="/strategies/clients" />
        <StatCard title="Team Members" value={stats.team} icon={Users} to="/strategies/team" />
        <StatCard title="Projects" value={stats.projects} icon={FolderKanban} to="/strategies/projects" />
        <StatCard title="Invoices" value={stats.invoices} icon={Receipt} to="/strategies/invoices" />
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/pages/TekDashboardPage.tsx', tekDash, { encoding: 'utf8' });
fs.writeFileSync('src/components/pages/StrategiesDashboardPage.tsx', strDash, { encoding: 'utf8' });
console.log('dashboards done');
