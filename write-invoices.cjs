const fs = require('fs');
const inv = `import { useState, useEffect } from 'react';
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
import { Plus, Trash2, Search, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR, formatINRDecimal, formatDate } from '@/lib/format';

type LineItem = { description: string; quantity: string; rate: string; amount: string };
const emptyForm = { client_id: '', invoice_date: new Date().toISOString().split('T')[0], due_date: '', tax_percent: '18', discount: '0', notes: '', status: 'draft' };

export function InvoicesPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const prefix = businessUnit === 'tek' ? 'STK-INV' : 'SS-INV';
  const title = businessUnit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';
  const [invList, setInvList] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: '1', rate: '0', amount: '0' }]);
  const [form, setForm] = useState(emptyForm);
  const [reminderDialog, setReminderDialog] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');

  const refresh = async () => {
    const { data } = await supabase.from('invoices').select('*, clients(brand_name, email)').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setInvList(data ?? []);
  };
  useEffect(() => {
    refresh();
    supabase.from('clients').select('id, brand_name, email').eq('business_unit_id', buId).then(({ data }) => setClientList(data ?? []));
  }, [buId]);

  const updateLineItem = (idx: number, field: keyof LineItem, value: string) => {
    const items = [...lineItems];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') items[idx].amount = String((parseFloat(items[idx].quantity)||0)*(parseFloat(items[idx].rate)||0));
    setLineItems(items);
  };

  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.amount)||0), 0);
  const taxAmount = subtotal * (parseFloat(form.tax_percent)||0) / 100;
  const total = subtotal + taxAmount - (parseFloat(form.discount)||0);

  const openAdd = () => { setForm(emptyForm); setLineItems([{ description: '', quantity: '1', rate: '0', amount: '0' }]); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.client_id) { toast.error('Please select a client'); return; }
    const nextNum = invList.length + 1;
    const invoiceNumber = prefix + '-' + String(nextNum).padStart(3, '0');
    const payload = { business_unit_id: buId, client_id: form.client_id, invoice_number: invoiceNumber, invoice_date: form.invoice_date, due_date: form.due_date, subtotal, tax_percent: parseFloat(form.tax_percent)||0, discount: parseFloat(form.discount)||0, total, status: form.status, notes: form.notes||null };
    const { data, error } = await supabase.from('invoices').insert(payload).select('id').single();
    if (error || !data) { toast.error(error?.message ?? 'Error'); return; }
    const items = lineItems.filter(i => i.description).map(i => ({ invoice_id: data.id, description: i.description, quantity: parseFloat(i.quantity)||1, rate: parseFloat(i.rate)||0, amount: parseFloat(i.amount)||0 }));
    if (items.length) await supabase.from('invoice_items').insert(items);
    toast.success('Invoice created'); setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    toast.success('Deleted'); refresh();
  };

  const markPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);
    toast.success('Marked as paid'); refresh();
  };

  const sendReminder = async () => {
    if (!reminderInvoice) return;
    const client = clientList.find(c => c.id === reminderInvoice.client_id);
    await supabase.from('invoice_reminders').insert({ invoice_id: reminderInvoice.id, sent_to_email: client?.email ?? '', message: reminderMessage });
    toast.success('Reminder logged'); setReminderDialog(false);
  };

  const filtered = invList.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (search) { const s = search.toLowerCase(); return inv.invoice_number.toLowerCase().includes(s) || (inv.clients?.brand_name ?? '').toLowerCase().includes(s); }
    return true;
  });

  const statusVariant: Record<string, any> = { draft: 'secondary', sent: 'outline', paid: 'default', overdue: 'destructive' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Invoices</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Create Invoice</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center"><p className="text-lg font-medium">No invoices yet</p><Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Create Invoice</Button></div>
      ) : (
        <div className="rounded-md border"><Table>
          <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((inv:any) => (
            <TableRow key={inv.id} className="even:bg-muted/30">
              <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
              <TableCell>{inv.clients?.brand_name ?? '—'}</TableCell>
              <TableCell className="font-medium">{formatINR(inv.total)}</TableCell>
              <TableCell>{formatDate(inv.invoice_date)}</TableCell>
              <TableCell>{formatDate(inv.due_date)}</TableCell>
              <TableCell><Badge variant={statusVariant[inv.status]} className="capitalize">{inv.status}</Badge></TableCell>
              <TableCell><div className="flex gap-1">
                {inv.status !== 'paid' && <Button variant="ghost" size="icon" title="Mark Paid" onClick={()=>markPaid(inv.id)}>✓</Button>}
                {inv.status !== 'paid' && <Button variant="ghost" size="icon" onClick={()=>{setReminderInvoice(inv);setReminderMessage('');setReminderDialog(true);}}><Mail className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="icon" onClick={()=>handleDelete(inv.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Client</Label>
                <Select value={form.client_id} onValueChange={v=>setForm({...form,client_id:v})}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clientList.map((c:any)=><SelectItem key={c.id} value={c.id}>{c.brand_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Invoice Date</Label><Input type="date" value={form.invoice_date} onChange={e=>setForm({...form,invoice_date:e.target.value})} /></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} /></div>
            </div>
            <div>
              <Label className="mb-2 block">Line Items</Label>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_100px_100px_36px] gap-2 items-end">
                    <Input placeholder="Description" value={item.description} onChange={e=>updateLineItem(idx,'description',e.target.value)} />
                    <Input placeholder="Qty" type="number" value={item.quantity} onChange={e=>updateLineItem(idx,'quantity',e.target.value)} />
                    <Input placeholder="Rate" type="number" value={item.rate} onChange={e=>updateLineItem(idx,'rate',e.target.value)} />
                    <Input value={formatINRDecimal(parseFloat(item.amount)||0)} readOnly className="bg-muted" />
                    <Button variant="ghost" size="icon" onClick={()=>setLineItems(lineItems.filter((_,i)=>i!==idx))} disabled={lineItems.length<=1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={()=>setLineItems([...lineItems,{description:'',quantity:'1',rate:'0',amount:'0'}])}><Plus className="mr-1 h-3 w-3" />Add Line</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Tax (%)</Label><Input type="number" value={form.tax_percent} onChange={e=>setForm({...form,tax_percent:e.target.value})} /></div>
              <div className="space-y-2"><Label>Discount</Label><Input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} /></div>
              <div className="space-y-2"><Label>Total</Label><div className="rounded-md border bg-muted p-2 text-lg font-bold">{formatINRDecimal(total)}</div></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Create Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={reminderDialog} onOpenChange={setReminderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Invoice Reminder</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>To</Label><Input value={clientList.find((c:any)=>c.id===reminderInvoice?.client_id)?.email??''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Invoice</Label><Input value={reminderInvoice?.invoice_number??''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={reminderMessage} onChange={e=>setReminderMessage(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setReminderDialog(false)}>Cancel</Button><Button onClick={sendReminder}><Mail className="mr-1 h-4 w-4" />Log Reminder</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;
fs.writeFileSync('src/components/pages/InvoicesPage.tsx', inv, { encoding: 'utf8' });
console.log('invoices done');
