describe('Uploader Work Orders', () => {
  beforeEach(() => {
    cy.createMachine();
    cy.signIn('http://localhost:3000');
  });

  afterEach(() => {
    cy.deleteMachine();
    cy.signOut();
  });

  it('creates work orders successfully, then deletes them (from main menu)', () => {
    cy.intercept('/api/*').as('getEverything');
    cy.origin("http://localhost:3000", {}, () => {
      cy.visit("http://localhost:3000")
        .contains("Dev Links").
        click();

      cy.contains("Create Work Order")
        .click();

      cy.contains("Create a new task");

      cy.contains("Select a user").click();
      cy.get('span').contains(Cypress.env("test_email")).click();

      cy.contains("Select a machine").click();
      cy.get('span').contains('e2e machine').click();

      cy.get('input[placeholder="Enter a task"]').click().type("E2E Task");
      cy.get('input[placeholder="Enter a task description"]').click().type("E2E Description");

      cy.contains("Submit").click();
      cy.contains("Work order created successfully", { timeout: 10000 });

      cy.visit("http://localhost:3000")
        .contains("Dev Links")
        .click();

      cy.contains("Delete Work Order")
        .click();

      cy.contains("Delete a work order")
        .wait('@getEverything')
        .wait(1000);

      cy.contains("Select a work order").click();
      cy.get('span').contains('E2E Task').click();

      cy.get('Button').contains('Delete').click();
    });
  });
});
