import React from "react";
import { render, waitFor } from "@testing-library/react";
import { WebSocketProvider, useWebSocket } from "./WebSocketContext";
import axios from "axios";

// Mock modules
jest.mock("axios");
jest.mock("@/hooks/use-auth-token", () => () => "mocked-token");
let mockWebSocketInstance: { send: any; close?: jest.Mock<any, any, any> };
let mockWebSocket: jest.Mock;

// Mock WebSocket
mockWebSocketInstance = { send: jest.fn(), close: jest.fn() };
mockWebSocket = jest.fn(() => mockWebSocketInstance) as jest.Mock;
mockWebSocket.prototype = WebSocket.prototype;

// Bypass TypeScript's strict typing for static properties
Object.defineProperty(mockWebSocket, "CONNECTING", {
  value: 0,
  configurable: true,
});
Object.defineProperty(mockWebSocket, "OPEN", { value: 1, configurable: true });
Object.defineProperty(mockWebSocket, "CLOSING", {
  value: 2,
  configurable: true,
});
Object.defineProperty(mockWebSocket, "CLOSED", {
  value: 3,
  configurable: true,
});

// Bypass TypeScript's type checking
global.WebSocket = mockWebSocket as any;

// Dummy child component to access the context
const DummyComponent = () => {
  const { addMessage } = useWebSocket();
  return <div>{addMessage && "Context is available"}</div>;
};

describe("WebSocketProvider", () => {
  it("sends messages with the correct auth token", async () => {
    // Mock the axios post call
    axios.post = jest
      .fn()
      .mockResolvedValue({ data: { wsUrl: "wss://test.websocket.url" } });

    // Render the WebSocketProvider with the DummyComponent as a child
    render(
      <WebSocketProvider>
        <DummyComponent />
      </WebSocketProvider>
    );

    // Wait for the async code to execute
    await waitFor(() => {
      // Check if axios was called with the correct config, especially the Auth-Token
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Auth-Token": "mocked-token",
          }),
        })
      );
    });
  });
});
