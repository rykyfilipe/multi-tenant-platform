/** @format */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TourProvider, useTour } from '@reactour/tour';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  SkipForward, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle, 
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

// Tour types
export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: any[];
  roles?: string[];
  features?: string[];
  autoStart?: boolean;
  priority?: number;
}

export interface TourManagerProps {
  tours: TourConfig[];
  currentPage: string;
  userRole?: string;
  enabledFeatures?: string[];
  onTourComplete?: (tourId: string) => void;
  onTourSkip?: (tourId: string) => void;
}

// Element existence checker with retries
const waitForElement = (
  selector: string, 
  timeout: number = 5000, 
  retryInterval: number = 100
): Promise<Element | null> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        console.warn(`Element ${selector} not found within ${timeout}ms`);
        resolve(null);
      } else {
        setTimeout(checkElement, retryInterval);
      }
    };
    
    checkElement();
  });
};

// Tour content component
const TourContent: React.FC<{ tour: TourConfig }> = ({ tour }) => {
  const { user, tenant, token } = useApp();
  const { t } = useLanguage();
  const { isOpen, setIsOpen, currentStep, setCurrentStep, steps } = useTour();
  
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [showTourMenu, setShowTourMenu] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id || !token) return;
      
      try {
        const response = await fetch(`/api/users/${user.id}/preferences`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const prefs = await response.json();
          setUserPreferences(prefs);
          
          // Load completed tours
          const completed = new Set<string>();
          if (prefs.tourDashboardDone) completed.add('dashboard');
          if (prefs.tourInvoiceDone) completed.add('invoice');
          if (prefs.tourDatabaseDone) completed.add('database');
          if (prefs.tourUsersDone) completed.add('users');
          if (prefs.tourSettingsDone) completed.add('settings');
          if (prefs.tourAnalyticsDone) completed.add('analytics');
          setCompletedTours(completed);
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [user?.id, token]);

  // Mark tour as completed
  const markTourCompleted = useCallback(async (tourId: string) => {
    if (!user?.id || !token) return;

    try {
      const response = await fetch(`/api/users/${user.id}/preferences`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          [`tour${tourId.charAt(0).toUpperCase() + tourId.slice(1)}Done`]: true
        })
      });

      if (response.ok) {
        setCompletedTours(prev => new Set([...prev, tourId]));
      }
    } catch (error) {
      console.error('Failed to mark tour as completed:', error);
    }
  }, [user?.id, token]);

  // Handle tour completion
  useEffect(() => {
    if (!isOpen && currentStep === steps.length - 1) {
      markTourCompleted(tour.id);
    }
  }, [isOpen, currentStep, steps.length, tour.id, markTourCompleted]);

  return (
    <>
      {/* Tour Menu Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showTourMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tours & Tutorials</h3>
                <button
                  onClick={() => setShowTourMenu(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setIsOpen(true);
                    setCurrentStep(0);
                    setShowTourMenu(false);
                  }}
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{tour.name}</h4>
                    <p className="text-sm text-gray-600">{tour.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completedTours.has(tour.id) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <Play className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => setShowTourMenu(!showTourMenu)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <HelpCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    </>
  );
};

export const TourManager: React.FC<TourManagerProps> = ({
  tours,
  currentPage,
  userRole = 'VIEWER',
  enabledFeatures = [],
  onTourComplete,
  onTourSkip
}) => {
  const { user, tenant } = useApp();
  
  // Find appropriate tour for current page
  const findTourForPage = useCallback(() => {
    const availableTours = tours.filter(tour => {
      // Check role restrictions
      if (tour.roles && !tour.roles.includes(userRole)) {
        return false;
      }
      
      // Check feature requirements
      if (tour.features) {
        const hasRequiredFeatures = tour.features.every(feature => 
          enabledFeatures.includes(feature)
        );
        if (!hasRequiredFeatures) return false;
      }
      
      return true;
    });

    // Sort by priority (higher number = higher priority)
    availableTours.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return availableTours[0] || null;
  }, [tours, userRole, enabledFeatures]);

  const currentTour = findTourForPage();

  if (!currentTour) {
    return null;
  }

  return (
    <TourProvider
      steps={currentTour.steps}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '450px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
          backdropFilter: 'blur(10px)',
        }),
        maskArea: (base) => ({
          ...base,
          rx: 12,
          stroke: '#3b82f6',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        }),
        badge: (base) => ({
          ...base,
          left: 'auto',
          right: '-0.8125em',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }),
        controls: (base) => ({
          ...base,
          marginTop: '20px',
          gap: '12px',
        }),
        navigation: (base) => ({
          ...base,
          borderRadius: '12px',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: 'none',
        }),
        close: (base) => ({
          ...base,
          top: '16px',
          right: '16px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          color: '#6b7280',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: '#374151',
          },
        }),
      }}
      onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
        if (steps) {
          if (currentStep === steps.length - 1) {
            setIsOpen(false);
            onTourComplete?.(currentTour.id);
          } else {
            setCurrentStep((s: number) => s + 1);
          }
        }
      }}
      onClickClose={({ setIsOpen }) => {
        setIsOpen(false);
        onTourSkip?.(currentTour.id);
      }}
      scrollSmooth
      showBadge
      showCloseButton
      showNavigation
      showDots
      disableDotsNavigation={false}
      disableInteraction={true}
    >
      <TourContent tour={currentTour} />
    </TourProvider>
  );
};

export default TourManager;