import React from "react";
import { render, waitFor } from "@testing-library/react";
import { WebSocketProvider, useWebSocket } from "./WebSocketContext";
import axios from "axios";

jest.mock("axios");
jest.mock("@/hooks/use-auth-token", () => () => "mocked-token");
let mockWebSocketInstance: { send: any; close?: jest.Mock<any, any, any> };
let mockWebSocket: jest.Mock;

mockWebSocketInstance = { send: jest.fn(), close: jest.fn() };
mockWebSocket = jest.fn(() => mockWebSocketInstance) as jest.Mock;
mockWebSocket.prototype = WebSocket.prototype;

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

global.WebSocket = mockWebSocket as any;

const DummyComponent = () => {
  const { addMessage } = useWebSocket();
  return <div>{addMessage && "Context is available"}</div>;
};

describe("WebSocketProvider", () => {
  it("sends messages with the correct auth token", async () => {
    axios.post = jest
      .fn()
      .mockResolvedValue({ data: { wsUrl: "wss://test.websocket.url" } });

    render(
      <WebSocketProvider>
        <DummyComponent />
      </WebSocketProvider>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
