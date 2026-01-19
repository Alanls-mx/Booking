import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Users, Star, Scissors, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useBranding } from '../contexts/BrandingContext';
import { resolveImageUrl } from '../utils/imageUtils';
import api from '../../api/client';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  icon: string;
  imageUrl?: string;
}

interface Professional {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  specialties: string[];
}

import { ProfileDialog } from '../components/ProfileDialog';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { branding, tenantId } = useBranding();
  const [services, setServices] = React.useState<Service[]>([]);
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [featuredReviews, setFeaturedReviews] = React.useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  React.useEffect(() => {
    if (tenantId) {
      const fetchData = async () => {
        try {
          const [servicesRes, professionalsRes, reviewsRes] = await Promise.all([
            api.get(`/services?tenantId=${tenantId}`),
            api.get(`/professionals?tenantId=${tenantId}`),
            api.get(`/reviews/featured?tenantId=${tenantId}`)
          ]);

          setServices(servicesRes.data.map((s: any) => ({
            ...s,
            icon: 'scissors', // Default icon
            imageUrl: s.imageUrl
          })));

          setProfessionals(professionalsRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            role: p.bio || t('booking.professional'),
            avatar: p.avatarUrl,
            rating: 5.0, // Mock rating for now
            specialties: [] // Mock specialties
          })));

          setFeaturedReviews(reviewsRes.data || []);
        } catch (error) {
          console.error('Error fetching landing page data:', error);
        }
      };
      fetchData();
    }
  }, [tenantId]);

  const iconMap: Record<string, React.ReactNode> = {
    scissors: <Scissors className="w-8 h-8" />,
    sparkles: <Sparkles className="w-8 h-8" />,
    palette: <Sparkles className="w-8 h-8" />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative flex items-center min-h-[600px] lg:min-h-[80vh] overflow-hidden bg-background">
        {/* Background Image (Right Side with Fade) */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[60%] select-none">
          <ImageWithFallback
            src={branding.bannerImage ? resolveImageUrl(branding.bannerImage) : 'https://images.unsplash.com/photo-1754294437661-129b86f868ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXJiZXJzaG9wJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY4MjY2NzIxfDA&ixlib=rb-4.1.0&q=80&w=1080'}
            alt="Hero"
            className="w-full h-full object-cover"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 20%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-xl lg:max-w-2xl space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              {branding.heroTitle}
            </h1>
            <p className="text-xl text-muted-foreground">
              {branding.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate('/booking')}>
                {t('landing.book_now')}
                <Calendar className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline">
                {t('landing.view_services')}
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm">{t('landing.quick_booking')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm">{t('landing.qualified_professionals')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t('landing.our_services')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.services_subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {service.imageUrl ? (
                       <img src={resolveImageUrl(service.imageUrl)} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-primary">{iconMap[service.icon] || iconMap.scissors}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{service.duration} {t('common.min')}</span>
                      <span className="font-semibold">{Number(service.price).toLocaleString(i18n.language, { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Professionals Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t('landing.our_team')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.team_subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionals.map((professional) => (
              <Card key={professional.id} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center overflow-hidden">
                    {professional.avatar ? (
                      <img src={resolveImageUrl(professional.avatar)} alt={professional.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{professional.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{professional.role}</p>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{professional.rating}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {professional.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-muted text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {featuredReviews.length > 0 && (
        <section className="py-20 bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                {t('landing.testimonials_title')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('landing.testimonials_subtitle')}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredReviews.map((review: any) => (
                <Card key={review.id} className="h-full">
                  <CardContent className="p-6 flex flex-col h-full justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">
                          “{review.comment}”
                        </p>
                      )}
                    </div>
                    <div className="mt-4 text-sm font-semibold">
                      {review.user?.name || ''}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            {t('landing.cta_title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('landing.cta_subtitle')}
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/booking')}
            className="text-lg px-8"
          >
            {t('landing.make_appointment')}
            <Calendar className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />
      <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};
