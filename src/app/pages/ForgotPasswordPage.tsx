import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useBranding } from '../contexts/BrandingContext';
import { resolveImageUrl } from '../utils/imageUtils';
import api from '../../api/client';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding, tenantId } = useBranding();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        email,
        tenantId,
      });
      setEmailSent(true);
      toast.success('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao solicitar redefinição de senha.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <Mail className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
            <CardDescription>
              {emailSent 
                ? 'Verifique sua caixa de entrada'
                : 'Digite seu e-mail para receber o link de redefinição'
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Voltar para Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Enviar Link
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
                type="button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};