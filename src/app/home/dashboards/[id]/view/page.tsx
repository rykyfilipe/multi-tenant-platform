import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardViewer from '@/components/dashboard/DashboardViewer';

interface ViewDashboardPageProps {
  params: { id: string };
}

export default async function ViewDashboardPage({ params }: ViewDashboardPageProps) {
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

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      widgets: {
        orderBy: { orderIndex: 'asc' },
        include: {
          children: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    }
  });

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardViewer 
        dashboard={dashboard}
        widgets={dashboard.widgets}
      />
    </div>
  );
}
