describe("port 3000 and 3001 exists", () => {
  beforeEach(() => {
    cy.signIn('http://localhost:3000');
  });

  afterEach(() => {
    cy.signOut();
  });

  after(() => {
    Cypress.session.clearAllSavedSessions();
  });

  it("passes the smoke test (3000)", () => {
    cy.origin("http://localhost:3000", {}, () => {
      cy.visit("http://localhost:3000").contains("Upload");
    });
  });
});
