import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Users,
  Settings,
  LogOut,
  Home,
  Scissors,
  Briefcase,
  BarChart,
  LucideIcon,
  FileText,
  Link,
  HelpCircle,
  MapPin,
  Star,
  Info,
  CreditCard,
  Crown
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { resolveImageUrl } from '../utils/imageUtils';

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  module?: string;
}

export const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { branding, rawConfig } = useBranding();

  const menuItems: MenuItem[] = useMemo(() => [
    { label: t('admin.dashboard_title'), path: '/admin/dashboard', icon: Home, permission: 'dashboard' },
    { label: t('admin.menu.appointments'), path: '/admin/appointments', icon: Calendar, permission: 'appointments', module: 'appointments' },
    { label: t('admin.menu.clients'), path: '/admin/clients', icon: Users, permission: 'clients', module: 'crm' },
    { label: t('admin.menu.team'), path: '/admin/team', icon: Briefcase, permission: 'team', module: 'appointments' },
    { label: t('admin.menu.locations'), path: '/admin/locations', icon: MapPin, permission: 'customization' },
    { label: t('admin.menu.services'), path: '/admin/services', icon: Scissors, permission: 'services', module: 'appointments' },
    { label: t('admin.menu.reports'), path: '/admin/analytics', icon: BarChart, permission: 'finance', module: 'financial' },
    { label: t('admin.menu.plans'), path: '/admin/plans', icon: Crown, permission: 'finance', module: 'financial' },
    { label: t('admin.menu.payments'), path: '/admin/payments', icon: CreditCard, permission: 'finance', module: 'financial' },
    { label: t('admin.reviews_page.title'), path: '/admin/reviews', icon: Star, permission: 'reports', module: 'website' },
    { label: t('admin.menu.customization'), path: '/admin/customization', icon: Settings, permission: 'customization', module: 'website' },
    { label: t('admin.menu.about'), path: '/admin/about', icon: Info, permission: 'customization', module: 'website' },
    { label: t('admin.menu.legal'), path: '/admin/legal', icon: FileText, permission: 'customization', module: 'website' },
    { label: t('admin.menu.integrations'), path: '/admin/integrations', icon: Link, permission: 'customization' },
    { label: t('admin.menu.documentation'), path: '/admin/docs', icon: HelpCircle },
  ], [t]);

  const isActive = (path: string) => location.pathname === path;

  const filteredItems = menuItems.filter(item => {
    // Check module enablement
    if (item.module && rawConfig?.modules) {
      if (rawConfig.modules[item.module] === false) {
        return false;
      }
    }

    // Show all items if no user (dev mode/fallback) or if user is ADMIN
    if (!user || user.role === 'ADMIN') return true;
    
    // If no permission required (shouldn't happen in this list, but good practice)
    if (!item.permission) return true;
    
    // Check user permissions
    return user?.permissions?.includes(item.permission);
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-10 hidden md:block">
      <div className="p-6 border-b border-border">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => navigate('/')}
        >
          {branding.logo ? (
            <img 
              src={resolveImageUrl(branding.logo)} 
              alt={branding.businessName} 
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-semibold">{branding.businessName}</h1>
            <p className="text-xs text-muted-foreground">{branding.dashboardTitle || 'Admin'}</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        {filteredItems.map((item) => (
          <Button 
            key={item.path}
            variant={isActive(item.path) ? "default" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => navigate(item.path)}
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start" onClick={logout}>
          <LogOut className="w-4 h-4 mr-3" />
          {t('common.logout')}
        </Button>
      </div>
    </aside>
  );
};
