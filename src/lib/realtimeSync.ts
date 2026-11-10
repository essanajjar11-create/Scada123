/**
 * Real-Time Synchronization Engine for SCADA Workstations
 * WebSockets + BroadcastChannel Dual Transport with Lockout & Presence Management
 */

import { UserRole, SwitchgearState, SOEEvent, AssetHealthDetails, OTSScenarioId, OTSReport, BessState, HvdcTelemetry, TransformerTelemetry } from '../types/scada';

/**
 * Authoritative live-telemetry frame. Exactly one workstation (the elected
 * simulation leader) produces these; every other client mirrors them so the
 * analog readings (A, kV, °C, MW ...) are identical on all screens.
 */
export interface TelemetrySyncSnapshot {
  tr1: TransformerTelemetry;
  tr2: TransformerTelemetry;
  bess: BessState;
  hvdc: HvdcTelemetry;
  sentAt: number;
}

export type SyncMessageType =
  | 'CONNECTED'
  | 'TELEMETRY_SYNC'
  | 'PRESENCE_HEARTBEAT'
  | 'SWITCH_OPERATION'
  | 'DEVICE_LOCK'
  | 'FAULT_INJECTION'
  | 'MAINTENANCE_TOGGLE'
  | 'TAP_CHANGE'
  | 'ALARM_ACK'
  | 'SETTINGS_UPDATE'
  | 'FULL_STATE_SYNC'
  | 'FAN_TOGGLE'
  | 'SOE_EVENT'
  | 'AHI_UPDATE'
  | 'OTS_SCENARIO'
  | 'BESS_UPDATE'
  | 'HVDC_UPDATE'
  | 'HVDC_SETPOINT';

export interface SyncMessagePayload {
  msgId?: string;
  type: SyncMessageType;
  senderWorkstationId: string;
  senderName: string;
  senderRole: UserRole;
  timestamp: number;

  // Specific payloads
  trId?: 'TR-1' | 'TR-2';
  switchKey?: keyof SwitchgearState;
  newState?: boolean;
  
  deviceKey?: string;
  lockExpiry?: number;

  faultType?: 'SLG' | 'OVER_TEMP' | 'BUCHHOLZ' | 'OPEN_CT' | 'CLEAR';
  maintenanceMode?: boolean;
  tapDirection?: 'UP' | 'DOWN';
  tapMode?: 'AUTO' | 'MANUAL';
  alarmId?: string;
  ackAll?: boolean;

  // Settings & manual overrides
  manualValues?: Record<string, number>;
  thresholds?: Record<string, number>;
  simMode?: 'AUTO' | 'MANUAL';
  scanRateMs?: number;
  primaryRatio?: number;
  resetEnergy?: boolean;

  // Fans
  fanKey?: string;

  // New Module Payloads
  soeEvent?: SOEEvent;
  ahiData?: AssetHealthDetails[];
  otsState?: {
    action: 'START' | 'STOP' | 'UPDATE' | 'COMPLETE';
    scenarioId?: OTSScenarioId;
    otsStatus?: 'idle' | 'running' | 'completed';
    otsReport?: OTSReport;
  };
  bessData?: Partial<BessState>;
  hvdcData?: Partial<HvdcTelemetry>;

  // Full state snapshot sync
  snapshot?: any;

  // Authoritative simulation telemetry
  telemetry?: TelemetrySyncSnapshot;
}

type MessageHandler = (msg: SyncMessagePayload) => void;

class RealtimeSyncManager {
  private workstationId: string;
  private userName: string = 'Grid Operator';
  private userRole: UserRole = 'operator';

  private broadcastChannel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private messageListeners: Set<MessageHandler> = new Set();
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // Deduplication tracking
  private processedMessageIds: Set<string> = new Set();
  private messageIdQueue: string[] = [];

  // Last state pushed by the server right after (re)connecting. Retained so a
  // late-mounting React tree can still seed itself instead of waiting a tick.
  private lastTelemetry: TelemetrySyncSnapshot | null = null;
  private lastSnapshot: any = null;

  constructor() {
    // Generate or retrieve persistent workstation ID. The random suffix keeps
    // colliding IDs (which would make two clients ignore each other and split
    // into two authoritative telemetry sources) practically impossible.
    const storedId = sessionStorage.getItem('scada_ws_id');
    if (storedId) {
      this.workstationId = storedId;
    } else {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
      this.workstationId = `WS-${randNum}-${suffix}`;
      sessionStorage.setItem('scada_ws_id', this.workstationId);
    }

    this.initBroadcastChannel();
    this.initWebSocket();
  }

  /** Latest authoritative telemetry frame seen from the simulation leader. */
  public getLastTelemetry(): TelemetrySyncSnapshot | null {
    return this.lastTelemetry;
  }

  /** Latest cached control snapshot pushed by the server on connect. */
  public getLastSnapshot(): any {
    return this.lastSnapshot;
  }

  public setIdentity(name: string, role: UserRole) {
    this.userName = name;
    this.userRole = role;
    this.broadcastPresence();
  }

  public getWorkstationId(): string {
    return this.workstationId;
  }

  public getUserName(): string {
    return this.userName;
  }

  public getUserRole(): UserRole {
    return this.userRole;
  }

  private handleIncomingMessage(data: SyncMessagePayload) {
    if (!data) return;

    // Server greeting carries the cached control snapshot and telemetry frame.
    if (data.type === 'CONNECTED') {
      if (data.snapshot) this.lastSnapshot = data.snapshot;
      if (data.telemetry) this.lastTelemetry = data.telemetry;
      this.notifyListeners(data);
      return;
    }

    if (data.type === 'TELEMETRY_SYNC' && data.telemetry) {
      this.lastTelemetry = data.telemetry;
    }

    if (data.senderWorkstationId === this.workstationId) return;

    if (data.msgId) {
      if (this.processedMessageIds.has(data.msgId)) {
        return; // Ignore duplicate message from dual transport or multiple tabs
      }
      this.processedMessageIds.add(data.msgId);
      this.messageIdQueue.push(data.msgId);
      if (this.messageIdQueue.length > 1000) {
        const oldId = this.messageIdQueue.shift();
        if (oldId) this.processedMessageIds.delete(oldId);
      }
    }

    this.notifyListeners(data);
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('scada_multi_user_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            this.handleIncomingMessage(event.data);
          }
        };
      } catch (e) {
        // BroadcastChannel optional fallback
      }
    }
  }

  private initWebSocket() {
    if (typeof window === 'undefined') return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Standalone mode: rely on BroadcastChannel for multi-tab sync
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.broadcastPresence();
      };

      this.socket.onmessage = (event) => {
        try {
          const data: SyncMessagePayload = JSON.parse(event.data);
          if (data) {
            this.handleIncomingMessage(data);
          }
        } catch (err) {
          // ignore non-JSON messages
        }
      };

      this.socket.onclose = () => {
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        if (this.socket) {
          try {
            this.socket.close();
          } catch {}
        }
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    const delay = Math.min(30000, 2000 * Math.pow(1.8, this.reconnectAttempts));
    this.reconnectTimer = setTimeout(() => {
      this.initWebSocket();
    }, delay);
  }

  public subscribe(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => {
      this.messageListeners.delete(handler);
    };
  }

  private notifyListeners(msg: SyncMessagePayload) {
    this.messageListeners.forEach((handler) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('Error in realtime message handler:', err);
      }
    });
  }

  public broadcast(payloadPartial: Omit<SyncMessagePayload, 'senderWorkstationId' | 'senderName' | 'senderRole' | 'timestamp' | 'msgId'>) {
    const msgId = `${this.workstationId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Mark as processed locally so we don't process if reflected back
    this.processedMessageIds.add(msgId);
    this.messageIdQueue.push(msgId);
    if (this.messageIdQueue.length > 1000) {
      const oldId = this.messageIdQueue.shift();
      if (oldId) this.processedMessageIds.delete(oldId);
    }

    const fullPayload: SyncMessagePayload = {
      ...payloadPartial,
      msgId,
      senderWorkstationId: this.workstationId,
      senderName: this.userName,
      senderRole: this.userRole,
      timestamp: Date.now(),
    };

    // Broadcast locally to other tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(fullPayload);
      } catch (e) {
        console.warn('BroadcastChannel postMessage error:', e);
      }
    }

    // Broadcast remotely via WebSocket server
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(fullPayload));
      } catch (e) {
        console.warn('WebSocket send error:', e);
      }
    }
  }

  public broadcastPresence() {
    this.broadcast({
      type: 'PRESENCE_HEARTBEAT',
    });
  }
}

export const realtimeSync = new RealtimeSyncManager();
