// Test copied from WebApp

import React from "react";
import { render, waitFor } from "@testing-library/react";
import { WebSocketProvider, useWebSocket } from "./WebSocketContext";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const mockAxios = new MockAdapter(axios);
let mockWebSocketInstance: { send: any; close: any; onclose: any };
let mockWebSocket: jest.Mock;

mockWebSocketInstance = {
  send: jest.fn(),
  close: jest.fn().mockImplementation(() => {
    mockWebSocketInstance.onclose();
  }),
  onclose: jest.fn(),
};
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
  useWebSocket();
  return <div>Context is available</div>;
};

describe("WebSocketProvider", () => {
  it("sends messages with the correct auth token", async () => {
    mockAxios
      .onPost("/api/chatConnection")
      .reply(200, { wsUrl: "wss://test.websocket.url" });

    render(
      <WebSocketProvider>
        <DummyComponent />
      </WebSocketProvider>,
    );

    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
    });
  });

  it("retries the websocket if connection failed", async () => {
    mockAxios
      .onPost("/api/chatConnection")
      .reply(200, { wsUrl: "wss://test.websocket.url" });

    render(
      <WebSocketProvider>
        <DummyComponent />
      </WebSocketProvider>,
    );

    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalledTimes(1);
    });

    expect(mockWebSocketInstance.close).toBeDefined();
    mockWebSocketInstance.close?.();
    await waitFor(
      () => {
        expect(mockWebSocket).toHaveBeenCalledTimes(2);
      },
      { timeout: 5000 },
    ); // have to give a longer timeout because of the retry
  });
});
