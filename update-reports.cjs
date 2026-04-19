const fs = require('fs');
const addition = `
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
`;

let content = fs.readFileSync('src/components/pages/TaskReportsPage.tsx', 'utf8');

// Add imports
content = content.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';\nimport { Textarea } from '@/components/ui/textarea';\nimport { Label } from '@/components/ui/label';\nimport { Button } from '@/components/ui/button';"
);

// Add RequestsTab before TaskReportsPage
content = content.replace('export function TaskReportsPage()', addition + '\nexport function TaskReportsPage()');

// Add Requests tab to the Tabs
content = content.replace(
  '<TabsTrigger value="notcompleted">Not Completed ({notCompleted.length})</TabsTrigger>',
  '<TabsTrigger value="notcompleted">Not Completed ({notCompleted.length})</TabsTrigger>\n          <TabsTrigger value="requests">Requests</TabsTrigger>'
);

content = content.replace(
  '</Tabs>\n    </div>\n  );\n}',
  `        <TabsContent value="requests" className="mt-4">
          <RequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}`
);

fs.writeFileSync('src/components/pages/TaskReportsPage.tsx', content, 'utf8');
console.log('done');
