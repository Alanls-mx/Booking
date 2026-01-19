import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../../api/client';
import { resolveImageUrl } from '../utils/imageUtils';
import { Loader2 } from 'lucide-react';

interface BrandingConfig {
  logo: string;
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  bannerImage: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsapp?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  dashboardTitle?: string;
  termsOfUse?: string;
  privacyPolicy?: string;
  aboutUs?: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  tenantId: string | null;
  rawConfig: any;
  isLoading: boolean;
  updateBranding: (updates: Partial<BrandingConfig>) => void;
  refreshTenant: () => Promise<void>;
}

const defaultBranding: BrandingConfig = {
  logo: '',
  businessName: 'FlexBook',
  primaryColor: '#030213',
  secondaryColor: '#6366f1',
  heroTitle: 'Agende seu horário com facilidade',
  heroSubtitle: 'Sistema de agendamento profissional para seu negócio',
  bannerImage: '',
  dashboardTitle: 'Admin',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    // Try to load from localStorage first to avoid flash of default content
    try {
      const cached = localStorage.getItem('flexbook_branding');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse cached branding', e);
    }
    return defaultBranding;
  });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [rawConfig, setRawConfig] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Update CSS variables when branding colors change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', branding.primaryColor);
    root.style.setProperty('--secondary', branding.secondaryColor);
  }, [branding.primaryColor, branding.secondaryColor]);

  // Update document title and favicon
  useEffect(() => {
    if (branding.businessName) {
      document.title = branding.businessName;
    }

    if (branding.logo) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = branding.logo;
      if (!document.querySelector("link[rel*='icon']")) {
        document.head.appendChild(link);
      }
    }
  }, [branding.businessName, branding.logo]);

  const fetchTenant = async () => {
    setIsLoading(true);
    try {
      // Hardcoded slug para demonstração. Em produção, pegaria do subdomínio ou path.
      const slug = (import.meta as any).env?.VITE_TENANT_SLUG || 'demo-barbershop'; 
      let tenant = null;
      try {
        const response = await api.get(`/tenants/slug/${slug}`);
        tenant = response.data;
      } catch (err: any) {
        console.error('Error fetching tenant:', err);
        // Se não existir, cria um tenant padrão automaticamente
        if (err?.response?.status === 404) {
          try {
            const createRes = await api.post('/tenants', {
              name: 'Demo Barbershop',
              slug,
              primaryColor: defaultBranding.primaryColor,
              secondaryColor: defaultBranding.secondaryColor,
              config: { businessType: 'BARBERSHOP', hasProfessionals: true },
            });
            tenant = createRes.data;
          } catch (createErr) {
             console.error('Failed to create fallback tenant:', createErr);
             // Tenta buscar novamente caso tenha havido condição de corrida
             const retryRes = await api.get(`/tenants/slug/${slug}`);
             tenant = retryRes.data;
          }
        } else {
          // Se for erro de conexão ou outro erro (ex: 500), lança para cair no catch externo
          throw err;
        }
      }

      if (tenant) {
        setTenantId(tenant.id);
        setRawConfig(tenant.config || {});
        
        const newBranding: BrandingConfig = {
          ...branding, // Keep current values as base, overwrite with new ones
          businessName: tenant.name || branding.businessName,
          primaryColor: tenant.primaryColor || branding.primaryColor,
          secondaryColor: tenant.secondaryColor || branding.secondaryColor,
          logo: resolveImageUrl(tenant.logo),
          heroTitle: tenant.config?.heroTitle || branding.heroTitle,
          heroSubtitle: tenant.config?.heroSubtitle || branding.heroSubtitle,
          bannerImage: resolveImageUrl(tenant.config?.bannerImage),
          dashboardTitle: tenant.config?.dashboardTitle || branding.dashboardTitle,
          facebookUrl: tenant.facebookUrl || '',
          instagramUrl: tenant.instagramUrl || '',
          whatsapp: tenant.whatsapp || '',
          address: tenant.address || '',
          contactEmail: tenant.contactEmail || '',
          contactPhone: tenant.contactPhone || '',
          termsOfUse: tenant.termsOfUse || '',
          privacyPolicy: tenant.privacyPolicy || '',
          aboutUs: tenant.aboutUs || '',
        };

        setBranding(newBranding);
        // Cache the new branding to localStorage
        localStorage.setItem('flexbook_branding', JSON.stringify(newBranding));
      }
    } catch (error) {
      console.error('Failed to load tenant:', error);
      // Opcional: Definir um estado de erro global ou exibir um toast
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    setBranding((prev) => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrandingContext.Provider value={{ branding, tenantId, rawConfig, isLoading, updateBranding, refreshTenant: fetchTenant }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
