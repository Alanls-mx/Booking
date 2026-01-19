import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../utils/imageUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          {branding.logo ? (
            <img src={resolveImageUrl(branding.logo)} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <span className="text-xl font-semibold">{branding.businessName}</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/dashboard')}
                  className="hidden sm:flex"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t('landing.dashboard')}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.name}</span>
                      <UserIcon className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      {t('common.my_account')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/login')}>
              {t('common.login')}
            </Button>
          )}
          <Button onClick={() => navigate('/booking')}>{t('common.book')}</Button>
        </div>
      </div>
    </header>
  );
};
