describe('Webapp Workorders', () => {
  beforeEach(() => {
    cy.createWorkOrder();
    cy.signIn('http://localhost:3001');
  });

  afterEach(() => {
    cy.deleteWorkOrder();
    cy.signOut();
  });

  after(() => {
    Cypress.session.clearAllSavedSessions();
  });

  it('appears when work orders are created', () => {
    cy.origin("http://localhost:3001", () => {
      cy.visit("http://localhost:3001").contains("E2E Task", { timeout: 10000 });
    });
  });
});
