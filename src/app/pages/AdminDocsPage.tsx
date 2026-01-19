import React from 'react';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  MessageSquare, 
  Briefcase,
  Scissors,
  MapPin,
  Smartphone,
  Crown,
  CreditCard,
  Mail
} from 'lucide-react';

export const AdminDocsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-950">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('admin.docs.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('admin.docs.subtitle')}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.docs.overview.title')}</CardTitle>
              <CardDescription>
                {t('admin.docs.overview.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                
                {/* Dashboard & Analytics */}
                <AccordionItem value="dashboard">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {t('admin.docs.sections.dashboard.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.dashboard.content') }} />
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.dashboard.list.revenue') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.dashboard.list.appointments') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.dashboard.list.clients') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.dashboard.list.top') }} />
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Agendamentos */}
                <AccordionItem value="appointments">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('admin.docs.sections.appointments.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.appointments.content') }} />
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.appointments.list.new') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.appointments.list.status') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.appointments.list.filters') }} />
                    </ul>
                    <p className="text-sm bg-muted p-2 rounded border border-border mt-2" dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.appointments.tip') }} />
                  </AccordionContent>
                </AccordionItem>

                {/* Cadastros */}
                <AccordionItem value="management">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('admin.docs.sections.management.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>
                      {t('admin.docs.sections.management.content')}
                    </p>
                    <div className="grid gap-4 mt-2">
                      <div className="border p-3 rounded-md">
                        <div className="flex items-center gap-2 font-medium mb-1"><Scissors className="h-3 w-3" /> {t('admin.docs.sections.management.services.title')}</div>
                        {t('admin.docs.sections.management.services.description')}
                      </div>
                      <div className="border p-3 rounded-md">
                        <div className="flex items-center gap-2 font-medium mb-1"><Briefcase className="h-3 w-3" /> {t('admin.docs.sections.management.team.title')}</div>
                        {t('admin.docs.sections.management.team.description')}
                      </div>
                      <div className="border p-3 rounded-md">
                        <div className="flex items-center gap-2 font-medium mb-1"><Users className="h-3 w-3" /> {t('admin.docs.sections.management.clients.title')}</div>
                        {t('admin.docs.sections.management.clients.description')}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Unidades */}
                <AccordionItem value="locations">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('admin.docs.sections.locations.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.locations.content')}
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.locations.list.register') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.locations.list.booking') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.locations.list.filters') }} />
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Personalização e Legal */}
                <AccordionItem value="customization">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t('admin.docs.sections.customization.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.customization.content')}
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.customization.list.branding') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.customization.list.legal') }} />
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Planos e Assinaturas */}
                <AccordionItem value="plans">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      {t('admin.docs.sections.plans.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.plans.content')}
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.plans.list.create') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.plans.list.credits') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.plans.list.subscribers') }} />
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Pagamentos */}
                <AccordionItem value="payments">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t('admin.docs.sections.payments.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.payments.content')}
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.payments.list.gateways') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.payments.list.history') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.payments.list.methods') }} />
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Emails e Notificações */}
                <AccordionItem value="emails">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t('admin.docs.sections.emails.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.emails.content')}
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.emails.list.client') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.emails.list.team') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.emails.list.templates') }} />
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Integrações */}
                <AccordionItem value="integrations">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('admin.docs.sections.integrations.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.integrations.content')}
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">{t('admin.docs.sections.integrations.step1.title')}</h4>
                      <p dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.integrations.step1.description') }} />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">{t('admin.docs.sections.integrations.step2.title')}</h4>
                      <p dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.integrations.step2.description') }} />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">{t('admin.docs.sections.integrations.bot_features.title')}</h4>
                      <ul className="list-disc list-inside ml-4">
                        <li>{t('admin.docs.sections.integrations.bot_features.list.check')}</li>
                        <li>{t('admin.docs.sections.integrations.bot_features.list.create')}</li>
                        <li>{t('admin.docs.sections.integrations.bot_features.list.notify')}</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* API Mobile */}
                <AccordionItem value="mobile-api">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      {t('admin.docs.sections.mobile.title')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>
                      {t('admin.docs.sections.mobile.content')}
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">{t('admin.docs.sections.mobile.docs.title')}</h4>
                      <p>
                        {t('admin.docs.sections.mobile.docs.description')} <br />
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">/api/docs</code>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">{t('admin.docs.sections.mobile.endpoints.title')}</h4>
                      <ul className="list-disc list-inside ml-4">
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.auth') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.profile') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.appointments') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.locations') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.services') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.professionals') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.plans') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.reviews') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.endpoints.list.subscriptions') }} />
                    </ul>
                    </div>
                    <p className="text-sm bg-muted p-2 rounded border border-border mt-2" dangerouslySetInnerHTML={{ __html: t('admin.docs.sections.mobile.tip') }} />
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
