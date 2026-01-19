import React from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { Card, CardContent } from '../components/ui/card';
import { ScrollText, CalendarClock, AlertTriangle, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const TermsPage: React.FC = () => {
  const { branding } = useBranding();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">{t('legal.terms.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('legal.terms.subtitle', { businessName: branding.businessName })}
            </p>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardContent className="p-8 prose prose-zinc dark:prose-invert max-w-none">
                {branding.termsOfUse ? (
                  <div 
                    className="font-sans text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: branding.termsOfUse }}
                  />
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-8">
                      <strong>{t('legal.last_update')}:</strong> {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <ScrollText className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.terms.sections.acceptance.title')}</h2>
                      </div>
                      <p>
                        {t('legal.terms.sections.acceptance.text', { businessName: branding.businessName })}
                      </p>
                    </section>
                    
                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <CalendarClock className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.terms.sections.booking.title')}</h2>
                      </div>
                      <p>{t('legal.terms.sections.booking.intro')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>{t('legal.terms.sections.booking.items.punctuality.label')}:</strong> {t('legal.terms.sections.booking.items.punctuality.desc')}</li>
                        <li><strong>{t('legal.terms.sections.booking.items.cancellation.label')}:</strong> {t('legal.terms.sections.booking.items.cancellation.desc')}</li>
                        <li><strong>{t('legal.terms.sections.booking.items.noshow.label')}:</strong> {t('legal.terms.sections.booking.items.noshow.desc')}</li>
                      </ul>
                    </section>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <UserCheck className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.terms.sections.responsibilities.title')}</h2>
                      </div>
                      <p>{t('legal.terms.sections.responsibilities.intro')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('legal.terms.sections.responsibilities.items.info')}</li>
                        <li>{t('legal.terms.sections.responsibilities.items.security')}</li>
                        <li>{t('legal.terms.sections.responsibilities.items.legal')}</li>
                        <li>{t('legal.terms.sections.responsibilities.items.respect')}</li>
                      </ul>
                    </section>

                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-primary">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-2xl font-semibold m-0">{t('legal.terms.sections.liability.title')}</h2>
                      </div>
                      <p>
                        {t('legal.terms.sections.liability.text_1', { businessName: branding.businessName })}
                      </p>
                      <p>
                        {t('legal.terms.sections.liability.text_2')}
                      </p>
                    </section>

                    <section className="mb-8">
                      <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.sections.ip.title')}</h2>
                      <p>
                        {t('legal.terms.sections.ip.text', { businessName: branding.businessName })}
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.sections.general.title')}</h2>
                      <p>
                        {t('legal.terms.sections.general.text_1')}
                      </p>
                      <p>
                        {t('legal.terms.sections.general.text_2')}
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
