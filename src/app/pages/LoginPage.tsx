import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useBranding } from '../contexts/BrandingContext';
import { resolveImageUrl } from '../utils/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import api from '../../api/client';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding, tenantId, isLoading: isTenantLoading, refreshTenant } = useBranding();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      toast.error(t('auth.connect_server_error'));
      await refreshTenant();
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        tenantId,
      });

      const { access_token, user } = response.data;
      
      // Usar o método login do contexto para persistir e atualizar o estado
      login(access_token, user);

      toast.success(t('auth.welcome', { name: user.name }));
      
      // Redirecionar baseado na role (simplificado)
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); // Cliente vai para home
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || t('auth.login_error');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isTenantLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            {branding.logo ? (
              <img
                src={resolveImageUrl(branding.logo)}
                alt={branding.businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Calendar className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">{branding.businessName}</CardTitle>
            <CardDescription>{t('auth.admin_panel')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="link"
                className="px-0 h-auto text-xs text-muted-foreground"
                onClick={() => navigate('/forgot-password')}
                type="button"
              >
                Esqueci minha senha
              </Button>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {t('common.login')}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <Button
              variant="link"
              onClick={() => navigate('/register')}
              className="text-sm text-primary block w-full"
            >
              {t('auth.create_account')}
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground block w-full"
            >
              {t('auth.back_to_site')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
