import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, User, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isFeatured?: boolean;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export const ReviewsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { branding, tenantId } = useBranding();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const locales: { [key: string]: any } = { pt: ptBR, en: enUS, es: es };
  const currentLocale = locales[i18n.language] || ptBR;

  const userHasReview = !!user && reviews.some((review) => review.user?.id === user.id);

  useEffect(() => {
    fetchReviews();
    fetchProfessionals();
  }, [tenantId]);

  const fetchReviews = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/reviews?tenantId=${tenantId}`);
      setReviews(response.data);
    } catch (error) {
      console.error(t('reviews.error_load'), error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    if (!tenantId) return;
    try {
      const response = await api.get(`/professionals?tenantId=${tenantId}`);
      if (Array.isArray(response.data)) {
        setProfessionals(
          response.data.map((p: any) => ({
            id: p.id,
            name: p.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading professionals for review:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reviews', {
        rating,
        comment,
        tenantId,
        userId: user.id,
        professionalId: selectedProfessionalId || undefined,
      });
      toast.success(t('reviews.success_submit'));
      setIsDialogOpen(false);
      setComment('');
      setRating(5);
       setSelectedProfessionalId('');
      fetchReviews();
    } catch (error: any) {
      const msg = error.response?.data?.message || t('reviews.error_submit');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

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
          {user && !userHasReview && (
            <Button onClick={() => setIsDialogOpen(true)}>
              {t('reviews.evaluate_button')}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{t('reviews.title')}</h1>
        </div>

        {userHasReview && (
          <div className="mb-6 text-sm text-muted-foreground">
            {t('reviews.already_submitted')}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t('reviews.empty')}</p>
            <p>{t('reviews.be_the_first')}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className={review.isFeatured ? 'border-2 border-yellow-400 bg-yellow-50/40' : ''}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold">{review.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-700 text-xs font-medium uppercase tracking-wide">
                          {t('reviews.featured_badge')}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "d 'de' MMMM 'de' yyyy", { locale: currentLocale })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reviews.dialog_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>{t('reviews.comment_label')}</Label>
              <Textarea
                placeholder={t('reviews.comment_placeholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('reviews.professional_label')}</Label>
              <Select
                value={selectedProfessionalId}
                onValueChange={(value) => setSelectedProfessionalId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reviews.professional_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('reviews.submitting')}
                </>
              ) : (
                t('reviews.submit_button')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
