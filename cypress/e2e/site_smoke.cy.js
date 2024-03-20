describe("port 3000 and 3001 exists", () => {
  beforeEach(() => {
    // cy.session('all-account-sign-in', () => {
    //   cy.signIn('http://localhost:3000');
    //   // cy.signIn('http://localhost:3001');
    // });
  });

  it("passes the smoke test (3000)", () => {
    cy.origin(Cypress.env('clerk_origin'), {}, () => {
      cy.visit('http://localhost:3000', {
        failOnStatusCode: false
      }).get("#identifier-field").type(Cypress.env('test_email')).get(".cl-formButtonPrimary").click()
        .get("#password-field")
        .type(Cypress.env('test_password'))
        .get(".cl-formButtonPrimary")
        .click();
    });


    cy.origin("http://localhost:3000", {}, () => {
      cy.visit("http://localhost:3000").contains("Upload");
    });
  });

  it("passes the smoke test (3001)", () => {
    cy.origin(Cypress.env('clerk_origin'), {}, () => {
      cy.visit('http://localhost:3001', {
        failOnStatusCode: false
      }).get("#identifier-field").type(Cypress.env('test_email')).get(".cl-formButtonPrimary").click()
        .get("#password-field")
        .type(Cypress.env('test_password'))
        .get(".cl-formButtonPrimary")
        .click();
    });


    cy.origin("http://localhost:3001", {}, () => {
      cy.visit("http://localhost:3001").contains("Send");
    });
  });
});
