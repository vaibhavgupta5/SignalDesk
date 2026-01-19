import { io, Socket } from "socket.io-client";

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      {
        auth: { token },
        transports: ["websocket", "polling"],
      },
    );

    this.socket.on("connect", () => {
      console.log("Socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  joinGroup(groupId: string) {
    this.emit("join-group", { groupId });
  }

  leaveGroup(groupId: string) {
    this.emit("leave-group", { groupId });
  }

  sendMessage(groupId: string, message: any) {
    this.emit("send-message", { groupId, ...message });
  }

  sendTyping(groupId: string, isTyping: boolean) {
    this.emit("typing", { groupId, isTyping });
  }
}

export const socketClient = new SocketClient();
