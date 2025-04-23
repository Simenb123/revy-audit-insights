
/// <reference types="cypress" />

describe('Layout – header & drawer', () => {
  beforeEach(() => cy.visit('/'));

  it('viser headeren konstant', () => {
    cy.get('[data-cy="app-header"]').should('be.visible');
  });

  it('åpner og lukker sidebar via hamburger-meny', () => {
    cy.get('[data-cy="hamburger"]').click();
    cy.get('[data-cy="sidebar"]').should('be.visible');

    cy.get('[data-cy="close-drawer"]').click();
    cy.get('[data-cy="sidebar"]').should('not.exist');
  });
});
