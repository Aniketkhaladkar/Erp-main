const fs = require('fs');

// Update submitExtension and submitNotCompleted in EmployeePanelPage to create requests instead
let content = fs.readFileSync('src/components/pages/EmployeePanelPage.tsx', 'utf8');

// Replace submitExtension
content = content.replace(
  `  const submitExtension = async () => {
    if (!selectedTask) return;
    await supabase.from('tasks').update({ deadline: extensionDate, description: (selectedTask.description ? selectedTask.description + ' | ' : '') + 'Extension requested to: ' + extensionDate }).eq('id', selectedTask.id);
    toast_simple('Extension requested');
    setExtensionDialog(false); setExtensionDate('');
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, deadline: extensionDate } : t));
  };`,
  `  const submitExtension = async () => {
    if (!selectedTask || !extensionDate) return;
    await supabase.from('task_requests').insert({ task_id: selectedTask.id, type: 'extension', requested_by: member?.id, details: { new_deadline: extensionDate, current_deadline: selectedTask.deadline } });
    toast_simple('Extension request submitted — awaiting admin approval');
    setExtensionDialog(false); setExtensionDate('');
  };`
);

// Replace submitNotCompleted
content = content.replace(
  `  const submitNotCompleted = async () => {
    if (!selectedTask) return;
    await supabase.from('tasks').update({ status: 'to_do', description: (selectedTask.description ? selectedTask.description + ' | ' : '') + 'Not completed: ' + notCompletedReason }).eq('id', selectedTask.id);
    toast_simple('Marked as not completed');
    setNotCompletedDialog(false); setNotCompletedReason('');
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'to_do' } : t));
  };`,
  `  const submitNotCompleted = async () => {
    if (!selectedTask) return;
    await supabase.from('task_requests').insert({ task_id: selectedTask.id, type: 'not_completed', requested_by: member?.id, details: { reason: notCompletedReason } });
    toast_simple('Submitted — awaiting admin review');
    setNotCompletedDialog(false); setNotCompletedReason('');
  };`
);

// Replace submitReason
content = content.replace(
  `  const submitReason = async () => {
    if (!selectedTask) return;
    await supabase.from('tasks').update({ description: (selectedTask.description ? selectedTask.description + ' | ' : '') + 'Reason: ' + reason, status: 'to_do' }).eq('id', selectedTask.id);
    toast_simple('Reason submitted');
    setReasonDialog(false); setReason('');
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'to_do' } : t));
  };`,
  `  const submitReason = async () => {
    if (!selectedTask) return;
    await supabase.from('task_requests').insert({ task_id: selectedTask.id, type: 'reason', requested_by: member?.id, details: { reason } });
    toast_simple('Reason submitted');
    setReasonDialog(false); setReason('');
  };`
);

fs.writeFileSync('src/components/pages/EmployeePanelPage.tsx', content, 'utf8');
console.log('employee done');
