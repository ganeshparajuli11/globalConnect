import React, { createContext, useContext, useEffect, useState } from "react";
import socket from "../socketManager/socket";
import { userAuth } from "../contexts/AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, authToken } = userAuth();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      // Optionally, include token in connection options if required by your server:
      socket.io.opts.query = authToken
      
      socket.connect();
      socket.emit("join", user._id);
      socket.emit("receiveMessageRequest", user._id);
      setSocketConnected(true);

      socket.on("connect_error", (err) => {
        console.error("Socket connect error:", err.message);
      });

      socket.on("reconnect", (attempt) => {
        console.log(`Reconnected on attempt ${attempt}`);
        socket.emit("join", user._id);
      });

      return () => {
        socket.off("connect_error");
        socket.off("reconnect");
        socket.disconnect();
        setSocketConnected(false);
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, socketConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
