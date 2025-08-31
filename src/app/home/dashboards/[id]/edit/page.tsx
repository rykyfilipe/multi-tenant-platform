import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardEditor from '@/components/dashboard/DashboardEditor';
import { notFound } from 'next/navigation';

interface EditDashboardPageProps {
  params: { id: string };
}

export default async function EditDashboardPage({ params }: EditDashboardPageProps) {
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
      <DashboardEditor 
        dashboard={dashboard}
        widgets={dashboard.widgets}
      />
    </div>
  );
}
