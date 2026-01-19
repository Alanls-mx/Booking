import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Loader2, CheckCircle2, AlertCircle, Server, Building2, User, Settings2 } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Form Data
  const [dbConnected, setDbConnected] = useState(false);
  const [databaseUrl, setDatabaseUrl] = useState('');
  
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [modules, setModules] = useState({
    appointments: true,
    crm: true,
    financial: true,
    website: true,
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await api.get('/setup/status');
      
      if (response.data.isSetup) {
        // Already setup, redirect to login
        navigate('/login');
        return;
      }

      setDbConnected(response.data.dbConnected);
      // If DB is connected, we can skip entering the URL if user wants
      // But we still show the step for confirmation
    } catch (error) {
      console.error('Setup check failed', error);
      // If API fails, DB is likely down or not configured
      setDbConnected(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const payload = {
        databaseUrl: databaseUrl || undefined, // Send only if provided
        businessName,
        logo,
        primaryColor,
        adminName,
        adminEmail,
        adminPassword,
        modules,
      };

      const response = await api.post('/setup/init', payload);

      if (response.data.requiresRestart) {
        toast.success('Configuração salva! Reinicie o servidor para aplicar as alterações do banco de dados.');
      } else {
        toast.success('Instalação concluída com sucesso!');
        navigate('/login');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao realizar o setup.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStep1_Database = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {dbConnected ? (
          <div className="p-2 bg-green-100 rounded-full text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        ) : (
          <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
            <AlertCircle className="h-6 w-6" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg">
            {dbConnected ? 'Banco de Dados Conectado' : 'Configuração do Banco de Dados'}
          </h3>
          <p className="text-sm text-gray-500">
            {dbConnected 
              ? 'O sistema detectou uma conexão ativa com o banco de dados.' 
              : 'Não foi possível conectar ao banco de dados. Configure abaixo.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dbUrl">Database URL (PostgreSQL)</Label>
        <Input 
          id="dbUrl" 
          placeholder="postgresql://user:password@localhost:5432/mydb"
          value={databaseUrl}
          onChange={(e) => setDatabaseUrl(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Deixe em branco se já estiver configurado no arquivo .env ou se a conexão acima estiver correta.
        </p>
      </div>
    </div>
  );

  const renderStep2_Business = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Nome do Negócio</Label>
        <Input 
          id="businessName" 
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Ex: Barbearia do João"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="logo">URL do Logo (Opcional)</Label>
        <Input 
          id="logo" 
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Cor Primária</Label>
        <div className="flex gap-2">
          <Input 
            id="primaryColor" 
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input 
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3_Admin = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="adminName">Nome do Administrador</Label>
        <Input 
          id="adminName" 
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminEmail">E-mail</Label>
        <Input 
          id="adminEmail" 
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminPassword">Senha</Label>
        <Input 
          id="adminPassword" 
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep4_Modules = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Selecione os módulos que deseja ativar inicialmente. Você pode alterar isso depois no painel.
      </p>
      
      <div className="flex items-center space-x-2 border p-3 rounded-md">
        <Checkbox 
          id="mod_app" 
          checked={modules.appointments}
          onCheckedChange={(c) => setModules(prev => ({ ...prev, appointments: !!c }))}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="mod_app" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Agendamentos
          </Label>
          <p className="text-sm text-muted-foreground">
            Sistema de reservas e calendário.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 border p-3 rounded-md">
        <Checkbox 
          id="mod_crm" 
          checked={modules.crm}
          onCheckedChange={(c) => setModules(prev => ({ ...prev, crm: !!c }))}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="mod_crm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            CRM (Clientes)
          </Label>
          <p className="text-sm text-muted-foreground">
            Gestão de clientes e histórico.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 border p-3 rounded-md">
        <Checkbox 
          id="mod_fin" 
          checked={modules.financial}
          onCheckedChange={(c) => setModules(prev => ({ ...prev, financial: !!c }))}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="mod_fin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Financeiro
          </Label>
          <p className="text-sm text-muted-foreground">
            Controle de receitas e despesas.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 border p-3 rounded-md">
        <Checkbox 
          id="mod_site" 
          checked={modules.website}
          onCheckedChange={(c) => setModules(prev => ({ ...prev, website: !!c }))}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="mod_site" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Website Público
          </Label>
          <p className="text-sm text-muted-foreground">
            Landing page e páginas institucionais.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Configuração Inicial
          </CardTitle>
          <CardDescription>
            Passo {step} de 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex justify-between px-2">
            {[
              { s: 1, i: <Server className="h-4 w-4" />, l: 'Banco' },
              { s: 2, i: <Building2 className="h-4 w-4" />, l: 'Negócio' },
              { s: 3, i: <User className="h-4 w-4" />, l: 'Admin' },
              { s: 4, i: <Settings2 className="h-4 w-4" />, l: 'Módulos' }
            ].map((item) => (
              <div 
                key={item.s} 
                className={`flex flex-col items-center gap-1 ${step >= item.s ? 'text-primary' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-full border-2 ${step >= item.s ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
                  {item.i}
                </div>
                <span className="text-xs font-medium">{item.l}</span>
              </div>
            ))}
          </div>

          {step === 1 && renderStep1_Database()}
          {step === 2 && renderStep2_Business()}
          {step === 3 && renderStep3_Admin()}
          {step === 4 && renderStep4_Modules()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1 || loading}
          >
            Voltar
          </Button>
          
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar Instalação
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
