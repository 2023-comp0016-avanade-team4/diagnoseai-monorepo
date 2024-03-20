describe("port 3001 exists", () => {
  cy.session('uploader-session', () => {
    cy.signIn('http://localhost:3001');
  });

  it("passes the smoke test (3001)", () => {
    cy.origin("http://localhost:3001", {}, () => {
      cy.visit("http://localhost:3001").contains("Send");
    });
  });
});
