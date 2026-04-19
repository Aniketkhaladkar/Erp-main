const fs = require('fs');

const page = `import { useState, useEffect } from 'react';
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
import { formatDate, formatINR } from '@/lib/format';

// Type options per section/unit
const TEK_TECHNICAL_TYPES = ['RND', 'Research', 'Development', 'Prototyping', 'Designing', 'Other'];
const TEK_IT_TYPES = ['Website', 'Web Portal', 'App', 'Software', 'Other'];
const STRATEGIES_TYPES = ['Video Editing', 'Graphic Designing', 'SEO', 'PPT', 'Logo', 'ID', 'Catalogue', 'Brochure', 'Other'];

function needsManualInput(type: string) {
  return type === 'Designing' || type === 'Other';
}

export function LeadsPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const isTek = businessUnit === 'tek';

  const emptyForm = {
    brand_name: '', email: '', phone: '', location: '',
    category: 'corporate', status: 'not_contacted', notes: '',
    lead_section: isTek ? 'technical' : '',
    lead_type: '', lead_type_custom: '', quoted_amount: '',
  };

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('leads').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { if (buId) refresh(); }, [buId]);

  const getTypeOptions = () => {
    if (!isTek) return STRATEGIES_TYPES;
    return form.lead_section === 'it' ? TEK_IT_TYPES : TEK_TECHNICAL_TYPES;
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (l: any) => {
    setEditing(l);
    setForm({
      brand_name: l.brand_name, email: l.email, phone: l.phone, location: l.location,
      category: l.category, status: l.status, notes: l.notes ?? '',
      lead_section: l.lead_section ?? (isTek ? 'technical' : ''),
      lead_type: needsManualInput(l.lead_type ?? '') ? 'custom' : (l.lead_type ?? ''),
      lead_type_custom: needsManualInput(l.lead_type ?? '') ? (l.lead_type ?? '') : '',
      quoted_amount: l.quoted_amount != null ? String(l.quoted_amount) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const finalType = needsManualInput(form.lead_type) ? form.lead_type_custom : form.lead_type;
    const payload = {
      brand_name: form.brand_name, email: form.email, phone: form.phone, location: form.location,
      category: form.category, status: form.status, notes: form.notes || null,
      business_unit_id: buId,
      lead_section: isTek ? form.lead_section : null,
      lead_type: finalType || null,
      quoted_amount: form.quoted_amount ? parseFloat(form.quoted_amount) : null,
    };
    if (editing) { await supabase.from('leads').update(payload).eq('id', editing.id); toast.success('Lead updated'); }
    else { await supabase.from('leads').insert(payload); toast.success('Lead added'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await supabase.from('leads').delete().eq('id', id);
    toast.success('Lead deleted'); refresh();
  };

  const toggleStatus = async (l: any) => {
    const next = l.status === 'contacted' ? 'not_contacted' : 'contacted';
    await supabase.from('leads').update({ status: next }).eq('id', l.id);
    refresh();
  };

  const exportCSV = () => {
    const rows = [['Brand/Company','Email','Phone','Location','Section','Type','Quoted Amount','Category','Status'],
      ...filtered.map((l:any)=>[l.brand_name,l.email,l.phone,l.location,l.lead_section??'',l.lead_type??'',l.quoted_amount??'',l.category,l.status])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\\n')],{type:'text/csv'})); a.download='leads.csv'; a.click();
  };

  const filtered = items.filter(l => {
    if (filterCategory !== 'all' && l.category !== filterCategory) return false;
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (isTek && filterSection !== 'all' && l.lead_section !== filterSection) return false;
    if (search) { const s = search.toLowerCase(); return l.brand_name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s); }
    return true;
  });

  const title = isTek ? 'Solvix Tek' : 'Solvix Strategies';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Leads</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />Export</Button>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Lead</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {isTek && (
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="it">IT</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="creator">Creator</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="not_contacted">Not Contacted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No leads yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Lead</Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand / Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                {isTek && <TableHead>Section</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Quoted Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l:any) => (
                <TableRow key={l.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{l.brand_name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>{l.location}</TableCell>
                  {isTek && <TableCell><Badge variant="outline" className="capitalize">{l.lead_section ?? '—'}</Badge></TableCell>}
                  <TableCell>{l.lead_type ?? '—'}</TableCell>
                  <TableCell>{l.quoted_amount != null ? formatINR(l.quoted_amount) : '—'}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{l.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={l.status==='contacted'?'default':'outline'} className="cursor-pointer capitalize" onClick={()=>toggleStatus(l)}>
                      {l.status.replace('_',' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(l.created_at)}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={()=>openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={()=>handleDelete(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'Add New Lead'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Brand Name / Company Name</Label><Input value={form.brand_name} onChange={e=>setForm({...form,brand_name:e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>

            {isTek && (
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={form.lead_section} onValueChange={v=>setForm({...form,lead_section:v,lead_type:'',lead_type_custom:''})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.lead_type} onValueChange={v=>setForm({...form,lead_type:v,lead_type_custom:''})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {getTypeOptions().map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {needsManualInput(form.lead_type) && (
                  <Input placeholder="Specify type..." value={form.lead_type_custom} onChange={e=>setForm({...form,lead_type_custom:e.target.value})} className="mt-2" />
                )}
              </div>
              <div className="space-y-2"><Label>Quoted Amount (₹)</Label><Input type="number" placeholder="0" value={form.quoted_amount} onChange={e=>setForm({...form,quoted_amount:e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_contacted">Not Contacted</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing?'Update':'Add'} Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

fs.writeFileSync('src/components/pages/LeadsPage.tsx', page, { encoding: 'utf8' });
console.log('done');
