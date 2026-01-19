import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  User,
  Lock,
  MapPin,
  Phone,
  CreditCard,
  Loader2,
  Calendar,
  Clock,
  ArrowLeft,
  Star,
} from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Textarea } from '../components/ui/textarea';

export const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { tenantId } = useBranding();
  const [isLoading, setIsLoading] = useState(false);

  const locales: { [key: string]: any } = { pt: ptBR, en: enUS, es: es };
  const currentLocale = locales[i18n.language] || ptBR;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Appointments state
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCpf(user.cpf || '');
      setAddress(user.address || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && tenantId) {
      fetchMyAppointments();
      fetchSubscriptions();
    }
  }, [user, tenantId]);

  const fetchMyAppointments = async () => {
    try {
      const response = await api.get(`/appointments?tenantId=${tenantId}`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const filtered = data.filter((apt: any) => apt.user?.id === user?.id);
      setMyAppointments(filtered);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchSubscriptions = async () => {
    if (!user || !tenantId) return;
    setIsLoadingSubscriptions(true);
    try {
      const response = await api.get(
        `/subscriptions?tenantId=${tenantId}&userId=${user.id}`,
      );
      setSubscriptions(response.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tenantId) return;

    setIsLoading(true);
    try {
      const response = await api.patch(`/users/${user.id}?tenantId=${tenantId}`, {
        name,
        phone,
        cpf,
        address
      });
      
      updateUser(response.data);
      toast.success(t('profile.personal.success_update'));
    } catch (error) {
      toast.error(t('profile.personal.error_update'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tenantId) return;

    if (!currentPassword) {
      toast.error(t('profile.security.error_current_password_missing'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('profile.security.error_password_mismatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('profile.security.error_password_length'));
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(`/users/${user.id}?tenantId=${tenantId}`, {
        currentPassword,
        password
      });
      toast.success(t('profile.security.success_password_change'));
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(t('profile.security.error_current_password_wrong'));
      } else {
        toast.error(t('profile.security.error_password_change'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !tenantId) return;

    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        rating: reviewRating,
        comment: reviewComment,
        tenantId,
        userId: user.id,
      });
      toast.success(t('reviews.success_submit'));
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      const msg = error.response?.data?.message || t('reviews.error_submit');
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="mb-4 pl-0 hover:bg-transparent hover:text-primary" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('profile.back')}
            </Button>
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
            <p className="text-muted-foreground">{t('profile.subtitle')}</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">{t('profile.tabs.personal_data')}</TabsTrigger>
            <TabsTrigger value="security">{t('profile.tabs.security')}</TabsTrigger>
            <TabsTrigger value="appointments">{t('profile.tabs.appointments')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('profile.tabs.reviews')}</TabsTrigger>
            <TabsTrigger value="subscriptions">
              {t('profile.tabs.subscriptions')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.personal.title')}</CardTitle>
                <CardDescription>{t('profile.personal.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('profile.personal.name_label')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('profile.personal.email_label')}</Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">{t('profile.personal.cpf_label')}</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="cpf"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('profile.personal.phone_label')}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">{t('profile.personal.address_label')}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Rua, Número, Bairro, Cidade - UF"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('profile.personal.save_button')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.security.title')}</CardTitle>
                <CardDescription>{t('profile.security.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t('profile.security.current_password_label')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('profile.security.current_password_placeholder')}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t('profile.security.new_password_label')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('profile.security.new_password_placeholder')}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t('profile.security.confirm_password_label')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('profile.security.update_password_button')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.appointments.title')}</CardTitle>
                <CardDescription>{t('profile.appointments.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {myAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('profile.appointments.empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex gap-4">
                          <div className="mt-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Calendar className="w-5 h-5" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold">{apt.services.map((s: any) => s.name).join(', ')}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(new Date(apt.date), "dd 'de' MMMM 'às' HH:mm", { locale: currentLocale })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <User className="w-3 h-3" />
                              <span>{apt.professional?.name || t('profile.appointments.professional_unassigned')}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            apt.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {t(`admin.status.${apt.status.toLowerCase()}`)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>{t('reviews.title')}</CardTitle>
                <CardDescription>{t('reviews.be_the_first')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('reviews.dialog_title')}</Label>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i + 1)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            i < reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('reviews.comment_label')}</Label>
                  <Textarea
                    placeholder={t('reviews.comment_placeholder')}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSubmittingReview
                      ? t('reviews.submitting')
                      : t('reviews.submit_button')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.subscriptions.title')}</CardTitle>
                <CardDescription>{t('profile.subscriptions.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSubscriptions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-4 opacity-50" />
                    <p>{t('profile.subscriptions.empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {sub.plan?.name || t('profile.subscriptions.no_plan_name')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t('profile.subscriptions.status_label')}{' '}
                            <span className="font-medium">
                              {t(`profile.subscriptions.status.${sub.status || 'UNKNOWN'}`)}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('profile.subscriptions.credits_label')}{' '}
                            <span className="font-medium">
                              {sub.creditsRemaining}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('profile.subscriptions.period_label')}{' '}
                            <span className="font-medium">
                              {format(new Date(sub.startDate), 'dd/MM/yyyy', {
                                locale: currentLocale,
                              })}{' '}
                              -{' '}
                              {format(new Date(sub.endDate), 'dd/MM/yyyy', {
                                locale: currentLocale,
                              })}
                            </span>
                          </p>
                        </div>
                        {sub.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.patch(`/subscriptions/${sub.id}`, {
                                  status: 'CANCELED',
                                });
                                toast.success(
                                  t('profile.subscriptions.cancel_success'),
                                );
                                fetchSubscriptions();
                              } catch (error) {
                                toast.error(
                                  t('profile.subscriptions.cancel_error'),
                                );
                              }
                            }}
                          >
                            {t('profile.subscriptions.cancel_button')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
      <Footer />
    </div>
  );
};
