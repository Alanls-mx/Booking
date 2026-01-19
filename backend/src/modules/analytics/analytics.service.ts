import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const now = new Date();
    
    // Day boundaries
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Week boundaries (assuming Sunday start)
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59);

    // Month boundaries
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const dayAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        date: { gte: startOfDay, lte: endOfDay }
      },
      select: { services: { select: { price: true } } }
    });

    const weekAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CONFIRMED] },
        date: { gte: startOfWeek, lte: endOfWeek }
      },
      select: { services: { select: { price: true } } }
    });

    const monthAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CONFIRMED] },
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      select: { services: { select: { price: true } } }
    });

    const topProfessionals = await this.prisma.appointment.groupBy({
      by: ['professionalId'],
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const topServices = await this.prisma.service.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            appointments: {
              where: {
                date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
                status: AppointmentStatus.COMPLETED
              }
            }
          }
        }
      },
      orderBy: { appointments: { _count: 'desc' } },
      take: 5
    });

    const recentAppointments = await this.prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        professional: { select: { name: true } },
        services: { select: { name: true } }
      }
    });

    const todayDistributionApps = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: AppointmentStatus.CANCELED }
      },
      select: { date: true }
    });

    const pendingCount = await this.prisma.appointment.count({
      where: {
        tenantId,
        status: AppointmentStatus.PENDING
      }
    });

    const activeClientsCount = await this.prisma.user.count({
      where: {
        tenantId,
        role: Role.CLIENT
      }
    });

    // Helper to sum revenue
    const calculateRevenue = (appointments: any[]) => {
      return appointments.reduce((acc, curr) => {
        const servicesTotal = curr.services?.reduce((sAcc, s) => sAcc + Number(s.price || 0), 0) || 0;
        return acc + servicesTotal;
      }, 0);
    };

    // Enrich Top Professionals
    const professionalIds = topProfessionals
      .map(p => p.professionalId)
      .filter((id): id is string => id !== null);

    const professionals = professionalIds.length > 0 ? await this.prisma.professional.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true, name: true }
    }) : [];
    
    const enrichedTopProfessionals = topProfessionals.map(p => {
      const prof = professionals.find(prof => prof.id === p.professionalId);
      return {
        name: prof?.name || 'Sem Profissional',
        count: p._count.id
      };
    });

    // Hourly Distribution
    const hourlyDistribution = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    todayDistributionApps.forEach(app => {
      if (app.date) {
        const dateObj = new Date(app.date);
        if (!isNaN(dateObj.getTime())) {
          const hour = dateObj.getHours();
          if (hourlyDistribution[hour]) {
            hourlyDistribution[hour].count++;
          }
        }
      }
    });

    return {
      today: {
        revenue: calculateRevenue(dayAppointments),
        count: dayAppointments.length
      },
      week: {
        revenue: calculateRevenue(weekAppointments),
        count: weekAppointments.length
      },
      month: {
        revenue: calculateRevenue(monthAppointments),
        count: monthAppointments.length
      },
      dailySeries: hourlyDistribution.filter(h => h.count > 0 || (h.hour >= 8 && h.hour <= 20)),
      topProfessionals: enrichedTopProfessionals,
      topServices: topServices
        .map(s => ({ name: s.name, count: s._count.appointments }))
        .filter(s => s.count > 0), // Filter out services with 0 appointments if desired, but maybe keep top 5 even if 0? Let's filter > 0 to be cleaner.
      recentAppointments: recentAppointments.map(a => ({
        id: a.id,
        clientName: a.user.name,
        professionalName: a.professional?.name || 'Não atribuído',
        serviceName: a.services.map(s => s.name).join(', '),
        date: a.date,
        status: a.status
      })),
      pendingCount,
      activeClientsCount
    };
  }
}
