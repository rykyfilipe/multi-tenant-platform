'use client';

import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Save, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaveChangesButtonProps {
  // Pending changes data
  pendingChanges?: any[];
  isSaving?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;

  // Styling
  className?: string;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  showDetails?: boolean;
}

export const SaveChangesButton = memo(function SaveChangesButton({
  pendingChanges = [],
  isSaving = false,
  onSave,
  onDiscard,
  className = '',
  size = 'lg',
  variant = 'default',
  showDetails = true,
}: SaveChangesButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculează numărul total de modificări
  const totalChanges = pendingChanges.length;

  // Determină dacă există modificări de salvat
  const hasChanges = totalChanges > 0;

  // Gestionează salvarea
  const handleSave = useCallback(async () => {
    if (isSaving || !onSave) return;

    try {
      await onSave();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  }, [isSaving, onSave]);

  // Gestionează anularea modificărilor
  const handleDiscard = useCallback(() => {
    if (isSaving || !onDiscard) return;
    onDiscard();
  }, [isSaving, onDiscard]);

  // Nu afișa butonul dacă nu există modificări
  if (!hasChanges) {
    return null;
  }

  // Determină textul butonului
  const getButtonText = () => {
    if (isSaving) {
      return 'Saving...';
    }

    if (totalChanges === 1) {
      return 'Save Change';
    } else {
      return `Save Changes (${totalChanges})`;
    }
  };

  // Determină iconița
  const getIcon = () => {
    if (isSaving) {
      return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    }
    return <Save className="w-4 h-4 mr-2" />;
  };

  // Grupează modificările pe tip
  const changesByType = {
    create: pendingChanges.filter(change => change.type === 'create'),
    update: pendingChanges.filter(change => change.type === 'update'),
    delete: pendingChanges.filter(change => change.type === 'delete'),
  };

  return (
    <motion.div 
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        onClick={handleSave}
        disabled={isSaving}
        variant={variant}
        size={size}
        className="min-w-[140px] transition-all duration-200 hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      {/* Butonul de anulare */}
      <Button
        onClick={handleDiscard}
        disabled={isSaving}
        variant="outline"
        size={size}
        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Discard ({totalChanges})
      </Button>

      {/* Indicator vizual pentru tipul de modificări */}
      {showDetails && totalChanges > 0 && (
        <AnimatePresence>
          <motion.div 
            className="flex items-center gap-1 text-xs text-muted-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {changesByType.create.length > 0 && (
              <motion.span 
                className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                +{changesByType.create.length} new
              </motion.span>
            )}
            {changesByType.update.length > 0 && (
              <motion.span 
                className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                ~{changesByType.update.length} updated
              </motion.span>
            )}
            {changesByType.delete.length > 0 && (
              <motion.span 
                className="px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                -{changesByType.delete.length} deleted
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Indicator de hover pentru detalii */}
      {isHovered && showDetails && (
        <motion.div
          className="absolute -top-12 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {totalChanges} pending change{totalChanges !== 1 ? 's' : ''}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </motion.div>
      )}
    </motion.div>
  );
});

export default SaveChangesButton;
