import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingData {
  username: string
  email: string
  role: string
  businessLine: string
  workStyle: string
  scenario: string // 'work_problem' | 'career_development'
  specificQuestion: string // 根据场景询问的具体问题
}

interface OnboardingState {
  currentStep: number
  data: Partial<OnboardingData>
  setStep: (step: number) => void
  updateData: (key: keyof OnboardingData, value: string) => void
  resetData: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      data: {},
      setStep: (step) => set({ currentStep: step }),
      updateData: (key, value) =>
        set((state) => ({
          data: { ...state.data, [key]: value },
        })),
      resetData: () => set({ currentStep: 0, data: {} }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)

interface UserState {
  username: string | null
  userId: number | null
  setUser: (username: string, userId: number) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      userId: null,
      setUser: (username, userId) => set({ username, userId }),
      clearUser: () => set({ username: null, userId: null }),
    }),
    {
      name: 'user-storage',
    }
  )
)

interface SessionState {
  currentSessionId: number | null
  currentScenario: string | null
  setSession: (sessionId: number, scenario: string) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSessionId: null,
      currentScenario: null,
      setSession: (sessionId, scenario) =>
        set({ currentSessionId: sessionId, currentScenario: scenario }),
      clearSession: () => set({ currentSessionId: null, currentScenario: null }),
    }),
    {
      name: 'session-storage',
    }
  )
)
