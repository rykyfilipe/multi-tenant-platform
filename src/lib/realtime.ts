export type MessageHandler<T = any> = (data: T) => void

export interface DashboardUpdate {
  type: 'widget_created' | 'widget_updated' | 'widget_deleted' | 'dashboard_updated';
  dashboardId: number;
  widgetId?: number;
  data: any;
  timestamp: string;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
  isConnected: boolean;
  reconnect: () => void;
}

export interface RealtimeOptions {
  onUpdate?: (update: DashboardUpdate) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function subscribeSSE(url: string, onMessage: MessageHandler, onError?: (err: any) => void) {
	const es = new EventSource(url)
	es.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data)
			onMessage(data)
		} catch (e) {
			onError?.(e)
		}
	}
	es.onerror = (e) => {
		onError?.(e)
	}
	return () => es.close()
}

class RealtimeManager {
  private subscriptions = new Map<number, RealtimeSubscription>();
  private reconnectAttempts = new Map<number, number>();
  private reconnectTimers = new Map<number, NodeJS.Timeout>();

  subscribeToDashboardUpdates(
    dashboardId: number,
    options: RealtimeOptions = {}
  ): RealtimeSubscription {
    const {
      onUpdate = () => {},
      onError = () => {},
      onConnect = () => {},
      onDisconnect = () => {},
      reconnectInterval = 5000,
      maxReconnectAttempts = 5
    } = options;

    let eventSource: EventSource | null = null;
    let isConnected = false;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`/api/dashboards/${dashboardId}/events`);
      
      eventSource.onopen = () => {
        isConnected = true;
        this.reconnectAttempts.set(dashboardId, 0);
        onConnect();
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as DashboardUpdate;
          onUpdate(data);
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        isConnected = false;
        onError(error);
        onDisconnect();
        
        // Attempt reconnection
        const attempts = this.reconnectAttempts.get(dashboardId) || 0;
        if (attempts < maxReconnectAttempts) {
          this.reconnectAttempts.set(dashboardId, attempts + 1);
          reconnectTimer = setTimeout(() => {
            connect();
          }, reconnectInterval);
          this.reconnectTimers.set(dashboardId, reconnectTimer);
        }
      };
    };

    const reconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      connect();
    };

    const unsubscribe = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      this.subscriptions.delete(dashboardId);
      this.reconnectAttempts.delete(dashboardId);
      this.reconnectTimers.delete(dashboardId);
    };

    // Start connection
    connect();

    const subscription: RealtimeSubscription = {
      unsubscribe,
      get isConnected() { return isConnected; },
      reconnect
    };

    this.subscriptions.set(dashboardId, subscription);
    return subscription;
  }

  unsubscribeFromDashboard(dashboardId: number) {
    const subscription = this.subscriptions.get(dashboardId);
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
    this.reconnectTimers.forEach(timer => clearTimeout(timer));
    this.reconnectTimers.clear();
  }
}

export const realtimeManager = new RealtimeManager();

// Convenience function for backward compatibility
export function subscribeToDashboardUpdates(
  dashboardId: number,
  onUpdate: (data: any) => void
): RealtimeSubscription {
  return realtimeManager.subscribeToDashboardUpdates(dashboardId, {
    onUpdate: (update) => onUpdate(update.data)
  });
}
