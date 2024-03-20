describe('Webapp Workorders', () => {
  beforeEach(() => {
    cy.signIn('http://localhost:3000');
    cy.createWorkOrder();
  });

  afterEach(() => {
    cy.deleteWorkOrder();
    cy.signOut();
  });

  it('appears when work orders are created', () => {
    cy.origin("http://localhost:3001", () => {
      cy.visit("http://localhost:3001").contains("E2E Task", { timeout: 10000 });
    });
  });
});
