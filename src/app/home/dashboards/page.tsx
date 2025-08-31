import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardList from '@/components/dashboard/DashboardList';
import prisma from '@/lib/prisma';

export default async function DashboardsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    redirect('/');
  }

  const dashboards = await prisma.dashboard.findMany({
    where: { userId: user.id },
    include: {
      widgets: {
        orderBy: { orderIndex: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            My Dashboards
          </h1>
          <p className="text-muted-foreground text-lg">
            Create and manage your custom dashboards with drag & drop widgets
          </p>
        </div>
        
        <DashboardList initialDashboards={dashboards} />
      </div>
    </div>
  );
}
