import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from 'jsonwebtoken';

export let io: Server;

const jwtSecret = process.env.JWT_SECRET as string;

const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';

const ADMIN_ROOM = 'admin_room';
const USER_ROOM_PREFIX = 'user_';
const AD_CHAT_PREFIX = 'ad_chat_';
const ADMIN_STATS_INTERVAL = 30000;
const MAX_BUFFER_SIZE = 1e6;
const MIN_TOKEN_LENGTH = 20;
const MAX_CONNECTIONS_PER_IP = 15;
const MAX_CONNECTIONS_PER_USER = 5;
const activeConnectionsPerIp = new Map<string, number>();
const activeConnectionsPerUser = new Map<number, number>();

interface DecodedToken {
  id: number;
  role?: string;
  [key: string]: any;
}

interface AuthenticatedSocket extends Socket {
  user: DecodedToken;
}

interface ChatMessage {
  content: string;
  recipient_id: number;
  [key: string]: any;
}

interface AdTypingData {
  ad_id: number;
  recipient_id: number;
  is_typing: boolean;
}

export function initSocket(httpServer: HttpServer): Server {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
  const allowedOrigins = [
    APP_URL,
    ...envOrigins
  ].filter(Boolean) as string[];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        try {
          const parsedUrl = new URL(origin);
          const hostname = parsedUrl.hostname;

          // Strict match to prevent localhost.attacker.com bypasses
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return callback(null, true);
          }

          // Strict suffix match on subdomains
          if (hostname.endsWith('.run.app') || hostname.endsWith('.aistudio.google')) {
            return callback(null, true);
          }
        } catch (err) {
          // Ignore invalid URLs
        }

        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"],
    allowUpgrades: true,
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: MAX_BUFFER_SIZE,
    serveClient: false,
    cookie: false
  });

  io.use((socket: Socket, next) => {
    try {
      const authSocket = socket as AuthenticatedSocket;
      const ip = authSocket.handshake.address || 'unknown';

      // Pre-check IP connection limit
      const ipCount = activeConnectionsPerIp.get(ip) || 0;
      if (ipCount >= MAX_CONNECTIONS_PER_IP) {
        return next(new Error('Too many active socket connections from this IP address'));
      }

      const token = authSocket.handshake.auth.token || 
                    authSocket.handshake.headers['authorization']?.split(' ')[1];
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (!token) {
        if (isProduction) {
          return next(new Error('Authentication token is required'));
        }
        return next();
      }

      if (typeof token !== 'string' || token.length < MIN_TOKEN_LENGTH) {
        if (isProduction) {
          return next(new Error('Invalid token format'));
        }
        return next();
      }

      jwt.verify(token, jwtSecret as string, { 
        algorithms: ['HS256'],
        maxAge: '24h'
      }, (err: any, decoded: any) => {
        if (err) {
          if (isProduction) {
            return next(new Error('Authentication failed: Invalid token'));
          }
          return next();
        }

        if (decoded && typeof decoded === 'object' && decoded.id) {
          const userId = decoded.id;
          // Pre-check User connection limit
          const userCount = activeConnectionsPerUser.get(userId) || 0;
          if (userCount >= MAX_CONNECTIONS_PER_USER) {
            return next(new Error('Too many active socket connections for this user account'));
          }

          authSocket.user = {
            id: userId,
            role: decoded.role || 'user',
            ...decoded
          };
        }
        next();
      });
    } catch (error) {
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const ip = authSocket.handshake.address || 'unknown';

    // Increment IP count
    const currentIpCount = activeConnectionsPerIp.get(ip) || 0;
    activeConnectionsPerIp.set(ip, currentIpCount + 1);

    const user = authSocket.user;
    if (user?.id) {
      // Increment User count
      const currentUserCount = activeConnectionsPerUser.get(user.id) || 0;
      activeConnectionsPerUser.set(user.id, currentUserCount + 1);
    }
    const userRoom = user?.id ? `${USER_ROOM_PREFIX}${user.id}` : '';
    
    if (user?.id) {
      socket.join(userRoom);

      if (user.role === 'admin') {
        socket.join(ADMIN_ROOM);
        broadcastAdminStatsOnce().catch(err => 
          console.error('[Socket] Initial admin stats failed:', err)
        );
      }
    }

    socket.on("register_user", (userId: number) => {
      if (typeof userId !== 'number') {
        return;
      }
      if (user && user.id && user.id !== userId) {
        console.warn(`[Socket] User ${user.id} attempted to register mismatch room ${userId}`);
        return;
      }
      socket.join(`${USER_ROOM_PREFIX}${userId}`);
    });

    socket.on("chat_message", async (data: ChatMessage) => {
      try {
        if (!data || typeof data !== 'object') {
          socket.emit('error', { message: 'Invalid message format' });
          return;
        }

        if (!data.content || typeof data.content !== 'string') {
          socket.emit('error', { message: 'Missing message content' });
          return;
        }

        const { handleChatMessage } = await import('../services/chat.js');
        await handleChatMessage(socket, { ...data, user });
      } catch (error) {
        console.error('[Socket] Chat error:', error);
        socket.emit('error', { 
          message: 'Failed to process message',
          ...(process.env.NODE_ENV === 'development' && { details: String(error) })
        });
      }
    });

    socket.on("typing", (data: any) => {
      try {
        if (!data || typeof data !== 'object') {
          return;
        }
        socket.to(userRoom).emit("typing", data);
      } catch (error) {
        console.error('[Socket] Typing error:', error);
      }
    });

    socket.on("ad_typing", (data: AdTypingData) => {
      try {
        if (!data || typeof data !== 'object') {
          return;
        }

        if (!data.recipient_id || typeof data.recipient_id !== 'number') {
          return;
        }

        if (!data.ad_id || typeof data.ad_id !== 'number') {
          return;
        }

        const recipientRoom = `${USER_ROOM_PREFIX}${data.recipient_id}`;
        io.to(recipientRoom).emit("ad_typing", {
          ad_id: data.ad_id,
          sender_id: user.id,
          is_typing: !!data.is_typing
        });
      } catch (error) {
        console.error('[Socket] Ad typing error:', error);
      }
    });

    socket.on("join_ad_chat", (adId: number) => {
      try {
        if (typeof adId !== 'number' || adId <= 0) {
          console.warn(`[Socket] User ${user.id} invalid ad chat join`);
          return;
        }
        socket.join(`${AD_CHAT_PREFIX}${adId}`);
      } catch (error) {
        console.error('[Socket] Join ad chat error:', error);
      }
    });

    socket.on("disconnect", () => {
      try {
        // Decrement IP count
        const ipCount = activeConnectionsPerIp.get(ip) || 0;
        if (ipCount <= 1) {
          activeConnectionsPerIp.delete(ip);
        } else {
          activeConnectionsPerIp.set(ip, ipCount - 1);
        }

        // Decrement User count
        if (user?.id) {
          const userCount = activeConnectionsPerUser.get(user.id) || 0;
          if (userCount <= 1) {
            activeConnectionsPerUser.delete(user.id);
          } else {
            activeConnectionsPerUser.set(user.id, userCount - 1);
          }
        }

        const rooms = Array.from(socket.rooms);
        for (const room of rooms) {
          if (room.startsWith(USER_ROOM_PREFIX) || room.startsWith(AD_CHAT_PREFIX)) {
            socket.leave(room);
          }
        }
      } catch (error) {
        console.error('[Socket] Disconnect error:', error);
      }
    });
  });

  const adminStatsInterval = setInterval(async () => {
    try {
      const adminRoom = io.sockets.adapter.rooms.get(ADMIN_ROOM);
      if (adminRoom && adminRoom.size > 0) {
        await broadcastAdminStats();
      }
    } catch (error) {
      console.error('[Socket] Periodic stats error:', error);
    }
  }, ADMIN_STATS_INTERVAL);

  return io;
}

async function broadcastAdminStats(): Promise<void> {
  try {
    const { broadcastAdminStats: broadcast } = await import('../services/admin.js');
    await broadcast();
  } catch (error) {
    console.error('[Socket] Admin stats broadcast error:', error);
    throw error;
  }
}

async function broadcastAdminStatsOnce(): Promise<void> {
  try {
    await broadcastAdminStats();
  } catch (error) {
    console.error('[Socket] Initial admin stats error:', error);
  }
}

export function closeSocket(): void {
  if (io) {
    io.close();
  }
}