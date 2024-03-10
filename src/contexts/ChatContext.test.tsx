import React, { useEffect } from 'react';
import axios from 'axios';
import { render, waitFor, screen } from '@testing-library/react';
import {
  ChatProvider, useChatProvider,
  IntermediateHistoricalMessage
} from './ChatContext';


describe('ChatContext', () => {
  it('fetches for history and converts to the right representation', async () => {
    const DummyComponentFetchHistory = () => {
      const { messages, fetchHistory } = useChatProvider();
      fetchHistory("mocked-conversation-id");
      return messages.length > 0 ? <p>done</p> : null
    };

    axios.get = jest
      .fn()
      .mockResolvedValue({
        data: {
          messages: [
            {
              message: "mocked-message",
              conversationId: 1,
              sentAt: 1,
              isImage: false,
              index: "mocked-index",
              sender: "bot",
            } as IntermediateHistoricalMessage,
          ],
        }
      });

    render(
      <ChatProvider>
        <DummyComponentFetchHistory />
      </ChatProvider >
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/chatHistory") &&
        expect.stringContaining("mocked-conversation-id"),
      );

      expect(screen.getByText("done")).toBeInTheDocument();
    });
  });

  it('has a size more than 1 after adding 2 new messages', async () => {
    const DummyComponentAddMessage = () => {
      const { messages, addMessage } = useChatProvider();
      useEffect(() => {
        addMessage({
          id: "mocked-id",
          username: "mocked-username",
          message: "mocked-message",
          isImage: false,
          sentAt: 1,
        });

        addMessage({
          id: "mocked-id-2",
          username: "mocked-username",
          message: "mocked-message-2",
          isImage: false,
          sentAt: 2,
        })
      }, [addMessage]);

      return messages.length > 0 ? <p>done</p> : null;
    };

    render(
      <ChatProvider>
        <DummyComponentAddMessage />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("done")).toBeInTheDocument();
    });
  })
});
