import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

export const PaymentCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const gateway = searchParams.get('gateway') || 'ONLINE';
  const appointmentId = searchParams.get('appointmentId') || '';

  const handleSimulateSuccess = () => {
    const query = new URLSearchParams();
    if (appointmentId) query.set('appointmentId', appointmentId);
    if (gateway) query.set('gateway', gateway);
    navigate(`/booking/success?${query.toString()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card shadow-md rounded-xl p-6 space-y-4 text-center">
        <div className="flex justify-center mb-2">
          <CreditCard className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">
          {t('booking.online_payment_title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('booking.online_payment_subtitle', { gateway })}
        </p>
        <Button className="w-full mt-4" onClick={handleSimulateSuccess}>
          <CheckCircle className="w-4 h-4 mr-2" />
          {t('booking.simulate_payment')}
        </Button>
      </div>
    </div>
  );
};

