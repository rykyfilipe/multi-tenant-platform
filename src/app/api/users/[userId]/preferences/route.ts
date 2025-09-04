/** @format */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    
    // Check if user is accessing their own preferences or is admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create user preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            tenantId: true
          }
        }
      }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          tenantId: user.tenantId || 1, // Default tenant if none
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              tenantId: true
            }
          }
        }
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    
    // Check if user is accessing their own preferences or is admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the update data
    const allowedFields = [
      'tourDashboardDone',
      'tourInvoiceDone', 
      'tourDatabaseDone',
      'tourUsersDone',
      'tourSettingsDone',
      'tourAnalyticsDone',
      'autoStartTours',
      'showTourHints',
      'tourSpeed',
      'theme',
      'language',
      'timezone',
      'emailNotifications',
      'pushNotifications',
      'weeklyDigest',
      'sidebarCollapsed',
      'compactMode'
    ];

    const updateData: any = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // Get or create user preferences first
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          tenantId: user.tenantId || 1,
        }
      });
    }

    // Update preferences
    const updatedPreferences = await prisma.userPreferences.update({
      where: { userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            tenantId: true
          }
        }
      }
    });

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
