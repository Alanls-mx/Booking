import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { Loader2, Upload, Save } from 'lucide-react';
import { DEFAULT_TERMS_OF_USE, DEFAULT_PRIVACY_POLICY } from '../data/defaultLegalContent';

export const AdminLegalPages: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId, branding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tenants/${tenantId}`);
      
      const businessName = branding.businessName || 'Sua Empresa';
      
      const loadedTerms = res.data.termsOfUse;
      const loadedPrivacy = res.data.privacyPolicy;

      setTerms(loadedTerms || DEFAULT_TERMS_OF_USE.replace(/{{BUSINESS_NAME}}/g, businessName));
      setPrivacy(loadedPrivacy || DEFAULT_PRIVACY_POLICY.replace(/{{BUSINESS_NAME}}/g, businessName));
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.post(`/tenants/${tenantId}`, {
        termsOfUse: terms,
        privacyPolicy: privacy
      });
      alert(t('admin.legal_page.save_success'));
    } catch (error) {
      console.error('Erro ao salvar', error);
      alert(t('admin.legal_page.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'terms' | 'privacy') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert(t('admin.legal_page.select_pdf'));
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/tenants/extract-pdf', formData);

      if (type === 'terms') {
        setTerms(res.data.text);
      } else {
        setPrivacy(res.data.text);
      }
    } catch (error) {
      console.error('Erro ao processar PDF', error);
      alert(t('admin.legal_page.pdf_error'));
    } finally {
      setUploading(false);
      // Limpar input
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.legal_page.title')}</h1>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('admin.legal_page.save_changes')}
            </Button>
          </div>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms">{t('admin.legal_page.terms_of_use')}</TabsTrigger>
              <TabsTrigger value="privacy">{t('admin.legal_page.privacy_policy')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.legal_page.terms_of_use')}</CardTitle>
                  <CardDescription>
                    {t('admin.legal_page.edit_terms_desc')}
                    <span className="block mt-1 text-xs text-blue-600 font-medium">
                    {t('common.html_supported')}
                  </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="relative" disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {t('admin.legal_page.upload_pdf')}
                      <input 
                        type="file" 
                        accept=".pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, 'terms')}
                      />
                    </Button>
                  </div>
                  <Textarea 
                    value={terms} 
                    onChange={(e) => setTerms(e.target.value)} 
                    className="min-h-[500px] font-mono text-sm"
                    placeholder={t('admin.legal_page.terms_placeholder')}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.legal_page.privacy_policy')}</CardTitle>
                  <CardDescription>
                    {t('admin.legal_page.edit_privacy_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="relative" disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {t('admin.legal_page.upload_pdf')}
                      <input 
                        type="file" 
                        accept=".pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, 'privacy')}
                      />
                    </Button>
                  </div>
                  <Textarea 
                    value={privacy} 
                    onChange={(e) => setPrivacy(e.target.value)} 
                    className="min-h-[500px] font-mono text-sm"
                    placeholder={t('admin.legal_page.privacy_placeholder')}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
