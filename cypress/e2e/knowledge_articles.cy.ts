describe('Knowledge article metadata', () => {
  it('displays referenced articles in Kilder section', () => {
    const sessionId = 's1';
    const messages = [
      {
        id: 'm1',
        session_id: sessionId,
        sender: 'revy',
        content: `Dette er et svar.\n\n<!-- KNOWLEDGE_ARTICLES: ${JSON.stringify([
          { id: 'a1', title: 'ISA 315' },
          { id: 'a2', title: 'ISA 330' }
        ])} -->`,
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      }
    ];

    cy.intercept('GET', '**/revy_chat_sessions*', [
      { id: sessionId, user_id: 'u1', title: 'Test', context: 'general', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', client_id: null }
    ]);
    cy.intercept('GET', '**/revy_chat_messages*', messages);

    cy.visit('/ai-revy-admin');
    cy.contains('Live test').click();

    cy.contains('Kilder').should('be.visible');
    cy.contains('ISA 315').should('be.visible');
    cy.contains('ISA 330').should('be.visible');
  });
});
