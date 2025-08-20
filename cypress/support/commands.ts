/// <reference types="cypress" />

// Custom commands for Revio Audit Insights testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock user login
       * @example cy.login()
       */
      login(): Chainable<Element>;
      
      /**
       * Custom command to select client for testing
       * @example cy.selectClient('client-id')
       */
      selectClient(clientId: string): Chainable<Element>;
      
      /**
       * Custom command to set up sampling test data
       * @example cy.setupSamplingData()
       */
      setupSamplingData(): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@revisor.no',
        user_metadata: {
          first_name: 'Test',
          last_name: 'Revisor'
        }
      }
    }));
  });
});

Cypress.Commands.add('selectClient', (clientId: string) => {
  cy.intercept('GET', `**/clients/${clientId}`, {
    statusCode: 200,
    body: {
      id: clientId,
      name: 'Test Klient AS',
      org_number: '123456789',
      user_id: 'mock-user-id'
    }
  }).as('getClient');
});

Cypress.Commands.add('setupSamplingData', () => {
  // Mock trial balance data
  cy.intercept('GET', '**/trial_balances*', {
    statusCode: 200,
    body: Array.from({ length: 100 }, (_, i) => ({
      id: `tb-${i}`,
      account_number: `${1000 + i}`,
      account_name: `Konto ${i + 1}`,
      debit_amount: Math.random() * 100000,
      credit_amount: Math.random() * 50000
    }))
  }).as('getTrialBalance');
  
  // Mock chart of accounts
  cy.intercept('GET', '**/client_chart_of_accounts*', {
    statusCode: 200,
    body: Array.from({ length: 50 }, (_, i) => ({
      id: `coa-${i}`,
      account_number: `${1000 + i}`,
      account_name: `Standard Konto ${i + 1}`,
      account_type: 'asset'
    }))
  }).as('getChartOfAccounts');
  
  // Mock general ledger transactions
  cy.intercept('GET', '**/general_ledger_transactions*', {
    statusCode: 200,
    body: Array.from({ length: 1000 }, (_, i) => ({
      id: `tx-${i}`,
      transaction_date: '2024-01-01',
      account_no: `${1000 + (i % 50)}`,
      account_name: `Konto ${(i % 50) + 1}`,
      description: `Transaksjon ${i + 1}`,
      debit_amount: i % 2 === 0 ? (i + 1) * 1000 : null,
      credit_amount: i % 2 === 1 ? (i + 1) * 1000 : null
    }))
  }).as('getTransactions');
});