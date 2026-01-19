import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { Loader2, Save, MessageSquare, Mail, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const AdminIntegrationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId, rawConfig } = useBranding();
  const [saving, setSaving] = useState(false);
  
  // ManyChat State
  const [manyChatEnabled, setManyChatEnabled] = useState(false);
  const [manyChatApiKey, setManyChatApiKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  // SMTP State
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<any>({});

  // Working Hours
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5] // Mon-Fri default
  });

  // Modules (Features)
  const [modules, setModules] = useState({
    appointments: true,
    crm: true,
    financial: true,
    website: true,
  });

  // Determine API URL for Webhook display
  // Use import.meta.env.VITE_API_URL or default
  // Note: We need to ensure no trailing slash for consistency
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const webhookUrl = `${API_URL}/integrations/manychat/webhook`;

  useEffect(() => {
    const loadConfigAndTemplates = async () => {
      if (rawConfig) {
        setManyChatEnabled(rawConfig.manyChatEnabled || false);
        setManyChatApiKey(rawConfig.manyChatApiKey || '');

        const smtp = rawConfig.smtp || {};
        setSmtpEnabled(!!smtp.host);
        setSmtpHost(smtp.host || '');
        setSmtpPort(smtp.port ? String(smtp.port) : '587');
        setSmtpUser(smtp.user || '');
        setSmtpPassword(smtp.password || '');
        setSmtpSecure(smtp.secure || false);
        setSmtpFromEmail(smtp.fromEmail || '');
        setSmtpFromName(smtp.fromName || '');

        if (rawConfig.modules) {
          setModules({
            appointments: rawConfig.modules.appointments ?? true,
            crm: rawConfig.modules.crm ?? true,
            financial: rawConfig.modules.financial ?? true,
            website: rawConfig.modules.website ?? true,
          });
        }

        if (rawConfig.workingHours) {
          setWorkingHours(rawConfig.workingHours);
        }
      }

      try {
        const response = await api.get('/email/templates');
        setEmailTemplates(response.data || {});
      } catch (error) {
        if (rawConfig?.emailTemplates) {
          setEmailTemplates(rawConfig.emailTemplates);
        }
      }
    };

    loadConfigAndTemplates();
  }, [rawConfig]);


  const handleTestSmtpConnection = async () => {
    try {
      setTestingSmtp(true);
      const config = {
          host: smtpHost,
          port: parseInt(smtpPort),
          user: smtpUser,
          password: smtpPassword,
          secure: smtpSecure,
          fromEmail: smtpFromEmail,
          fromName: smtpFromName
      };

      await api.post('/email/test-connection', { config });
      toast.success('Conexão SMTP testada com sucesso! Verifique seu e-mail.');
    } catch (error) {
      toast.error('Erro ao testar conexão SMTP. Verifique as configurações.');
      console.error(error);
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestConnection = async () => {
    if (!tenantId) return;

    try {
      setTestingConnection(true);
      const response = await api.get('/integrations/manychat/test-connection', {
        headers: {
          'x-tenant-id': tenantId,
        },
      });

      const data = response.data;

      if (data.success) {
        toast.success(
          t('admin.integrations_page.manychat.test_success', {
            pageName: data.pageName || '',
          })
        );
      } else {
        toast.error(
          data.message ||
            t('admin.integrations_page.manychat.test_error')
        );
      }
    } catch (error) {
      toast.error(t('admin.integrations_page.manychat.test_error'));
    } finally {
      setTestingConnection(false);
    }
  };

  const updateTemplate = (key: string, field: 'subject' | 'body', value: string) => {
    setEmailTemplates((prev: any) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const newConfig = {
        ...rawConfig,
        modules,
        manyChatEnabled,
        manyChatApiKey,
        emailTemplates,
        smtp: smtpEnabled ? {
          host: smtpHost,
          port: parseInt(smtpPort),
          user: smtpUser,
          password: smtpPassword,
          secure: smtpSecure,
          fromEmail: smtpFromEmail,
          fromName: smtpFromName
        } : {},
      };

      await api.post(`/tenants/${tenantId}`, {
        config: newConfig
      });
      
      toast.success(t('admin.integrations_page.save_success'));
    } catch (error) {
      console.error('Erro ao salvar integrações', error);
      toast.error(t('admin.integrations_page.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-950">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="integrations" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                <p className="text-muted-foreground">Gerencie integrações, sistemas e preferências.</p>
              </div>
              <div className="flex items-center gap-2">
                 <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </div>

            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
              <TabsTrigger value="integrations">Integrações</TabsTrigger>
              <TabsTrigger value="modules">Sistemas</TabsTrigger>
              <TabsTrigger value="schedule">Horários</TabsTrigger>
              <TabsTrigger value="email-templates">E-mail</TabsTrigger>
              <TabsTrigger value="smtp">SMTP</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Horário de Funcionamento</CardTitle>
                  <CardDescription>Defina os horários padrão para agendamentos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horário de Início</Label>
                      <Input 
                        type="time" 
                        value={workingHours.start} 
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário de Fim</Label>
                      <Input 
                        type="time" 
                        value={workingHours.end} 
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de Funcionamento</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {[
                        { id: 0, label: 'Domingo' },
                        { id: 1, label: 'Segunda' },
                        { id: 2, label: 'Terça' },
                        { id: 3, label: 'Quarta' },
                        { id: 4, label: 'Quinta' },
                        { id: 5, label: 'Sexta' },
                        { id: 6, label: 'Sábado' },
                      ].map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${day.id}`}
                            checked={workingHours.days.includes(day.id)}
                            onCheckedChange={(checked) => {
                              setWorkingHours(prev => ({
                                ...prev,
                                days: checked 
                                  ? [...prev.days, day.id]
                                  : prev.days.filter(d => d !== day.id)
                              }));
                            }}
                          />
                          <Label htmlFor={`day-${day.id}`} className="cursor-pointer">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="modules" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg dark:bg-gray-800">
                      <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle>Módulos do Sistema</CardTitle>
                      <CardDescription>Ative ou desative funcionalidades do sistema conforme sua necessidade.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 border-t">
                  
                  <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <Checkbox 
                      id="mod_app_page" 
                      checked={modules.appointments}
                      onCheckedChange={(c) => setModules(prev => ({ ...prev, appointments: !!c }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="mod_app_page" className="text-sm font-medium leading-none cursor-pointer">
                        Agendamentos
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Sistema completo de reservas, calendário e gestão de horários.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <Checkbox 
                      id="mod_crm_page" 
                      checked={modules.crm}
                      onCheckedChange={(c) => setModules(prev => ({ ...prev, crm: !!c }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="mod_crm_page" className="text-sm font-medium leading-none cursor-pointer">
                        CRM (Clientes)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Gestão de base de clientes, histórico e fidelização.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <Checkbox 
                      id="mod_fin_page" 
                      checked={modules.financial}
                      onCheckedChange={(c) => setModules(prev => ({ ...prev, financial: !!c }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="mod_fin_page" className="text-sm font-medium leading-none cursor-pointer">
                        Financeiro
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Controle de receitas, despesas e relatórios financeiros.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <Checkbox 
                      id="mod_site_page" 
                      checked={modules.website}
                      onCheckedChange={(c) => setModules(prev => ({ ...prev, website: !!c }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="mod_site_page" className="text-sm font-medium leading-none cursor-pointer">
                        Website Público
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Landing page, página de "Sobre", avaliações e outras páginas institucionais.
                      </p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <CardTitle>{t('admin.integrations_page.manychat.title')}</CardTitle>
                    <CardDescription>{t('admin.integrations_page.manychat.description')}</CardDescription>
                </div>
                <div className="ml-auto">
                    <Switch 
                        checked={manyChatEnabled}
                        onCheckedChange={setManyChatEnabled}
                    />
                </div>
              </div>
            </CardHeader>
            {manyChatEnabled && (
                <CardContent className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">{t('admin.integrations_page.manychat.api_key_label')}</Label>
                        <Input 
                            id="apiKey" 
                            type="password"
                            placeholder={t('admin.integrations_page.manychat.api_key_placeholder')} 
                            value={manyChatApiKey}
                            onChange={(e) => setManyChatApiKey(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          {t('admin.integrations_page.manychat.help_text')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestConnection}
                          disabled={testingConnection || !manyChatApiKey}
                        >
                          {testingConnection ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                          )}
                          {t('admin.integrations_page.manychat.test_button')}
                        </Button>
                        {!manyChatApiKey && (
                          <p className="text-xs text-muted-foreground">
                            {t('admin.integrations_page.manychat.test_disabled')}
                          </p>
                        )}
                      </div>
                    
                    <div className="rounded-md bg-muted p-4">
                        <h4 className="text-sm font-medium mb-2">{t('admin.integrations_page.manychat.webhook_title')}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                            {t('admin.integrations_page.manychat.webhook_desc')}
                        </p>
                        <code className="text-xs bg-black/10 dark:bg-black/30 p-2 rounded block break-all select-all cursor-pointer" onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            toast.success(t('admin.integrations_page.url_copied'));
                        }}>
                             {webhookUrl}
                        </code>
                    </div>
                </CardContent>
            )}
          </Card>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                      <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle>Configurações de E-mail (SMTP)</CardTitle>
                      <CardDescription>Configure o servidor de e-mail para envio de notificações.</CardDescription>
                    </div>
                    <div className="ml-auto">
                      <Switch 
                        checked={smtpEnabled}
                        onCheckedChange={setSmtpEnabled}
                      />
                    </div>
                  </div>
                </CardHeader>
                {smtpEnabled && (
                  <CardContent className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">Host SMTP</Label>
                        <Input id="smtpHost" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">Porta</Label>
                        <Input id="smtpPort" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">Usuário</Label>
                        <Input id="smtpUser" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">Senha</Label>
                        <Input id="smtpPassword" type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpFromEmail">E-mail de Remetente</Label>
                        <Input id="smtpFromEmail" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder="nao-responda@empresa.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpFromName">Nome de Remetente</Label>
                        <Input id="smtpFromName" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="Minha Empresa" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Switch id="smtpSecure" checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                      <Label htmlFor="smtpSecure">Usar conexão segura (SSL/TLS)</Label>
                    </div>
                    <div className="pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestSmtpConnection}
                        disabled={testingSmtp || !smtpHost}
                      >
                        {testingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Testar Conexão
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="email-templates" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Confirmação de Agendamento</CardTitle>
                        <CardDescription>
                            Enviado quando um agendamento é criado com sucesso. <br/>
                            Variáveis:{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{serviceName}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{professionalName}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{time}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label>Assunto</Label>
                        <Input 
                            value={emailTemplates.appointmentConfirmation?.subject || ''} 
                            onChange={e => updateTemplate('appointmentConfirmation', 'subject', e.target.value)}
                            placeholder="Confirmação de Agendamento - {{businessName}}"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label>Conteúdo (HTML)</Label>
                        <Textarea 
                            className="min-h-[200px] font-mono text-sm"
                            value={emailTemplates.appointmentConfirmation?.body || ''} 
                            onChange={e => updateTemplate('appointmentConfirmation', 'body', e.target.value)}
                            placeholder="<html>...</html>"
                        />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cancelamento de Agendamento</CardTitle>
                        <CardDescription>
                            Enviado quando um agendamento é cancelado. <br/>
                            Variáveis:{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{serviceName}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{time}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label>Assunto</Label>
                        <Input 
                            value={emailTemplates.appointmentCancellation?.subject || ''} 
                            onChange={e => updateTemplate('appointmentCancellation', 'subject', e.target.value)}
                            placeholder="Cancelamento de Agendamento - {{businessName}}"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label>Conteúdo (HTML)</Label>
                        <Textarea 
                            className="min-h-[200px] font-mono text-sm"
                            value={emailTemplates.appointmentCancellation?.body || ''} 
                            onChange={e => updateTemplate('appointmentCancellation', 'body', e.target.value)}
                            placeholder="<html>...</html>"
                        />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recuperação de Senha</CardTitle>
                        <CardDescription>
                            Enviado quando o usuário solicita redefinição de senha. <br/>
                            Variáveis:{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{resetLink}}'}</code>,{' '}
                            <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label>Assunto</Label>
                        <Input 
                            value={emailTemplates.passwordReset?.subject || ''} 
                            onChange={e => updateTemplate('passwordReset', 'subject', e.target.value)}
                            placeholder="Recuperação de Senha - {{businessName}}"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label>Conteúdo (HTML)</Label>
                        <Textarea 
                            className="min-h-[200px] font-mono text-sm"
                            value={emailTemplates.passwordReset?.body || ''} 
                            onChange={e => updateTemplate('passwordReset', 'body', e.target.value)}
                            placeholder="<html>...</html>"
                        />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Boas-vindas</CardTitle>
                        <CardDescription>
                            Enviado ao criar uma nova conta. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{name}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.welcome?.subject || ''} 
                                onChange={e => updateTemplate('welcome', 'subject', e.target.value)}
                                placeholder="Bem-vindo ao {{businessName}}!"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.welcome?.body || ''} 
                                onChange={e => updateTemplate('welcome', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pagamento Confirmado</CardTitle>
                        <CardDescription>
                            Enviado após confirmação de pagamento. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{name}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{amount}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{id}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.paymentConfirmation?.subject || ''} 
                                onChange={e => updateTemplate('paymentConfirmation', 'subject', e.target.value)}
                                placeholder="Confirmação de Pagamento - {{businessName}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.paymentConfirmation?.body || ''} 
                                onChange={e => updateTemplate('paymentConfirmation', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Falha no Pagamento</CardTitle>
                        <CardDescription>
                            Enviado após falha no pagamento. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{name}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{amount}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{reason}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.paymentFailed?.subject || ''} 
                                onChange={e => updateTemplate('paymentFailed', 'subject', e.target.value)}
                                placeholder="Falha no Pagamento - {{businessName}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.paymentFailed?.body || ''} 
                                onChange={e => updateTemplate('paymentFailed', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Nova Assinatura</CardTitle>
                        <CardDescription>
                            Enviado ao criar uma assinatura. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{planName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{credits}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{startDate}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{endDate}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.subscriptionCreated?.subject || ''} 
                                onChange={e => updateTemplate('subscriptionCreated', 'subject', e.target.value)}
                                placeholder="Nova Assinatura Ativada - {{businessName}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.subscriptionCreated?.body || ''} 
                                onChange={e => updateTemplate('subscriptionCreated', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Alteração de Status da Assinatura</CardTitle>
                        <CardDescription>
                            Enviado quando o status da assinatura muda. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{planName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{status}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{endDate}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{credits}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.subscriptionStatusChanged?.subject || ''} 
                                onChange={e => updateTemplate('subscriptionStatusChanged', 'subject', e.target.value)}
                                placeholder="Atualização na sua Assinatura - {{businessName}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.subscriptionStatusChanged?.body || ''} 
                                onChange={e => updateTemplate('subscriptionStatusChanged', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lembrete de Agendamento</CardTitle>
                        <CardDescription>
                            Enviado como lembrete (normalmente 24h antes). <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{serviceName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{professionalName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{time}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.appointmentReminder?.subject || ''} 
                                onChange={e => updateTemplate('appointmentReminder', 'subject', e.target.value)}
                                placeholder="Lembrete de Agendamento - {{businessName}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.appointmentReminder?.body || ''} 
                                onChange={e => updateTemplate('appointmentReminder', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Novo Agendamento (Admin/Profissional)</CardTitle>
                        <CardDescription>
                            Enviado para o profissional quando há um novo agendamento. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{userEmail}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{serviceName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{professionalName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{time}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.newAppointmentAdmin?.subject || ''} 
                                onChange={e => updateTemplate('newAppointmentAdmin', 'subject', e.target.value)}
                                placeholder="Novo Agendamento: {{serviceName}} - {{date}} {{time}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.newAppointmentAdmin?.body || ''} 
                                onChange={e => updateTemplate('newAppointmentAdmin', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cancelamento de Agendamento (Admin/Profissional)</CardTitle>
                        <CardDescription>
                            Enviado para o profissional quando um agendamento é cancelado. <br/>
                            Variáveis: <code className="text-xs bg-muted p-1 rounded">{'{{userName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{serviceName}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{date}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{time}}'}</code>, <code className="text-xs bg-muted p-1 rounded">{'{{businessName}}'}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={emailTemplates.appointmentCancelledAdmin?.subject || ''} 
                                onChange={e => updateTemplate('appointmentCancelledAdmin', 'subject', e.target.value)}
                                placeholder="Agendamento Cancelado: {{serviceName}} - {{date}} {{time}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm"
                                value={emailTemplates.appointmentCancelledAdmin?.body || ''} 
                                onChange={e => updateTemplate('appointmentCancelledAdmin', 'body', e.target.value)}
                                placeholder="<html>...</html>"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
