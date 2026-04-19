const fs = require('fs');

const trackerPage = `import { useState, useEffect } from 'react';
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
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = { high: 'text-destructive', medium: 'text-yellow-600', low: 'text-green-600' };
const statusColors: Record<string, any> = { to_do: 'secondary', in_progress: 'outline', done: 'default' };
const emptyForm = { team_member_id: '', title: '', description: '', deadline: '', priority: 'medium', status: 'to_do', project_id: '' };

export function TrackerPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filterMember, setFilterMember] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('tasks')
      .select('*, team_members(name), projects(name)')
      .in('team_member_id', members.map(m => m.id))
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
  };

  useEffect(() => {
    if (!buId) return;
    Promise.all([
      supabase.from('team_members').select('id, name').eq('business_unit_id', buId),
      supabase.from('projects').select('id, name').eq('business_unit_id', buId),
    ]).then(([m, p]) => {
      setMembers(m.data ?? []);
      setProjects(p.data ?? []);
    });
  }, [buId]);

  useEffect(() => {
    if (members.length > 0) refresh();
  }, [members]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ team_member_id: t.team_member_id, title: t.title, description: t.description ?? '', deadline: t.deadline ?? '', priority: t.priority, status: t.status, project_id: t.project_id ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.team_member_id || !form.title) { toast.error('Member and title required'); return; }
    const payload = { team_member_id: form.team_member_id, title: form.title, description: form.description || null, deadline: form.deadline || null, priority: form.priority, status: form.status, project_id: form.project_id || null };
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
    return true;
  });

  const title = businessUnit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Tracker</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Assign Task</Button>
      </div>

      <div className="flex flex-wrap gap-3">
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
              <TableHead>Title</TableHead><TableHead>Assigned To</TableHead><TableHead>Project</TableHead>
              <TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Deadline</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((t: any) => (
                <TableRow key={t.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.team_members?.name ?? '—'}</TableCell>
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
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Project (optional)</Label>
              <Select value={form.project_id} onValueChange={v => setForm({...form, project_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
`;

const employeePanel = `import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = { high: 'text-destructive', medium: 'text-yellow-600', low: 'text-green-600' };

export function EmployeePanelPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('team_members').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setMember(data);
    });
  }, [user]);

  useEffect(() => {
    if (!member) return;
    supabase.from('tasks').select('*, projects(name)').eq('team_member_id', member.id).order('created_at', { ascending: false }).then(({ data }) => setTasks(data ?? []));
  }, [member]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : null } : t));
  };

  const todo = tasks.filter(t => t.status === 'to_do');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'done');

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            {task.description && <div className="text-sm text-muted-foreground mt-1">{task.description}</div>}
            {task.projects?.name && <div className="text-xs text-muted-foreground mt-1">Project: {task.projects.name}</div>}
            {task.deadline && <div className="text-xs text-muted-foreground mt-1">Due: {formatDate(task.deadline)}</div>}
            <Badge variant="outline" className={cn('mt-2 capitalize text-xs', priorityColors[task.priority])}>{task.priority}</Badge>
          </div>
          <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
            <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="to_do">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No employee profile linked</p>
        <p className="text-sm text-muted-foreground mt-2">Ask your admin to link your account to a team member profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">{member.name} — {member.designation}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">To Do</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todo.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inProgress.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{done.length}</div></CardContent></Card>
      </div>
      <Tabs defaultValue="todo">
        <TabsList>
          <TabsTrigger value="todo">To Do ({todo.length})</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4">
          {todo.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No pending tasks</p> : todo.map(t => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="inprogress" className="mt-4">
          {inProgress.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">Nothing in progress</p> : inProgress.map(t => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {done.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No completed tasks</p> : done.map(t => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
`;

fs.writeFileSync('src/components/pages/TrackerPage.tsx', trackerPage, { encoding: 'utf8' });
fs.writeFileSync('src/components/pages/EmployeePanelPage.tsx', employeePanel, { encoding: 'utf8' });
console.log('done');
