import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { client_id: '', name: '', billing_label: 'one_time', start_date: '', deadline: '', description: '' };

export function StrategiesProjectsPage() {
  const buId = useBusinessUnit('strategies');
  const [items, setItems] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('projects').select('*, clients(brand_name)').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => {
    if (!buId) return;
    refresh();
    supabase.from('clients').select('id, brand_name').eq('business_unit_id', buId).then(({ data }) => setClientList(data ?? []));
  }, [buId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ client_id: p.client_id ?? '', name: p.name, billing_label: p.billing_label ?? 'one_time', start_date: p.start_date ?? '', deadline: p.deadline ?? '', description: p.description ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const client = clientList.find(c => c.id === form.client_id);
    const payload = {
      name: form.name,
      company_name: client?.brand_name ?? '',
      contact_person: '', contact_email: '',
      business_unit_id: buId,
      client_id: form.client_id || null,
      billing_label: form.billing_label,
      status_label: null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      description: form.description || null,
      contact_phone: null,
    };
    if (editing) { await supabase.from('projects').update(payload).eq('id', editing.id); toast.success('Project updated'); }
    else { await supabase.from('projects').insert(payload); toast.success('Project added'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await supabase.from('projects').delete().eq('id', id);
    toast.success('Project deleted'); refresh();
  };

  const filtered = filter === 'all' ? items : items.filter((p: any) => p.billing_label === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Solvix Strategies — Projects</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Project</Button>
      </div>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Projects</SelectItem><SelectItem value="one_time">One-Time</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
      </Select>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No projects yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Project</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Project Name</TableHead><TableHead>Client</TableHead>
              <TableHead>Billing</TableHead><TableHead>Deadline</TableHead><TableHead className="w-[80px]">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.clients?.brand_name ?? p.company_name ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{(p.billing_label ?? '').replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{p.deadline ?? '—'}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'Add Project'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Project Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Client (Company)</Label>
              <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clientList.map(c => <SelectItem key={c.id} value={c.id}>{c.brand_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Billing Type</Label>
                <Select value={form.billing_label} onValueChange={v => setForm({ ...form, billing_label: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="one_time">One-Time</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annually">Annually</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
