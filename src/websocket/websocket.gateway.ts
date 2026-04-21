import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { getRequiredEnv } from '../config/env.validation';

export enum WsEvent {
  // Menu events
  MENU_UPDATED = 'menu:updated',
  MENU_ITEM_CREATED = 'menu:item:created',
  MENU_ITEM_UPDATED = 'menu:item:updated',
  MENU_ITEM_DELETED = 'menu:item:deleted',
  MENU_CATEGORY_UPDATED = 'menu:category:updated',
  PRIMARY_CATEGORY_UPDATED = 'menu:primaryCategory:updated',

  // Specials events
  SPECIAL_CREATED = 'special:created',
  SPECIAL_UPDATED = 'special:updated',
  SPECIAL_DELETED = 'special:deleted',

  // Events events
  EVENT_CREATED = 'event:created',
  EVENT_UPDATED = 'event:updated',
  EVENT_DELETED = 'event:deleted',

  // Announcements events
  ANNOUNCEMENT_CREATED = 'announcement:created',
  ANNOUNCEMENT_UPDATED = 'announcement:updated',
  ANNOUNCEMENT_DELETED = 'announcement:deleted',

  // Opening hours events
  OPENING_HOURS_UPDATED = 'openingHours:updated',

  // Todo events
  TODO_CREATED = 'todo:created',
  TODO_UPDATED = 'todo:updated',
  TODO_DELETED = 'todo:deleted',

  // Story events
  STORY_UPDATED = 'story:updated',

  // Party menu events
  PARTY_MENU_UPDATED = 'partyMenu:updated',

  // Family meals events
  FAMILY_MEAL_UPDATED = 'familyMeal:updated',

  // User events
  USER_UPDATED = 'user:updated',

  // Newsletter events
  NEWSLETTER_UPDATED = 'newsletter:updated',

  // Notification events
  NOTIFICATION_SENT = 'notification:sent',

  // Dashboard events
  DASHBOARD_REFRESH = 'dashboard:refresh',

  // Site images events
  SITE_IMAGES_UPDATED = 'siteImages:updated',
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = getRequiredEnv('CORS_ORIGINS')
        .split(',')
        .map((o) => o.trim());
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  namespace: '/',
})
export class AppWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private connectedClients = new Map<
    string,
    { userId?: string; role?: string; type: 'admin' | 'public' }
  >();

  constructor(private jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Try to authenticate via cookie or auth header
      const token = this.extractToken(client);
      const clientType = (client.handshake.query?.type as string) || 'public';

      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: getRequiredEnv('JWT_SECRET'),
        });
        this.connectedClients.set(client.id, {
          userId: payload.sub,
          role: payload.role,
          type: clientType as 'admin' | 'public',
        });

        // Join role-based rooms for targeted events
        client.join('authenticated');
        client.join(`role:${payload.role}`);
        client.join(`user:${payload.sub}`);

        this.logger.log(
          `Authenticated client connected: ${client.id} (${payload.email}, ${clientType})`,
        );
      } else {
        // Public (unauthenticated) connections - allowed for frontend
        this.connectedClients.set(client.id, { type: 'public' });
        client.join('public');
        this.logger.log(`Public client connected: ${client.id}`);
      }
    } catch {
      // Invalid token - treat as public client
      this.connectedClients.set(client.id, { type: 'public' });
      client.join('public');
      this.logger.debug(`Client connected without valid auth: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);
    this.logger.log(
      `Client disconnected: ${client.id} (${clientInfo?.type || 'unknown'})`,
    );
  }

  /**
   * Emit an event to all connected clients (admin + public)
   */
  emitToAll(event: WsEvent, data: any) {
    if (!this.server) return;
    this.server.emit(event, data);
  }

  /**
   * Emit an event only to authenticated admin clients
   */
  emitToAdmins(event: WsEvent, data: any) {
    if (!this.server) return;
    this.server.to('authenticated').emit(event, data);
  }

  /**
   * Emit an event only to public (frontend) clients
   */
  emitToPublic(event: WsEvent, data: any) {
    if (!this.server) return;
    this.server.to('public').emit(event, data);
  }

  /**
   * Emit an event to a specific user
   */
  emitToUser(userId: string, event: WsEvent, data: any) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Get the count of connected clients
   */
  getConnectedCount(): { total: number; admin: number; public: number } {
    let admin = 0;
    let publicCount = 0;
    this.connectedClients.forEach((info) => {
      if (info.type === 'admin') admin++;
      else publicCount++;
    });
    return { total: this.connectedClients.size, admin, public: publicCount };
  }

  private extractToken(client: Socket): string | null {
    // Try cookie first
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const tokenCookie = cookies
        .split(';')
        .find((c) => c.trim().startsWith('access_token='));
      if (tokenCookie) {
        return tokenCookie.split('=')[1]?.trim() || null;
      }
    }

    // Try auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Try query param (for initial connection)
    const queryToken = client.handshake.auth?.token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }
}
