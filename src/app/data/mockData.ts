export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  icon: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  specialties: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  clientName: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export const services: Service[] = [
  {
    id: '1',
    name: 'Corte de Cabelo',
    description: 'Corte moderno e personalizado',
    duration: 45,
    price: 50,
    icon: 'scissors',
  },
  {
    id: '2',
    name: 'Barba',
    description: 'Modelagem e alinhamento de barba',
    duration: 30,
    price: 35,
    icon: 'scissors',
  },
  {
    id: '3',
    name: 'Combo Completo',
    description: 'Corte + Barba + Finalização',
    duration: 60,
    price: 75,
    icon: 'sparkles',
  },
  {
    id: '4',
    name: 'Coloração',
    description: 'Tintura e coloração profissional',
    duration: 90,
    price: 120,
    icon: 'palette',
  },
];

export const professionals: Professional[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    role: 'Barbeiro Especialista',
    avatar: '',
    rating: 4.9,
    specialties: ['Cortes Modernos', 'Barba', 'Design'],
  },
  {
    id: '2',
    name: 'Ana Costa',
    role: 'Hair Stylist',
    avatar: '',
    rating: 5.0,
    specialties: ['Coloração', 'Cortes Femininos', 'Tratamentos'],
  },
  {
    id: '3',
    name: 'Ricardo Oliveira',
    role: 'Barbeiro Master',
    avatar: '',
    rating: 4.8,
    specialties: ['Cortes Clássicos', 'Barba', 'Navalha'],
  },
];

export const timeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: false },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: false },
  { time: '13:00', available: true },
  { time: '13:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: false },
  { time: '15:00', available: true },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
  { time: '17:00', available: true },
  { time: '17:30', available: false },
  { time: '18:00', available: true },
];

export const appointments: Appointment[] = [
  {
    id: '1',
    clientName: 'João Santos',
    service: 'Corte de Cabelo',
    professional: 'Carlos Silva',
    date: '2026-01-15',
    time: '10:00',
    status: 'confirmed',
  },
  {
    id: '2',
    clientName: 'Maria Oliveira',
    service: 'Coloração',
    professional: 'Ana Costa',
    date: '2026-01-15',
    time: '14:30',
    status: 'confirmed',
  },
  {
    id: '3',
    clientName: 'Pedro Lima',
    service: 'Combo Completo',
    professional: 'Ricardo Oliveira',
    date: '2026-01-16',
    time: '09:00',
    status: 'pending',
  },
];
