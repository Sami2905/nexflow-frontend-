// Cypress E2E tests for navigation and protected routes

describe('Navigation & Protected Routes', () => {
  it('should redirect to login if not authenticated', () => {
    cy.clearCookies();
    cy.visit('http://localhost:5173/dashboard');
    cy.contains('Login').should('exist');
  });

  it('should allow navigation between dashboard and projects', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.contains('Dashboard').should('exist');
    cy.contains('Projects').click();
    cy.contains('Create New Project').should('exist');
  });
}); 