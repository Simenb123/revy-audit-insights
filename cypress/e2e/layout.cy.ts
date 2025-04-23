
describe("Layout – header & drawer", () => {
  it("opens and closes the sidebar on mobile", () => {
    cy.viewport(390, 844); // iPhone 13 Pro

    cy.visit("/");

    cy.get('[data-cy="sidebar"]').should("not.be.visible");
    cy.get('[data-cy="hamburger"]').click();
    cy.get('[data-cy="sidebar"]').should("be.visible");
    cy.get('[data-cy="close-drawer"]').click();
    cy.get('[data-cy="sidebar"]').should("not.be.visible");
  });
});
