// Cypress E2E tests for project CRUD and member management

describe('Project Management', () => {
  before(() => {
    // Login first
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
  });

  it('should create a new project', () => {
    cy.contains('Projects').click();
    cy.get('input[name="name"]').type('Test Project');
    cy.get('textarea[name="description"]').type('A project for E2E testing');
    cy.get('button').contains('Create Project').click();
    cy.contains('Test Project').should('exist');
  });

  it('should show project details modal', () => {
    cy.contains('Test Project').click();
    cy.contains('Members:').should('exist');
    cy.get('button').contains('Close').click();
  });

  // Add more tests for edit, delete, invite, remove as needed
}); 