import React from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { Card, CardContent } from '../components/ui/card';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const PrivacyPage: React.FC = () => {
  const { branding } = useBranding();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">{t('legal.privacy.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('legal.privacy.subtitle', { businessName: branding.businessName })}
            </p>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardContent className="p-8 prose prose-zinc dark:prose-invert max-w-none">
                {branding.privacyPolicy ? (
                  <div 
                    className="font-sans text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: branding.privacyPolicy }}
                  />
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-8">
                      <strong>{t('legal.last_update')}:</strong> {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <Shield className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.privacy.sections.intro.title')}</h2>
                      </div>
                      <p>
                        {t('legal.privacy.sections.intro.content_1', { businessName: branding.businessName })}
                      </p>
                      <p>
                        {t('legal.privacy.sections.intro.content_2')}
                      </p>
                    </section>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <Eye className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.privacy.sections.data.title')}</h2>
                      </div>
                      <p>{t('legal.privacy.sections.data.intro')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>{t('legal.privacy.sections.data.items.id.label')}:</strong> {t('legal.privacy.sections.data.items.id.desc')}</li>
                        <li><strong>{t('legal.privacy.sections.data.items.contact.label')}:</strong> {t('legal.privacy.sections.data.items.contact.desc')}</li>
                        <li><strong>{t('legal.privacy.sections.data.items.booking.label')}:</strong> {t('legal.privacy.sections.data.items.booking.desc')}</li>
                        <li><strong>{t('legal.privacy.sections.data.items.access.label')}:</strong> {t('legal.privacy.sections.data.items.access.desc')}</li>
                      </ul>
                    </section>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <FileText className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.privacy.sections.purpose.title')}</h2>
                      </div>
                      <p>{t('legal.privacy.sections.purpose.intro')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>{t('legal.privacy.sections.purpose.items.service.label')}:</strong> {t('legal.privacy.sections.purpose.items.service.desc')}</li>
                        <li><strong>{t('legal.privacy.sections.purpose.items.communication.label')}:</strong> {t('legal.privacy.sections.purpose.items.communication.desc')}</li>
                        <li><strong>{t('legal.privacy.sections.purpose.items.security.label')}:</strong> {t('legal.privacy.sections.purpose.items.security.desc')}</li>
                        <li><strong>{t('legal.privacy.sections.purpose.items.improvement.label')}:</strong> {t('legal.privacy.sections.purpose.items.improvement.desc')}</li>
                      </ul>
                    </section>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <Lock className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.privacy.sections.sharing.title')}</h2>
                      </div>
                      <p>
                        <strong>{t('legal.privacy.sections.sharing.intro_bold')}</strong> {t('legal.privacy.sections.sharing.intro_text')}
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('legal.privacy.sections.sharing.items.providers')}</li>
                        <li>{t('legal.privacy.sections.sharing.items.legal')}</li>
                      </ul>
                      <p className="mt-4">
                        {t('legal.privacy.sections.sharing.security_text')}
                      </p>
                    </section>

                    <section className="mb-8">
                      <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.sections.rights.title')}</h2>
                      <p>{t('legal.privacy.sections.rights.intro')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('legal.privacy.sections.rights.items.confirmation')}</li>
                        <li>{t('legal.privacy.sections.rights.items.correction')}</li>
                        <li>{t('legal.privacy.sections.rights.items.deletion')}</li>
                        <li>{t('legal.privacy.sections.rights.items.portability')}</li>
                        <li>{t('legal.privacy.sections.rights.items.revocation')}</li>
                      </ul>
                      <p className="mt-4 text-sm bg-muted p-4 rounded-md">
                        {t('legal.privacy.sections.rights.contact_info')}
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.sections.changes.title')}</h2>
                      <p>
                        {t('legal.privacy.sections.changes.text_1')}
                      </p>
                      <p>
                        {t('legal.privacy.sections.changes.text_2')}
                      </p>
                    </section>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
