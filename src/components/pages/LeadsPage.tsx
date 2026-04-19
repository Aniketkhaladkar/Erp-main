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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Search, Download, X, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatINR } from '@/lib/format';

const TEK_TECHNICAL_TYPES = ['RND', 'Research', 'Development', 'Prototyping', 'Designing', 'Other'];
const TEK_IT_TYPES = ['Website', 'Web Portal', 'App', 'Software', 'Other'];
const STRATEGIES_TYPES = ['Video Editing', 'Graphic Designing', 'SEO', 'PPT', 'Logo', 'ID', 'Catalogue', 'Brochure', 'Other'];

function needsCustomInput(type: string) { return type === 'Designing' || type === 'Other'; }

type TypeEntry = { type: string; custom?: string; price: string };

export function LeadsPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const isTek = businessUnit === 'tek';

  const emptyForm = {
    brand_name: '', email: '', phone: '', location: '',
    category: 'corporate', status: 'not_contacted', notes: '',
    lead_section: isTek ? 'technical' : '',
  };

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [typeEntries, setTypeEntries] = useState<TypeEntry[]>([]);

  const refresh = async () => {
    const { data } = await supabase.from('leads').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { if (buId) refresh(); }, [buId]);

  const getTypeOptions = () => {
    if (!isTek) return STRATEGIES_TYPES;
    return form.lead_section === 'it' ? TEK_IT_TYPES : TEK_TECHNICAL_TYPES;
  };

  const allTypes = getTypeOptions();
  const quotedTotal = typeEntries.reduce((s, e) => s + (parseFloat(e.price) || 0), 0);

  const toggleType = (type: string) => {
    const exists = typeEntries.find(e => e.type === type);
    if (exists) {
      setTypeEntries(typeEntries.filter(e => e.type !== type));
    } else {
      setTypeEntries([...typeEntries, { type, price: '' }]);
    }
  };

  const selectAll = () => {
    const current = typeEntries.map(e => e.type);
    const missing = allTypes.filter(t => !current.includes(t));
    setTypeEntries([...typeEntries, ...missing.map(t => ({ type: t, price: '' }))]);
  };

  const updateEntry = (type: string, field: 'price' | 'custom', value: string) => {
    setTypeEntries(typeEntries.map(e => e.type === type ? { ...e, [field]: value } : e));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setTypeEntries([]);
    setDialogOpen(true);
  };

  const openEdit = (l: any) => {
    setEditing(l);
    setForm({ brand_name: l.brand_name, email: l.email, phone: l.phone, location: l.location, category: l.category, status: l.status, notes: l.notes ?? '', lead_section: l.lead_section ?? (isTek ? 'technical' : '') });
    setTypeEntries(Array.isArray(l.lead_types) ? l.lead_types : []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      brand_name: form.brand_name, email: form.email, phone: form.phone, location: form.location,
      category: form.category, status: form.status, notes: form.notes || null,
      business_unit_id: buId,
      lead_section: isTek ? form.lead_section : null,
      lead_type: typeEntries.map(e => e.custom || e.type).join(', ') || null,
      lead_types: typeEntries,
      quoted_amount: quotedTotal || null,
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

  const handleOnboard = async (l: any) => {
    if (!confirm(`Onboard "${l.brand_name}" as a client?`)) return;
    await supabase.from('clients').insert({
      business_unit_id: buId,
      brand_name: l.brand_name,
      email: l.email,
      phone: l.phone,
      location: l.location,
      category: l.category,
      billing_label: 'monthly',
      onboarded_at: new Date().toISOString().split('T')[0],
      notes: l.notes,
      quoted_price: l.quoted_amount,
    });
    await supabase.from('leads').update({ status: 'contacted' }).eq('id', l.id);
    toast.success(`${l.brand_name} onboarded as client!`);
    refresh();
  };

  const toggleStatus = async (l: any) => {
    const next = l.status === 'contacted' ? 'not_contacted' : 'contacted';
    await supabase.from('leads').update({ status: next }).eq('id', l.id);
    refresh();
  };

  const exportCSV = () => {
    const rows = [['Brand/Company','Email','Phone','Location','Types','Quoted Amount','Category','Status'],
      ...filtered.map((l:any)=>[l.brand_name,l.email,l.phone,l.location,l.lead_type??'',l.quoted_amount??'',l.category,l.status])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})); a.download='leads.csv'; a.click();
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
                <TableHead>Brand / Company</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>{isTek && <TableHead>Section</TableHead>}
                <TableHead>Types</TableHead><TableHead>Quoted</TableHead>
                <TableHead>Category</TableHead><TableHead>Status</TableHead>
                <TableHead>Added</TableHead><TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l:any) => (
                <TableRow key={l.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{l.brand_name}</TableCell>
                  <TableCell>{l.email}</TableCell><TableCell>{l.phone}</TableCell>
                  <TableCell>{l.location ? <a href={l.location.startsWith('http') ? l.location : 'https://' + l.location} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1">📍 View Map</a> : '—'}</TableCell>
                  {isTek && <TableCell><Badge variant="outline" className="capitalize">{l.lead_section ?? '—'}</Badge></TableCell>}
                  <TableCell className="max-w-[150px]">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(l.lead_types) && l.lead_types.length > 0
                        ? l.lead_types.map((e: TypeEntry, i: number) => <Badge key={i} variant="secondary" className="text-xs">{e.custom || e.type}</Badge>)
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>{l.quoted_amount != null ? formatINR(l.quoted_amount) : '—'}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{l.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={l.status==='contacted'?'default':'outline'} className="cursor-pointer capitalize" onClick={()=>toggleStatus(l)}>
                      {l.status.replace('_',' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(l.created_at)}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Onboard as Client" onClick={()=>handleOnboard(l)}><UserCheck className="h-4 w-4 text-green-600" /></Button>
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
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'Add New Lead'}</DialogTitle></DialogHeader>
          <div className="space-y-3 overflow-y-auto pr-1">
            <div className="space-y-1"><Label>Brand Name / Company Name</Label><Input value={form.brand_name} onChange={e=>setForm({...form,brand_name:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            </div>
            <div className="space-y-1">
              <Label>Location (Google Maps link)</Label>
              <Input placeholder="https://maps.google.com/..." value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
              {form.location && (
                <a href={form.location.startsWith('http') ? form.location : 'https://' + form.location} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  📍 Preview location
                </a>
              )}
            </div>

            {isTek && (
              <div className="space-y-1"><Label>Section</Label>
                <Select value={form.lead_section} onValueChange={v=>setForm({...form,lead_section:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="technical">Technical</SelectItem><SelectItem value="it">IT</SelectItem></SelectContent>
                </Select>
              </div>
            )}

            {/* Multi-type selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Types</Label>
                <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={selectAll}>Select All</Button>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-md border p-2">
                {allTypes.map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-muted/50">
                    <Checkbox checked={typeEntries.some(e => e.type === t)} onCheckedChange={() => toggleType(t)} />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Per-type pricing */}
            {typeEntries.length > 0 && (
              <div className="space-y-2">
                <Label>Pricing per Type</Label>
                {typeEntries.map((entry) => (
                  <div key={entry.type} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium min-w-[100px]">{entry.type}</span>
                      {needsCustomInput(entry.type) && (
                        <Input placeholder="Specify..." value={entry.custom ?? ''} onChange={e=>updateEntry(entry.type,'custom',e.target.value)} className="h-8 text-sm flex-1" />
                      )}
                    </div>
                    <Input type="number" placeholder="₹ Price" value={entry.price} onChange={e=>updateEntry(entry.type,'price',e.target.value)} className="h-8 text-sm w-28" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setTypeEntries(typeEntries.filter(e=>e.type!==entry.type))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                  <span className="text-sm font-medium">Total Quoted Amount</span>
                  <span className="text-base font-bold">{formatINR(quotedTotal)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Category</Label>
                <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="creator">Creator</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Status</Label>
                <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="not_contacted">Not Contacted</SelectItem><SelectItem value="contacted">Contacted</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
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
