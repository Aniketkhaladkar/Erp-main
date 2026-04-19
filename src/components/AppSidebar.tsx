import { Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderKanban,
  Receipt,
  Wrench,
  Package,
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ListTodo,
  BarChart2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const tekItems: NavItem[] = [
  { label: 'Dashboard', to: '/tek/dashboard', icon: LayoutDashboard },
  { label: 'Leads', to: '/tek/leads', icon: UserPlus },
  { label: 'Clients', to: '/tek/clients', icon: Users },
  { label: 'Team Members', to: '/tek/team', icon: Users },
  { label: 'Projects', to: '/tek/projects', icon: FolderKanban },
  { label: 'Expense Tools', to: '/tek/expenses', icon: Wrench },
  { label: 'Billing', to: '/tek/invoices', icon: Receipt },
];

const strategiesItems: NavItem[] = [
  { label: 'Dashboard', to: '/strategies/dashboard', icon: LayoutDashboard },
  { label: 'Leads', to: '/strategies/leads', icon: UserPlus },
  { label: 'Clients', to: '/strategies/clients', icon: Users },
  { label: 'Team Members', to: '/strategies/team', icon: Users },
  { label: 'Projects', to: '/strategies/projects', icon: FolderKanban },
  { label: 'Assets', to: '/strategies/assets', icon: Package },
  { label: 'Expense Tools', to: '/strategies/expenses', icon: Wrench },
  { label: 'Billing', to: '/strategies/invoices', icon: Receipt },
];

function NavGroup({ title, items, defaultOpen }: { title: string; items: NavItem[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const location = useLocation();

  const isGroupActive = items.some((i) => location.pathname.startsWith(i.to));

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider',
          'text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors'
        )}
      >
        <span>{title}</span>
        {open || isGroupActive ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {(open || isGroupActive) && (
        <div className="mt-1 space-y-0.5">
          {items.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { user, role, signOut, businessUnitId } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          S
        </div>
        <div>
          <div className="font-semibold text-sm">Solvix</div>
          <div className="text-xs text-sidebar-foreground/50">Financial Dashboard</div>
        </div>
      </div>

      {/* User info */}
      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="text-sm font-medium truncate">{user?.email}</div>
        <span className={cn(
          'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
          role === 'admin' ? 'bg-sidebar-primary/20 text-sidebar-primary' : 'bg-sidebar-accent text-sidebar-accent-foreground'
        )}>
          {role ?? 'user'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {(role === 'admin' || role === 'manager') && (
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              location.pathname === '/dashboard'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        )}

        <Link
          to="/tracker"
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
            location.pathname === '/tracker'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <ListTodo className="h-4 w-4" />
          <span>Tracker</span>
        </Link>

        {(role === 'admin' || role === 'manager' || role === 'team_lead') && (
          <Link
            to="/task-reports"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              location.pathname === '/task-reports'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Task Reports</span>
          </Link>
        )}

        {role === 'employee' && (
          <Link
            to="/employee"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              location.pathname === '/employee'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <ListTodo className="h-4 w-4" />
            <span>My Tasks</span>
          </Link>
        )}

        {/* team_lead: My Tasks + Projects of their unit + Tracker + Task Reports */}
        {role === 'team_lead' && (
          <>
            <Link to="/employee" className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors', location.pathname === '/employee' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}>
              <ListTodo className="h-4 w-4" /><span>My Tasks</span>
            </Link>
            <NavGroup
              title="Projects"
              defaultOpen
              items={[
                { label: 'Tek Projects', to: '/tek/projects', icon: FolderKanban },
                { label: 'Strategies Projects', to: '/strategies/projects', icon: FolderKanban },
              ]}
            />
          </>
        )}

        {/* manager: full Solvix Strategies access */}
        {role === 'manager' && (
          <>
            <Link to="/employee" className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors', location.pathname === '/employee' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}>
              <ListTodo className="h-4 w-4" /><span>My Tasks</span>
            </Link>
            <NavGroup title="Solvix Strategies" items={strategiesItems} defaultOpen />
          </>
        )}

        {/* admin: full access */}
        {(role === 'admin') && (
          <>
            <NavGroup title="Solvix Tek" items={tekItems} />
            <NavGroup title="Solvix Strategies" items={strategiesItems} />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <Link
          to="/settings"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
