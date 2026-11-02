import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent, fetchSpots } from '../api/client'

const NEED_DB = 'Supabase 설정(.env.local)이 필요해요'
const SOURCE = 'doldam' // favorites 테이블에서 돌담 수첩 기록을 구분하는 값

// 여러 페이지가 함께 쓰는 상태: 닉네임, 알림, 돌담 명소·종류, 선택 명소, 돌담 수첩(Supabase), 에이전트 대화
export const useAppStore = create(
  persist(
    (set, get) => ({
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),
      me: () => get().nickname || '익명',

      toasts: [],
      toast: (message, variant = 'success') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2500)
      },

      // 돌담 명소·종류 (지도, 목록, 상세 화면이 같이 쓴다)
      spots: [],
      kinds: [],
      spotsLoading: false,
      spotsError: '',
      loadSpots: async () => {
        if (get().spots.length || get().spotsLoading) return
        set({ spotsLoading: true, spotsError: '' })
        try {
          const { spots, kinds } = await fetchSpots()
          set({ spots, kinds, spotsLoading: false })
        } catch (e) { set({ spotsLoading: false, spotsError: e.message }) }
      },

      // 돌담 수첩 — Supabase favorites 테이블 (source = 'doldam')
      favorites: [],
      favLoading: false,
      loadFavorites: async () => {
        if (!supabase) return get().toast(NEED_DB, 'warning')
        set({ favLoading: true })
        const { data, error } = await supabase.from('favorites').select('*')
          .eq('nickname', get().me()).eq('source', SOURCE).order('created_at', { ascending: false })
        set({ favLoading: false })
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: data })
      },
      stamp: async (spot) => {
        if (!supabase) return get().toast(NEED_DB, 'warning')
        if (get().favorites.some((f) => f.item_id === spot.id)) return get().toast('이미 도장을 찍은 곳이에요', 'info')
        const { data, error } = await supabase.from('favorites')
          .insert({ nickname: get().me(), source: SOURCE, item_id: spot.id, title: spot.name }).select().single()
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: [data, ...get().favorites] })
        get().toast('돌담 도장을 찍었어요')
      },
      removeFavorite: async (id) => {
        if (!supabase) return get().toast(NEED_DB, 'warning')
        const { error } = await supabase.from('favorites').delete().eq('id', id)
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: get().favorites.filter((f) => f.id !== id) })
      },

      // 오른쪽 아래 돌담지기 팝업 (기본은 닫힘)
      agentOpen: false,
      setAgentOpen: (agentOpen) => set({ agentOpen }),

      messages: [],
      chatLoading: false,
      sendMessage: async (text) => {
        // 오류 말풍선은 대화 맥락에 넣지 않는다
        let shown = get().messages.filter((m) => !m.error)
        const last = shown[shown.length - 1]
        if (last?.role === 'user' && last.text === text) shown = shown.slice(0, -1) // 다시 시도: 실패한 같은 질문은 한 번만 보이게
        const history = shown.map((m) => ({ role: m.role, content: m.text }))
        set({ messages: [...shown, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps } = await askAgent(text, history)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps }] })
        } catch (e) {
          // 실패해도 대화에 남겨 두고 "다시 시도" 버튼을 보여준다
          set({ messages: [...get().messages, { role: 'assistant', error: true, text: e.message, retry: text }] })
        } finally {
          set({ chatLoading: false })
        }
      },
      clearChat: () => set({ messages: [] }),
    }),
    { name: 'doldam-store', partialize: (s) => ({ nickname: s.nickname }) },
  ),
)
