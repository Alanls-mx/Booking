import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  Search,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { format, isSameDay } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { toast } from 'sonner';

import { AdminSidebar } from '../components/AdminSidebar';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
}

interface Professional {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
  user?: User;
  services?: Service[];
  professional?: Professional;
  location?: Location;
  professionalId?: string;
  locationId?: string;
}

export const AdminAppointmentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenantId, rawConfig } = useBranding();
  const queryClient = useQueryClient();

  const locales: { [key: string]: any } = {
    'pt-BR': ptBR,
    'en-US': enUS,
    'es-ES': es,
    'pt': ptBR,
    'en': enUS,
    'es': es
  };

  const currentLocale = locales[i18n.language] || ptBR;
  
  // Pagination State
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | undefined>(undefined);
  const [createTime, setCreateTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [createProfessionalId, setCreateProfessionalId] = useState('');
  const [createServiceIds, setCreateServiceIds] = useState<string[]>([]);
  const [createClientId, setCreateClientId] = useState('');
  const [createLocationId, setCreateLocationId] = useState('');

  // Reschedule Dialog State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newProfessionalId, setNewProfessionalId] = useState('');
  const [newLocationId, setNewLocationId] = useState('');

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detail Dialog State
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Queries
    const { data: appointmentsData, isLoading, error, refetch } = useQuery({
      queryKey: ['appointments', tenantId, page, limit],
      queryFn: async () => {
        console.log('[AdminAppointmentsPage] Fetching appointments:', { tenantId, page, limit });
        if (!tenantId) throw new Error('Tenant ID missing');
        const response = await api.get(`/appointments?tenantId=${tenantId}&page=${page}&limit=${limit}`);
        console.log('[AdminAppointmentsPage] Response:', response.data);
        return response.data; // Now returns { data: [], meta: {} }
      },
      enabled: !!tenantId,
      placeholderData: keepPreviousData,
    });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', tenantId],
    queryFn: async () => {
      const response = await api.get(`/professionals?tenantId=${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', tenantId],
    queryFn: async () => {
      const response = await api.get(`/services?tenantId=${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      const response = await api.get(`/users?tenantId=${tenantId}&role=CLIENT`);
      return response.data;
    },
    enabled: !!tenantId
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', tenantId],
    queryFn: async () => {
      const response = await api.get(`/locations?tenantId=${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/appointments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('admin.appointments.create_success'));
      setIsCreateOpen(false);
      // Reset form
      setCreateDate(undefined);
      setCreateTime('');
      setCreateClientId('');
      setCreateServiceIds([]);
      setCreateProfessionalId('');
      setCreateLocationId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar agendamento');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.patch(`/appointments/${id}/status?tenantId=${tenantId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('admin.appointments.status_success'));
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('admin.appointments.status_error'));
    }
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return api.patch(`/appointments/${id}?tenantId=${tenantId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('admin.appointments.reschedule_success'));
      setIsRescheduleOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('admin.appointments.reschedule_error'));
    }
  });

  // Derived state
  const appointments = Array.isArray(appointmentsData)
    ? appointmentsData
    : appointmentsData?.data || [];

  const meta = !appointmentsData || Array.isArray(appointmentsData)
    ? {
        total: appointments.length,
        page,
        totalPages: 1,
      }
    : appointmentsData.meta || {
        total: appointments.length,
        page,
        totalPages: 1,
      };

  // Filtered appointments (client-side search on current page)
  // Note: For large datasets, search should also be server-side. 
  // For now, keeping client-side search but warning it only filters current page.
  // Ideally, we should add 'search' param to the backend.
  const filteredAppointments = appointments.filter((app: any) => {
    const userName = app.user?.name || '';
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.services?.some((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusFilter = searchParams.get('status');
    const matchesStatus = statusFilter ? app.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const loadSlots = async () => {
      if (!createDate || !tenantId) return;
      
      const slots: string[] = [];
      const configStart = rawConfig?.workingHours?.start || '09:00';
      const configEnd = rawConfig?.workingHours?.end || '18:00';
      
      const [startH, startM] = configStart.split(':').map(Number);
      const [endH, endM] = configEnd.split(':').map(Number);

      let current = new Date();
      current.setHours(startH, startM, 0, 0);
      const endTime = new Date();
      endTime.setHours(endH, endM, 0, 0);

      while (current < endTime) {
        slots.push(format(current, 'HH:mm'));
        current = new Date(current.getTime() + 30 * 60000);
      }

      try {
        const dayStr = format(createDate, 'yyyy-MM-dd');
        // We still need to check availability. 
        // Using the same endpoint with date filter would be better if backend supported it fully for availability check.
        // For now, let's just fetch for that specific date without pagination if possible, or assume backend handles it.
        // Backend 'findAll' now supports pagination but if we don't pass page/limit it returns all.
        // BUT we changed backend to return all if page/limit are missing.
        // So we can use that to check availability for the day.
        
        const response = await api.get(`/appointments?tenantId=${tenantId}&date=${dayStr}`);
        // Response might be array (old behavior/no pagination params) or object (if we changed default).
        // My change in backend: if !page || !limit, returns array.
        const dayAppointments = Array.isArray(response.data) ? response.data : response.data.data;

        const occupied = new Set<string>(
          dayAppointments
            .filter((a: any) => (!createProfessionalId || a.professional?.id === createProfessionalId) && a.status !== 'CANCELED')
            .map((a: any) => format(new Date(a.date), 'HH:mm'))
        );
        
        // Filter occupied and past slots if today
        const now = new Date();
        const isToday = isSameDay(createDate, now);
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const free = slots.filter((t) => {
            if (occupied.has(t)) return false;
            
            if (isToday) {
               const [h, m] = t.split(':').map(Number);
               const slotTotalMinutes = h * 60 + m;
               if (slotTotalMinutes <= currentTotalMinutes) return false;
            }
            return true;
        });

        setAvailableSlots(free);
      } catch (error) {
        console.error('Error loading slots:', error);
        setAvailableSlots(slots);
      }
    };
    
    loadSlots();
  }, [createDate, createProfessionalId, tenantId, rawConfig]);


  const handleCreate = async () => {
    if (!createDate || !createTime || !createClientId || createServiceIds.length === 0) {
      toast.error(t('admin.appointments.fill_required'));
      return;
    }

    const [hours, minutes] = createTime.split(':').map(Number);
    const appointmentDate = new Date(createDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    createMutation.mutate({
      tenantId,
      date: appointmentDate.toISOString(),
      userId: createClientId,
      professionalId: createProfessionalId || undefined,
      locationId: createLocationId || undefined,
      serviceIds: createServiceIds,
      status: 'CONFIRMED'
    });
  };

  const toggleService = (serviceId: string) => {
    setCreateServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAppointments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAppointments.map((a: any) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const deletableIds = filteredAppointments
      .filter((a: any) => selectedIds.includes(a.id) && a.status !== 'COMPLETED')
      .map((a: any) => a.id);

    if (deletableIds.length === 0) {
      toast.error(t('admin.appointments.bulk_delete_none_allowed'));
      return;
    }

    const confirmed = window.confirm(t('admin.appointments.delete_confirm'));
    if (!confirmed) return;

    try {
      await api.post(`/appointments/bulk-delete?tenantId=${tenantId}`, { ids: deletableIds });
      toast.success(t('admin.appointments.bulk_delete_success', { count: deletableIds.length }));
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error(t('admin.appointments.bulk_delete_error'));
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map(id => 
          api.patch(`/appointments/${id}/status?tenantId=${tenantId}`, { status })
        )
      );
      toast.success(t('admin.appointments.bulk_update_success', { count: selectedIds.length }));
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error: any) {
      console.error('Bulk update error:', error);
      toast.error(t('admin.appointments.bulk_update_error'));
    }
  };

  const openDetailDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const handleReschedule = () => {
    if (!selectedAppointment || !newDate) return;

    rescheduleMutation.mutate({
      id: selectedAppointment.id,
      data: {
        date: new Date(newDate).toISOString(),
        professionalId: newProfessionalId || undefined,
        locationId: newLocationId || undefined
      }
    });
  };

  const openRescheduleDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    const date = new Date(appointment.date);
    const dateString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setNewDate(dateString);
    setNewProfessionalId(appointment.professionalId || '');
    setNewLocationId(appointment.locationId || '');
    setIsRescheduleOpen(true);
  };

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
      <main className="md:ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-start">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t('admin.appointments.title')}</h2>
              <p className="text-muted-foreground">{t('admin.appointments.subtitle')}</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.appointments.new_appointment_title')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.appointments.list_title')}</CardTitle>
                <div className="flex gap-2 items-center">
                  {searchParams.get('status') && (
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate('/admin/appointments')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('admin.appointments.clear_filter')}
                    </Button>
                  )}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('admin.appointments.search_placeholder')}
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bulk Actions Toolbar */}
                {selectedIds.length > 0 && (
                  <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between border border-primary/20">
                    <span className="text-sm font-medium">{t('admin.appointments.selected_count', { count: selectedIds.length })}</span>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => handleBulkStatusUpdate('CONFIRMED')}>
                        {t('admin.appointments.confirm')}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleBulkStatusUpdate('COMPLETED')}>
                        {t('admin.appointments.complete')}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleBulkStatusUpdate('CANCELED')}>
                        {t('admin.appointments.cancel')}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        {t('admin.appointments.delete_selected')}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center px-4 py-2 bg-muted/20 rounded-lg">
                   <Checkbox 
                     checked={filteredAppointments.length > 0 && selectedIds.length === filteredAppointments.length}
                     onCheckedChange={toggleSelectAll}
                     className="mr-4"
                   />
                   <span className="text-sm font-medium text-muted-foreground">{t('admin.appointments.select_all')}</span>
                </div>

                {isLoading ? (
                   <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                     <Loader2 className="w-8 h-8 animate-spin mb-2" />
                     <p>{t('common.loading')}</p>
                   </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || searchParams.get('status') 
                      ? t('admin.appointments.no_results_filter')
                      : t('admin.appointments.no_appointments')}
                  </div>
                ) : (
                  filteredAppointments.map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={selectedIds.includes(appointment.id)}
                        onCheckedChange={() => toggleSelect(appointment.id)}
                      />
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="cursor-pointer" onClick={() => openDetailDialog(appointment)}>
                        <div className="font-medium hover:underline">{appointment.user?.name || t('admin.appointments.no_client_name')}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{appointment.services?.map((s: any) => s.name).join(', ')}</span>
                          <span>•</span>
                          <span>{format(new Date(appointment.date), "PP p", { locale: currentLocale })}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                          {appointment.professional && (
                            <span>{t('admin.appointments.professional_label')}: {appointment.professional.name}</span>
                          )}
                          {appointment.professional && appointment.location && <span>•</span>}
                          {appointment.location && (
                            <span>{t('admin.appointments.unit_label')}: {appointment.location.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(appointment.status)}
                      <div className="flex gap-2">
                        {appointment.status === 'PENDING' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleStatusUpdate(appointment.id, 'CONFIRMED')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> {t('admin.appointments.confirm')}
                          </Button>
                        )}

                        {appointment.status === 'CONFIRMED' && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleStatusUpdate(appointment.id, 'COMPLETED')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> {t('admin.appointments.complete')}
                          </Button>
                        )}

                        {appointment.status !== 'CANCELED' && appointment.status !== 'COMPLETED' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openRescheduleDialog(appointment)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> {t('admin.appointments.reschedule')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id, 'CANCELED')}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> {t('admin.appointments.cancel')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4 border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    {t('admin.appointments.pagination', { page: meta.page, totalPages: meta.totalPages, total: meta.total })}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSearchParams(prev => {
                        prev.set('page', String(Math.max(1, page - 1)));
                        return prev;
                      })}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> {t('admin.appointments.prev_page')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSearchParams(prev => {
                        prev.set('page', String(Math.min(meta.totalPages, page + 1)));
                        return prev;
                      })}
                      disabled={page >= meta.totalPages}
                    >
                      {t('admin.appointments.next_page')} <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.appointments.new_appointment_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.appointments.client_label')}</Label>
              <Select value={createClientId} onValueChange={setCreateClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.appointments.select_client_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: User) => (
                    <SelectItem key={client.id} value={client.id}>{client.name} ({client.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.appointments.services_label')}</Label>
              <div className="border rounded-md p-2 h-40 overflow-y-auto space-y-2">
                {services.map((service: Service) => (
                  <div key={service.id} className="flex items-center space-x-2 p-1 hover:bg-accent rounded">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={createServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <Label htmlFor={`service-${service.id}`} className="cursor-pointer font-normal flex-1">
                      {service.name} ({new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(Number(service.price))})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.appointments.unit_optional_label')}</Label>
              <Select value={createLocationId} onValueChange={setCreateLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.appointments.select_unit_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc: Location) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.appointments.professional_optional_label')}</Label>
              <Select value={createProfessionalId} onValueChange={setCreateProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.appointments.select_professional_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof: Professional) => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.appointments.date_time_label')}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Calendar
                    mode="single"
                    selected={createDate}
                    onSelect={setCreateDate}
                    className="rounded-md border"
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      
                      const workingDays = rawConfig?.workingHours?.days;
                      if (workingDays && Array.isArray(workingDays)) {
                        return !workingDays.includes(date.getDay());
                      }
                      return false;
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.appointments.available_times_label')}</Label>
                  {!createDate ? (
                    <p className="text-sm text-muted-foreground">{t('admin.appointments.select_date_helper')}</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('admin.appointments.no_times_available')}</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto pr-2">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant={createTime === time ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCreateTime(time)}
                          className={createTime === time ? 'bg-primary text-primary-foreground' : ''}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate}>
              {t('admin.appointments.create_button')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.appointments.reschedule_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.appointments.new_date_time_label')}</Label>
              <Input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.appointments.unit_label')}</Label>
              <Select value={newLocationId} onValueChange={setNewLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.appointments.select_unit_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc: Location) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.appointments.professional_label')}</Label>
              <Select value={newProfessionalId} onValueChange={setNewProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.appointments.select_professional_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof: Professional) => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleReschedule}>
              {t('admin.appointments.save_changes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.appointments.details_title')}</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAppointment.user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.user?.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.user?.phone || selectedAppointment.user?.cpf}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t('admin.appointments.date_label')}</Label>
                    <div className="font-medium">
                      {format(new Date(selectedAppointment.date), "P", { locale: currentLocale })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('admin.appointments.time_label')}</Label>
                    <div className="font-medium">
                      {format(new Date(selectedAppointment.date), "p", { locale: currentLocale })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('admin.appointments.professional_label')}</Label>
                    <div className="font-medium">
                      {selectedAppointment.professional?.name || t('admin.appointments.not_assigned')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('admin.appointments.unit_label')}</Label>
                    <div className="font-medium">
                      {selectedAppointment.location?.name || t('admin.appointments.not_defined')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('admin.appointments.status_label')}</Label>
                    <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">{t('admin.appointments.services_label')}</Label>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    {selectedAppointment.services?.map((s: any) => (
                      <div key={s.id} className="flex justify-between text-sm">
                        <span>{s.name}</span>
                        <span className="font-medium">{new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(Number(s.price))}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>{t('admin.appointments.total_label')}</span>
                      <span>
                        {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(selectedAppointment.services?.reduce((acc: number, s: any) => acc + Number(s.price), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                {selectedAppointment.status === 'PENDING' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'CONFIRMED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> {t('admin.appointments.confirm_action')}
                  </Button>
                )}

                {selectedAppointment.status === 'CONFIRMED' && (
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'COMPLETED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> {t('admin.appointments.complete_action')}
                  </Button>
                )}

                <div className="flex gap-2">
                  {selectedAppointment.status !== 'CANCELED' && selectedAppointment.status !== 'COMPLETED' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setIsDetailOpen(false);
                          openRescheduleDialog(selectedAppointment);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" /> {t('admin.appointments.reschedule_action')}
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'CANCELED')}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> {t('admin.appointments.cancel_action')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
