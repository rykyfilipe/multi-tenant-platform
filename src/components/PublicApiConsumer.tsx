"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Filter, Plus, Eye, Edit, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";

interface TableData {
  id: number;
  name: string;
  description: string | null;
  database: {
    id: number;
    name: string;
  };
}

interface ColumnData {
  id: number;
  name: string;
  type: string;
  required: boolean;
  primary: boolean;
  order: number;
  customOptions: any;
}

interface RowData {
  id: number;
  [key: string]: any;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: any;
  sorting?: {
    sortBy: string;
    sortOrder: string;
  };
}

interface FilterConfig {
  operator: string;
  value: any;
}

interface PublicApiConsumerProps {
  apiToken: string;
  baseUrl?: string;
}

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "between", label: "Between" },
  { value: "in", label: "In" },
  { value: "not_in", label: "Not In" },
  { value: "is_null", label: "Is Null" },
  { value: "is_not_null", label: "Is Not Null" },
];

export default function PublicApiConsumer({ apiToken, baseUrl = "" }: PublicApiConsumerProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [tableColumns, setTableColumns] = useState<ColumnData[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  
  // Filtering state
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState<string>("");

  const headers = {
    "Authorization": `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  // Fetch all tables
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${baseUrl}/api/public/tables`, { headers });
      const result: ApiResponse<TableData[]> = await response.json();
      
      if (result.success) {
        setTables(result.data);
      } else {
        setError("Failed to fetch tables");
      }
    } catch (err) {
      setError("Error fetching tables");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, baseUrl]);

  // Fetch table details and columns
  const fetchTableDetails = useCallback(async (tableId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${baseUrl}/api/public/tables/${tableId}`, { headers });
      const result: ApiResponse<TableData & { columns: ColumnData[] }> = await response.json();
      
      if (result.success) {
        setTableColumns(result.data.columns);
      } else {
        setError("Failed to fetch table details");
      }
    } catch (err) {
      setError("Error fetching table details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, baseUrl]);

  // Fetch table rows
  const fetchRows = useCallback(async (tableId: number, page: number = 1, limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (Object.keys(filters).length > 0) {
        params.append("filters", JSON.stringify(filters));
      }

      if (sortBy) {
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);
      }

      const response = await fetch(`${baseUrl}/api/public/tables/${tableId}/rows?${params}`, { headers });
      const result: ApiResponse<RowData[]> = await response.json();
      
      if (result.success) {
        setRows(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalRows(result.pagination.total);
        }
      } else {
        setError("Failed to fetch rows");
      }
    } catch (err) {
      setError("Error fetching rows");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, baseUrl, filters, sortBy, sortOrder]);

  // Handle table selection
  const handleTableSelect = useCallback((table: TableData) => {
    setSelectedTable(table);
    setCurrentPage(1);
    setFilters({});
    setSortBy("");
    setSortOrder("asc");
    setSearchTerm("");
    setSearchColumn("");
    fetchTableDetails(table.id);
    fetchRows(table.id, 1, pageSize);
  }, [fetchTableDetails, fetchRows, pageSize]);

  // Add new row
  const handleAddRow = async () => {
    if (!selectedTable) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${baseUrl}/api/public/tables/${selectedTable.id}/rows`, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: formData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Row added successfully");
        setShowAddForm(false);
        setFormData({});
        fetchRows(selectedTable.id, currentPage, pageSize);
      } else {
        toast.error(result.error || "Failed to add row");
      }
    } catch (err) {
      toast.error("Error adding row");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update row
  const handleUpdateRow = async () => {
    if (!selectedTable || !editingRow) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${baseUrl}/api/public/tables/${selectedTable.id}/rows/${editingRow.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ data: formData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Row updated successfully");
        setEditingRow(null);
        setFormData({});
        fetchRows(selectedTable.id, currentPage, pageSize);
      } else {
        toast.error(result.error || "Failed to update row");
      }
    } catch (err) {
      toast.error("Error updating row");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete row
  const handleDeleteRow = async (rowId: number) => {
    if (!selectedTable) return;
    
    if (!confirm("Are you sure you want to delete this row?")) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${baseUrl}/api/public/tables/${selectedTable.id}/rows/${rowId}`, {
        method: "DELETE",
        headers,
      });
      
      if (response.ok) {
        toast.success("Row deleted successfully");
        fetchRows(selectedTable.id, currentPage, pageSize);
      } else {
        toast.error("Failed to delete row");
      }
    } catch (err) {
      toast.error("Error deleting row");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const handleExport = () => {
    if (!rows.length) return;
    
    const csvContent = [
      Object.keys(rows[0]).join(","),
      ...rows.map(row => Object.values(row).map(value => `"${value}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTable?.name || "table"}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Apply filters
  const applyFilters = () => {
    if (selectedTable) {
      setCurrentPage(1);
      fetchRows(selectedTable.id, 1, pageSize);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSortBy("");
    setSortOrder("asc");
    if (selectedTable) {
      setCurrentPage(1);
      fetchRows(selectedTable.id, 1, pageSize);
    }
  };

  // Search functionality
  const handleSearch = () => {
    if (!searchTerm || !searchColumn) return;
    
    const newFilters = { ...filters };
    newFilters[searchColumn] = {
      operator: "contains",
      value: searchTerm
    };
    
    setFilters(newFilters);
    applyFilters();
  };

  // Initialize component
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Reset form when table changes
  useEffect(() => {
    if (selectedTable && tableColumns.length > 0) {
      const initialFormData: Record<string, any> = {};
      tableColumns.forEach(column => {
        if (!column.primary) {
          initialFormData[column.name] = "";
        }
      });
      setFormData(initialFormData);
    }
  }, [selectedTable, tableColumns]);

  if (loading && !tables.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading tables...</span>
      </div>
    );
  }

  if (error && !tables.length) {
    return (
      <Alert className="max-w-md mx-auto mt-8">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tables Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tables</CardTitle>
          <CardDescription>Select a table to view and manage its data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleTableSelect(table)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{table.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {table.description || "No description"}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {table.database.name}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Table Data */}
      {selectedTable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTable.name}</CardTitle>
                <CardDescription>
                  {selectedTable.description || "No description"} • {totalRows} total rows
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Search</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={searchColumn} onValueChange={setSearchColumn}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Column" />
                      </SelectTrigger>
                      <SelectContent>
                        {tableColumns.map((column) => (
                          <SelectItem key={column.id} value={column.name}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Search term..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Sort by</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {tableColumns.map((column) => (
                          <SelectItem key={column.id} value={column.name}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Asc</SelectItem>
                        <SelectItem value="desc">Desc</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={applyFilters}>
                      <Filter className="h-4 w-4 mr-2" />
                      Apply
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading data...</span>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableColumns.map((column) => (
                          <TableHead key={column.id}>
                            <div className="flex items-center gap-2">
                              {column.name}
                              {column.primary && (
                                <Badge variant="outline" className="text-xs">PK</Badge>
                              )}
                              {column.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          {tableColumns.map((column) => (
                            <TableCell key={column.id}>
                              {column.type === "boolean" ? (
                                <Badge variant={row[column.name] ? "default" : "secondary"}>
                                  {row[column.name] ? "Yes" : "No"}
                                </Badge>
                              ) : column.type === "date" ? (
                                new Date(row[column.name]).toLocaleDateString()
                              ) : (
                                String(row[column.name] || "")
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingRow(row);
                                  setFormData(row);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRow(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} • {totalRows} total rows
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => {
                          const newPage = currentPage - 1;
                          setCurrentPage(newPage);
                          fetchRows(selectedTable.id, newPage, pageSize);
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          const newPage = currentPage + 1;
                          setCurrentPage(newPage);
                          fetchRows(selectedTable.id, newPage, pageSize);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Row Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Row</DialogTitle>
            <DialogDescription>
              Fill in the form to add a new row to {selectedTable?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {tableColumns
              .filter((column) => !column.primary)
              .map((column) => (
                <div key={column.id}>
                  <Label htmlFor={column.name}>
                    {column.name}
                    {column.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {column.type === "text" || column.type === "string" ? (
                    <Input
                      id={column.name}
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : column.type === "textarea" ? (
                    <Textarea
                      id={column.name}
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : column.type === "number" ? (
                    <Input
                      id={column.name}
                      type="number"
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : column.type === "boolean" ? (
                    <Select
                      value={formData[column.name]?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, [column.name]: value === "true" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : column.type === "date" ? (
                    <Input
                      id={column.name}
                      type="date"
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                    />
                  ) : (
                    <Input
                      id={column.name}
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  )}
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRow} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Row
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>
              Modify the row data in {selectedTable?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {tableColumns
              .filter((column) => !column.primary)
              .map((column) => (
                <div key={column.id}>
                  <Label htmlFor={`edit-${column.name}`}>
                    {column.name}
                    {column.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {column.type === "text" || column.type === "string" ? (
                    <Input
                      id={`edit-${column.name}`}
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : column.type === "textarea" ? (
                    <Textarea
                      id={`edit-${column.name}`}
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : column.type === "number" ? (
                    <Input
                      id={`edit-${column.name}`}
                      type="number"
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : column.type === "boolean" ? (
                    <Select
                      value={formData[column.name]?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, [column.name]: value === "true" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : column.type === "date" ? (
                    <Input
                      id={`edit-${column.name}`}
                      type="date"
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                    />
                  ) : (
                    <Input
                      id={`edit-${column.name}`}
                      value={formData[column.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [column.name]: e.target.value })
                      }
                      placeholder={`Enter ${column.name}`}
                    />
                  )}
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditingRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRow} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Row
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
