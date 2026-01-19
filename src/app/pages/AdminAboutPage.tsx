import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { Loader2, Save } from 'lucide-react';

export const AdminAboutPage: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId, branding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [about, setAbout] = useState('');

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tenants/${tenantId}`);
      const loadedAbout = res.data.aboutUs as string | null | undefined;
      const businessName = branding.businessName || 'Seu Negócio';
      const defaultAbout = t('admin.about_page.default_content', { businessName });
      setAbout(loadedAbout || defaultAbout);
    } catch (error) {
      console.error('Erro ao carregar Sobre Nós', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      await api.post(`/tenants/${tenantId}`, {
        aboutUs: about,
      });
      alert(t('admin.about_page.save_success'));
    } catch (error) {
      console.error('Erro ao salvar Sobre Nós', error);
      alert(t('admin.about_page.save_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.about_page.title')}
            </h1>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('admin.about_page.save_changes')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.about_page.section_title')}</CardTitle>
              <CardDescription>
                {t('admin.about_page.section_description')}
                <span className="block mt-1 text-xs text-blue-600 font-medium">
                  {t('common.html_supported')}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="min-h-[400px] font-sans text-base"
                placeholder={t('admin.about_page.placeholder')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

