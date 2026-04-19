import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { DollarSign, CreditCard, Package, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/format';

function KpiCard({ title, amount, icon: Icon }: { title: string; amount: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{formatINR(amount)}</div></CardContent>
    </Card>
  );
}

function BusinessUnitCard({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link to={to as any}>
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader><CardTitle className="flex items-center justify-between"><span>{title}</span><ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, assets: 0, tekRevenue: 0, strategiesRevenue: 0 });

  useEffect(() => {
    if (role !== 'admin' && role !== 'manager') return;
    const fetchStats = async () => {
      const [invRes, expRes, assRes, buRes, salRes] = await Promise.all([
        supabase.from('invoices').select('total, business_unit_id').eq('status', 'paid'),
        supabase.from('expense_tools').select('amount'),
        supabase.from('assets').select('price'),
        supabase.from('business_units').select('id, name'),
        supabase.from('team_members').select('salary'),
      ]);
      const bus = buRes.data ?? [];
      const tekId = bus.find((b:any) => b.name === 'Solvix Tek')?.id;
      const strId = bus.find((b:any) => b.name === 'Solvix Strategies')?.id;
      const invs = invRes.data ?? [];
      const tekRev = invs.filter((i:any) => i.business_unit_id === tekId).reduce((s:number,i:any) => s + Number(i.total), 0);
      const strRev = invs.filter((i:any) => i.business_unit_id === strId).reduce((s:number,i:any) => s + Number(i.total), 0);
      const toolExp = (expRes.data ?? []).reduce((s:number,e:any) => s + Number(e.amount), 0);
      const salaryExp = (salRes.data ?? []).reduce((s:number,m:any) => s + Number(m.salary ?? 0), 0);
      setStats({
        revenue: role === 'manager' ? strRev : tekRev + strRev,
        expenses: toolExp + salaryExp,
        assets: (assRes.data ?? []).reduce((s:number,a:any) => s + Number(a.price), 0),
        tekRevenue: tekRev,
        strategiesRevenue: strRev,
      });
    };
    fetchStats();
  }, [role]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {(role === 'admin' || role === 'manager') && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Total Revenue" amount={stats.revenue} icon={DollarSign} />
            <KpiCard title="Total Expenses" amount={stats.expenses} icon={CreditCard} />
            <KpiCard title="Total Assets" amount={stats.assets} icon={Package} />
          </div>
          {role === 'admin' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Solvix Tek Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatINR(stats.tekRevenue)}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Solvix Strategies Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatINR(stats.strategiesRevenue)}</div></CardContent></Card>
            </div>
          )}
          {role === 'manager' && (
            <div className="grid gap-4 md:grid-cols-1">
              <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Solvix Strategies Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatINR(stats.strategiesRevenue)}</div></CardContent></Card>
            </div>
          )}
        </>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {role !== 'manager' && (
          <BusinessUnitCard title="Solvix Tek" description="Tech and production — Leads, Clients, Team, Projects, Expense Tools, Invoices" to="/tek/dashboard" />
        )}
        <BusinessUnitCard title="Solvix Strategies" description="Consulting and strategy — Leads, Clients, Team, Projects, Assets, Invoices" to="/strategies/dashboard" />
      </div>
    </div>
  );
}
