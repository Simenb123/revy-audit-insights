import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AssistantSidebar from '../AssistantSidebar'
import { ChatUIProvider } from '@/store/chatUI'

const renderWithProvider = () =>
  render(
    <ChatUIProvider>
      <AssistantSidebar />
    </ChatUIProvider>
  )

describe('AssistantSidebar', () => {
  it('toggles collapsed class on click', () => {
    renderWithProvider()
    const button = screen.getByRole('button')
    fireEvent.click(button)
    const aside = screen.getByRole('complementary')
    expect(aside.className).toContain('translate-x-full')
  })

  it('persists collapse state after rerender', () => {
    const { rerender } = render(
      <ChatUIProvider>
        <AssistantSidebar />
      </ChatUIProvider>
    )
    const button = screen.getByRole('button')
    fireEvent.click(button)
    rerender(
      <ChatUIProvider>
        <AssistantSidebar />
      </ChatUIProvider>
    )
    const aside = screen.getByRole('complementary')
    expect(aside.className).toContain('translate-x-full')
  })
})
