export interface ThemePreset {
  name: string;
  description: string;
  category: 'modern' | 'classic' | 'minimal' | 'dark';
  chart: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: { x: number; y: number };
    shadow: {
      enabled: boolean;
      size: 'sm' | 'md' | 'lg' | 'xl';
      color: string;
    };
    backgroundGradient: {
      enabled: boolean;
      from: string;
      to: string;
      direction: 'to-r' | 'to-b' | 'to-br';
    };
    line: {
      color: string;
      width: number;
      strokeDasharray?: string;
    };
    grid: {
      enabled: boolean;
      color: string;
      opacity: number;
    };
    axes: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium' | 'semibold';
    };
  };
  table: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: number;
    padding: { x: number; y: number };
    shadow: {
      enabled: boolean;
      size: 'sm' | 'md' | 'lg' | 'xl';
      color: string;
    };
    header: {
      backgroundColor: string;
      textColor: string;
      fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
      fontSize: number;
    };
    row: {
      hoverColor: string;
      evenColor: string;
      oddColor: string;
    };
  };
  kpi: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: number;
    padding: { x: number; y: number };
    shadow: {
      enabled: boolean;
      size: 'sm' | 'md' | 'lg' | 'xl';
      color: string;
    };
    value: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    };
    label: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium';
    };
    trend: {
      positiveColor: string;
      negativeColor: string;
    };
  };
  clock: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: number;
    padding: { x: number; y: number };
    shadow: {
      enabled: boolean;
      size: 'sm' | 'md' | 'lg' | 'xl';
      color: string;
    };
    time: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    };
    date: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium';
    };
  };
  weather: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: number;
    padding: { x: number; y: number };
    shadow: {
      enabled: boolean;
      size: 'sm' | 'md' | 'lg' | 'xl';
      color: string;
    };
    temperature: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    };
    location: {
      color: string;
      fontSize: number;
      fontWeight: 'normal' | 'medium';
    };
  };
  tasks: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: number;
    padding: { x: number; y: number };
    shadow: {
      enabled: boolean;
      size: 'sm' | 'md' | 'lg' | 'xl';
      color: string;
    };
    taskCard: {
      backgroundColor: string;
      borderColor: string;
      borderRadius: number;
      padding: { x: number; y: number };
    };
    priority: {
      high: string;
      medium: string;
      low: string;
    };
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Dark Modern",
    description: "Elegant dark theme with clean shadows and modern typography",
    category: "dark",
    chart: {
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      borderColor: "#333333",
      borderWidth: 1,
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.4)" },
      backgroundGradient: { enabled: false, from: "#1a1a1a", to: "#2a2a2a", direction: "to-br" },
      line: { color: "#10b981", width: 3 },
      grid: { enabled: true, color: "#333333", opacity: 0.3 },
      axes: { color: "#9ca3af", fontSize: 12, fontWeight: "medium" }
    },
    table: {
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      borderColor: "#333333",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.4)" },
      header: { backgroundColor: "#2a2a2a", textColor: "#ffffff", fontWeight: "semibold", fontSize: 14 },
      row: { hoverColor: "#2a2a2a", evenColor: "#1f1f1f", oddColor: "#1a1a1a" }
    },
    kpi: {
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      borderColor: "#333333",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.4)" },
      value: { color: "#ffffff", fontSize: 32, fontWeight: "bold" },
      label: { color: "#9ca3af", fontSize: 14, fontWeight: "medium" },
      trend: { positiveColor: "#10b981", negativeColor: "#ef4444" }
    },
    clock: {
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      borderColor: "#333333",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.4)" },
      time: { color: "#ffffff", fontSize: 36, fontWeight: "bold" },
      date: { color: "#9ca3af", fontSize: 16, fontWeight: "medium" }
    },
    weather: {
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      borderColor: "#333333",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.4)" },
      temperature: { color: "#ffffff", fontSize: 32, fontWeight: "bold" },
      location: { color: "#9ca3af", fontSize: 14, fontWeight: "medium" }
    },
    tasks: {
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      borderColor: "#333333",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.4)" },
      taskCard: { backgroundColor: "#2a2a2a", borderColor: "#404040", borderRadius: 8, padding: { x: 16, y: 12 } },
      priority: { high: "#ef4444", medium: "#f59e0b", low: "#10b981" }
    }
  },
  {
    name: "Light Clean",
    description: "Minimal light theme with subtle shadows and clean typography",
    category: "minimal",
    chart: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
      backgroundGradient: { enabled: false, from: "#ffffff", to: "#f9fafb", direction: "to-br" },
      line: { color: "#3b82f6", width: 3 },
      grid: { enabled: true, color: "#e5e7eb", opacity: 0.5 },
      axes: { color: "#6b7280", fontSize: 12, fontWeight: "medium" }
    },
    table: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderColor: "#e5e7eb",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
      header: { backgroundColor: "#f9fafb", textColor: "#111827", fontWeight: "semibold", fontSize: 14 },
      row: { hoverColor: "#f9fafb", evenColor: "#ffffff", oddColor: "#f9fafb" }
    },
    kpi: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderColor: "#e5e7eb",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
      value: { color: "#111827", fontSize: 32, fontWeight: "bold" },
      label: { color: "#6b7280", fontSize: 14, fontWeight: "medium" },
      trend: { positiveColor: "#10b981", negativeColor: "#ef4444" }
    },
    clock: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderColor: "#e5e7eb",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
      time: { color: "#111827", fontSize: 36, fontWeight: "bold" },
      date: { color: "#6b7280", fontSize: 16, fontWeight: "medium" }
    },
    weather: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderColor: "#e5e7eb",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
      temperature: { color: "#111827", fontSize: 32, fontWeight: "bold" },
      location: { color: "#6b7280", fontSize: 14, fontWeight: "medium" }
    },
    tasks: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderColor: "#e5e7eb",
      borderRadius: 12,
      padding: { x: 24, y: 20 },
      shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
      taskCard: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb", borderRadius: 8, padding: { x: 16, y: 12 } },
      priority: { high: "#ef4444", medium: "#f59e0b", low: "#10b981" }
    }
  },
  {
    name: "Blue Gradient",
    description: "Modern blue gradient theme with elegant shadows",
    category: "modern",
    chart: {
      backgroundColor: "#1e3a8a",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      borderWidth: 1,
      borderRadius: 16,
      padding: { x: 28, y: 24 },
      shadow: { enabled: true, size: "xl", color: "rgba(59, 130, 246, 0.3)" },
      backgroundGradient: { enabled: true, from: "#1e3a8a", to: "#3b82f6", direction: "to-br" },
      line: { color: "#fbbf24", width: 4 },
      grid: { enabled: true, color: "#3b82f6", opacity: 0.2 },
      axes: { color: "#93c5fd", fontSize: 13, fontWeight: "semibold" }
    },
    table: {
      backgroundColor: "#1e3a8a",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      borderRadius: 16,
      padding: { x: 28, y: 24 },
      shadow: { enabled: true, size: "xl", color: "rgba(59, 130, 246, 0.3)" },
      header: { backgroundColor: "#1e40af", textColor: "#ffffff", fontWeight: "bold", fontSize: 15 },
      row: { hoverColor: "#1e40af", evenColor: "#1e3a8a", oddColor: "#1d4ed8" }
    },
    kpi: {
      backgroundColor: "#1e3a8a",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      borderRadius: 16,
      padding: { x: 28, y: 24 },
      shadow: { enabled: true, size: "xl", color: "rgba(59, 130, 246, 0.3)" },
      value: { color: "#fbbf24", fontSize: 36, fontWeight: "bold" },
      label: { color: "#93c5fd", fontSize: 15, fontWeight: "medium" },
      trend: { positiveColor: "#10b981", negativeColor: "#f87171" }
    },
    clock: {
      backgroundColor: "#1e3a8a",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      borderRadius: 16,
      padding: { x: 28, y: 24 },
      shadow: { enabled: true, size: "xl", color: "rgba(59, 130, 246, 0.3)" },
      time: { color: "#fbbf24", fontSize: 40, fontWeight: "bold" },
      date: { color: "#93c5fd", fontSize: 18, fontWeight: "medium" }
    },
    weather: {
      backgroundColor: "#1e3a8a",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      borderRadius: 16,
      padding: { x: 28, y: 24 },
      shadow: { enabled: true, size: "xl", color: "rgba(59, 130, 246, 0.3)" },
      temperature: { color: "#fbbf24", fontSize: 36, fontWeight: "bold" },
      location: { color: "#93c5fd", fontSize: 15, fontWeight: "medium" }
    },
    tasks: {
      backgroundColor: "#1e3a8a",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      borderRadius: 16,
      padding: { x: 28, y: 24 },
      shadow: { enabled: true, size: "xl", color: "rgba(59, 130, 246, 0.3)" },
      taskCard: { backgroundColor: "#1e40af", borderColor: "#3b82f6", borderRadius: 10, padding: { x: 18, y: 14 } },
      priority: { high: "#f87171", medium: "#fbbf24", low: "#10b981" }
    }
  },
  {
    name: "Green Success",
    description: "Fresh green theme with success-focused colors",
    category: "modern",
    chart: {
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      borderColor: "#10b981",
      borderWidth: 1,
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      shadow: { enabled: true, size: "lg", color: "rgba(16, 185, 129, 0.2)" },
      backgroundGradient: { enabled: true, from: "#064e3b", to: "#10b981", direction: "to-br" },
      line: { color: "#ffffff", width: 3 },
      grid: { enabled: true, color: "#10b981", opacity: 0.25 },
      axes: { color: "#6ee7b7", fontSize: 12, fontWeight: "medium" }
    },
    table: {
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      borderColor: "#10b981",
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      shadow: { enabled: true, size: "lg", color: "rgba(16, 185, 129, 0.2)" },
      header: { backgroundColor: "#065f46", textColor: "#ffffff", fontWeight: "semibold", fontSize: 14 },
      row: { hoverColor: "#065f46", evenColor: "#064e3b", oddColor: "#047857" }
    },
    kpi: {
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      borderColor: "#10b981",
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      shadow: { enabled: true, size: "lg", color: "rgba(16, 185, 129, 0.2)" },
      value: { color: "#ffffff", fontSize: 34, fontWeight: "bold" },
      label: { color: "#6ee7b7", fontSize: 14, fontWeight: "medium" },
      trend: { positiveColor: "#ffffff", negativeColor: "#f87171" }
    },
    clock: {
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      borderColor: "#10b981",
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      shadow: { enabled: true, size: "lg", color: "rgba(16, 185, 129, 0.2)" },
      time: { color: "#ffffff", fontSize: 38, fontWeight: "bold" },
      date: { color: "#6ee7b7", fontSize: 17, fontWeight: "medium" }
    },
    weather: {
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      borderColor: "#10b981",
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      shadow: { enabled: true, size: "lg", color: "rgba(16, 185, 129, 0.2)" },
      temperature: { color: "#ffffff", fontSize: 34, fontWeight: "bold" },
      location: { color: "#6ee7b7", fontSize: 14, fontWeight: "medium" }
    },
    tasks: {
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      borderColor: "#10b981",
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      shadow: { enabled: true, size: "lg", color: "rgba(16, 185, 129, 0.2)" },
      taskCard: { backgroundColor: "#065f46", borderColor: "#10b981", borderRadius: 9, padding: { x: 17, y: 13 } },
      priority: { high: "#f87171", medium: "#fbbf24", low: "#ffffff" }
    }
  },
  {
    name: "Classic Gray",
    description: "Professional gray theme for business applications",
    category: "classic",
    chart: {
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderWidth: 1,
      borderRadius: 8,
      padding: { x: 20, y: 16 },
      shadow: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
      backgroundGradient: { enabled: false, from: "#f8fafc", to: "#f1f5f9", direction: "to-br" },
      line: { color: "#475569", width: 2 },
      grid: { enabled: true, color: "#cbd5e1", opacity: 0.6 },
      axes: { color: "#64748b", fontSize: 11, fontWeight: "normal" }
    },
    table: {
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderRadius: 8,
      padding: { x: 20, y: 16 },
      shadow: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
      header: { backgroundColor: "#f1f5f9", textColor: "#1e293b", fontWeight: "medium", fontSize: 13 },
      row: { hoverColor: "#f1f5f9", evenColor: "#f8fafc", oddColor: "#f1f5f9" }
    },
    kpi: {
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderRadius: 8,
      padding: { x: 20, y: 16 },
      shadow: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
      value: { color: "#1e293b", fontSize: 28, fontWeight: "semibold" },
      label: { color: "#64748b", fontSize: 13, fontWeight: "normal" },
      trend: { positiveColor: "#059669", negativeColor: "#dc2626" }
    },
    clock: {
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderRadius: 8,
      padding: { x: 20, y: 16 },
      shadow: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
      time: { color: "#1e293b", fontSize: 32, fontWeight: "semibold" },
      date: { color: "#64748b", fontSize: 15, fontWeight: "normal" }
    },
    weather: {
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderRadius: 8,
      padding: { x: 20, y: 16 },
      shadow: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
      temperature: { color: "#1e293b", fontSize: 28, fontWeight: "semibold" },
      location: { color: "#64748b", fontSize: 13, fontWeight: "normal" }
    },
    tasks: {
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderRadius: 8,
      padding: { x: 20, y: 16 },
      shadow: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
      taskCard: { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1", borderRadius: 6, padding: { x: 14, y: 10 } },
      priority: { high: "#dc2626", medium: "#d97706", low: "#059669" }
    }
  }
];

export const getThemeByName = (name: string): ThemePreset | undefined => {
  return THEME_PRESETS.find(theme => theme.name === name);
};

export const getThemesByCategory = (category: ThemePreset['category']): ThemePreset[] => {
  return THEME_PRESETS.filter(theme => theme.category === category);
};
