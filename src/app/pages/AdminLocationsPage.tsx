import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { AdminSidebar } from '../components/AdminSidebar';

interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export const AdminLocationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Partial<Location>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchLocations();
    }
  }, [tenantId]);

  const fetchLocations = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/locations?tenantId=${tenantId}`);
      if (Array.isArray(response.data)) {
        setLocations(response.data);
      } else {
        setLocations([]);
      }
    } catch (error) {
      toast.error(t('admin.locations.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setCurrentLocation(location);
      setIsEditing(true);
    } else {
      setCurrentLocation({});
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentLocation.name) {
      toast.error(t('admin.locations.name_required'));
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && currentLocation.id) {
        await api.patch(`/locations/${currentLocation.id}`, currentLocation);
        toast.success(t('admin.locations.save_success'));
      } else {
        await api.post('/locations', {
          ...currentLocation,
          tenantId,
        });
        toast.success(t('admin.locations.save_success'));
      }
      setIsDialogOpen(false);
      fetchLocations();
    } catch (error) {
      toast.error(t('admin.locations.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.locations.delete_confirm'))) return;

    try {
      await api.delete(`/locations/${id}`);
      toast.success(t('admin.locations.delete_success'));
      fetchLocations();
    } catch (error) {
      toast.error(t('admin.locations.delete_error'));
    }
  };

  if (isBrandingLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.locations.title')}</h1>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> {t('admin.locations.new_location')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : locations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{t('admin.locations.no_locations')}</h3>
                <p className="text-gray-500 mt-2 mb-6">{t('admin.locations.start_adding')}</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> {t('admin.locations.add_location')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <Card key={location.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">{location.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(location)}>
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mt-4">
                      {location.address && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">{location.address}</span>
                        </div>
                      )}
                      {location.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span className="text-sm">{location.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? t('admin.locations.edit_location') : t('admin.locations.new_location')}</DialogTitle>
            <DialogDescription>
              {t('admin.locations.location_details')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.locations.name_label')}</Label>
              <Input
                id="name"
                placeholder={t('admin.locations.name_placeholder')}
                value={currentLocation.name || ''}
                onChange={(e) => setCurrentLocation({ ...currentLocation, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('admin.locations.address_label')}</Label>
              <Input
                id="address"
                placeholder={t('admin.locations.address_placeholder')}
                value={currentLocation.address || ''}
                onChange={(e) => setCurrentLocation({ ...currentLocation, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('admin.locations.phone_label')}</Label>
              <Input
                id="phone"
                placeholder={t('admin.locations.phone_placeholder')}
                value={currentLocation.phone || ''}
                onChange={(e) => setCurrentLocation({ ...currentLocation, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('admin.locations.cancel')}</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.locations.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
