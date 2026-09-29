import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Search, 
  Sparkles, 
  Cloud, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Lock, 
  WifiOff,
  UserCheck,
  BookOpen,
  Award,
  Calendar,
  Bookmark,
  DollarSign,
  MessageSquare,
  FileText,
  BookOpenCheck
} from 'lucide-react';
import { TabType, Cohort } from '../../types';
import { AppUser } from '../../lib/userAuth';
import { LogoImage } from '../LogoImage';
import { getDesktopNavigation, isNavigationAccessible } from '../../app/navigation';

export interface AppSidebarProps {
  activeErpTab: TabType;
  handleNavigate: (tab: TabType) => void;
  appUser: AppUser | null;
  unreadMessagesCount: number;
  activeCohort?: Cohort | null;
  onOpenCohortModal?: () => void;
  onGoHome?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenRoleSwitch?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onOpenBroadcast?: () => void;
  onOpenAuditLog?: () => void;
  onOpenPINCheckin?: () => void;
  onPushToCloud?: () => void;
  isCloudSyncing?: boolean;
  isOffline?: boolean;
  pendingOfflineCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ROLE_COLORS: Record<string, { avatar: string; label: string; badge: string }> = {
  super_admin: {
    avatar: 'bg-purple-700 text-white dark:bg-purple-950 dark:text-purple-200',
    label: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  admin: {
    avatar: 'bg-[#023264] text-white dark:bg-[#dceaf8] dark:text-[#023264]',
    label: 'text-[#025798] dark:text-[#7dd3fc]',
    badge: 'bg-blue-50 dark:bg-blue-950/70 text-[#025798] dark:text-[#7dd3fc] border-blue-200 dark:border-blue-800',
  },
  registrar: {
    avatar: 'bg-blue-600 text-white dark:bg-blue-950 dark:text-blue-200',
    label: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  teacher: {
    avatar: 'bg-[#01883c] text-white dark:bg-[#d1fae5] dark:text-[#01883c]',
    label: 'text-[#01883c] dark:text-[#4ade80]',
    badge: 'bg-emerald-50 dark:bg-emerald-950/70 text-[#01883c] dark:text-[#4ade80] border-emerald-200 dark:border-emerald-800',
  },
  lecturer: {
    avatar: 'bg-[#01883c] text-white dark:bg-[#d1fae5] dark:text-[#01883c]',
    label: 'text-[#01883c] dark:text-[#4ade80]',
    badge: 'bg-emerald-50 dark:bg-emerald-950/70 text-[#01883c] dark:text-[#4ade80] border-emerald-200 dark:border-emerald-800',
  },
  student: {
    avatar: 'bg-[#b38f53] text-white dark:bg-[#fef3c7] dark:text-[#8c6a32]',
    label: 'text-[#b38f53] dark:text-[#dfc18b]',
    badge: 'bg-amber-50 dark:bg-amber-950/70 text-[#b38f53] dark:text-[#dfc18b] border-amber-200 dark:border-amber-800',
  },
  finance_officer: {
    avatar: 'bg-emerald-700 text-white dark:bg-emerald-950 dark:text-emerald-200',
    label: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  librarian: {
    avatar: 'bg-amber-600 text-white dark:bg-amber-950 dark:text-amber-200',
    label: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  viewer: {
    avatar: 'bg-slate-600 text-white dark:bg-slate-800 dark:text-slate-300',
    label: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

interface NavGroup {
  id: string;
  title: string;
  items: {
    id: TabType;
    label: string;
    shortLabel?: string;
    description?: string;
    icon: React.ComponentType<any>;
    badge?: number | string;
    isAlert?: boolean;
  }[];
}

export function AppSidebar({
  activeErpTab,
  handleNavigate,
  appUser,
  unreadMessagesCount,
  activeCohort,
  onOpenCohortModal = () => {},
  onGoHome = () => {},
  onOpenLogin = () => {},
  onLogout = () => {},
  onOpenCommandPalette = () => {},
  onOpenRoleSwitch = () => {},
  onOpenSettings = () => {},
  onOpenHelp = () => {},
  onOpenBroadcast = () => {},
  onOpenAuditLog = () => {},
  onOpenPINCheckin,
  onPushToCloud = () => {},
  isCloudSyncing = false,
  isOffline = false,
  pendingOfflineCount = 0,
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  // Local collapsed state fallback if not controlled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('hteim_sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem('hteim_sidebar_collapsed', String(next));
      } catch {}
    }
  };

  const userRole = appUser?.role;
  const userPermissions = (appUser as any)?.permissions;

  // Derive grouped navigation items based on active role permissions
  const navGroups: NavGroup[] = useMemo(() => {
    const accessible = getDesktopNavigation(userRole, userPermissions);
    const accessibleIds = new Set(accessible.map(r => r.id));

    const coreItems: NavGroup['items'] = [
      { id: 'home' as TabType, label: 'Dashboard', shortLabel: 'Dashboard', icon: Sparkles, description: 'Overview & Analytics' },
      { id: 'attendance' as TabType, label: 'Attendance', shortLabel: 'Attendance', icon: UserCheck, description: '75% Compliance & Logs' },
      { id: 'students' as TabType, label: 'Students Directory', shortLabel: 'Students', icon: GraduationCap, description: 'Roster & Records' },
      { id: 'courses' as TabType, label: '6 Modules', shortLabel: 'Modules', icon: BookOpen, description: 'Curriculum & Syllabi' },
      { id: 'exams' as TabType, label: 'Exams & Grades', shortLabel: 'Exams', icon: Award, description: 'Quizzes & Grading' },
      { id: 'schedule' as TabType, label: 'Academic Schedule', shortLabel: 'Schedule', icon: Calendar, description: 'Lectures & Calendar' },
    ].filter(item => accessibleIds.has(item.id));

    const academicItems: NavGroup['items'] = [
      { id: 'library' as TabType, label: 'Library & Media', shortLabel: 'Library', icon: Bookmark, description: 'Handouts & Audio' },
      { id: 'notes' as TabType, label: 'Study Notes & Bible', shortLabel: 'Notes & Bible', icon: BookOpenCheck, description: 'Journal & Scripture' },
    ].filter(item => accessibleIds.has(item.id));

    const operationsItems: NavGroup['items'] = [
      { id: 'payments' as TabType, label: 'Tuition & Fees', shortLabel: 'Tuition', icon: DollarSign, description: 'Statements & Ledgers' },
      { 
        id: 'messages' as TabType, 
        label: 'Faculty Messages', 
        shortLabel: 'Messages', 
        icon: MessageSquare, 
        description: 'Direct Inquiries',
        badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        isAlert: unreadMessagesCount > 0
      },
      { id: 'reports' as TabType, label: 'Analytics & Reports', shortLabel: 'Reports', icon: FileText, description: 'Cohort Retention Trends' },
    ].filter(item => accessibleIds.has(item.id));

    const groups: NavGroup[] = [];
    if (coreItems.length > 0) {
      groups.push({ id: 'core', title: 'Main Menu', items: coreItems });
    }
    if (academicItems.length > 0) {
      groups.push({ id: 'academic', title: 'Learning & Media', items: academicItems });
    }
    if (operationsItems.length > 0) {
      groups.push({ id: 'operations', title: 'Management & Services', items: operationsItems });
    }

    return groups;
  }, [userRole, userPermissions, unreadMessagesCount]);

  const rc = appUser ? (ROLE_COLORS[appUser.role] ?? ROLE_COLORS.student) : null;

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`hidden md:flex flex-col shrink-0 bg-white/95 dark:bg-[#07172b]/95 backdrop-blur-xl border-r border-slate-200/90 dark:border-[#1a385c] fixed top-0 left-0 bottom-0 h-screen max-h-screen z-40 transition-all duration-300 select-none overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64 lg:w-72'
      }`}
    >
      {/* 1. Header / Logo Zone */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 dark:border-[#1a385c]/80 min-h-[64px]">
        <button
          type="button"
          onClick={onGoHome}
          className={`flex items-center gap-3 cursor-pointer min-w-0 text-left transition-opacity hover:opacity-85 ${
            isCollapsed ? 'justify-center w-full' : ''
          }`}
          title="Go to HTEIM Home Dashboard"
        >
          <LogoImage
            alt="HTEIM Logo"
            className="w-9 h-9 shrink-0 rounded-xl object-contain bg-transparent p-0 shadow-2xs"
          />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  HTEIM
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-[#b38f53] dark:text-[#dfc18b] border border-amber-500/30">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate leading-tight">
                School of Ministry
              </p>
            </div>
          )}
        </button>

        {!isCollapsed && (
          <button
            type="button"
            onClick={handleToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. User Profile Card / Login Banner */}
      <div className="p-3 border-b border-slate-200/70 dark:border-[#1a385c]/70">
        {appUser ? (
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
              isCollapsed
                ? 'justify-center'
                : 'bg-slate-50/80 dark:bg-[#0c223c]/80 border border-slate-200/60 dark:border-[#1e3a5f]/60'
            }`}
          >
            <button
              type="button"
              onClick={onOpenLogin}
              className={`relative rounded-full flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 cursor-pointer ${
                isCollapsed ? 'w-10 h-10' : 'w-8 h-8'
              } ${rc?.avatar ?? 'bg-[#023264] text-white'}`}
              title={`Logged in as ${appUser.name} (${appUser.role}) — click to view profile`}
            >
              {appUser.name.charAt(0).toUpperCase()}
              {unreadMessagesCount > 0 && isCollapsed && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 border-2 border-white dark:border-slate-900 rounded-full" />
              )}
            </button>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {appUser.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${rc?.badge ?? 'bg-slate-100 text-slate-700'}`}>
                    {appUser.role}
                  </span>
                  {activeCohort && (
                    <button
                      type="button"
                      onClick={appUser.role === 'admin' ? onOpenCohortModal : undefined}
                      className={`text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate ${
                        appUser.role === 'admin' ? 'hover:underline cursor-pointer' : 'cursor-default'
                      }`}
                      title={appUser.role === 'admin' ? 'Click to switch cohort' : undefined}
                    >
                      · {activeCohort.name.replace('Class of ', "'")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#023264] hover:bg-[#025798] text-white font-bold text-xs shadow-xs transition-all cursor-pointer border border-[#b38f53]/30 ${
              isCollapsed ? 'p-2' : ''
            }`}
            title="Sign In to Student or Faculty Portal"
          >
            <Lock className="w-3.5 h-3.5 text-[#dfc18b] shrink-0" />
            {!isCollapsed && <span>Sign In to Portal</span>}
          </button>
        )}
      </div>

      {/* 3. Global Quick Search Action */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center p-2' : ''
          }`}
          title="Global Search & Quick Actions (⌘K)"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left text-slate-500 dark:text-slate-400 font-medium">Quick Search...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400 font-semibold shadow-2xs">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* 4. Main Scrollable Navigation Links */}
      <nav 
        aria-label="Sidebar tab links" 
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-2 space-y-4"
      >
        {navGroups.map(group => (
          <div key={group.id} className="space-y-1">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 py-1">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = activeErpTab === item.id || (item.id === 'home' && activeErpTab === 'home');
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? `${item.label} — ${item.description}` : item.description}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer text-left relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#025798]/15 to-[#025798]/5 dark:from-[#025798]/30 dark:to-[#0277b8]/10 text-[#023264] dark:text-white font-bold border border-[#025798]/30 dark:border-[#0277b8]/40 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c223c]/80 border border-transparent'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    {/* Active Accent Left Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#025798] dark:bg-[#7dd3fc] rounded-r-full" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'text-[#025798] dark:text-[#7dd3fc]'
                          : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] min-w-4 h-4 px-1.5 rounded-full font-bold flex items-center justify-center shrink-0 ${
                                item.isAlert
                                  ? 'bg-[#b38f53] text-white animate-pulse'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Collapsed Badge Pill Overlay */}
                    {isCollapsed && item.badge !== undefined && (
                      <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-1 rounded-full bg-[#b38f53] text-white text-[9px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 5. Bottom Utilities & Actions Zone */}
      <div className="p-3 border-t border-slate-200/80 dark:border-[#1a385c]/80 space-y-1">
        {/* Offline Status indicator in sidebar */}
        {isOffline && (
          <div
            className={`flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-[11px] font-bold ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Application is currently in Offline Mode"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                Offline {pendingOfflineCount > 0 ? `· ${pendingOfflineCount} queued` : ''}
              </span>
            )}
          </div>
        )}

        {/* Live PIN Check-in Quick Access for Faculty/Admin */}
        {onOpenPINCheckin && (appUser?.role === 'admin' || appUser?.role === 'teacher') && (
          <button
            type="button"
            onClick={onOpenPINCheckin}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Open Live QR & PIN Check-in"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            {!isCollapsed && <span>Live PIN Check-in</span>}
          </button>
        )}

        {/* Cloud Sync Backup Quick Button */}
        {appUser?.role === 'admin' && (
          <button
            type="button"
            onClick={onPushToCloud}
            disabled={isCloudSyncing}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Push local changes to Supabase Cloud Backup"
          >
            {isCloudSyncing ? (
              <RefreshCw className="w-4 h-4 text-[#025798] animate-spin shrink-0" />
            ) : (
              <Cloud className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            {!isCollapsed && <span>{isCloudSyncing ? 'Syncing...' : 'Cloud Backup'}</span>}
          </button>
        )}

        {/* Quick Role Switcher / Settings / Help */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            type="button"
            onClick={onOpenRoleSwitch}
            className="flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Switch Role Preview (Student / Faculty / Admin)"
            aria-label="Switch Role"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Portal Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="User Guide & System Help"
            aria-label="Help Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Expand Sidebar button when collapsed */}
        {isCollapsed && (
          <button
            type="button"
            onClick={handleToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="w-full flex items-center justify-center p-2 mt-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

export default AppSidebar;
