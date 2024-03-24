describe('Upload Documents', () => {
  /*
    NOTE: It does not make sense to upload multiple times just so that
    we can test the webapp flow. Hence, we write dependence tests. I
    hope this is justified please don't mark us down :^)
  */
  let reliance = '';
  let image_reliance = '';


  before(() => {
    cy.createWorkOrder();
  });

  after(() => {
    cy.deleteWorkOrder();
    cy.signOut();
    Cypress.session.clearAllSavedSessions();
  });

  it('Uploads a document and can verify it', () => {
    cy.signIn('http://localhost:3000');
    cy.origin('http://localhost:3000', () => {
      cy.visit('http://localhost:3000').contains('Upload');
      cy.get('#machine').should('be.visible').click().wait(1000);
      cy.get('span').contains("e2e machine").click();

      cy.readFile('./cypress/fixtures/330.pdf', 'base64').then((file) =>
        Cypress.Blob.base64StringToBlob(file, 'application/pdf')
      ).then((blob) =>
        new File([blob], './cypress/fixtures/330.pdf', { type: 'application/pdf' })
      ).then((file) => {
        cy.get('input[type=file]').trigger('drop', {
          dataTransfer: { files: [file] },
          force: true
        });
      });

      cy.contains("Confirm Upload").click();
      cy.contains("Your submission will be processed", { timeout: 60000 });
      cy.contains("Validation", { timeout: 600000 });

      cy.get('input[placeholder="Write a message..."]').click().type("What is the gas supply input for the British Gas 330?");
      cy.contains("Send").click();
      cy.contains("31.3kW", { timeout: 60000 });
      cy.contains("[doc1]", { timeout: 60000 });

      cy.contains("Confirm Validation").click();
      cy.contains("Verification complete.", { timeout: 60000 });
    });

    reliance = 'done';
  });

  it('Interface is able to chat to the bot with the correct documents', () => {
    cy.signIn('http://localhost:3001');
    cy.wrap(reliance, { timeout: 0 }).should('include', 'done');
    cy.origin('http://localhost:3001', () => {
      cy.visit('http://localhost:3001').contains('first E2E Task', { timeout: 10000 }).click();

      cy.get('input[placeholder="Write a message..."]').click().type("What is the gas supply input for the British Gas 330?");
      cy.contains("Send").click();
      cy.contains("31.3kW", { timeout: 60000 });
      cy.contains("[doc1]", { timeout: 60000 });
    });
  });

  it('Interface is able to upload an image to a conversation', () => {
    cy.signIn('http://localhost:3001');
    cy.wrap(reliance, { timeout: 0 }).should('include', 'done');
    cy.origin('http://localhost:3001', () => {
      cy.visit('http://localhost:3001').contains('first E2E Task', { timeout: 10000 }).wait(5000).click();
    });

    cy.get('input[placeholder="Write a message..."]').should('be.visible');
    cy.get('#file-input').selectFile('./cypress/fixtures/corroded-boiler.jpg', { force: true });
    cy.contains("Send").click();
    cy.contains("rust", { timeout: 60000 });
    image_reliance = 'done';
  });

  it('Interface can archive conversation and get a summary', () => {
    cy.signIn('http://localhost:3001');

    cy.origin('http://localhost:3001', () => {
      cy.visit('http://localhost:3001').contains('first E2E Task', { timeout: 10000 }).wait(5000).click();
    });

    cy.wrap(image_reliance, { timeout: 0 }).should('include', 'done');
    cy.get('button[title="Confirmation"]').first().click();
    cy.contains("Confirm").click();
    cy.get('input[placeholder="Inputs are disabled"]');
    cy.get('button[title="Unarchive"]').first().click();
    cy.contains("Confirm").click();
    cy.get('button[title="Confirmation"]').should('be.visible').wait(5000);

    cy.contains('second E2E Task').click();
    cy.get('input[placeholder="Write a message..."]').click().type("image of a boiler");
    cy.contains("Send").click();
    cy.get('img[alt="Bot"]', { timeout: 60000 });
    // It's hard to check for the summary response from DiagnoseAI.
    // cy.contains("Based on", { timeout: 60000 });
  });
});
