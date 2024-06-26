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
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
  cy.reload();
});

Cypress.Commands.add('signIn', (site) => {
  // NOTE: There is a canonical method to do this, found in the Clerk
  // documentation: https://clerk.com/docs/testing/cypress

  // However, because of our authentication flow, it makes more sense
  // _NOT_ to do this. Instead, we log in as if we are a real user

  // Another note: Sessions do not work. For some reason, they can still persist.
  cy.log('Signing in...');

  cy.session(`${site}-session`, () => {
    cy.signOut();
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
});

Cypress.Commands.add('createMachine', () => {
  // NOTE: When logging in across 2 applications, on Cypress it can
  // get _VERY_ glitchy.  So, we just do the safe thing and relogin
  cy.signIn('http://localhost:3000');
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
  cy.signIn('http://localhost:3000');
  cy.log('deleting the e2e machine');
  cy.intercept('/api/*').as('getEverything');

  cy.origin("http://localhost:3000", () => {
    // NOTE: To trigger auth
    cy.visit("http://localhost:3000").contains("Upload").wait(1000);

    cy.visit("http://localhost:3000/machines/delete")
      .contains("Delete a machine")
      .wait('@getEverything')
      .wait(1000);

    cy.contains("Select a machine").click();
    cy.get("span").contains("e2e machine").click();
    cy.get("button").contains("Delete").click();
    cy.contains("machine deleted successfully", { timeout: 10000 });
  });
});

Cypress.Commands.add('createWorkOrder', () => {
  cy.signIn('http://localhost:3000');
  cy.log('creating work order');

  cy.createMachine();
  cy.intercept('/api/*').as('getEverything');

  cy.origin("http://localhost:3000", () => {
    // NOTE: To trigger auth
    cy.visit("http://localhost:3000").contains("Upload").wait(1000);

    ["first E2E Task", "second E2E Task"].forEach(taskName => {
      cy.visit("http://localhost:3000/workorder/create")
        .contains("Create a new task")
        .wait('@getEverything')
        .wait(1000);

      cy.contains("Select a user").click();
      cy.get('span').contains(Cypress.env("test_email")).click();

      cy.contains("Select a machine").click();
      cy.get('span').contains('e2e machine').click();

      cy.get('input[placeholder="Enter a task"]').click().type(taskName);
      cy.get('input[placeholder="Enter a task description"]').click().type("E2E Description");

      cy.contains("Submit").click();
      cy.contains("Work order created successfully", { timeout: 10000 });
    });
  });
});

Cypress.Commands.add('deleteWorkOrder', () => {
  cy.signIn('http://localhost:3000');
  cy.log('deleting work order');

  cy.intercept('/api/*').as('getEverything');

  cy.origin("http://localhost:3000", () => {
    // NOTE: To trigger auth
    cy.visit("http://localhost:3000").contains("Upload").wait(1000);

    ["first E2E Task", "second E2E Task"].forEach(taskName => {
      cy.visit("http://localhost:3000/workorder/delete")
        .contains("Delete a work order")
        .wait('@getEverything')
        .wait(3000);

      cy.contains("Select a work order").click();
      cy.get('span').contains(taskName).click();

      cy.get('Button').contains('Delete').click();
      cy.contains("Work order deleted successfully", { timeout: 10000 });
    });
  });

  cy.deleteMachine();
});
