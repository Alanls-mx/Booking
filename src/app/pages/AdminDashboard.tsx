import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Settings,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

import { AdminSidebar } from '../components/AdminSidebar';

export const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();

  const locales: Record<string, any> = { 'en': enUS, 'pt': ptBR, 'es': es };
  const currentLocale = locales[i18n.language] || ptBR;

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['analytics', tenantId],
    queryFn: async () => {
      const response = await api.get(`/analytics/stats?tenantId=${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  const stats = {
    todayCount: analytics?.today.count || 0,
    activeClients: analytics?.activeClientsCount || 0,
    monthlyRevenue: analytics?.month.revenue || 0,
    occupation: 'N/A',
    pendingCount: analytics?.pendingCount || 0
  };

  const isLoading = isBrandingLoading || isAnalyticsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dashboardStats = [
    {
      title: t('admin.today_appointments'),
      value: stats.todayCount.toString(),
      icon: Calendar,
      trend: '',
      color: 'text-blue-600',
    },
    {
      title: t('admin.active_clients'),
      value: stats.activeClients.toString(),
      icon: Users,
      trend: '',
      color: 'text-green-600',
    },
    {
      title: t('admin.monthly_revenue'),
      value: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue),
      icon: DollarSign,
      trend: '',
      color: 'text-purple-600',
    },
    {
      title: t('admin.occupation_rate'),
      value: stats.occupation,
      icon: TrendingUp,
      trend: '',
      color: 'text-orange-600',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      CONFIRMED: 'default',
      PENDING: 'secondary',
      CANCELED: 'destructive',
      COMPLETED: 'default',
    };
    const labels: Record<string, string> = {
      CONFIRMED: t('admin.status.confirmed'),
      PENDING: t('admin.status.pending'),
      CANCELED: t('admin.status.canceled'),
      COMPLETED: t('admin.status.completed'),
    };
    return (
      <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4 pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            <h1 className="text-3xl font-bold mb-2">{t('admin.dashboard_title')}</h1>
            <p className="text-muted-foreground">
              {t('admin.welcome_subtitle')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.recent_appointments')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!analytics?.recentAppointments || analytics.recentAppointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t('admin.no_appointments')}</p>
                ) : (
                  analytics.recentAppointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{appointment.serviceName}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.clientName} • {format(new Date(appointment.date), "P p", { locale: currentLocale })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/appointments?status=PENDING')}>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-1">{t('admin.confirm_appointments')}</h3>
                <p className="text-sm text-muted-foreground">{t('admin.pending_count', { count: stats.pendingCount })}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/appointments?action=new')}>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-1">{t('admin.new_appointment')}</h3>
                <p className="text-sm text-muted-foreground">{t('admin.create_manual')}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/customization')}>
              <CardContent className="p-6 text-center">
                <Settings className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-1">{t('admin.customize')}</h3>
                <p className="text-sm text-muted-foreground">{t('admin.site_settings')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
