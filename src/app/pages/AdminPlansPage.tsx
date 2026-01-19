import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
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
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  credits: number;
  active: boolean;
}

export const AdminPlansPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchPlans();
    }
  }, [tenantId]);

  const fetchPlans = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/plans?tenantId=${tenantId}`);
      if (Array.isArray(response.data)) {
        setPlans(response.data);
      } else {
        setPlans([]);
      }
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setCurrentPlan(plan);
      setIsEditing(true);
    } else {
      setCurrentPlan({ name: '', description: '', price: 0, interval: 'MONTHLY', credits: 0, active: true });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId) return;
    if (!currentPlan.name || currentPlan.price === undefined || currentPlan.credits === undefined) {
      toast.error(t('common.required'));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: currentPlan.name,
        description: currentPlan.description,
        price: Number(currentPlan.price),
        interval: currentPlan.interval || 'MONTHLY',
        credits: Number(currentPlan.credits),
        active: currentPlan.active ?? true,
      };

      if (isEditing && currentPlan.id) {
        await api.patch(`/plans/${currentPlan.id}?tenantId=${tenantId}`, payload);
        toast.success(t('admin.plans.save_success'));
      } else {
        await api.post(`/plans?tenantId=${tenantId}`, payload);
        toast.success(t('admin.plans.save_success'));
      }
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error(error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (!confirm(t('admin.plans.delete_confirm'))) return;

    try {
      await api.delete(`/plans/${id}?tenantId=${tenantId}`);
      toast.success(t('admin.plans.delete_success'));
      fetchPlans();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isBrandingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
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
              <h2 className="text-3xl font-bold tracking-tight">{t('admin.plans.title')}</h2>
              <p className="text-muted-foreground">{t('admin.plans.subtitle')}</p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.plans.create_plan')}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                {t('admin.plans.no_plans')}
              </div>
            ) : (
              plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {plan.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('admin.plans.edit_plan')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('admin.plans.delete_plan_action')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(plan.price)}
                        <span className="text-sm font-normal text-muted-foreground">/{t(`admin.plans.intervals.${plan.interval}`)}</span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {plan.description || t('admin.plans.no_description')}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('admin.plans.credits')}:</span>
                        <span className="font-medium">{plan.credits}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('admin.plans.active')}:</span>
                        {plan.active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? t('admin.plans.edit_plan') : t('admin.plans.new_plan')}</DialogTitle>
            <DialogDescription>
              {t('admin.plans.plan_details')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.plans.name')}</Label>
              <Input
                id="name"
                value={currentPlan.name || ''}
                onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.plans.description_label')}</Label>
              <Textarea
                id="description"
                value={currentPlan.description || ''}
                onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                placeholder={t('admin.plans.description_placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('admin.plans.price')}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={currentPlan.price || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">{t('admin.plans.interval')}</Label>
                <Select 
                  value={currentPlan.interval} 
                  onValueChange={(value: 'MONTHLY' | 'YEARLY') => setCurrentPlan({ ...currentPlan, interval: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">{t('admin.plans.intervals.MONTHLY')}</SelectItem>
                    <SelectItem value="YEARLY">{t('admin.plans.intervals.YEARLY')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">{t('admin.plans.credits')}</Label>
              <Input
                id="credits"
                type="number"
                value={currentPlan.credits || ''}
                onChange={(e) => setCurrentPlan({ ...currentPlan, credits: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('admin.plans.cancel')}</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('admin.plans.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
