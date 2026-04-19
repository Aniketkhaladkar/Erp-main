const fs = require('fs');

const expensePage = `import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const emptyForm = { name: '', amount: '', billing_cycle: 'monthly', start_date: new Date().toISOString().split('T')[0], end_date: '', category: 'software', notes: '' };

function getStatus(endDate: string) {
  const diff = (new Date(endDate).getTime() - Date.now()) / (1000*60*60*24);
  if (diff < 0) return 'expired';
  if (diff <= 7) return 'expiring_soon';
  return 'active';
}

export function ExpenseToolsPage() {
  const buId = useBusinessUnit('tek');
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('expense_tools').select('*').eq('business_unit_id', buId).order('end_date');
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [buId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ name: e.name, amount: String(e.amount), billing_cycle: e.billing_cycle, start_date: e.start_date, end_date: e.end_date, category: e.category ?? 'software', notes: e.notes ?? '' }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, amount: parseFloat(form.amount), business_unit_id: buId, category: form.category || null, notes: form.notes || null };
    if (editing) { await supabase.from('expense_tools').update(payload).eq('id', editing.id); toast.success('Expense updated'); }
    else { await supabase.from('expense_tools').insert(payload); toast.success('Expense added'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('expense_tools').delete().eq('id', id);
    toast.success('Deleted'); refresh();
  };

  const totalMonthly = items.filter(e => e.billing_cycle === 'monthly').reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Solvix Tek — Expense Tools</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Expense</Button>
      </div>
      <Card className="w-fit">
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Monthly Recurring</CardTitle></CardHeader>
        <CardContent className="pt-0"><span className="text-2xl font-bold">{formatINR(totalMonthly)}</span></CardContent>
      </Card>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No expenses yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Expense</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Cycle</TableHead>
              <TableHead>Category</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((e:any) => {
                const status = getStatus(e.end_date);
                return (
                  <TableRow key={e.id} className="even:bg-muted/30">
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{formatINR(e.amount)}</TableCell>
                    <TableCell className="capitalize">{e.billing_cycle.replace('_',' ')}</TableCell>
                    <TableCell className="capitalize">{e.category}</TableCell>
                    <TableCell>{formatDate(e.end_date)}</TableCell>
                    <TableCell>
                      <Badge variant={status==='active'?'default':status==='expiring_soon'?'outline':'destructive'} className={cn('capitalize',status==='expiring_soon'&&'border-yellow-500 text-yellow-600')}>
                        {status.replace('_',' ')}
                      </Badge>
                    </TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={()=>openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={()=>handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Expense' : 'Add Expense Tool'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (Rs)</Label><Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
              <div className="space-y-2"><Label>Billing Cycle</Label>
                <Select value={form.billing_cycle} onValueChange={v=>setForm({...form,billing_cycle:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annually">Annually</SelectItem><SelectItem value="one_time">One-Time</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing?'Update':'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

fs.writeFileSync('src/components/pages/ExpenseToolsPage.tsx', expensePage, { encoding: 'utf8' });
console.log('expense done');
