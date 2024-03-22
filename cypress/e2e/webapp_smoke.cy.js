describe("port 3001 exists", () => {
  beforeEach(() => {
    cy.signIn('http://localhost:3001');
  });

  afterEach(() => {
    cy.signOut();
  });

  after(() => {
    Cypress.session.clearAllSavedSessions();
  });

  it("passes the smoke test (3001)", () => {
    cy.origin("http://localhost:3001", {}, () => {
      cy.visit("http://localhost:3001").contains("Send");
    });
  });
});
