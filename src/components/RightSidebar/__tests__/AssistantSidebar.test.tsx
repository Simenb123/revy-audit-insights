import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AssistantSidebar from '../AssistantSidebar'
import { ChatUIProvider, useChatUI } from '@/store/chatUI'

// Mock hook that fetches AI-Revy variants to avoid Supabase calls
vi.mock('@/hooks/useAIRevyVariants', () => ({
  useAIRevyVariants: () => ({
    variants: [],
    selectedVariant: null,
    isLoading: false,
    switchVariant: vi.fn(),
    handleVariantChange: vi.fn(),
    loadVariants: vi.fn()
  })
}))

// Force desktop layout so the sidebar is rendered directly
vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: () => ({ lg: true })
}))

const ToggleButton = () => {
  const { toggle } = useChatUI()
  return <button onClick={toggle}>toggle</button>
}

const renderWithProvider = () =>
  render(
    <ChatUIProvider>
      <AssistantSidebar />
      <ToggleButton />
    </ChatUIProvider>
  )

describe('AssistantSidebar', () => {
  it('toggles collapsed class on click', () => {
    renderWithProvider()
    const aside = screen.getByRole('complementary')
    expect(aside.className).not.toContain('translate-x-full')

    const button = screen.getByRole('button', { name: /toggle/i })
    fireEvent.click(button)
    expect(aside.className).toContain('translate-x-full')
  })

  it('resets collapse state after rerender', () => {
    const { rerender } = renderWithProvider()
    fireEvent.click(screen.getByRole('button', { name: /toggle/i }))

    rerender(
      <ChatUIProvider>
        <AssistantSidebar />
        <ToggleButton />
      </ChatUIProvider>
    )

    const aside = screen.getByRole('complementary')
    expect(aside.className).not.toContain('translate-x-full')
  })
})
