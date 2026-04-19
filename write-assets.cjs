const fs = require('fs');
const assetsPage = `import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const emptyAsset = { name: '', use_purpose: '', price: '', purchase_date: '', condition: 'new', notes: '' };
const emptyBuy = { name: '', estimated_price: '', purpose: '', priority: 'medium', status: 'requested' };
const priorityColors: Record<string, string> = { high: 'text-destructive', medium: 'text-yellow-600', low: 'text-green-600' };

export function AssetsPage() {
  const buId = useBusinessUnit('strategies');
  const [assetItems, setAssetItems] = useState<any[]>([]);
  const [buyItems, setBuyItems] = useState<any[]>([]);
  const [tab, setTab] = useState('equipment');
  const [assetDialog, setAssetDialog] = useState(false);
  const [buyDialog, setBuyDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [editingBuy, setEditingBuy] = useState<any>(null);
  const [assetForm, setAssetForm] = useState(emptyAsset);
  const [buyForm, setBuyForm] = useState(emptyBuy);

  const refreshAssets = async () => { const { data } = await supabase.from('assets').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false }); setAssetItems(data ?? []); };
  const refreshBuy = async () => { const { data } = await supabase.from('buy_list').select('*').eq('business_unit_id', buId); setBuyItems(data ?? []); };
  useEffect(() => { refreshAssets(); refreshBuy(); }, [buId]);

  const openAddAsset = () => { setEditingAsset(null); setAssetForm(emptyAsset); setAssetDialog(true); };
  const openEditAsset = (a: any) => { setEditingAsset(a); setAssetForm({ name: a.name, use_purpose: a.use_purpose, price: String(a.price), purchase_date: a.purchase_date ?? '', condition: a.condition ?? 'new', notes: a.notes ?? '' }); setAssetDialog(true); };
  const saveAsset = async () => {
    const payload = { name: assetForm.name, use_purpose: assetForm.use_purpose, price: parseFloat(assetForm.price)||0, business_unit_id: buId, purchase_date: assetForm.purchase_date||null, condition: assetForm.condition, notes: assetForm.notes||null, assigned_to: null };
    if (editingAsset) { await supabase.from('assets').update(payload).eq('id', editingAsset.id); toast.success('Asset updated'); }
    else { await supabase.from('assets').insert(payload); toast.success('Asset added'); }
    setAssetDialog(false); refreshAssets();
  };
  const deleteAsset = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('assets').delete().eq('id', id); toast.success('Deleted'); refreshAssets(); };

  const openAddBuy = () => { setEditingBuy(null); setBuyForm(emptyBuy); setBuyDialog(true); };
  const openEditBuy = (b: any) => { setEditingBuy(b); setBuyForm({ name: b.name, estimated_price: String(b.estimated_price), purpose: b.purpose, priority: b.priority, status: b.status }); setBuyDialog(true); };
  const saveBuy = async () => {
    const payload = { name: buyForm.name, estimated_price: parseFloat(buyForm.estimated_price)||0, purpose: buyForm.purpose, priority: buyForm.priority, status: buyForm.status, business_unit_id: buId, requested_by: null };
    if (editingBuy) { await supabase.from('buy_list').update(payload).eq('id', editingBuy.id); toast.success('Item updated'); }
    else { await supabase.from('buy_list').insert(payload); toast.success('Item added'); }
    setBuyDialog(false); refreshBuy();
  };
  const markPurchased = async (item: any) => {
    await supabase.from('assets').insert({ name: item.name, use_purpose: item.purpose, price: item.estimated_price, business_unit_id: buId, condition: 'new', purchase_date: new Date().toISOString().split('T')[0], notes: null, assigned_to: null });
    await supabase.from('buy_list').update({ status: 'purchased' }).eq('id', item.id);
    toast.success('Moved to equipment'); refreshAssets(); refreshBuy();
  };

  const totalEquipment = assetItems.reduce((s, a) => s + Number(a.price), 0);
  const totalBuyList = buyItems.filter(b => b.status !== 'purchased' && b.status !== 'rejected').reduce((s, b) => s + Number(b.estimated_price), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Solvix Strategies — Assets</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="equipment">Equipment</TabsTrigger><TabsTrigger value="buylist">Buy List</TabsTrigger></TabsList>
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex items-center justify-between">
            <Card className="w-fit"><CardContent className="p-3 text-sm"><span className="text-muted-foreground">Total Value: </span><span className="font-bold">{formatINR(totalEquipment)}</span></CardContent></Card>
            <Button size="sm" onClick={openAddAsset}><Plus className="mr-1 h-4 w-4" />Add Equipment</Button>
          </div>
          {assetItems.length === 0 ? <div className="py-16 text-center"><p className="text-lg font-medium">No equipment yet</p><Button className="mt-4" onClick={openAddAsset}><Plus className="mr-1 h-4 w-4" />Add Equipment</Button></div> : (
            <div className="rounded-md border"><Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Purpose</TableHead><TableHead>Price</TableHead><TableHead>Condition</TableHead><TableHead>Purchased</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{assetItems.map((a:any) => (
                <TableRow key={a.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{a.name}</TableCell><TableCell>{a.use_purpose}</TableCell><TableCell>{formatINR(a.price)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{(a.condition??'').replace('_',' ')}</Badge></TableCell>
                  <TableCell>{formatDate(a.purchase_date)}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={()=>openEditAsset(a)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={()=>deleteAsset(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          )}
        </TabsContent>
        <TabsContent value="buylist" className="space-y-4">
          <div className="flex items-center justify-between">
            <Card className="w-fit"><CardContent className="p-3 text-sm"><span className="text-muted-foreground">Pending Cost: </span><span className="font-bold">{formatINR(totalBuyList)}</span></CardContent></Card>
            <Button size="sm" onClick={openAddBuy}><Plus className="mr-1 h-4 w-4" />Add Item</Button>
          </div>
          {buyItems.length === 0 ? <div className="py-16 text-center"><p className="text-lg font-medium">Buy list is empty</p><Button className="mt-4" onClick={openAddBuy}><Plus className="mr-1 h-4 w-4" />Add Item</Button></div> : (
            <div className="rounded-md border"><Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Est. Price</TableHead><TableHead>Purpose</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{buyItems.map((b:any) => (
                <TableRow key={b.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{b.name}</TableCell><TableCell>{formatINR(b.estimated_price)}</TableCell><TableCell className="max-w-[200px] truncate">{b.purpose}</TableCell>
                  <TableCell><Badge variant="outline" className={cn('capitalize',priorityColors[b.priority])}>{b.priority}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{b.status}</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={()=>openEditBuy(b)}><Pencil className="h-4 w-4" /></Button>{b.status!=='purchased'&&<Button variant="ghost" size="icon" onClick={()=>markPurchased(b)}><ArrowRight className="h-4 w-4 text-green-600" /></Button>}</div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={assetDialog} onOpenChange={setAssetDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAsset?'Edit Equipment':'Add Equipment'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={assetForm.name} onChange={e=>setAssetForm({...assetForm,name:e.target.value})} /></div>
            <div className="space-y-2"><Label>Use / Purpose</Label><Input value={assetForm.use_purpose} onChange={e=>setAssetForm({...assetForm,use_purpose:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price</Label><Input type="number" value={assetForm.price} onChange={e=>setAssetForm({...assetForm,price:e.target.value})} /></div>
              <div className="space-y-2"><Label>Condition</Label>
                <Select value={assetForm.condition} onValueChange={v=>setAssetForm({...assetForm,condition:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="needs_repair">Needs Repair</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={assetForm.purchase_date} onChange={e=>setAssetForm({...assetForm,purchase_date:e.target.value})} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={assetForm.notes} onChange={e=>setAssetForm({...assetForm,notes:e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setAssetDialog(false)}>Cancel</Button><Button onClick={saveAsset}>{editingAsset?'Update':'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={buyDialog} onOpenChange={setBuyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBuy?'Edit Item':'Add to Buy List'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Item Name</Label><Input value={buyForm.name} onChange={e=>setBuyForm({...buyForm,name:e.target.value})} /></div>
            <div className="space-y-2"><Label>Estimated Price</Label><Input type="number" value={buyForm.estimated_price} onChange={e=>setBuyForm({...buyForm,estimated_price:e.target.value})} /></div>
            <div className="space-y-2"><Label>Purpose</Label><Textarea value={buyForm.purpose} onChange={e=>setBuyForm({...buyForm,purpose:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Priority</Label>
                <Select value={buyForm.priority} onValueChange={v=>setBuyForm({...buyForm,priority:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={buyForm.status} onValueChange={v=>setBuyForm({...buyForm,status:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="requested">Requested</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="purchased">Purchased</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setBuyDialog(false)}>Cancel</Button><Button onClick={saveBuy}>{editingBuy?'Update':'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;
fs.writeFileSync('src/components/pages/AssetsPage.tsx', assetsPage, { encoding: 'utf8' });
console.log('assets done');
