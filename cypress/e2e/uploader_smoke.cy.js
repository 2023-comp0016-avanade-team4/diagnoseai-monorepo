describe("port 3000 and 3001 exists", () => {
  beforeEach(() => {
    cy.session('uploader-session', () => {
      cy.signIn('http://localhost:3000');
    });
  });

  it("passes the smoke test (3000)", () => {
    cy.origin("http://localhost:3000", {}, () => {
      cy.visit("http://localhost:3000").contains("Upload");
    });
  });
});
