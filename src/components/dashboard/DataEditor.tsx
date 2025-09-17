'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Download, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartDataPoint } from './LineChartWidget';

interface DataEditorProps {
  data: ChartDataPoint[];
  columns: string[];
  onDataChange: (data: ChartDataPoint[]) => void;
  onSave: () => void;
}

export function DataEditor({ data, columns, onDataChange, onSave }: DataEditorProps) {
  const [editingData, setEditingData] = useState<ChartDataPoint[]>(data);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditingData(data);
    setHasChanges(false);
  }, [data]);

  const handleDataChange = (index: number, column: string, value: string) => {
    const newData = [...editingData];
    if (!newData[index]) {
      newData[index] = {};
    }
    newData[index][column] = value;
    setEditingData(newData);
    setHasChanges(true);
    onDataChange(newData);
  };

  const handleAddRow = () => {
    const newRow: ChartDataPoint = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    const newData = [...editingData, newRow];
    setEditingData(newData);
    setHasChanges(true);
    onDataChange(newData);
  };

  const handleDeleteRow = (index: number) => {
    const newData = editingData.filter((_, i) => i !== index);
    setEditingData(newData);
    setHasChanges(true);
    onDataChange(newData);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const importedData: ChartDataPoint[] = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: ChartDataPoint = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          return row;
        });
        
        setEditingData(importedData);
        setHasChanges(true);
        onDataChange(importedData);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (editingData.length === 0) return;

    const headers = columns.join(',');
    const rows = editingData.map(row => 
      columns.map(col => row[col] || '').join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Data Editor</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={editingData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full overflow-auto">
        <div className="space-y-4">
          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-3 py-2 text-left font-medium text-gray-700">
                        {column}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {editingData.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50"
                    >
                      {columns.map((column) => (
                        <td key={column} className="px-3 py-2">
                          <Input
                            value={row[column] || ''}
                            onChange={(e) => handleDataChange(index, column, e.target.value)}
                            placeholder={`Enter ${column}`}
                            className="h-8 text-xs"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Row Button */}
          <Button
            variant="outline"
            onClick={handleAddRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>

          {/* Data Summary */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Rows: {editingData.length}</p>
            <p>Columns: {columns.length}</p>
            {hasChanges && (
              <p className="text-orange-600 font-medium">Unsaved changes</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
