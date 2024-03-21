describe('Upload Documents', () => {
  before(() => {
    cy.createWorkOrder();
    cy.signIn('http://localhost:3000');
  });

  after(() => {
    cy.deleteWorkOrder();
    cy.signOut();
  });

  it('Uploads a document and can verify it', () => {
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
      cy.contains("31.3kW");
      cy.contains("[doc1]");

      cy.contains("Confirm Validation").click();
      cy.contains("Verification complete.", { timeout: 60000 });
    });
  });
});
