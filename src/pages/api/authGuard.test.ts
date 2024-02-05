import { authGuard } from './authGuard';
import { getAuth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn().mockReturnValue({ userId: undefined }),
}));

describe('authGuard', () => {
  it('returns a 401 if there is no user', async () => {
    const mockFn = jest.fn();
    const mockReq = {} as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await authGuard(mockFn)(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('calls the function if there is a user', async () => {
    const mockFn = jest.fn();
    const mockReq = {} as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    (getAuth as jest.Mock).mockReturnValue({ userId: '123' });

    await authGuard(mockFn)(mockReq, mockRes);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes);
  });
});
