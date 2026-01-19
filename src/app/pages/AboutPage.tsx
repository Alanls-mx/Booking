import React from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { Card, CardContent } from '../components/ui/card';
import { Users, Scissors, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const AboutPage: React.FC = () => {
  const { branding } = useBranding();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
              {t('about.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('about.subtitle', { businessName: branding.businessName })}
            </p>
          </div>

          <Card>
            <CardContent className="p-8 prose prose-zinc dark:prose-invert max-w-none">
              {branding.aboutUs ? (
                <div 
                  className="font-sans text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: branding.aboutUs }}
                />
              ) : (
                <>
                  <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                      <Users className="h-6 w-6" />
                      <h2 className="text-2xl font-semibold m-0">
                        {t('about.sections.who_we_are.title')}
                      </h2>
                    </div>
                    <p>
                      {t('about.sections.who_we_are.text', { businessName: branding.businessName })}
                    </p>
                  </section>

                  <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                      <Scissors className="h-6 w-6" />
                      <h2 className="text-2xl font-semibold m-0">
                        {t('about.sections.services.title')}
                      </h2>
                    </div>
                    <p>{t('about.sections.services.text')}</p>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-4 text-primary">
                      <Star className="h-6 w-6" />
                      <h2 className="text-2xl font-semibold m-0">
                        {t('about.sections.experience.title')}
                      </h2>
                    </div>
                    <p>{t('about.sections.experience.text')}</p>
                  </section>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};
