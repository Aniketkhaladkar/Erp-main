import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, ListTodo, AlertCircle, CalendarClock } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

function TaskDetailCard({ task }: { task: any }) {
  const hasExtension = task.description?.includes('Extension requested to:');
  const hasNotCompleted = task.description?.includes('Not completed:');
  const hasReason = task.description?.includes('Reason:');

  return (
    <Card className={cn('mb-3 border-l-4', task.status === 'done' ? 'border-l-green-500' : task.status === 'in_progress' ? 'border-l-yellow-500' : 'border-l-blue-500')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-semibold text-base">{task.title}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priorityColors[task.priority])}>{task.priority}</span>
              <Badge variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'outline' : 'secondary'} className="capitalize">
                {task.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div><span className="text-xs text-muted-foreground block">Assigned To</span><span className="font-medium">{task.team_members?.name ?? '—'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Unit</span><span className="font-medium">{task.team_members?.business_units?.name ?? '—'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Project</span><span className="font-medium">{task.projects?.name ?? '—'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Deadline</span><span className="font-medium">{task.deadline ? formatDate(task.deadline) : '—'}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div><span className="text-xs text-muted-foreground block">Assigned On</span><span className="font-medium">{formatDate(task.created_at)}</span></div>
              {task.completed_at && <div><span className="text-xs text-muted-foreground block">Completed On</span><span className="font-medium">{formatDate(task.completed_at)}</span></div>}
            </div>

            {task.description && (
              <div className="mt-2 space-y-1">
                {task.description.split(' | ').map((part: string, i: number) => {
                  if (part.startsWith('Extension requested to:')) return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-orange-50 text-orange-700 rounded px-2 py-1">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      <span>{part}</span>
                    </div>
                  );
                  if (part.startsWith('Not completed:')) return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded px-2 py-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{part}</span>
                    </div>
                  );
                  if (part.startsWith('Reason:')) return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-yellow-50 text-yellow-700 rounded px-2 py-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{part}</span>
                    </div>
                  );
                  return <p key={i} className="text-sm text-muted-foreground">{part}</p>;
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function RequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState('');
  const [noteDialog, setNoteDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<'approved'|'rejected'>('approved');

  const refresh = async () => {
    const { data } = await supabase.from('task_requests')
      .select('*, tasks(title, deadline), team_members(name)')
      .order('created_at', { ascending: false });
    setRequests(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const openAction = (req: any, act: 'approved'|'rejected') => {
    setSelected(req); setAction(act); setAdminNote(''); setNoteDialog(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    await supabase.from('task_requests').update({ status: action, admin_note: adminNote }).eq('id', selected.id);
    // Apply the change if approved
    if (action === 'approved') {
      if (selected.type === 'extension') {
        await supabase.from('tasks').update({ deadline: selected.details?.new_deadline }).eq('id', selected.task_id);
      } else if (selected.type === 'not_completed') {
        await supabase.from('tasks').update({ status: 'to_do', description: (selected.tasks?.description ? selected.tasks.description + ' | ' : '') + 'Not completed: ' + selected.details?.reason }).eq('id', selected.task_id);
      }
    }
    setNoteDialog(false); refresh();
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  const typeLabel: Record<string, string> = { extension: 'Extension Request', not_completed: 'Not Completed', reason: 'Reason Submitted', forward: 'Forward Request' };
  const typeColor: Record<string, string> = { extension: 'bg-orange-100 text-orange-700', not_completed: 'bg-red-100 text-red-700', reason: 'bg-yellow-100 text-yellow-700', forward: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-base">Pending Approval ({pending.length})</h3>
          {pending.map((r: any) => (
            <Card key={r.id} className="mb-3 border-l-4 border-l-orange-400">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeColor[r.type] ?? 'bg-gray-100 text-gray-700')}>{typeLabel[r.type] ?? r.type}</span>
                      <span className="font-medium">{r.tasks?.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">From: <span className="text-foreground font-medium">{r.team_members?.name}</span></div>
                    {r.type === 'extension' && <div className="text-sm">New deadline requested: <strong>{r.details?.new_deadline}</strong> (current: {r.tasks?.deadline ?? '—'})</div>}
                    {(r.type === 'not_completed' || r.type === 'reason') && r.details?.reason && <div className="text-sm">Reason: <strong>{r.details.reason}</strong></div>}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openAction(r, 'approved')}>Approve</Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => openAction(r, 'rejected')}>Reject</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-base text-muted-foreground">Resolved ({resolved.length})</h3>
          {resolved.map((r: any) => (
            <Card key={r.id} className="mb-2 opacity-70">
              <CardContent className="p-3 flex items-center justify-between gap-4">
                <div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mr-2', typeColor[r.type] ?? 'bg-gray-100')}>{typeLabel[r.type] ?? r.type}</span>
                  <span className="text-sm">{r.tasks?.title} — {r.team_members?.name}</span>
                  {r.admin_note && <div className="text-xs text-muted-foreground mt-1">Admin note: {r.admin_note}</div>}
                </div>
                <Badge variant={r.status === 'approved' ? 'default' : 'destructive'} className="capitalize">{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {requests.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No requests yet</p>}

      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action === 'approved' ? 'Approve' : 'Reject'} Request</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Admin Note (optional)</Label>
            <Textarea rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note for the employee..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>Cancel</Button>
            <Button className={action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} onClick={handleApprove}>
              {action === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TaskReportsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterMember, setFilterMember] = useState('all');
  const [filterBU, setFilterBU] = useState('all');
  const [members, setMembers] = useState<any[]>([]);
  const [bus, setBus] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('tasks')
      .select('*, team_members(name, business_unit_id, business_units(name)), projects(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTasks(data ?? []));

    supabase.from('team_members').select('id, name, business_unit_id, business_units(name)').then(({ data }) => {
      setMembers(data ?? []);
      const buMap = new Map((data ?? []).map((m: any) => [m.business_unit_id, (m.business_units as any)?.name]));
      setBus(Array.from(buMap.entries()).map(([id, name]) => ({ id, name })));
    });
  }, []);

  const filtered = tasks.filter(t => {
    if (filterMember !== 'all' && t.team_member_id !== filterMember) return false;
    if (filterBU !== 'all' && (t.team_members as any)?.business_unit_id !== filterBU) return false;
    return true;
  });

  const todo = filtered.filter(t => t.status === 'to_do');
  const inProgress = filtered.filter(t => t.status === 'in_progress');
  const done = filtered.filter(t => t.status === 'done');
  const withExtension = filtered.filter(t => t.description?.includes('Extension requested to:'));
  const notCompleted = filtered.filter(t => t.description?.includes('Not completed:'));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Task Reports</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={filterBU} onValueChange={setFilterBU}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {bus.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="flex flex-col items-center py-4">
          <ListTodo className="h-6 w-6 text-blue-500 mb-1" />
          <div className="text-2xl font-bold">{todo.length}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </CardContent></Card>
        <Card><CardContent className="flex flex-col items-center py-4">
          <Clock className="h-6 w-6 text-yellow-500 mb-1" />
          <div className="text-2xl font-bold">{inProgress.length}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </CardContent></Card>
        <Card><CardContent className="flex flex-col items-center py-4">
          <CheckCircle className="h-6 w-6 text-green-500 mb-1" />
          <div className="text-2xl font-bold">{done.length}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </CardContent></Card>
        <Card><CardContent className="flex flex-col items-center py-4">
          <CalendarClock className="h-6 w-6 text-orange-500 mb-1" />
          <div className="text-2xl font-bold">{withExtension.length}</div>
          <div className="text-xs text-muted-foreground">Extension Req.</div>
        </CardContent></Card>
        <Card><CardContent className="flex flex-col items-center py-4">
          <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
          <div className="text-2xl font-bold">{notCompleted.length}</div>
          <div className="text-xs text-muted-foreground">Not Completed</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({todo.length})</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({done.length})</TabsTrigger>
          <TabsTrigger value="extension">Extensions ({withExtension.length})</TabsTrigger>
          <TabsTrigger value="notcompleted">Not Completed ({notCompleted.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {filtered.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No tasks</p> : filtered.map(t => <TaskDetailCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          {todo.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No pending tasks</p> : todo.map(t => <TaskDetailCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="inprogress" className="mt-4">
          {inProgress.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">None in progress</p> : inProgress.map(t => <TaskDetailCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {done.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No completed tasks</p> : done.map(t => <TaskDetailCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="extension" className="mt-4">
          {withExtension.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No extension requests</p> : withExtension.map(t => <TaskDetailCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="notcompleted" className="mt-4">
          {notCompleted.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No not-completed tasks</p> : notCompleted.map(t => <TaskDetailCard key={t.id} task={t} />)}
        </TabsContent>
              <TabsContent value="requests" className="mt-4">
          <RequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
