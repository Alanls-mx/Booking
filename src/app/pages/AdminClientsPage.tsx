import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Loader2,
  Mail,
  Search,
  Trash,
  ArrowLeft,
  CreditCard,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

import { AdminSidebar } from '../components/AdminSidebar';
import { addDays } from 'date-fns';

interface Client {
  id: string;
  name: string;
  email: string;
  subscription?: {
    id: string;
    creditsRemaining: number;
    status: string;
    startDate?: string;
    endDate?: string;
    interval?: 'MONTHLY' | 'YEARLY';
  } | null;
}

export const AdminClientsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlySubscribers, setOnlySubscribers] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string; interval: 'MONTHLY' | 'YEARLY' }[]>([]);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [durationDays, setDurationDays] = useState<string>('');
  const [billingMode, setBillingMode] = useState<'PAID_OFFLINE' | 'CHARGE_NEXT_MONTH'>('PAID_OFFLINE');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editDays, setEditDays] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      const response = await api.get(`/users?tenantId=${tenantId}&role=CLIENT`);
      return response.data;
    },
    enabled: !!tenantId,
  });

  const { data: plansData = [] } = useQuery({
    queryKey: ['plans', tenantId],
    queryFn: async () => {
      const response = await api.get(`/plans?tenantId=${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId,
  });

  React.useEffect(() => {
    setPlans(
      Array.isArray(plansData)
        ? plansData.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            interval: plan.interval as 'MONTHLY' | 'YEARLY',
          }))
        : [],
    );
  }, [plansData]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/${id}?tenantId=${tenantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('admin.clients.delete_success'));
    },
    onError: () => {
      toast.error(t('admin.clients.delete_error'));
    }
  });

  const handleDeleteClient = async (id: string) => {
    if (!confirm(t('admin.clients.delete_confirm'))) return;
    deleteMutation.mutate(id);
  };

  const createSubscriptionMutation = useMutation({
    mutationFn: async (params: {
      userId: string;
      planId: string;
      durationDays?: number;
      interval?: 'MONTHLY' | 'YEARLY';
      alreadyPaid?: boolean;
      startNextMonth?: boolean;
    }) => {
      if (!tenantId) return;
      return api.post('/subscriptions', {
        tenantId,
        userId: params.userId,
        planId: params.planId,
        durationDays: params.durationDays,
        interval: params.interval,
        alreadyPaid: params.alreadyPaid,
        startNextMonth: params.startNextMonth,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('admin.clients.subscription_create_success'));
      setIsSubscriptionDialogOpen(false);
    },
    onError: () => {
      toast.error(t('admin.clients.subscription_create_error'));
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (params: { id: string; status?: string; endDate?: string }) => {
      return api.patch(`/subscriptions/${params.id}`, {
        status: params.status,
        endDate: params.endDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('admin.clients.subscription_update_success'));
    },
    onError: () => {
      toast.error(t('admin.clients.subscription_update_error'));
    },
  });

  const removeSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('admin.clients.subscription_remove_success'));
    },
    onError: () => {
      toast.error(t('admin.clients.subscription_remove_error'));
    },
  });

  const handleCreateSubscription = (userId: string, planId: string) => {
    if (!planId) {
      toast.error(t('admin.clients.select_plan_error'));
      return;
    }
    const parsedDuration =
      durationDays && Number(durationDays) > 0 ? Number(durationDays) : undefined;

    createSubscriptionMutation.mutate({
      userId,
      planId,
      durationDays: parsedDuration,
      interval: selectedInterval,
      alreadyPaid: billingMode === 'PAID_OFFLINE',
      startNextMonth: billingMode === 'CHARGE_NEXT_MONTH',
    });
  };

  const openSubscriptionDialog = (client: Client) => {
    setSelectedClient(client);
    setSelectedPlanId('');
    const firstPlan = plans[0];
    setSelectedInterval(firstPlan ? firstPlan.interval : 'MONTHLY');
    setDurationDays('');
    setBillingMode('PAID_OFFLINE');
    setIsSubscriptionDialogOpen(true);
  };

  const handleSuspendSubscription = (subscriptionId: string) => {
    updateSubscriptionMutation.mutate({ id: subscriptionId, status: 'PENDING' });
  };

  const handleActivateSubscription = (subscriptionId: string) => {
    updateSubscriptionMutation.mutate({ id: subscriptionId, status: 'ACTIVE' });
  };

  const handleRemoveSubscription = (subscriptionId: string) => {
    if (!confirm(t('admin.clients.subscription_remove_confirm'))) return;
    removeSubscriptionMutation.mutate(subscriptionId);
  };

  const openEditSubscriptionDialog = (client: Client) => {
    if (!client.subscription) return;
    setEditClient(client);
    if (client.subscription.endDate) {
      const diffMs =
        new Date(client.subscription.endDate).getTime() - new Date().getTime();
      const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      setEditDays(String(diffDays));
    } else {
      setEditDays('');
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveEditSubscription = () => {
    if (!editClient || !editClient.subscription || !editClient.subscription.id) {
      return;
    }
    if (!editDays || Number(editDays) <= 0 || Number.isNaN(Number(editDays))) {
      toast.error(t('admin.clients.subscription_edit_days_error'));
      return;
    }
    const daysNumber = Number(editDays);
    const newEndDate = addDays(new Date(), daysNumber).toISOString();

    updateSubscriptionMutation.mutate(
      { id: editClient.subscription.id, endDate: newEndDate },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      } as any,
    );
  };

  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubscriber = !onlySubscribers || !!client.subscription;

    return matchesSearch && matchesSubscriber;
  });

  const isLoading = isBrandingLoading || isClientsLoading;

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
              <h2 className="text-3xl font-bold tracking-tight">{t('admin.clients.title')}</h2>
              <p className="text-muted-foreground">{t('admin.clients.subtitle')}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.clients.list_title')}</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('admin.clients.search_placeholder')} 
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant={onlySubscribers ? 'default' : 'outline'}
                    onClick={() => setOnlySubscribers((prev) => !prev)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('admin.clients.only_subscribers')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin w-8 h-8 text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('admin.clients.no_clients')}</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredClients.map((client: Client) => (
                        <div
                          key={client.id}
                          className="flex flex-col p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium truncate">{client.name}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3 mr-1" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                {client.subscription ? (
                                  <span>
                                    {t('admin.clients.subscription_active')} ·{' '}
                                    {t('admin.clients.credits_available', {
                                      count: client.subscription.creditsRemaining,
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {t('admin.clients.no_subscription')}
                                  </span>
                                )}
                              </div>
                              {client.subscription?.endDate && (
                                <span className="text-xs text-muted-foreground">
                                  {t('admin.clients.subscription_days_remaining', {
                                    count: Math.max(
                                      0,
                                      Math.ceil(
                                        (new Date(client.subscription.endDate).getTime() -
                                          new Date().getTime()) /
                                          (1000 * 60 * 60 * 24),
                                      ),
                                    ),
                                  })}
                                </span>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  {t('admin.clients.subscription_actions')}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!client.subscription && (
                                  <DropdownMenuItem
                                    onClick={() => openSubscriptionDialog(client)}
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {t('admin.clients.add_subscription')}
                                  </DropdownMenuItem>
                                )}
                                {client.subscription && (
                                  <>
                                    {client.subscription.status === 'ACTIVE' ? (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleSuspendSubscription(client.subscription!.id)
                                        }
                                      >
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        {t('admin.clients.suspend_subscription')}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleActivateSubscription(client.subscription!.id)
                                        }
                                      >
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        {t('admin.clients.activate_subscription')}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => openEditSubscriptionDialog(client)}
                                    >
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      {t('admin.clients.subscription_edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() =>
                                        handleRemoveSubscription(client.subscription!.id)
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      {t('admin.clients.remove_subscription')}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </CardContent>
            </Card>
            <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.clients.subscription_dialog_title')}</DialogTitle>
                <DialogDescription>
                  {t('admin.clients.subscription_dialog_subtitle', {
                    name: selectedClient?.name || '',
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="plan">
                    {t('admin.clients.subscription_plan_label')}
                  </Label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={(value) => {
                      setSelectedPlanId(value);
                      const plan = plans.find((p) => p.id === value);
                      if (plan) {
                        setSelectedInterval(plan.interval);
                      }
                    }}
                  >
                    <SelectTrigger id="plan">
                      <SelectValue
                        placeholder={t('admin.clients.subscription_plan_placeholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">
                      {t('admin.clients.subscription_interval_label')}
                    </Label>
                    <Select
                      value={selectedInterval}
                      onValueChange={(value: 'MONTHLY' | 'YEARLY') =>
                        setSelectedInterval(value)
                      }
                    >
                      <SelectTrigger id="interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">
                          {t('admin.plans.intervals.MONTHLY')}
                        </SelectItem>
                        <SelectItem value="YEARLY">
                          {t('admin.plans.intervals.YEARLY')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      {t('admin.clients.subscription_duration_days_label')}
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      placeholder={t('admin.clients.subscription_duration_days_placeholder')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing">
                    {t('admin.clients.subscription_billing_label')}
                  </Label>
                  <Select
                    value={billingMode}
                    onValueChange={(value: 'PAID_OFFLINE' | 'CHARGE_NEXT_MONTH') =>
                      setBillingMode(value)
                    }
                  >
                    <SelectTrigger id="billing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID_OFFLINE">
                        {t('admin.clients.subscription_billing_paid_offline')}
                      </SelectItem>
                      <SelectItem value="CHARGE_NEXT_MONTH">
                        {t('admin.clients.subscription_billing_next_month')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!selectedClient || !selectedPlanId) {
                      toast.error(t('admin.clients.select_plan_error'));
                      return;
                    }
                    handleCreateSubscription(selectedClient.id, selectedPlanId);
                  }}
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('admin.clients.subscription_create_button')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.clients.subscription_edit_dialog_title')}</DialogTitle>
                <DialogDescription>
                  {t('admin.clients.subscription_edit_dialog_subtitle', {
                    name: editClient?.name || '',
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="editDays">
                    {t('admin.clients.subscription_edit_days_label')}
                  </Label>
                  <Input
                    id="editDays"
                    type="number"
                    min={1}
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    placeholder={t('admin.clients.subscription_edit_days_placeholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSaveEditSubscription}
                  disabled={updateSubscriptionMutation.isPending}
                >
                  {updateSubscriptionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('admin.clients.subscription_edit_save_button')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};
