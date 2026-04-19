import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, ListTodo, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

function timeElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + ' minutes';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hours';
  return Math.floor(hrs / 24) + ' days';
}

function formatDateTime(dt: string): string {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function EmployeePanelPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [member, setMember] = useState<any>(null);
  const [notCompletedDialog, setNotCompletedDialog] = useState(false);
  const [notCompletedReason, setNotCompletedReason] = useState('');
  const [reasonDialog, setReasonDialog] = useState(false);
  const [extensionDialog, setExtensionDialog] = useState(false);
  const [forwardDialog, setForwardDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [allMembers, setAllMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('team_members').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setMember(data);
    });
  }, [user]);

  useEffect(() => {
    if (!member) return;
    supabase.from('tasks').select('*, projects(name)').eq('team_member_id', member.id).order('created_at', { ascending: false }).then(({ data }) => setTasks(data ?? []));
    supabase.from('team_members').select('id, name').then(({ data }) => setAllMembers((data ?? []).filter(m => m.id !== member.id)));
  }, [member]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const submitNotCompleted = async () => {
    if (!selectedTask) return;
    await supabase.from('task_requests').insert({ task_id: selectedTask.id, type: 'not_completed', requested_by: member?.id, details: { reason: notCompletedReason } });
    toast_simple('Submitted — awaiting admin review');
    setNotCompletedDialog(false); setNotCompletedReason('');
  }; 
  
  const submitReason = async () => {
    if (!selectedTask) return;
    await supabase.from('task_requests').insert({ task_id: selectedTask.id, type: 'reason', requested_by: member?.id, details: { reason } });
    toast_simple('Reason submitted');
    setReasonDialog(false); setReason('');
  };

  const submitExtension = async () => {
    if (!selectedTask || !extensionDate) return;
    await supabase.from('task_requests').insert({ task_id: selectedTask.id, type: 'extension', requested_by: member?.id, details: { new_deadline: extensionDate, current_deadline: selectedTask.deadline } });
    toast_simple('Extension request submitted — awaiting admin approval');
    setExtensionDialog(false); setExtensionDate('');
  };

  const submitForward = async () => {
    if (!selectedTask || !forwardTo) return;
    await supabase.from('tasks').update({ team_member_id: forwardTo }).eq('id', selectedTask.id);
    toast_simple('Task forwarded');
    setForwardDialog(false); setForwardTo('');
    setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
  };

  function toast_simple(msg: string) {
    const el = document.createElement('div');
    el.className = 'fixed bottom-4 right-4 bg-foreground text-background px-4 py-2 rounded-md text-sm z-50';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const todo = tasks.filter(t => t.status === 'to_do');
  const done = tasks.filter(t => t.status === 'done');

  const TaskCard = ({ task }: { task: any }) => (
    <div className={cn('rounded-lg border-l-4 bg-card p-4 mb-3 shadow-sm', task.status === 'in_progress' ? 'border-l-yellow-500' : task.status === 'done' ? 'border-l-green-500' : 'border-l-blue-500')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-base">{task.title}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priorityColors[task.priority])}>{task.priority}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">{task.status.replace('_', ' ')}</span>
          </div>
          {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
            <div><span className="font-medium text-foreground block">Assigned On</span>{formatDateTime(task.created_at)}</div>
            {task.deadline && <div><span className="font-medium text-foreground block">Deadline</span>{new Date(task.deadline).toLocaleDateString('en-IN')}</div>}
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 rounded px-2 py-1 w-fit">
            <Clock className="h-3 w-3" />
            <span>Time Elapsed: <strong>{timeElapsed(task.created_at)}</strong></span>
          </div>
        </div>
        {task.status !== 'done' && (
          <div className="flex flex-col gap-2 min-w-[140px]">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateStatus(task.id, 'done')}>
              <CheckCircle className="mr-1 h-4 w-4" />Complete
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedTask(task); setExtensionDialog(true); }}>
              <Clock className="mr-1 h-4 w-4" />Request Extension
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedTask(task); setNotCompletedDialog(true); }}>
              <AlertCircle className="mr-1 h-4 w-4" />Not Completed
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { setSelectedTask(task); setReasonDialog(true); }}>
              <AlertCircle className="mr-1 h-4 w-4" />Reason
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { setSelectedTask(task); setForwardDialog(true); }}>
              <ChevronRight className="mr-1 h-4 w-4" />Forward Task
            </Button>
          </div>
        )}
      </div>
    </div>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">View your assigned tasks and progress</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex flex-col items-center justify-center py-6">
          <ListTodo className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-3xl font-bold">{tasks.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Assigned</div>
        </CardContent></Card>
        <Card><CardContent className="flex flex-col items-center justify-center py-6">
          <Clock className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-3xl font-bold">{inProgress.length}</div>
          <div className="text-sm text-muted-foreground mt-1">In Progress</div>
        </CardContent></Card>
        <Card><CardContent className="flex flex-col items-center justify-center py-6">
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-3xl font-bold">{done.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Completed</div>
        </CardContent></Card>
      </div>

      {inProgress.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-base mb-3 text-yellow-600">
            <Clock className="h-4 w-4" />In Progress ({inProgress.length})
          </h2>
          {inProgress.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}

      {todo.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-base mb-3 text-blue-600">
            <ListTodo className="h-4 w-4" />To Do ({todo.length})
          </h2>
          {todo.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-base mb-3 text-green-600">
            <CheckCircle className="h-4 w-4" />Completed ({done.length})
          </h2>
          {done.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No tasks assigned yet</p>
        </div>
      )}

      {/* Not Completed Dialog */}
      <Dialog open={notCompletedDialog} onOpenChange={setNotCompletedDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Not Completed</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Why was this not completed?</Label>
            <Textarea rows={3} value={notCompletedReason} onChange={e => setNotCompletedReason(e.target.value)} placeholder="Describe the reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotCompletedDialog(false)}>Cancel</Button>
            <Button onClick={submitNotCompleted}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Dialog */}
      <Dialog open={reasonDialog} onOpenChange={setReasonDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Reason</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for not completing</Label>
            <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why the task was not completed..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialog(false)}>Cancel</Button>
            <Button onClick={submitReason}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extension Dialog */}
      <Dialog open={extensionDialog} onOpenChange={setExtensionDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Extension</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>New Deadline</Label>
              <Input type="date" value={extensionDate} onChange={e => setExtensionDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reason for extension</Label>
              <Textarea rows={2} placeholder="Why do you need more time?" onChange={e => setExtensionDate(prev => prev)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtensionDialog(false)}>Cancel</Button>
            <Button onClick={submitExtension}>Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={forwardDialog} onOpenChange={setForwardDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Forward Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Forward to</Label>
              <select className="w-full rounded-md border px-3 py-2 text-sm" value={forwardTo} onChange={e => setForwardTo(e.target.value)}>
                <option value="">Select member</option>
                {allMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Textarea rows={2} placeholder="Add a note for the recipient..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardDialog(false)}>Cancel</Button>
            <Button onClick={submitForward}>Forward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
