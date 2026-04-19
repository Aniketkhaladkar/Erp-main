import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = { high: 'text-destructive', medium: 'text-yellow-600', low: 'text-green-600' };
const emptyForm = { team_member_id: '', title: '', description: '', deadline: '', priority: 'medium', status: 'to_do', project_id: '' };

export function SharedTrackerPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filterMember, setFilterMember] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBU, setFilterBU] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('tasks')
      .select('*, team_members(name, business_unit_id, business_units(name)), projects(name)')
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
  };

  useEffect(() => {
    Promise.all([
      supabase.from('team_members').select('id, name, business_unit_id, business_units(name)'),
      supabase.from('projects').select('id, name, business_unit_id'),
    ]).then(([m, p]) => {
      setMembers(m.data ?? []);
      setProjects(p.data ?? []);
    });
    refresh();
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ team_member_id: t.team_member_id, title: t.title, description: t.description ?? '', deadline: t.deadline ?? '', priority: t.priority, status: t.status, project_id: t.project_id ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.team_member_id || !form.title) { toast.error('Member and title required'); return; }
    const payload = { team_member_id: form.team_member_id, title: form.title, description: form.description || null, deadline: form.deadline || null, priority: form.priority, status: form.status, project_id: (form.project_id && form.project_id !== 'none') ? form.project_id : null };
    if (editing) { await supabase.from('tasks').update(payload).eq('id', editing.id); toast.success('Task updated'); }
    else { await supabase.from('tasks').insert(payload); toast.success('Task assigned'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    toast.success('Task deleted'); refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', id);
    refresh();
  };

  const filtered = tasks.filter(t => {
    if (filterMember !== 'all' && t.team_member_id !== filterMember) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterBU !== 'all' && (t.team_members as any)?.business_unit_id !== filterBU) return false;
    return true;
  });

  const buList = Array.from(new Map(members.map(m => [(m.business_units as any)?.name, { id: m.business_unit_id, name: (m.business_units as any)?.name }])).values());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Tracker</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Assign Task</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterBU} onValueChange={setFilterBU}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {buList.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="to_do">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No tasks yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Assign Task</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Assigned To</TableHead><TableHead>Unit</TableHead>
              <TableHead>Project</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead><TableHead className="w-[80px]">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((t: any) => (
                <TableRow key={t.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.team_members?.name ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{(t.team_members as any)?.business_units?.name ?? '—'}</Badge></TableCell>
                  <TableCell>{t.projects?.name ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={cn('capitalize', priorityColors[t.priority])}>{t.priority}</Badge></TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={v => updateStatus(t.id, v)}>
                      <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to_do">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDate(t.deadline)}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Task' : 'Assign Task'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="space-y-1"><Label>Assign To</Label>
              <Select value={form.team_member_id} onValueChange={v => setForm({...form, team_member_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({(m.business_units as any)?.name})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Project (optional)</Label>
              <Select value={form.project_id} onValueChange={v => setForm({...form, project_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            </div>
            <div className="space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
