import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, Check, Info, MapPin, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Calendar } from '../components/ui/calendar';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../utils/imageUtils';
import api from '../../api/client';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

type BookingStep = 'location' | 'service' | 'professional' | 'datetime' | 'payment' | 'contact' | 'confirmation';
type OnlineGateway = 'STRIPE' | 'MERCADO_PAGO' | 'PAYPAL';

export const BookingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const locales: Record<string, any> = {
    'en': enUS,
    'pt': ptBR,
    'es': es
  };
  const currentLocale = locales[i18n.language] || ptBR;

  const { branding, tenantId, rawConfig } = useBranding();
  const { user } = useAuth();
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedServices, setSelectedServices] = useState<string[]>([]); // Múltiplos serviços
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  // Dados do backend
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', phone: '', email: '' });
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'AT_LOCATION' | 'ONLINE' | 'PLAN_CREDIT'>('AT_LOCATION');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [onlineGateway, setOnlineGateway] = useState<OnlineGateway | null>(null);

  const paymentConfig = (rawConfig as any)?.payment || {};
  const isStripeEnabled = !!paymentConfig.stripeEnabled;
  const hasMpToken = !!paymentConfig.mpAccessToken;
  const isMpEnabled = !!paymentConfig.mpEnabled && hasMpToken;
  const isPaypalEnabled = !!paymentConfig.paypalEnabled;
  const isOnlineEnabled = isStripeEnabled || isMpEnabled || isPaypalEnabled;

  useEffect(() => {
    if (!user) {
      toast.error(t('booking.login_required'));
      navigate('/login');
    } else {
      setContactInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user || !tenantId) return;
      try {
        const response = await api.get(`/subscriptions?tenantId=${tenantId}&userId=${user.id}`);
        if (Array.isArray(response.data)) {
          setSubscriptions(response.data);
          // Find active subscription with credits
          const active = response.data.find((sub: any) => 
            sub.status === 'ACTIVE' && sub.creditsRemaining > 0
          );
          setActiveSubscription(active || null);
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions', error);
      }
    };
    fetchSubscriptions();
  }, [user, tenantId]);

  // Carregar Dados
  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;
      try {
        const [servicesRes, professionalsRes, locationsRes] = await Promise.all([
          api.get(`/services?tenantId=${tenantId}`),
          api.get(`/professionals?tenantId=${tenantId}`),
          api.get(`/locations?tenantId=${tenantId}`)
        ]);
        setServices(servicesRes.data);
        setProfessionals(professionalsRes.data);
        
        const locs = locationsRes.data || [];
        setLocations(locs);
        
        // Se houver unidades, o primeiro passo deve ser 'location'
        if (locs.length > 0) {
          setStep('location');
          // Se houver apenas uma, pré-seleciona (opcional, mas melhor UX é deixar explícito ou auto-selecionar e pular? Vamos deixar explícito por enquanto ou pular se quiser simplificar. Vamos forçar seleção se > 1, senão auto-select)
          if (locs.length === 1) {
             setSelectedLocation(locs[0].id);
             setStep('service');
          }
        }
      } catch (error) {
        toast.error(t('common.error'));
      }
    };
    fetchData();
  }, [tenantId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !tenantId) return;
      
      const slots: string[] = [];
      
      // Determine working hours source (Professional or Tenant Global)
      let startStr = rawConfig?.workingHours?.start || '09:00';
      let endStr = rawConfig?.workingHours?.end || '18:00';
      
      const selectedProf = professionals.find(p => p.id === selectedProfessional);
      
      // Check if professional has specific working hours for this day
      if (selectedProf && selectedProf.workingHours && selectedProf.workingHours.length > 0) {
        const dayOfWeek = selectedDate.getDay();
        const profSchedule = selectedProf.workingHours.find((wh: any) => wh.dayOfWeek === dayOfWeek);
        
        if (profSchedule) {
            startStr = profSchedule.startTime;
            endStr = profSchedule.endTime;
        } else {
            // Professional doesn't work on this day
            setAvailableSlots([]);
            setAllSlots([]);
            return;
        }
      }

      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      const baseDate = new Date(selectedDate);
      baseDate.setHours(startH, startM, 0, 0);

      let current = new Date(baseDate);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(endH, endM, 0, 0);

      while (current < endTime) {
        slots.push(format(current, 'HH:mm'));
        current = new Date(current.getTime() + 30 * 60000);
      }

      setAllSlots(slots);

      try {
        const dayStr = format(selectedDate, 'yyyy-MM-dd');
        // Adicionar filtro de locationId se necessário no backend futuramente
        const resp = await api.get(`/appointments?tenantId=${tenantId}&date=${dayStr}`);
        const occupied = new Set<string>(
          resp.data
            .filter((a: any) => (!selectedProfessional || a.professional?.id === selectedProfessional) && a.status !== 'CANCELED')
            .map((a: any) => format(new Date(a.date), 'HH:mm'))
        );

        // Filter occupied and past slots if today
        const now = new Date();
        const isToday = isSameDay(selectedDate, now);
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const free = slots.filter((t) => {
          if (occupied.has(t)) return false;
          
          if (isToday) {
             const [h, m] = t.split(':').map(Number);
             const slotTotalMinutes = h * 60 + m;
             // Allow booking only if the slot is in the future
             if (slotTotalMinutes <= currentTotalMinutes) return false;
          }
          return true;
        });
        
        setAvailableSlots(free);
      } catch {
        setAvailableSlots(slots);
        setAllSlots(slots);
      }
    };
    loadSlots();
  }, [selectedDate, selectedProfessional, tenantId, rawConfig]);

  const stepsRaw = [
    ...(locations.length > 1 ? [{ id: 'location', label: t('booking.step_location') }] : []),
    { id: 'service', label: t('booking.step_services') },
    { id: 'professional', label: t('booking.step_professional') },
    { id: 'datetime', label: t('booking.step_datetime') },
    { id: 'payment', label: t('booking.step_payment') },
    { id: 'contact', label: t('booking.step_contact') },
    { id: 'confirmation', label: t('booking.step_confirmation') },
  ];

  const steps = stepsRaw.map((s, i) => ({ ...s, number: i + 1, id: s.id as BookingStep }));

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const canProceed = () => {
    switch (step) {
      case 'location':
        return selectedLocation !== '';
      case 'service':
        return selectedServices.length > 0;
      case 'professional':
        return selectedProfessional !== '';
      case 'datetime':
        return selectedDate !== undefined && selectedTime !== '';
      case 'payment':
        if (paymentMethod === 'PLAN_CREDIT' && !activeSubscription) return false;
        if (paymentMethod === 'ONLINE') {
          if (!isOnlineEnabled) return false;
          if (!onlineGateway) return false;
        }
        return true;
      case 'contact':
        return !!user;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].id);
    }
  };

  useEffect(() => {
    if (paymentMethod !== 'ONLINE') {
      setOnlineGateway(null);
    }
  }, [paymentMethod]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        toast.error(t('booking.login_required'));
        // Salvar estado atual para retornar depois? Por enquanto, apenas redirecionar.
        navigate('/login');
        return;
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate!);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const response = await api.post('/appointments', {
        tenantId,
        serviceIds: selectedServices,
        professionalId: selectedProfessional,
        locationId: selectedLocation || undefined,
        date: appointmentDate.toISOString(),
        status: 'PENDING',
        userId: user.id,
        paymentMethod,
      });

      toast.success(t('common.success'));

      const appointmentId = response.data?.id;

      if (paymentMethod === 'ONLINE' && onlineGateway && appointmentId) {
        if (onlineGateway === 'MERCADO_PAGO') {
          try {
            const prefRes = await api.post('/payments/preference', {
              appointmentId,
              tenantId,
              gateway: 'MERCADO_PAGO'
            });

            if (prefRes.data && prefRes.data.init_point) {
              window.location.href = prefRes.data.init_point;
            } else {
              toast.error(t('booking.payment_link_error'));
              return;
            }
          } catch (err: any) {
            console.error('Failed to create preference', err);
            const backendMessage = err.response?.data?.message;
            if (backendMessage) {
              toast.error(backendMessage);
            } else {
              toast.error(t('booking.payment_connect_error'));
            }
            return;
          }
        } else {
          navigate(`/payment/checkout?appointmentId=${appointmentId}&gateway=${onlineGateway}`);
        }
      } else {
        navigate('/booking/success');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || t('common.booking_error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Helpers para exibir dados selecionados
  const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
  const selectedProfessionalData = professionals.find((p) => p.id === selectedProfessional);
  const totalPrice = selectedServicesData.reduce((acc, curr) => acc + Number(curr.price), 0);
  const totalDuration = selectedServicesData.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold">{branding.businessName}</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      s.number
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-muted mx-2">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: index < currentStepIndex ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {step === 'location' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">{t('booking.select_location')}</h2>
            <div className="grid gap-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedLocation === location.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{location.name}</h3>
                      {location.address && <p className="text-sm text-muted-foreground">{location.address}</p>}
                      {location.phone && <p className="text-sm text-muted-foreground">{location.phone}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'service' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">{t('booking.select_services')}</h2>
            <div className="grid gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedServices.includes(service.id)
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Number(service.price).toLocaleString(i18n.language, { style: 'currency', currency: 'BRL' })}</p>
                      <p className="text-xs text-muted-foreground">{service.duration} {t('common.min')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between items-center">
                <span className="font-medium">{t('booking.estimated_total')}:</span>
                <span className="font-bold text-lg">{totalPrice.toLocaleString(i18n.language, { style: 'currency', currency: 'BRL' })} • {totalDuration} {t('common.min')}</span>
              </div>
            )}
          </div>
        )}

        {step === 'professional' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">{t('booking.select_professional')}</h2>
            <div className="grid gap-4">
              {professionals.map((professional) => (
                <div
                  key={professional.id}
                  onClick={() => setSelectedProfessional(professional.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                    selectedProfessional === professional.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {professional.avatarUrl ? (
                      <img 
                        src={resolveImageUrl(professional.avatarUrl)} 
                        alt={professional.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{professional.name}</h3>
                    <p className="text-xs text-muted-foreground">{professional.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'datetime' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">{t('booking.date_time')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    
                    const selectedProf = professionals.find(p => p.id === selectedProfessional);
                    
                    if (selectedProf && selectedProf.workingHours && selectedProf.workingHours.length > 0) {
                        // Check if professional works on this day
                        const worksOnDay = selectedProf.workingHours.some((wh: any) => wh.dayOfWeek === date.getDay());
                        return !worksOnDay;
                    }

                    const workingDays = rawConfig?.workingHours?.days;
                    if (workingDays && Array.isArray(workingDays)) {
                      return !workingDays.includes(date.getDay());
                    }
                    return date.getDay() === 0;
                  }}
                  locale={currentLocale}
                />
              </div>
              <div>
                <h3 className="font-medium mb-4">{t('booking.available_slots')}</h3>
                {!selectedDate ? (
                  <p className="text-muted-foreground text-sm">{t('booking.select_date_first')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {allSlots.map((time) => {
                      const isAvailable = availableSlots.includes(time);
                      return (
                        <Button
                          key={time}
                          variant={selectedTime === time && isAvailable ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedTime(time);
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('booking.payment_method')}
            </h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as any)}
              className="space-y-3"
            >
              <Label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary/60 transition-colors">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="AT_LOCATION" />
                  <div>
                    <p className="font-medium">{t('booking.pay_at_location')}</p>
                  </div>
                </div>
              </Label>

              {isOnlineEnabled && (
                <Label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="ONLINE" />
                    <div>
                      <p className="font-medium">{t('booking.pay_online')}</p>
                    </div>
                  </div>
                </Label>
              )}

              {isOnlineEnabled && paymentMethod === 'ONLINE' && (
                <div className="ml-8 space-y-2">
                  <p className="text-xs text-muted-foreground">{t('booking.select_online_method')}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {isStripeEnabled && (
                      <Button
                        type="button"
                        size="sm"
                        variant={onlineGateway === 'STRIPE' ? 'default' : 'outline'}
                        onClick={() => setOnlineGateway('STRIPE')}
                      >
                        Stripe
                      </Button>
                    )}
                    {isMpEnabled && (
                      <Button
                        type="button"
                        size="sm"
                        variant={onlineGateway === 'MERCADO_PAGO' ? 'default' : 'outline'}
                        onClick={() => setOnlineGateway('MERCADO_PAGO')}
                      >
                        Mercado Pago
                      </Button>
                    )}
                    {isPaypalEnabled && (
                      <Button
                        type="button"
                        size="sm"
                        variant={onlineGateway === 'PAYPAL' ? 'default' : 'outline'}
                        onClick={() => setOnlineGateway('PAYPAL')}
                      >
                        PayPal
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <Label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${!activeSubscription ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/60'}`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="PLAN_CREDIT" disabled={!activeSubscription} />
                  <div>
                    <p className="font-medium">{t('booking.use_plan_credit')}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeSubscription
                        ? `${activeSubscription.creditsRemaining} ${t('booking.credits_available')}`
                        : t('booking.no_credits')}
                    </p>
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('booking.your_data')}</h2>
            {!user ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                 <p className="text-muted-foreground text-center">
                   {t('booking.login_required')}
                 </p>
                 <Button onClick={() => navigate('/login')} size="lg">
                   {t('booking.login_button')}
                 </Button>
              </div>
            ) : (
            <div className="space-y-4 max-w-md">
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                   <Info className="w-4 h-4" />
                   <span>{t('booking.data_usage_notice')}</span>
                 </div>
                 
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('booking.name')}</Label>
                    <Input
                      id="name"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('booking.phone')}</Label>
                    <Input
                      id="phone"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('booking.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-background"
                    />
                  </div>
                  
                  <Button variant="link" className="px-0" onClick={() => navigate('/profile')}>
                    {t('booking.update_data')}
                  </Button>
              </div>
            </div>
            )}
          </div>
        )}

        {step === 'confirmation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('booking.confirmation')}</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('booking.date_time')}</p>
                    <p className="text-muted-foreground">
                      {selectedDate && format(selectedDate, "PPP", { locale: currentLocale })} {t('common.at')} {selectedTime}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('booking.professional')}</p>
                    <p className="text-muted-foreground">{selectedProfessionalData?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div className="w-full">
                    <p className="font-medium">{t('booking.services')}</p>
                    <ul className="text-muted-foreground space-y-1 mt-1">
                      {selectedServicesData.map(s => (
                        <li key={s.id} className="flex justify-between text-sm">
                          <span>{s.name}</span>
                          <span>{new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(Number(s.price))}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between font-semibold">
                      <span>{t('booking.total')}</span>
                      <span>{new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isLoading}
          >
            {t('common.back')}
          </Button>
          
          {step === 'confirmation' ? (
            <Button onClick={handleConfirm} size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('booking.confirm_booking')}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              {t('common.continue')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};
