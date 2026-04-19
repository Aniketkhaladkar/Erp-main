import { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState({ revenue: 0, leads: 0, clients: 0, team: 0, projects: 0, expenses: 0, invoices: 0, quotedPrice: 0, finalPrice: 0 });

  useEffect(() => {
    if (!buId) return;
    const load = async () => {
      const [inv, leads, clients, team, projects, expenses, salaries, allInv, clientPrices] = await Promise.all([
        supabase.from('invoices').select('total').eq('business_unit_id', buId).eq('status', 'paid'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
        supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
        supabase.from('expense_tools').select('amount').eq('business_unit_id', buId),
        supabase.from('team_members').select('salary').eq('business_unit_id', buId),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('business_unit_id', buId),
        supabase.from('clients').select('quoted_price, final_price').eq('business_unit_id', buId),
      ]);
      const toolExpenses = (expenses.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      const salaryExpenses = (salaries.data ?? []).reduce((s: number, m: any) => s + Number(m.salary ?? 0), 0);
      setStats({
        revenue: (inv.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0),
        leads: leads.count ?? 0,
        clients: clients.count ?? 0,
        team: team.count ?? 0,
        projects: projects.count ?? 0,
        expenses: toolExpenses + salaryExpenses,
        invoices: allInv.count ?? 0,
        quotedPrice: (clientPrices.data ?? []).reduce((s: number, c: any) => s + Number(c.quoted_price ?? 0), 0),
        finalPrice: (clientPrices.data ?? []).reduce((s: number, c: any) => s + Number(c.final_price ?? 0), 0),
      });
    };
    load();
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
        <StatCard title="Billing" value={stats.invoices} icon={Receipt} to="/tek/invoices" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quoted Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(stats.quotedPrice)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Final Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(stats.finalPrice)}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
