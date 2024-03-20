// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('signOut', () => {
  cy.log('Signing out...');
  cy.clearCookies();
});

Cypress.Commands.add('signIn', (site) => {
  // NOTE: There is a canonical method to do this, found in the Clerk
  // documentation: https://clerk.com/docs/testing/cypress

  // However, because of our authentication flow, it makes more sense
  // _NOT_ to do this. Instead, we log in as if we are a real user
  cy.log('Signing in...');

  cy.origin(Cypress.env('clerk_origin'), { args: { site } }, ({ site }) => {
    cy.visit(site, {
      failOnStatusCode: false
    }).get("#identifier-field").type(Cypress.env('test_email')).get(".cl-formButtonPrimary").click()
      .get("#password-field")
      .type(Cypress.env('test_password'))
      .get(".cl-formButtonPrimary")
      .click();
  });
});

Cypress.Commands.add('createMachine', () => {
  cy.log('creating a e2e machine');

  cy.origin("http://localhost:3000", () => {
    // NOTE: To trigger auth
    cy.visit("http://localhost:3000").contains("Upload").wait(1000);

    cy.visit("http://localhost:3000/machines/create")
      .contains("Create a new machine");

    cy.get("input[placeholder=\"Enter a manufacturer\"]").click().type("e2e machine");
    cy.get("input[placeholder=\"Enter a model\"]").click().type("a temporary machine");
    cy.contains("Submit").click();
    cy.contains("Machine created successfully", { timeout: 10000 });
  });
});

Cypress.Commands.add('deleteMachine', () => {
  cy.log('deleting the e2e machine');

  cy.origin("http://localhost:3000", () => {
    // NOTE: To trigger auth
    cy.visit("http://localhost:3000").contains("Upload").wait(1000);

    cy.visit("http://localhost:3000/machines/delete")
      .contains("Delete a machine").wait(10000);

    cy.contains("Select a machine").click();
    cy.get("span").contains("e2e machine").click();
    cy.get("button").contains("Delete").click();
    cy.contains("machine deleted successfully", { timeout: 10000 });
  });
});
