import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

const useSocket = () => {
  if (!globalSocket) {
    globalSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  return globalSocket;
};

export default useSocket;
