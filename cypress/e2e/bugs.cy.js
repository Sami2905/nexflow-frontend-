// Cypress E2E tests for bug CRUD, filtering, and sorting

describe('Bug Management', () => {
  before(() => {
    // Login first
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
  });

  it('should create a new bug', () => {
    cy.get('button').contains('Create Bug').click();
    cy.get('input[name="title"]').type('E2E Bug');
    cy.get('textarea[name="description"]').type('This is a bug created by Cypress');
    cy.get('button').contains('Create Bug').click();
    cy.contains('E2E Bug').should('exist');
  });

  // Add more tests for edit, delete, filter, sort as needed
}); 