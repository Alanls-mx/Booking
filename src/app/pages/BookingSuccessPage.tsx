import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

export const BookingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const gateway = searchParams.get('gateway');
  const status = searchParams.get('status');
  const collectionStatus = searchParams.get('collection_status');
  const isOnline = !!gateway || !!status || !!collectionStatus;

  const isApproved =
    status === 'success' ||
    collectionStatus === 'approved';

  const isPending =
    status === 'pending' ||
    collectionStatus === 'pending' ||
    collectionStatus === 'in_process';

  const isFailed =
    status === 'failure' ||
    collectionStatus === 'rejected' ||
    collectionStatus === 'cancelled';

  let messageKey: string;

  if (!isOnline) {
    messageKey = 'booking.success_message_offline';
  } else if (isApproved) {
    messageKey = 'booking.success_message_online_approved';
  } else if (isPending) {
    messageKey = 'booking.success_message_online_pending';
  } else if (isFailed) {
    messageKey = 'booking.success_message_online_failed';
  } else {
    messageKey = 'booking.success_message_online_pending';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card shadow-md rounded-xl p-6 space-y-4 text-center">
        <div className="flex justify-center mb-2">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">
          {t('booking.success_title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t(messageKey)}
        </p>
        <Button className="w-full mt-4" onClick={() => navigate('/')}>
          {t('booking.back_home')}
        </Button>
      </div>
    </div>
  );
};
