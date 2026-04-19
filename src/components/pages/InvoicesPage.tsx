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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Search, Mail, Pencil, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR, formatINRDecimal, formatDate } from '@/lib/format';

type LineItem = { description: string; quantity: string; rate: string; amount: string };
const emptyForm = { client_id: '', invoice_date: new Date().toISOString().split('T')[0], due_date: '', tax_percent: '18', discount: '0', notes: '', status: 'draft' };
const emptyLineItems = (): LineItem[] => [{ description: '', quantity: '1', rate: '0', amount: '0' }];

function BillingForm({ clientList, form, setForm, lineItems, setLineItems, onSave, onCancel, title }: any) {
  const updateLineItem = (idx: number, field: keyof LineItem, value: string) => {
    const items = [...lineItems];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') items[idx].amount = String((parseFloat(items[idx].quantity)||0)*(parseFloat(items[idx].rate)||0));
    setLineItems(items);
  };
  const subtotal = lineItems.reduce((s: number, i: LineItem) => s + (parseFloat(i.amount)||0), 0);
  const taxAmount = subtotal * (parseFloat(form.tax_percent)||0) / 100;
  const total = subtotal + taxAmount - (parseFloat(form.discount)||0);

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Client</Label>
              <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clientList.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.brand_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.invoice_date} onChange={e => setForm({...form, invoice_date: e.target.value})} /></div>
            <div className="space-y-2"><Label>Valid Until</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
          </div>
          <div>
            <Label className="mb-2 block">Line Items</Label>
            <div className="space-y-2">
              {lineItems.map((item: LineItem, idx: number) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_100px_100px_36px] gap-2 items-end">
                  <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} />
                  <Input placeholder="Qty" type="number" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} />
                  <Input placeholder="Rate" type="number" value={item.rate} onChange={e => updateLineItem(idx, 'rate', e.target.value)} />
                  <Input value={formatINRDecimal(parseFloat(item.amount)||0)} readOnly className="bg-muted" />
                  <Button variant="ghost" size="icon" onClick={() => setLineItems(lineItems.filter((_: any, i: number) => i !== idx))} disabled={lineItems.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { description: '', quantity: '1', rate: '0', amount: '0' }])}><Plus className="mr-1 h-3 w-3" />Add Line</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Tax (%)</Label><Input type="number" value={form.tax_percent} onChange={e => setForm({...form, tax_percent: e.target.value})} /></div>
            <div className="space-y-2"><Label>Discount (Rs)</Label><Input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} /></div>
            <div className="space-y-2"><Label>Total</Label><div className="rounded-md border bg-muted p-2 text-lg font-bold">{formatINRDecimal(total)}</div></div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(subtotal, total)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escHtml(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));
}

function openPrintableDoc(doc: any) {
  const fmtINR = (n: number) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const rowsHtml = (doc.items || []).map((i: any) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${escHtml(i.description)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(i.quantity)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmtINR(i.rate)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmtINR(i.amount)}</td>
    </tr>`).join('');
  const taxAmt = (Number(doc.subtotal) || 0) * (Number(doc.tax_percent) || 0) / 100;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escHtml(doc.kind)} ${escHtml(doc.number)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;padding:40px;max-width:820px;margin:0 auto;background:#fff}
  .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #0f172a;margin-bottom:28px}
  .brand{font-size:26px;font-weight:800;letter-spacing:-0.02em}
  .sub{color:#64748b;font-size:13px;margin-top:4px}
  .docMeta{text-align:right}
  .docTitle{font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
  .docNum{color:#64748b;font-size:13px;margin-top:4px;font-family:ui-monospace,monospace}
  .status{display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:8px;background:#e0e7ff;color:#3730a3}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:600;margin-bottom:6px}
  .value{font-size:14px;color:#0f172a;line-height:1.5}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
  th{text-align:left;padding:10px 8px;background:#f8fafc;border-bottom:2px solid #0f172a;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#475569}
  th.r,td.r{text-align:right}
  .totals{margin-left:auto;width:280px;margin-top:16px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
  .totals .grand{border-top:2px solid #0f172a;margin-top:8px;padding-top:12px;font-size:18px;font-weight:700}
  .notes{margin-top:32px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px;color:#475569;line-height:1.6}
  .footer{margin-top:48px;text-align:center;font-size:11px;color:#94a3b8;padding-top:16px;border-top:1px solid #e5e7eb}
  @media print { body{padding:24px} .noprint{display:none} }
  .toolbar{position:fixed;top:12px;right:12px;display:flex;gap:8px}
  .btn{background:#0f172a;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500}
  .btn.alt{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
</style></head><body>
  <div class="toolbar noprint">
    <button class="btn" onclick="window.print()">Save as PDF / Print</button>
    <button class="btn alt" onclick="window.close()">Close</button>
  </div>
  <div class="head">
    <div>
      <div class="brand">Solvix</div>
      <div class="sub">Financial Dashboard</div>
    </div>
    <div class="docMeta">
      <div class="docTitle">${escHtml(doc.kind)}</div>
      <div class="docNum">${escHtml(doc.number)}</div>
      <span class="status">${escHtml(doc.status)}</span>
    </div>
  </div>
  <div class="grid">
    <div>
      <div class="label">Billed To</div>
      <div class="value"><strong>${escHtml(doc.client?.brand_name ?? '—')}</strong><br>${escHtml(doc.client?.email ?? '')}</div>
    </div>
    <div>
      <div class="label">${escHtml(doc.kind)} Date</div>
      <div class="value">${fmtDate(doc.date)}</div>
      <div class="label" style="margin-top:12px;">${escHtml(doc.dueLabel)}</div>
      <div class="value">${fmtDate(doc.due)}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;">No line items</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${fmtINR(doc.subtotal)}</span></div>
    <div class="row"><span>Tax (${Number(doc.tax_percent) || 0}%)</span><span>${fmtINR(taxAmt)}</span></div>
    <div class="row"><span>Discount</span><span>− ${fmtINR(doc.discount)}</span></div>
    <div class="row grand"><span>Total</span><span>${fmtINR(doc.total)}</span></div>
  </div>
  ${doc.notes ? `<div class="notes"><strong style="color:#0f172a">Notes</strong><br>${escHtml(doc.notes)}</div>` : ''}
  <div class="footer">Generated by Solvix Financial Dashboard · ${new Date().toLocaleDateString('en-IN')}</div>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to download this document.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function InvoicesPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const invPrefix = businessUnit === 'tek' ? 'STK-INV' : 'SS-INV';
  const quotPrefix = businessUnit === 'tek' ? 'STK-QT' : 'SS-QT';
  const title = businessUnit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';

  const [tab, setTab] = useState('invoices');
  const [invList, setInvList] = useState<any[]>([]);
  const [quotList, setQuotList] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [invDialog, setInvDialog] = useState(false);
  const [quotDialog, setQuotDialog] = useState(false);
  const [invForm, setInvForm] = useState(emptyForm);
  const [quotForm, setQuotForm] = useState(emptyForm);
  const [invLines, setInvLines] = useState<LineItem[]>(emptyLineItems());
  const [quotLines, setQuotLines] = useState<LineItem[]>(emptyLineItems());
  const [reminderDialog, setReminderDialog] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [editingInv, setEditingInv] = useState<any>(null);
  const [editingQuot, setEditingQuot] = useState<any>(null);

  const refreshInv = async () => {
    const { data } = await supabase.from('invoices').select('*, clients(brand_name, email)').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setInvList(data ?? []);
  };
  const refreshQuot = async () => {
    const { data } = await supabase.from('quotations').select('*, clients(brand_name, email)').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setQuotList(data ?? []);
  };
  useEffect(() => {
    if (!buId) return;
    refreshInv(); refreshQuot();
    supabase.from('clients').select('id, brand_name, email').eq('business_unit_id', buId).then(({ data }) => setClientList(data ?? []));
  }, [buId]);

  const saveInvoice = async (subtotal: number, total: number) => {
    if (!invForm.client_id) { toast.error('Please select a client'); return; }
    const base = { client_id: invForm.client_id, invoice_date: invForm.invoice_date, due_date: invForm.due_date, subtotal, tax_percent: parseFloat(invForm.tax_percent)||0, discount: parseFloat(invForm.discount)||0, total, status: invForm.status, notes: invForm.notes||null };
    if (editingInv) {
      const { error } = await supabase.from('invoices').update(base).eq('id', editingInv.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from('invoice_items').delete().eq('invoice_id', editingInv.id);
      const items = invLines.filter(i => i.description).map(i => ({ invoice_id: editingInv.id, description: i.description, quantity: parseFloat(i.quantity)||1, rate: parseFloat(i.rate)||0, amount: parseFloat(i.amount)||0 }));
      if (items.length) await supabase.from('invoice_items').insert(items);
      toast.success('Invoice updated');
    } else {
      const invoiceNumber = invPrefix + '-' + String(invList.length + 1).padStart(3, '0');
      const payload = { ...base, business_unit_id: buId, invoice_number: invoiceNumber };
      const { data, error } = await supabase.from('invoices').insert(payload).select('id').single();
      if (error || !data) { toast.error(error?.message ?? 'Error'); return; }
      const items = invLines.filter(i => i.description).map(i => ({ invoice_id: data.id, description: i.description, quantity: parseFloat(i.quantity)||1, rate: parseFloat(i.rate)||0, amount: parseFloat(i.amount)||0 }));
      if (items.length) await supabase.from('invoice_items').insert(items);
      toast.success('Invoice created');
    }
    setInvDialog(false); setEditingInv(null); setInvForm(emptyForm); setInvLines(emptyLineItems()); refreshInv();
  };

  const saveQuotation = async (subtotal: number, total: number) => {
    if (!quotForm.client_id) { toast.error('Please select a client'); return; }
    const base = { client_id: quotForm.client_id, quotation_date: quotForm.invoice_date, due_date: quotForm.due_date, subtotal, tax_percent: parseFloat(quotForm.tax_percent)||0, discount: parseFloat(quotForm.discount)||0, total, status: quotForm.status, notes: quotForm.notes||null };
    if (editingQuot) {
      const { error } = await supabase.from('quotations').update(base).eq('id', editingQuot.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from('quotation_items').delete().eq('quotation_id', editingQuot.id);
      const items = quotLines.filter(i => i.description).map(i => ({ quotation_id: editingQuot.id, description: i.description, quantity: parseFloat(i.quantity)||1, rate: parseFloat(i.rate)||0, amount: parseFloat(i.amount)||0 }));
      if (items.length) await supabase.from('quotation_items').insert(items);
      toast.success('Quotation updated');
    } else {
      const quotationNumber = quotPrefix + '-' + String(quotList.length + 1).padStart(3, '0');
      const payload = { ...base, business_unit_id: buId, quotation_number: quotationNumber };
      const { data, error } = await supabase.from('quotations').insert(payload).select('id').single();
      if (error || !data) { toast.error(error?.message ?? 'Error'); return; }
      const items = quotLines.filter(i => i.description).map(i => ({ quotation_id: data.id, description: i.description, quantity: parseFloat(i.quantity)||1, rate: parseFloat(i.rate)||0, amount: parseFloat(i.amount)||0 }));
      if (items.length) await supabase.from('quotation_items').insert(items);
      toast.success('Quotation created');
    }
    setQuotDialog(false); setEditingQuot(null); setQuotForm(emptyForm); setQuotLines(emptyLineItems()); refreshQuot();
  };

  const openEditInvoice = async (inv: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    setEditingInv(inv);
    setInvForm({ client_id: inv.client_id, invoice_date: inv.invoice_date, due_date: inv.due_date, tax_percent: String(inv.tax_percent ?? '18'), discount: String(inv.discount ?? '0'), notes: inv.notes ?? '', status: inv.status });
    setInvLines((items && items.length ? items : []).map((i: any) => ({ description: i.description, quantity: String(i.quantity), rate: String(i.rate), amount: String(i.amount) })) as LineItem[]);
    if (!items || items.length === 0) setInvLines(emptyLineItems());
    setInvDialog(true);
  };

  const openEditQuotation = async (q: any) => {
    const { data: items } = await supabase.from('quotation_items').select('*').eq('quotation_id', q.id);
    setEditingQuot(q);
    setQuotForm({ client_id: q.client_id, invoice_date: q.quotation_date, due_date: q.due_date, tax_percent: String(q.tax_percent ?? '18'), discount: String(q.discount ?? '0'), notes: q.notes ?? '', status: q.status });
    setQuotLines((items && items.length ? items : []).map((i: any) => ({ description: i.description, quantity: String(i.quantity), rate: String(i.rate), amount: String(i.amount) })) as LineItem[]);
    if (!items || items.length === 0) setQuotLines(emptyLineItems());
    setQuotDialog(true);
  };

  const downloadInvoice = async (inv: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    openPrintableDoc({ kind: 'Invoice', number: inv.invoice_number, date: inv.invoice_date, dueLabel: 'Due Date', due: inv.due_date, client: inv.clients, items: items ?? [], subtotal: inv.subtotal, tax_percent: inv.tax_percent, discount: inv.discount, total: inv.total, notes: inv.notes, status: inv.status });
  };

  const downloadQuotation = async (q: any) => {
    const { data: items } = await supabase.from('quotation_items').select('*').eq('quotation_id', q.id);
    openPrintableDoc({ kind: 'Quotation', number: q.quotation_number, date: q.quotation_date, dueLabel: 'Valid Until', due: q.due_date, client: q.clients, items: items ?? [], subtotal: q.subtotal, tax_percent: q.tax_percent, discount: q.discount, total: q.total, notes: q.notes, status: q.status });
  };

  const deleteInvoice = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('invoices').delete().eq('id', id); toast.success('Deleted'); refreshInv(); };
  const deleteQuotation = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('quotations').delete().eq('id', id); toast.success('Deleted'); refreshQuot(); };
  const markPaid = async (id: string) => { await supabase.from('invoices').update({ status: 'paid' }).eq('id', id); toast.success('Marked as paid'); refreshInv(); };

  const sendReminder = async () => {
    if (!reminderInvoice) return;
    const client = clientList.find(c => c.id === reminderInvoice.client_id);
    await supabase.from('invoice_reminders').insert({ invoice_id: reminderInvoice.id, sent_to_email: client?.email ?? '', message: reminderMessage });
    toast.success('Reminder logged'); setReminderDialog(false);
  };

  const statusVariant: Record<string, any> = { draft: 'secondary', sent: 'outline', paid: 'default', overdue: 'destructive', approved: 'default', rejected: 'destructive' };

  const filteredInv = invList.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (search) { const s = search.toLowerCase(); return inv.invoice_number.toLowerCase().includes(s) || (inv.clients?.brand_name ?? '').toLowerCase().includes(s); }
    return true;
  });

  const filteredQuot = quotList.filter(q => {
    if (search) { const s = search.toLowerCase(); return q.quotation_number.toLowerCase().includes(s) || (q.clients?.brand_name ?? '').toLowerCase().includes(s); }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Billing</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setQuotForm(emptyForm); setQuotLines(emptyLineItems()); setQuotDialog(true); }}><Plus className="mr-1 h-4 w-4" />Create Quotation</Button>
          <Button size="sm" onClick={() => { setInvForm(emptyForm); setInvLines(emptyLineItems()); setInvDialog(true); }}><Plus className="mr-1 h-4 w-4" />Create Invoice</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="quotations">Quotations</TabsTrigger></TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
            </Select>
          </div>
          {filteredInv.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><p className="text-lg font-medium">No invoices yet</p></div>
          ) : (
            <div className="rounded-md border"><Table>
              <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="w-[200px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filteredInv.map((inv: any) => (
                <TableRow key={inv.id} className="even:bg-muted/30">
                  <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.clients?.brand_name ?? '—'}</TableCell>
                  <TableCell className="font-medium">{formatINR(inv.total)}</TableCell>
                  <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                  <TableCell>{formatDate(inv.due_date)}</TableCell>
                  <TableCell><Badge variant={statusVariant[inv.status]} className="capitalize">{inv.status}</Badge></TableCell>
                  <TableCell><div className="flex gap-1">
                    {inv.status !== 'paid' && <Button variant="ghost" size="icon" title="Mark Paid" onClick={() => markPaid(inv.id)}>✓</Button>}
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditInvoice(inv)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Download PDF" onClick={() => downloadInvoice(inv)}><Download className="h-4 w-4" /></Button>
                    {inv.status !== 'paid' && <Button variant="ghost" size="icon" title="Send reminder" onClick={() => { setReminderInvoice(inv); setReminderMessage(''); setReminderDialog(true); }}><Mail className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteInvoice(inv.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          )}
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search quotations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filteredQuot.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><p className="text-lg font-medium">No quotations yet</p></div>
          ) : (
            <div className="rounded-md border"><Table>
              <TableHeader><TableRow><TableHead>Quotation #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Valid Until</TableHead><TableHead>Status</TableHead><TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filteredQuot.map((q: any) => (
                <TableRow key={q.id} className="even:bg-muted/30">
                  <TableCell className="font-mono text-sm">{q.quotation_number}</TableCell>
                  <TableCell>{q.clients?.brand_name ?? '—'}</TableCell>
                  <TableCell className="font-medium">{formatINR(q.total)}</TableCell>
                  <TableCell>{formatDate(q.quotation_date)}</TableCell>
                  <TableCell>{formatDate(q.due_date)}</TableCell>
                  <TableCell><Badge variant={statusVariant[q.status] ?? 'secondary'} className="capitalize">{q.status}</Badge></TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditQuotation(q)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Download PDF" onClick={() => downloadQuotation(q)}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteQuotation(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          )}
        </TabsContent>
      </Tabs>

      {invDialog && <BillingForm clientList={clientList} form={invForm} setForm={setInvForm} lineItems={invLines} setLineItems={setInvLines} onSave={saveInvoice} onCancel={() => { setInvDialog(false); setEditingInv(null); }} title={editingInv ? `Edit Invoice ${editingInv.invoice_number}` : 'Create Invoice'} />}
      {quotDialog && <BillingForm clientList={clientList} form={quotForm} setForm={setQuotForm} lineItems={quotLines} setLineItems={setQuotLines} onSave={saveQuotation} onCancel={() => { setQuotDialog(false); setEditingQuot(null); }} title={editingQuot ? `Edit Quotation ${editingQuot.quotation_number}` : 'Create Quotation'} />}

      <Dialog open={reminderDialog} onOpenChange={setReminderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Invoice Reminder</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>To</Label><Input value={clientList.find((c: any) => c.id === reminderInvoice?.client_id)?.email ?? ''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Invoice</Label><Input value={reminderInvoice?.invoice_number ?? ''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={reminderMessage} onChange={e => setReminderMessage(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialog(false)}>Cancel</Button>
            <Button onClick={sendReminder}><Mail className="mr-1 h-4 w-4" />Log Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
