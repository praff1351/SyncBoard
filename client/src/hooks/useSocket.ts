import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
    });
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};

export default useSocket;
