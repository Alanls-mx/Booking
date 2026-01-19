import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, MessageCircle, Mail, MapPin } from 'lucide-react';
import { useBranding } from '../contexts/BrandingContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { branding } = useBranding();

  return (
    <footer className="border-t border-border bg-card text-card-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{branding.businessName}</h3>
            <p className="text-sm text-muted-foreground">
              {branding.heroSubtitle || t('footer.default_subtitle')}
            </p>
            <div className="flex space-x-4">
              {branding.facebookUrl && (
                <a href={branding.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {branding.instagramUrl && (
                <a href={branding.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {branding.whatsapp && (
                <a href={`https://wa.me/${branding.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.quick_links')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">{t('footer.home')}</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">{t('footer.book')}</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">{t('footer.login')}</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">{t('footer.register')}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.contact')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {branding.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{branding.address}</span>
                </li>
              )}
              {branding.contactEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{branding.contactEmail}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {branding.businessName}. {t('footer.rights_reserved')}</p>
        </div>
      </div>
    </footer>
  );
};
