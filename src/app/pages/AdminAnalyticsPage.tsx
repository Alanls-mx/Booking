import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AdminSidebar } from '../components/AdminSidebar';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Scissors, Calendar, ArrowLeft, User, TrendingUp, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from '../components/ui/badge';

interface StatsData {
  today: { revenue: number; count: number };
  week: { revenue: number; count: number };
  month: { revenue: number; count: number };
  dailySeries: { hour: number; count: number }[];
  topProfessionals: { name: string; count: number }[];
  topServices: { name: string; count: number }[];
  recentAppointments: {
    id: string;
    clientName: string;
    professionalName: string;
    serviceName: string;
    date: string;
    status: string;
  }[];
  pendingCount: number;
  activeClientsCount: number;
}

export const AdminAnalyticsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', tenantId],
    queryFn: async () => {
      const response = await api.get<StatsData>(`/analytics/stats?tenantId=${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800',
    };
    
    const labels: Record<string, string> = {
        PENDING: t('admin.status.pending'),
        CONFIRMED: t('admin.status.confirmed'),
        COMPLETED: t('admin.status.completed'),
        CANCELED: t('admin.status.canceled'),
    }

    return (
      <Badge variant="outline" className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isBrandingLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">{t('admin.analytics.loading')}</p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t('admin.analytics.config_error')}</h2>
          <p className="text-muted-foreground">{t('admin.analytics.tenant_error')}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            {t('admin.analytics.try_again')}
          </Button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t('admin.analytics.load_error')}</h2>
          <p className="text-muted-foreground">{t('admin.analytics.load_error_desc')}</p>
          <Button onClick={() => refetch()} className="mt-4">
            {t('admin.analytics.try_again')}
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="md:ml-64 p-8">
        <div className="flex justify-start mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-8">{t('admin.analytics.title')}</h1>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.analytics.today')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.today.revenue)}</div>
              <p className="text-xs text-muted-foreground">{stats.today.count} {t('admin.analytics.scheduled_cuts')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.analytics.week')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.week.revenue)}</div>
              <p className="text-xs text-muted-foreground">{stats.week.count} {t('admin.analytics.confirmed_cuts')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.analytics.month')}</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.month.revenue)}</div>
              <p className="text-xs text-muted-foreground">{stats.month.count} {t('admin.analytics.confirmed_cuts')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
            {/* Top Professionals */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t('admin.analytics.top_professionals')}
                    </CardTitle>
                    <CardDescription>{t('admin.analytics.top_professionals_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('admin.analytics.table.name')}</TableHead>
                                <TableHead className="text-right">{t('admin.analytics.table.appointments')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.topProfessionals.map((prof, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{prof.name}</TableCell>
                                    <TableCell className="text-right">{prof.count}</TableCell>
                                </TableRow>
                            ))}
                            {stats.topProfessionals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">{t('admin.analytics.no_data')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {/* Top Services */}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {t('admin.analytics.top_services')}
                    </CardTitle>
                    <CardDescription>{t('admin.analytics.top_services_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('admin.analytics.table.service')}</TableHead>
                                <TableHead className="text-right">{t('admin.analytics.table.appointments')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.topServices.map((service, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell className="text-right">{service.count}</TableCell>
                                </TableRow>
                            ))}
                            {stats.topServices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">{t('admin.analytics.no_data')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t('admin.analytics.recent_activity')}
                </CardTitle>
                <CardDescription>{t('admin.analytics.recent_activity_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('admin.analytics.table.client')}</TableHead>
                            <TableHead>{t('admin.analytics.table.professional')}</TableHead>
                            <TableHead>{t('admin.analytics.table.service')}</TableHead>
                            <TableHead>{t('admin.analytics.table.date_time')}</TableHead>
                            <TableHead>{t('admin.analytics.table.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.recentAppointments.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell>{app.clientName}</TableCell>
                                <TableCell>{app.professionalName}</TableCell>
                                <TableCell>{app.serviceName}</TableCell>
                                <TableCell>{formatDate(app.date)}</TableCell>
                                <TableCell>{getStatusBadge(app.status)}</TableCell>
                            </TableRow>
                        ))}
                         {stats.recentAppointments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">{t('admin.analytics.no_recent_appointments')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-1">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t('admin.analytics.cuts_per_hour')}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dailySeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      formatter={(value) => [value, t('admin.analytics.table.appointments')]}
                      labelFormatter={(hour) => `${hour}:00`}
                    />
                    <Bar dataKey="count" fill="#8884d8" name={t('admin.analytics.table.appointments')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
