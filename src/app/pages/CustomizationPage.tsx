import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Image as ImageIcon,
  Save,
  Loader2,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useBranding } from '../contexts/BrandingContext';
import { toast } from 'sonner';
import api from '../../api/client';
import { AdminSidebar } from '../components/AdminSidebar';
import { resolveImageUrl, stripApiUrl } from '../utils/imageUtils';

export const CustomizationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding, tenantId, rawConfig, refreshTenant } = useBranding();
  const [localBranding, setLocalBranding] = useState(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sync local state when branding context updates (e.g. initial load)
  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  const handleSave = async () => {
    if (!tenantId) {
      toast.error(t('admin.customization_page.tenant_error'));
      return;
    }

    setIsSaving(true);
    try {
      await api.post(`/tenants/${tenantId}`, {
        name: localBranding.businessName,
        primaryColor: localBranding.primaryColor,
        secondaryColor: localBranding.secondaryColor,
        logo: stripApiUrl(localBranding.logo),
        facebookUrl: localBranding.facebookUrl,
        instagramUrl: localBranding.instagramUrl,
        whatsapp: localBranding.whatsapp,
        address: localBranding.address,
        contactEmail: localBranding.contactEmail,
        contactPhone: localBranding.contactPhone,
        // Preserva configurações existentes e atualiza as novas
        config: {
          ...rawConfig,
          heroTitle: localBranding.heroTitle,
          heroSubtitle: localBranding.heroSubtitle,
          dashboardTitle: localBranding.dashboardTitle,
          bannerImage: stripApiUrl(localBranding.bannerImage)
        }
      });

      await refreshTenant();
      toast.success(t('admin.customization_page.save_success'));
    } catch (error) {
      console.error(error);
      toast.error(t('admin.customization_page.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await api.post('/uploads', formData);
      return response.data.url;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t('admin.customization_page.upload_error'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleFileUpload(file);
      if (url) {
        setLocalBranding({ ...localBranding, logo: url });
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleFileUpload(file);
      if (url) {
        setLocalBranding({ ...localBranding, bannerImage: url });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="md:ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-start">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('admin.customization_page.back')}
            </Button>
          </div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('admin.customization_page.title')}</h1>
              <p className="text-muted-foreground">
                {t('admin.customization_page.subtitle')}
              </p>
            </div>
            <Button onClick={handleSave} size="lg" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('admin.customization_page.save_changes')}
            </Button>
          </div>

          <Tabs defaultValue="branding" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">{t('admin.customization_page.tabs.branding')}</TabsTrigger>
              <TabsTrigger value="colors">{t('admin.customization_page.tabs.colors')}</TabsTrigger>
              <TabsTrigger value="content">{t('admin.customization_page.tabs.content')}</TabsTrigger>
              <TabsTrigger value="footer">{t('admin.customization_page.tabs.footer')}</TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.customization_page.branding.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.customization_page.branding.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="logo">{t('admin.customization_page.branding.logo_label')}</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {localBranding.logo ? (
                        <img
                          src={resolveImageUrl(localBranding.logo)}
                          alt="Logo"
                          className="w-20 h-20 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('logo')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {t('admin.customization_page.branding.upload_logo')}
                          </Button>
                          {localBranding.logo && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setLocalBranding({ ...localBranding, logo: '' })}
                              title={t('admin.customization_page.branding.remove_logo')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('admin.customization_page.branding.logo_help')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessName">{t('admin.customization_page.branding.business_name_label')}</Label>
                    <Input
                      id="businessName"
                      value={localBranding.businessName}
                      onChange={(e) =>
                        setLocalBranding({ ...localBranding, businessName: e.target.value })
                      }
                      placeholder="FlexBook"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dashboardTitle">{t('admin.customization_page.branding.dashboard_title_label')}</Label>
                    <Input
                      id="dashboardTitle"
                      value={localBranding.dashboardTitle || 'Admin'}
                      onChange={(e) =>
                        setLocalBranding({ ...localBranding, dashboardTitle: e.target.value })
                      }
                      placeholder="Admin"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.customization_page.branding.dashboard_title_help')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="banner">{t('admin.customization_page.branding.banner_label')}</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {localBranding.bannerImage ? (
                        <img
                          src={resolveImageUrl(localBranding.bannerImage)}
                          alt="Banner"
                          className="w-32 h-20 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          id="banner"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('banner')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            {t('admin.customization_page.branding.upload_banner')}
                          </Button>
                          {localBranding.bannerImage && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setLocalBranding({ ...localBranding, bannerImage: '' })}
                              title={t('admin.customization_page.branding.remove_banner')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.customization_page.branding.banner_help')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.customization_page.colors.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.customization_page.colors.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="primaryColor">{t('admin.customization_page.colors.primary_label')}</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          id="primaryColor"
                          type="color"
                          value={localBranding.primaryColor}
                          onChange={(e) =>
                            setLocalBranding({ ...localBranding, primaryColor: e.target.value })
                          }
                          className="w-16 h-16 rounded-lg border border-border cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={localBranding.primaryColor}
                            onChange={(e) =>
                              setLocalBranding({ ...localBranding, primaryColor: e.target.value })
                            }
                            placeholder="#030213"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('admin.customization_page.colors.primary_help')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secondaryColor">{t('admin.customization_page.colors.secondary_label')}</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          id="secondaryColor"
                          type="color"
                          value={localBranding.secondaryColor}
                          onChange={(e) =>
                            setLocalBranding({ ...localBranding, secondaryColor: e.target.value })
                          }
                          className="w-16 h-16 rounded-lg border border-border cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={localBranding.secondaryColor}
                            onChange={(e) =>
                              setLocalBranding({ ...localBranding, secondaryColor: e.target.value })
                            }
                            placeholder="#6366f1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('admin.customization_page.colors.secondary_help')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-3">{t('admin.customization_page.colors.preview')}</p>
                    <div className="flex gap-3">
                      <div
                        className="w-full h-16 rounded-lg"
                        style={{ backgroundColor: localBranding.primaryColor }}
                      />
                      <div
                        className="w-full h-16 rounded-lg"
                        style={{ backgroundColor: localBranding.secondaryColor }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.customization_page.content.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.customization_page.content.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="heroTitle">{t('admin.customization_page.content.hero_title_label')}</Label>
                    <Input
                      id="heroTitle"
                      value={localBranding.heroTitle}
                      onChange={(e) =>
                        setLocalBranding({ ...localBranding, heroTitle: e.target.value })
                      }
                      placeholder={t('admin.customization_page.content.hero_title_placeholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="heroSubtitle">{t('admin.customization_page.content.hero_subtitle_label')}</Label>
                    <Textarea
                      id="heroSubtitle"
                      value={localBranding.heroSubtitle}
                      onChange={(e) =>
                        setLocalBranding({ ...localBranding, heroSubtitle: e.target.value })
                      }
                      placeholder={t('admin.customization_page.content.hero_subtitle_placeholder')}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Tab */}
            <TabsContent value="footer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.customization_page.footer.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.customization_page.footer.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="facebookUrl">{t('admin.customization_page.footer.facebook_label')}</Label>
                      <Input
                        id="facebookUrl"
                        value={localBranding.facebookUrl || ''}
                        onChange={(e) =>
                          setLocalBranding({ ...localBranding, facebookUrl: e.target.value })
                        }
                        placeholder="https://facebook.com/seunegocio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagramUrl">{t('admin.customization_page.footer.instagram_label')}</Label>
                      <Input
                        id="instagramUrl"
                        value={localBranding.instagramUrl || ''}
                        onChange={(e) =>
                          setLocalBranding({ ...localBranding, instagramUrl: e.target.value })
                        }
                        placeholder="https://instagram.com/seunegocio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">{t('admin.customization_page.footer.whatsapp_label')}</Label>
                      <Input
                        id="whatsapp"
                        value={localBranding.whatsapp || ''}
                        onChange={(e) =>
                          setLocalBranding({ ...localBranding, whatsapp: e.target.value })
                        }
                        placeholder="5511999999999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">{t('admin.customization_page.footer.phone_label')}</Label>
                      <Input
                        id="contactPhone"
                        value={localBranding.contactPhone || ''}
                        onChange={(e) =>
                          setLocalBranding({ ...localBranding, contactPhone: e.target.value })
                        }
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">{t('admin.customization_page.footer.email_label')}</Label>
                      <Input
                        id="contactEmail"
                        value={localBranding.contactEmail || ''}
                        onChange={(e) =>
                          setLocalBranding({ ...localBranding, contactEmail: e.target.value })
                        }
                        placeholder="contato@seunegocio.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">{t('admin.customization_page.footer.address_label')}</Label>
                      <Input
                        id="address"
                        value={localBranding.address || ''}
                        onChange={(e) =>
                          setLocalBranding({ ...localBranding, address: e.target.value })
                        }
                        placeholder="Rua Exemplo, 123, Bairro, Cidade - UF"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};
