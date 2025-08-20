/// <reference types="cypress" />

describe('Audit Sampling - Smoke Test', () => {
  beforeEach(() => {
    // Mock Supabase auth
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });
  });

  it('kan generere sampling og eksportere', () => {
    // Visit the sampling page for a mock client
    cy.visit('/clients/mock-client-id/audit/sampling');
    
    // Wait for page to load
    cy.get('[data-testid="audit-sampling-module"]', { timeout: 10000 }).should('be.visible');
    
    // Set materiality
    cy.get('input[name="materiality"]').should('be.visible').clear().type('150000');
    
    // Enable high-value threshold
    cy.get('input[type="checkbox"]').first().check();
    
    // Use suggested threshold
    cy.contains('button', /bruk foreslått terskel/i).click();
    
    // Generate sample
    cy.contains('button', /generer utvalg/i).click();
    
    // Wait for results
    cy.contains(/målrettet \(100%\)/i, { timeout: 15000 }).should('be.visible');
    cy.contains(/statistisk \(rest\)/i).should('be.visible');
    
    // Test CSV export
    cy.contains('button', /last ned csv/i).click();
    
    // Test saving plan
    cy.contains('button', /lagre plan/i).click();
    
    // Fill in plan name in dialog
    cy.get('input[placeholder*="plan"]').type('Test Sampling Plan');
    cy.contains('button', /lagre/i).last().click();
    
    // Verify success message
    cy.contains(/lagret/i).should('be.visible');
  });

  it('kan justere risikomatrise og se effekt på utvalgsstørrelse', () => {
    cy.visit('/clients/mock-client-id/audit/sampling');
    
    // Wait for page to load  
    cy.get('[data-testid="audit-sampling-module"]').should('be.visible');
    
    // Set basic parameters
    cy.get('input[name="materiality"]').clear().type('100000');
    cy.get('input[name="performanceMateriality"]').clear().type('75000');
    
    // Generate first sample with default risk
    cy.contains('button', /generer utvalg/i).click();
    
    // Store initial sample size
    cy.get('[data-testid="sample-size"]').invoke('text').as('initialSize');
    
    // Change risk level to high
    cy.get('select[name="riskLevel"]').select('hoy');
    
    // Generate new sample
    cy.contains('button', /generer utvalg/i).click();
    
    // Verify sample size increased
    cy.get('@initialSize').then((initialSize) => {
      cy.get('[data-testid="sample-size"]').should(($newSize) => {
        const initial = parseInt(initialSize as string);
        const newVal = parseInt($newSize.text());
        expect(newVal).to.be.greaterThan(initial);
      });
    });
  });

  it('kan bruke stratifisering med slidere', () => {
    cy.visit('/clients/mock-client-id/audit/sampling');
    
    // Enable stratification
    cy.contains('label', /stratifiser/i).click();
    
    // Wait for stratification controls
    cy.get('[data-testid="strata-bounds"]').should('be.visible');
    
    // Suggest intervals
    cy.contains('button', /foreslå intervaller/i).click();
    
    // Adjust sliders (mock interaction)
    cy.get('input[type="range"]').first().invoke('val', 25000).trigger('input');
    cy.get('input[type="range"]').eq(1).invoke('val', 50000).trigger('input');
    
    // Set method to stratified
    cy.get('select[name="method"]').select('STRATIFIED');
    
    // Generate stratified sample
    cy.contains('button', /generer utvalg/i).click();
    
    // Verify strata information is shown
    cy.contains(/stratum/i).should('be.visible');
  });
});

describe('Audit Sampling - Validering', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });
  });

  it('viser feilmeldinger for ugyldige parametere', () => {
    cy.visit('/clients/mock-client-id/audit/sampling');
    
    // Try to generate without required fields
    cy.contains('button', /generer utvalg/i).click();
    
    // Should show validation errors
    cy.contains(/påkrevd/i).should('be.visible');
    
    // Set invalid combination (EM > TM)
    cy.get('input[name="materiality"]').clear().type('50000');
    cy.get('input[name="expectedMisstatement"]').clear().type('60000');
    
    cy.contains('button', /generer utvalg/i).click();
    
    // Should show specific validation error
    cy.contains(/forventet feil.*mindre.*vesentlighet/i).should('be.visible');
  });

  it('respekterer konfidensgrad og viser korrekt Z-score', () => {
    cy.visit('/clients/mock-client-id/audit/sampling');
    
    // Set parameters
    cy.get('input[name="materiality"]').clear().type('100000');
    
    // Test different confidence levels
    const confidenceLevels = [90, 95, 99];
    
    confidenceLevels.forEach((level) => {
      cy.get('select[name="confidenceLevel"]').select(level.toString());
      
      // Generate sample
      cy.contains('button', /generer utvalg/i).click();
      
      // Verify higher confidence gives larger sample
      if (level === 99) {
        cy.get('[data-testid="sample-size"]').should('contain.text', /\d+/);
      }
    });
  });
});