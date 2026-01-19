import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  User,
  MoreVertical,
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
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { AdminSidebar } from '../components/AdminSidebar';
import { resolveImageUrl } from '../utils/imageUtils';

import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';

interface Professional {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  email?: string;
  role?: 'ADMIN' | 'STAFF';
  permissions?: string[];
  hasLogin?: boolean;
}

export const AdminTeamPage: React.FC = () => {
  const { t } = useTranslation();
  
  const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: t('admin.team.permissions.dashboard') },
    { id: 'appointments', label: t('admin.team.permissions.appointments') },
    { id: 'clients', label: t('admin.team.permissions.clients') },
    { id: 'services', label: t('admin.team.permissions.services') },
    { id: 'team', label: t('admin.team.permissions.team') },
    { id: 'customization', label: t('admin.team.permissions.customization') },
    { id: 'finance', label: t('admin.team.permissions.finance') },
    { id: 'locations', label: t('admin.team.permissions.locations') },
    { id: 'reports', label: t('admin.team.permissions.reports') },
    { id: 'legal', label: t('admin.team.permissions.legal') },
    { id: 'integrations', label: t('admin.team.permissions.integrations') },
    { id: 'documentation', label: t('admin.team.permissions.documentation') },
  ];

  const navigate = useNavigate();
  const { tenantId, isLoading: isBrandingLoading } = useBranding();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfessional, setCurrentProfessional] = useState<Partial<Professional>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Login fields
  const [showLoginFields, setShowLoginFields] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [permissions, setPermissions] = useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const togglePermission = (permissionId: string) => {
    setPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  useEffect(() => {
    if (tenantId) {
      fetchProfessionals();
    }
  }, [tenantId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads', formData);
      setCurrentProfessional(prev => ({ ...prev, avatarUrl: response.data.url }));
    } catch (error) {
      toast.error(t('admin.team.upload_error'));
    }
  };

  const fetchProfessionals = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/professionals?tenantId=${tenantId}`);
      if (Array.isArray(response.data)) {
        setProfessionals(response.data);
      } else {
        setProfessionals([]);
        console.error('Invalid data format:', response.data);
      }
    } catch (error) {
      toast.error(t('admin.team.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (professional?: Professional) => {
    if (professional) {
      setCurrentProfessional(professional);
      setIsEditing(true);
      setRole(professional.role || 'STAFF');
      setPermissions(professional.permissions || []);
      setShowLoginFields(!!professional.hasLogin);
    } else {
      setCurrentProfessional({ name: '', bio: '' });
      setIsEditing(false);
      setRole('STAFF');
      setPermissions([]);
      setShowLoginFields(false);
    }
    setPassword('');
    setConfirmPassword('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId) return;
    if (!currentProfessional.name) {
      toast.error(t('admin.team.name_required'));
      return;
    }

    if (showLoginFields) {
      if (!currentProfessional.email) {
         toast.error(t('admin.team.email_required'));
         return;
      }
      
      const isNewLogin = !isEditing || !currentProfessional.hasLogin;
      if (isNewLogin && !password) {
         toast.error(t('admin.team.password_required'));
         return;
      }

      if (password && password !== confirmPassword) {
        toast.error(t('admin.team.password_mismatch'));
        return;
      }
    }

    const payload = {
      name: currentProfessional.name,
      bio: currentProfessional.bio,
      avatarUrl: currentProfessional.avatarUrl,
      email: currentProfessional.email,
      tenantId,
      role: showLoginFields ? role : undefined,
      permissions: showLoginFields ? permissions : undefined,
      password: (showLoginFields && password) ? password : undefined
    };

    setIsSaving(true);
    try {
      if (isEditing && currentProfessional.id) {
        await api.patch(`/professionals/${currentProfessional.id}?tenantId=${tenantId}`, payload);
        toast.success(t('admin.team.save_success'));
      } else {
        await api.post('/professionals', payload);
        toast.success(t('admin.team.save_success'));
      }
      setIsDialogOpen(false);
      fetchProfessionals();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('admin.team.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (!confirm(t('admin.team.delete_confirm'))) return;

    try {
      await api.delete(`/professionals/${id}?tenantId=${tenantId}`);
      toast.success(t('admin.team.delete_success'));
      fetchProfessionals();
    } catch (error) {
      toast.error(t('admin.team.delete_error'));
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
              <h2 className="text-3xl font-bold tracking-tight">{t('admin.team.title')}</h2>
              <p className="text-muted-foreground">{t('admin.team.subtitle')}</p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.team.add_professional')}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : professionals.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                {t('admin.team.no_professionals')}
              </div>
            ) : (
              professionals.map((professional) => (
                <Card key={professional.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {professional.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(professional)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('admin.team.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(professional.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('admin.team.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {professional.avatarUrl ? (
                          <img src={resolveImageUrl(professional.avatarUrl)} alt={professional.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {professional.bio || t('admin.team.no_bio')}
                        </p>
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
            <DialogTitle>
              {isEditing ? t('admin.team.edit_professional') : t('admin.team.new_professional')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.team.professional_details')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {currentProfessional.avatarUrl ? (
                  <img src={resolveImageUrl(currentProfessional.avatarUrl)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white text-xs">{t('admin.team.change_photo')}</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">{t('admin.team.name_label')}</Label>
              <Input
                id="name"
                value={currentProfessional.name || ''}
                onChange={(e) =>
                  setCurrentProfessional({ ...currentProfessional, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('admin.team.email_label')}</Label>
              <Input
                id="email"
                type="email"
                value={currentProfessional.email || ''}
                onChange={(e) =>
                  setCurrentProfessional({ ...currentProfessional, email: e.target.value })
                }
                placeholder={t('admin.team.email_placeholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">{t('admin.team.bio_label')}</Label>
              <Textarea
                id="bio"
                value={currentProfessional.bio || ''}
                onChange={(e) =>
                  setCurrentProfessional({ ...currentProfessional, bio: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox 
                id="hasLogin" 
                checked={showLoginFields}
                onCheckedChange={(checked) => setShowLoginFields(checked as boolean)}
              />
              <Label htmlFor="hasLogin" className="font-medium cursor-pointer">
                {t('admin.team.login_access')}
              </Label>
            </div>

            {showLoginFields && (
              <div className="grid gap-4 pl-4 border-l-2 border-muted">
                <div className="grid gap-2">
                  <Label htmlFor="role">{t('admin.team.role_label')}</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as 'ADMIN' | 'STAFF')}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.team.select_role')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t('admin.team.role_admin')}</SelectItem>
                      <SelectItem value="STAFF">{t('admin.team.role_staff')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t('admin.team.permissions_label')}</Label>
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-2">
                      {AVAILABLE_PERMISSIONS.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={`perm-${permission.id}`} className="cursor-pointer font-normal">
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {isEditing ? t('admin.team.new_password_label') : t('admin.team.password_label')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? "••••••••" : t('admin.team.password_placeholder')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t('admin.team.confirm_password_label')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('admin.team.confirm_password_placeholder')}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('admin.team.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('admin.team.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
