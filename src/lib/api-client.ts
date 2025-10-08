export interface ApiResult<T> { 
	data: T; 
	error?: string;
	success?: boolean;
	message?: string;
}

export interface CreateDashboardData {
	name: string;
	description?: string;
	mode?: 'view' | 'edit';
	isPublic?: boolean;
	isDefault?: boolean;
}

export interface UpdateDashboardData {
	name?: string;
	description?: string;
	mode?: 'view' | 'edit';
	isPublic?: boolean;
	isDefault?: boolean;
}

export interface CreateWidgetData {
	type: string;
	title?: string;
	position: { x: number; y: number; width: number; height: number };
	config: Record<string, any>;
	isVisible?: boolean;
	order?: number;
}

export interface UpdateWidgetData {
	type?: string;
	title?: string;
	position?: { x: number; y: number; width: number; height: number };
	config?: Record<string, any>;
	isVisible?: boolean;
	order?: number;
}

export interface FilterData {
	id: string;
	columnId: number;
	columnName: string;
	columnType: string;
	operator: string;
	value: any;
	secondValue?: any;
}

export interface QueryData {
	filters?: FilterData[];
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
	try {
		const res = await fetch(url, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...(init?.headers || {}),
			},
		})
		if (!res.ok) {
			const text = await res.text()
			return { 
				data: undefined as unknown as T, 
				error: `${res.status} ${res.statusText}: ${text}`,
				success: false
			}
		}
		const json = await res.json()
		return { 
			data: json.data || json, 
			success: true,
			message: json.message
		}
	} catch (e) {
		return { 
			data: undefined as unknown as T, 
			error: e instanceof Error ? e.message : 'Network error',
			success: false
		}
	}
}

export const api = {
	dashboards: {
		list: () => request<any[]>('/api/dashboards'),
		create: (payload: CreateDashboardData) => request<any>('/api/dashboards', { method: 'POST', body: JSON.stringify(payload) }),
		get: (id: number) => request<any>(`/api/dashboards/${id}`),
		update: (id: number, payload: UpdateDashboardData) => request<any>(`/api/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
		remove: (id: number) => request<void>(`/api/dashboards/${id}`, { method: 'DELETE' }),
	},
	widgets: {
		list: (dashboardId: number) => request<any[]>(`/api/dashboards/${dashboardId}/widgets`),
		create: (dashboardId: number, payload: CreateWidgetData) => request<any>(`/api/dashboards/${dashboardId}/widgets`, { method: 'POST', body: JSON.stringify(payload) }),
		get: (dashboardId: number, widgetId: number) => request<any>(`/api/dashboards/${dashboardId}/widgets/${widgetId}`),
		update: (dashboardId: number, widgetId: number, payload: UpdateWidgetData) => request<any>(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'PUT', body: JSON.stringify(payload) }),
		remove: (dashboardId: number, widgetId: number) => request<void>(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'DELETE' }),
		batchUpdate: (dashboardId: number, updates: Array<{ id: number; data: UpdateWidgetData }>) => request<any[]>(`/api/dashboards/${dashboardId}/widgets/batch`, { method: 'PUT', body: JSON.stringify({ updates }) }),
	},
	tables: {
		list: (tenantId: number, databaseId: number, includePredefined: boolean = false) => {
			const searchParams = new URLSearchParams();
			searchParams.set('includePredefined', String(includePredefined));
			return request<any[]>(`/api/tenants/${tenantId}/databases/${databaseId}/tables?${searchParams.toString()}`);
		},
		rows: (tenantId: number, databaseId: number, tableId: number, query?: QueryData) => {
			const searchParams = new URLSearchParams();
			if (query) {
				if (query.filters) searchParams.set('filters', JSON.stringify(query.filters));
				if (query.search) searchParams.set('search', query.search);
				if (query.sortBy) searchParams.set('sortBy', query.sortBy);
				if (query.sortOrder) searchParams.set('sortOrder', query.sortOrder);
				if (query.page) searchParams.set('page', query.page.toString());
				if (query.limit) searchParams.set('limit', query.limit.toString());
			}
			const queryString = searchParams.toString();
			const endpoint = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows${queryString ? `?${queryString}` : ''}`;
			return request<any>(endpoint);
		},
		getAllRows: async (tenantId: number, databaseId: number, tableId: number, query?: QueryData) => {
			const allRows: any[] = [];
			let page = 1;
			const pageSize = 1000; // Large page size to minimize requests
			let hasMoreData = true;

			while (hasMoreData) {
				const searchParams = new URLSearchParams();
				searchParams.set('page', page.toString());
				searchParams.set('pageSize', pageSize.toString());
				searchParams.set('includeCells', 'true');
				
				if (query) {
					if (query.filters) searchParams.set('filters', JSON.stringify(query.filters));
					if (query.search) searchParams.set('search', query.search);
					if (query.sortBy) searchParams.set('sortBy', query.sortBy);
					if (query.sortOrder) searchParams.set('sortOrder', query.sortOrder);
				}

				const queryString = searchParams.toString();
				const endpoint = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows?${queryString}`;
				
				const response = await fetch(endpoint, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				
				if (data.success && data.data) {
					allRows.push(...data.data);
					hasMoreData = data.data.length === pageSize;
					page++;
				} else {
					hasMoreData = false;
				}
			}

			return { success: true, data: allRows };
		},
		columns: (tenantId: number, databaseId: number, tableId: number) => request<any[]>(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/columns`),
	},
	databases: {
		list: (tenantId: number, includePredefined: boolean = false) => {
			const searchParams = new URLSearchParams();
			searchParams.set('includePredefined', String(includePredefined));
			return request<any[]>(`/api/tenants/${tenantId}/databases?${searchParams.toString()}`);
		},
		allTables: (tenantId: number, includePredefined: boolean = false) => {
			const searchParams = new URLSearchParams();
			searchParams.set('includePredefined', String(includePredefined));
			return request<any[]>(`/api/tenants/${tenantId}/databases/tables?${searchParams.toString()}`);
		},
	},
	health: () => request<{ status: string; timestamp: string }>('/api/health'),
}
