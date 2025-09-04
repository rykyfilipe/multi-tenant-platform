/** @format */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Play, 
  CheckCircle, 
  Clock, 
  Settings, 
  RotateCcw,
  BookOpen,
  Video,
  FileText,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourConfig } from './TourManager';

interface HelpMenuProps {
  tours: TourConfig[];
  completedTours: Set<string>;
  onStartTour: (tourId: string) => void;
  onResetTours: () => void;
  onClose: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({
  tours,
  completedTours,
  onStartTour,
  onResetTours,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tours' | 'resources'>('tours');

  const getTourStatus = (tourId: string) => {
    if (completedTours.has(tourId)) {
      return { status: 'completed', icon: CheckCircle, color: 'text-green-500' };
    }
    return { status: 'available', icon: Play, color: 'text-blue-500' };
  };

  const getTourIcon = (tourId: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      dashboard: BookOpen,
      invoice: FileText,
      database: Settings,
      users: Settings,
      settings: Settings,
    };
    return iconMap[tourId] || BookOpen;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Help & Tutorials</h2>
                <p className="text-blue-100">Learn how to use the platform effectively</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tours')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'tours'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Interactive Tours
              </div>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'resources'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Resources
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'tours' && (
              <motion.div
                key="tours"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Available Tours</h3>
                    <p className="text-sm text-gray-600">
                      Interactive guided tours to help you learn the platform
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetTours}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Tours
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tours.map((tour) => {
                    const { status, icon: StatusIcon, color } = getTourStatus(tour.id);
                    const TourIcon = getTourIcon(tour.id);
                    
                    return (
                      <Card
                        key={tour.id}
                        className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
                        onClick={() => onStartTour(tour.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <TourIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{tour.name}</h4>
                                <StatusIcon className={`w-4 h-4 ${color}`} />
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{tour.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={status === 'completed' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {status === 'completed' ? 'Completed' : 'Available'}
                                </Badge>
                                {tour.priority && (
                                  <Badge variant="outline" className="text-xs">
                                    Priority {tour.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Resources</h3>
                  <p className="text-sm text-gray-600">
                    Additional resources to help you master the platform
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Documentation</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Comprehensive guides and API documentation
                          </p>
                          <Button variant="outline" size="sm">
                            View Docs
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Video className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Video Tutorials</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Step-by-step video guides for common tasks
                          </p>
                          <Button variant="outline" size="sm">
                            Watch Videos
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Tips and tricks from our experts
                          </p>
                          <Button variant="outline" size="sm">
                            Read Guide
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Feature Updates</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Stay updated with the latest features
                          </p>
                          <Button variant="outline" size="sm">
                            View Updates
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Need more help? Contact our support team
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HelpMenu;
