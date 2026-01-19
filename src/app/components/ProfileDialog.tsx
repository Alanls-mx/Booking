import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { resolveImageUrl } from '../utils/imageUtils';
import api from '../../api/client';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { tenantId } = useBranding();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await api.post('/uploads', formData);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const avatarUrl = `${apiUrl}${response.data.url}`;
      
      // Update user immediately with new avatar
      if (user && tenantId) {
        await api.patch(`/users/${user.id}?tenantId=${tenantId}`, { avatarUrl });
        updateUser({ avatar: avatarUrl });
        toast.success('Foto de perfil atualizada!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !tenantId) return;

    try {
      setIsLoading(true);
      await api.patch(`/users/${user.id}?tenantId=${tenantId}`, { name });
      updateUser({ name });
      toast.success('Perfil atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="w-24 h-24">
                <AvatarImage src={resolveImageUrl(user?.avatar)} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">Clique na foto para alterar</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              value={user?.email}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
