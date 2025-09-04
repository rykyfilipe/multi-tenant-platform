/** @format */

import { TourConfig } from '@/components/tours/TourManager';
import { dashboardTourConfig } from './dashboard-tour';
import { invoiceTourConfig } from './invoice-tour';
import { databaseTourConfig } from './database-tour';
import { usersTourConfig } from './users-tour';
import { settingsTourConfig } from './settings-tour';

// Export all tour configurations
export const allTours: TourConfig[] = [
  dashboardTourConfig,
  invoiceTourConfig,
  databaseTourConfig,
  usersTourConfig,
  settingsTourConfig,
];

// Helper function to get tours for a specific page
export const getToursForPage = (page: string): TourConfig[] => {
  return allTours.filter(tour => tour.id === page);
};

// Helper function to get tours for a specific role
export const getToursForRole = (role: string): TourConfig[] => {
  return allTours.filter(tour => 
    !tour.roles || tour.roles.includes(role)
  );
};

// Helper function to get tours for enabled features
export const getToursForFeatures = (features: string[]): TourConfig[] => {
  return allTours.filter(tour => 
    !tour.features || tour.features.every(feature => features.includes(feature))
  );
};

// Helper function to get tours by priority
export const getToursByPriority = (tours: TourConfig[]): TourConfig[] => {
  return tours.sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

// Helper function to get the highest priority tour
export const getHighestPriorityTour = (tours: TourConfig[]): TourConfig | null => {
  const sortedTours = getToursByPriority(tours);
  return sortedTours[0] || null;
};

// Export individual tour configs for direct access
export {
  dashboardTourConfig,
  invoiceTourConfig,
  databaseTourConfig,
  usersTourConfig,
  settingsTourConfig,
};
