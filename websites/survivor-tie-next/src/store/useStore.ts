import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  openId: string;
  wechatName: string;
  avatar: string;
  gameId: string;
  gameNickname: string;
}

export interface Batch {
  id: string;
  date: string;
  time: string;
  targetScore: number;
  maxCapacity: number;
  currentCount: number;
  avatarUrl: string;
  qrCodeUrl: string;
  notice: string;
  status: 'active' | 'invalid';
}

export interface Booking {
  batchId: string;
  locked: boolean;
  status: 'booked' | 'invalid_unlocked';
  bookedAt: number;
}

export interface AppState {
  user: User | null;
  isAdmin: boolean;
  batches: Batch[];
  bookings: Record<string, Booking>;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  addBatch: (batch: Batch) => void;
  bookBatch: (openId: string, batchId: string) => void;
  unlockBooking: (openId: string) => void;
  markBatchInvalid: (batchId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      batches: [
        {
          id: 'batch-01',
          date: '2026-07-25',
          time: '01:05:00',
          targetScore: 106,
          maxCapacity: 200,
          currentCount: 184,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Group01',
          notice: '【01:05 冲刺班】统一更换为特工阿猫头像！打到 106 分即刻停手共享史诗配件。',
          status: 'active',
        },
        {
          id: 'batch-02',
          date: '2026-07-25',
          time: '08:05:00',
          targetScore: 106,
          maxCapacity: 200,
          currentCount: 42,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Group02',
          notice: '【08:05 上班族班】早晨发车，请各位玩家准时卡点！',
          status: 'active',
        },
      ],
      bookings: {},
      setUser: (user) => set({ user }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      addBatch: (batch) => set((state) => ({ batches: [batch, ...state.batches] })),
      bookBatch: (openId, batchId) =>
        set((state) => ({
          bookings: {
            ...state.bookings,
            [openId]: { batchId, locked: true, status: 'booked', bookedAt: Date.now() },
          },
          batches: state.batches.map((b) =>
            b.id === batchId ? { ...b, currentCount: b.currentCount + 1 } : b
          ),
        })),
      unlockBooking: (openId) =>
        set((state) => {
          const newBookings = { ...state.bookings };
          delete newBookings[openId];
          return { bookings: newBookings };
        }),
      markBatchInvalid: (batchId) =>
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === batchId ? { ...b, status: 'invalid' } : b
          ),
        })),
    }),
    { name: 'survivor-tie-next-store' }
  )
);
