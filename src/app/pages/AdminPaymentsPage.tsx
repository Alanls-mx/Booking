import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Settings,
  ArrowLeft,
  Loader2,
  Save,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { format } from 'date-fns';
import { Checkbox } from '../components/ui/checkbox';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export const AdminPaymentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tenantId, rawConfig, isLoading: isBrandingLoading } = useBranding();
  
  // Payments State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  // Settings State
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [mpEnabled, setMpEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchPayments();
    }
    
    if (rawConfig?.payment) {
      setStripePublicKey(rawConfig.payment.stripePublicKey || '');
      setStripeSecretKey(rawConfig.payment.stripeSecretKey || '');
      setMpPublicKey(rawConfig.payment.mpPublicKey || '');
      setMpAccessToken(rawConfig.payment.mpAccessToken || '');
      setStripeEnabled(!!rawConfig.payment.stripeEnabled);
      setMpEnabled(!!rawConfig.payment.mpEnabled);
      setPaypalEnabled(!!rawConfig.payment.paypalEnabled);
      setPaypalClientId(rawConfig.payment.paypalClientId || '');
      setPaypalSecret(rawConfig.payment.paypalSecret || '');
    }
  }, [tenantId, rawConfig]);

  const fetchPayments = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/payments?tenantId=${tenantId}`);
      if (Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      const newConfig = {
        ...rawConfig,
        payment: {
          ...(rawConfig?.payment || {}),
          stripePublicKey,
          stripeSecretKey,
          mpPublicKey,
          mpAccessToken,
          stripeEnabled,
          mpEnabled,
          paypalEnabled,
          paypalClientId,
          paypalSecret,
        },
      };

      // Assuming we can patch config via tenant update endpoint
      // Adjust endpoint if your backend uses a different one for config updates
      // Using post to tenants/:id as seen in AdminIntegrationsPage
      await api.post(`/tenants/${tenantId}`, {
        config: newConfig
      });
      
      toast.success(t('admin.payments.save_config') + ' ' + t('common.success'));
    } catch (error) {
      console.error(error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
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
              <h2 className="text-3xl font-bold tracking-tight">{t('admin.payments.title')}</h2>
              <p className="text-muted-foreground">{t('admin.payments.subtitle')}</p>
            </div>
          </div>

          <Tabs defaultValue="history" className="space-y-4">
            <TabsList>
              <TabsTrigger value="history">{t('admin.payments.history')}</TabsTrigger>
              <TabsTrigger value="settings">{t('admin.payments.settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.payments.history')}</CardTitle>
                  <CardDescription>
                    Visualize todas as transações recentes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin w-8 h-8 text-primary" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum pagamento encontrado.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('admin.payments.date')}</TableHead>
                            <TableHead>{t('admin.payments.user')}</TableHead>
                            <TableHead>{t('admin.payments.amount')}</TableHead>
                            <TableHead>{t('admin.payments.method')}</TableHead>
                            <TableHead>{t('admin.payments.status')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{payment.user?.name || 'Unknown'}</span>
                                  <span className="text-xs text-muted-foreground">{payment.user?.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(Number(payment.amount))}
                              </TableCell>
                              <TableCell className="capitalize">
                                {payment.method.replace('_', ' ')}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                  ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                  {payment.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.payments.gateway_keys')}</CardTitle>
                  <CardDescription>
                    Configure as chaves de API dos seus gateways de pagamento (Stripe, MercadoPago, etc).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="stripePublicKey">{t('admin.payments.stripe_public')}</Label>
                        <Input 
                          id="stripePublicKey" 
                          value={stripePublicKey}
                          onChange={(e) => setStripePublicKey(e.target.value)}
                          placeholder="pk_test_..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripeSecretKey">{t('admin.payments.stripe_secret')}</Label>
                        <Input 
                          id="stripeSecretKey" 
                          type="password"
                          value={stripeSecretKey}
                          onChange={(e) => setStripeSecretKey(e.target.value)}
                          placeholder="sk_test_..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mpPublicKey">{t('admin.payments.mp_public_key')}</Label>
                        <Input 
                          id="mpPublicKey" 
                          value={mpPublicKey}
                          onChange={(e) => setMpPublicKey(e.target.value)}
                          placeholder="TEST-..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mpAccessToken">{t('admin.payments.mp_access_token')}</Label>
                        <Input 
                          id="mpAccessToken" 
                          type="password"
                          value={mpAccessToken}
                          onChange={(e) => setMpAccessToken(e.target.value)}
                          placeholder="APP_USR-..." 
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="stripeEnabled"
                            checked={stripeEnabled}
                            onCheckedChange={(checked) => setStripeEnabled(!!checked)}
                          />
                          <Label htmlFor="stripeEnabled">{t('admin.payments.stripe_enabled')}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Stripe para pagamentos com cartão de crédito.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="mpEnabled"
                            checked={mpEnabled}
                            onCheckedChange={(checked) => setMpEnabled(!!checked)}
                          />
                          <Label htmlFor="mpEnabled">{t('admin.payments.mp_enabled')}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Mercado Pago para PIX e cartão.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="paypalEnabled"
                            checked={paypalEnabled}
                            onCheckedChange={(checked) => setPaypalEnabled(!!checked)}
                          />
                          <Label htmlFor="paypalEnabled">{t('admin.payments.paypal_enabled')}</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="paypalClientId">{t('admin.payments.paypal_client_id')}</Label>
                        <Input
                          id="paypalClientId"
                          value={paypalClientId}
                          onChange={(e) => setPaypalClientId(e.target.value)}
                          placeholder="PayPal Client ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paypalSecret">{t('admin.payments.paypal_secret')}</Label>
                        <Input
                          id="paypalSecret"
                          type="password"
                          value={paypalSecret}
                          onChange={(e) => setPaypalSecret(e.target.value)}
                          placeholder="PayPal Secret"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {t('admin.payments.save_config')}
                    </Button>
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
