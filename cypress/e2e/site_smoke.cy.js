describe("port 3000 and 3001 exists", () => {
  // beforeEach(() => {
  //   cy.session('signed-in', () => {
  //     cy.signIn('http://localhost:3000');
  //   });
  // });

  it("passes", () => {
    cy.visit("http://localhost:3000", {
      failOnStatusCode: false
    }).wait(30000)
      .contains("DiagnoseAI");
    // cy.visit("http://localhost:3001", {
    //   failOnStatusCode: false,
    // })
    //   .contains("to continue to DiagnoseAI");
  });
});
