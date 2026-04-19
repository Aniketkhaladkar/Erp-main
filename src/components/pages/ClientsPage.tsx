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
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const emptyForm = { brand_name: '', email: '', phone: '', location: '', category: 'corporate', billing_label: 'monthly', onboarded_at: new Date().toISOString().split('T')[0], notes: '', quoted_price: '', final_price: '' };

export function ClientsPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBilling, setFilterBilling] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('clients').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [buId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ brand_name: c.brand_name, email: c.email, phone: c.phone, location: c.location, category: c.category, billing_label: c.billing_label, onboarded_at: c.onboarded_at, notes: c.notes ?? '', quoted_price: c.quoted_price != null ? String(c.quoted_price) : '', final_price: c.final_price != null ? String(c.final_price) : '' }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, business_unit_id: buId, notes: form.notes || null, quoted_price: form.quoted_price ? parseFloat(form.quoted_price) : null, final_price: form.final_price ? parseFloat(form.final_price) : null };
    if (editing) { await supabase.from('clients').update(payload).eq('id', editing.id); toast.success('Client updated'); }
    else { await supabase.from('clients').insert(payload); toast.success('Client added'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    toast.success('Client deleted'); refresh();
  };

  const exportCSV = () => {
    const rows = [['Brand','Email','Phone','Location','Category','Billing','Onboarded'], ...filtered.map((c:any)=>[c.brand_name,c.email,c.phone,c.location,c.category,c.billing_label,c.onboarded_at])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})); a.download='clients.csv'; a.click();
  };

  const filtered = items.filter(c => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterBilling !== 'all' && c.billing_label !== filterBilling) return false;
    if (search) { const s = search.toLowerCase(); return c.brand_name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s); }
    return true;
  });

  const title = businessUnit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Clients</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />Export</Button>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Client</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="creator">Creator</SelectItem></SelectContent>
        </Select>
        <Select value={filterBilling} onValueChange={setFilterBilling}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Billing</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annually">Annually</SelectItem><SelectItem value="one_time">One-Time</SelectItem></SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No clients yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Client</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Brand Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
              <TableHead>Location</TableHead><TableHead>Category</TableHead><TableHead>Billing</TableHead>
              <TableHead>Onboarded</TableHead><TableHead className="w-[80px]">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((c:any) => (
                <TableRow key={c.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{c.brand_name}</TableCell>
                  <TableCell>{c.email}</TableCell><TableCell>{c.phone}</TableCell>
                  <TableCell>{c.location ? <a href={c.location.startsWith('http') ? c.location : 'https://' + c.location} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">📍 View Map</a> : '—'}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{c.category}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{c.billing_label.replace('_',' ')}</Badge></TableCell>
                  <TableCell>{formatDate(c.onboarded_at)}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={()=>openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={()=>handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>{editing ? 'Edit Client' : 'Add New Client'}</DialogTitle></DialogHeader>
          <div className="space-y-3 overflow-y-auto pr-1">
            <div className="space-y-1"><Label>Brand Name</Label><Input value={form.brand_name} onChange={e=>setForm({...form,brand_name:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            </div>
            <div className="space-y-1"><Label>Location (Google Maps link)</Label>
              <Input placeholder="https://maps.google.com/..." value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
              {form.location && <a href={form.location.startsWith('http') ? form.location : 'https://' + form.location} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">📍 Preview location</a>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Category</Label>
                <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="creator">Creator</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Billing</Label>
                <Select value={form.billing_label} onValueChange={v=>setForm({...form,billing_label:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annually">Annually</SelectItem><SelectItem value="one_time">One-Time</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Onboarded Date</Label><Input type="date" value={form.onboarded_at} onChange={e=>setForm({...form,onboarded_at:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Quoted Price (₹)</Label><Input type="number" placeholder="0" value={form.quoted_price} onChange={e=>setForm({...form,quoted_price:e.target.value})} /></div>
              <div className="space-y-1"><Label>Final Price (₹)</Label><Input type="number" placeholder="0" value={form.final_price} onChange={e=>setForm({...form,final_price:e.target.value})} /></div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing?'Update':'Add'} Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
