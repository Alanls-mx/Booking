import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MoreVertical,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
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
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { resolveImageUrl } from '../utils/imageUtils';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  imageUrl?: string;
  plans?: { id: string; name: string }[];
}

export const AdminServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();
  const [services, setServices] = useState<Service[]>([]);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service> & { planIds?: string[] }>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenantId) {
      fetchServices();
      fetchPlans();
    }
  }, [tenantId]);

  const fetchPlans = async () => {
    try {
        const response = await api.get(`/plans?tenantId=${tenantId}`);
        setAvailablePlans(response.data);
    } catch (error) {
        console.error("Failed to fetch plans", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads', formData);
      setCurrentService(prev => ({ ...prev, imageUrl: response.data.url }));
    } catch (error) {
      toast.error(t('admin.services.upload_error'));
    }
  };

  const fetchServices = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/services?tenantId=${tenantId}`);
      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        setServices([]);
        console.error('Invalid services data:', response.data);
      }
    } catch (error) {
      toast.error(t('admin.services.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

const handleOpenDialog = (service?: Service) => {
    if (service) {
      setCurrentService({
        id: service.id,
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        imageUrl: service.imageUrl,
        planIds: service.plans?.map((p) => p.id) || [],
      });
      setIsEditing(true);
    } else {
      setCurrentService({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        planIds: [],
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId) return;
    if (!currentService.name || !currentService.duration || currentService.price === undefined) {
      toast.error(t('common.required'));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: currentService.name,
        description: currentService.description,
        duration: Number(currentService.duration),
        price: Number(currentService.price),
        imageUrl: currentService.imageUrl,
        tenantId,
        planIds: currentService.planIds && currentService.planIds.length > 0 ? currentService.planIds : undefined,
      };

      if (isEditing && currentService.id) {
        await api.patch(`/services/${currentService.id}?tenantId=${tenantId}`, payload);
        toast.success(t('admin.services.save_success'));
      } else {
        await api.post('/services', payload);
        toast.success(t('admin.services.save_success'));
      }
      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error(error);
      toast.error(t('admin.services.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (!confirm(t('admin.services.delete_confirm'))) return;

    try {
      await api.delete(`/services/${id}?tenantId=${tenantId}`);
      toast.success(t('admin.services.delete_success'));
      fetchServices();
    } catch (error) {
      toast.error(t('admin.services.delete_error'));
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
              <h2 className="text-3xl font-bold tracking-tight">{t('admin.services.title')}</h2>
              <p className="text-muted-foreground">{t('admin.services.subtitle')}</p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.services.add_service')}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : services.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                {t('admin.services.no_services')}
              </div>
            ) : (
              services.map((service) => (
                <Card key={service.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {service.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(service)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('admin.services.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('admin.services.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {service.imageUrl && (
                        <div className="w-full h-32 rounded-md overflow-hidden mb-2">
                          <img src={resolveImageUrl(service.imageUrl)} alt={service.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {service.description || t('admin.services.no_description')}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} {t('common.min')}
                        </div>
                        <div className="flex items-center font-medium text-green-600">
                          {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(service.price)}
                        </div>
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
            <DialogTitle>{isEditing ? t('admin.services.edit_service') : t('admin.services.new_service')}</DialogTitle>
            <DialogDescription>
              {t('admin.services.service_details')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.services.image_label')}</Label>
              <div className="flex items-center gap-4">
                {currentService.imageUrl && (
                  <img src={resolveImageUrl(currentService.imageUrl)} alt="Preview" className="w-16 h-16 rounded object-cover" />
                )}
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  {t('admin.services.upload_image')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.services.name_label')}</Label>
              <Input
                id="name"
                value={currentService.name || ''}
                onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
                placeholder={t('admin.services.name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.services.description_label')}</Label>
              <Textarea
                id="description"
                value={currentService.description || ''}
                onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                placeholder={t('admin.services.description_placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('admin.services.price_label')}</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentService.price}
                  onChange={(e) => setCurrentService({ ...currentService, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t('admin.services.duration_label')}</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={currentService.duration}
                  onChange={(e) => setCurrentService({ ...currentService, duration: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.services.allowed_plans')}</Label>
              <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-40 overflow-y-auto">
                {availablePlans.map(plan => (
                    <div key={plan.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`plan-${plan.id}`}
                            checked={currentService.planIds?.includes(plan.id)}
                            onCheckedChange={(checked) => {
                                const currentIds = currentService.planIds || [];
                                if (checked) {
                                    setCurrentService({ ...currentService, planIds: [...currentIds, plan.id] });
                                } else {
                                    setCurrentService({ ...currentService, planIds: currentIds.filter(id => id !== plan.id) });
                                }
                            }}
                        />
                        <Label htmlFor={`plan-${plan.id}`} className="cursor-pointer">{plan.name}</Label>
                    </div>
                ))}
                {availablePlans.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">{t('admin.services.no_plans_available')}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('admin.services.cancel')}</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('admin.services.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
