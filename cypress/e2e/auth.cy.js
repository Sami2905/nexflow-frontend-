// Cypress E2E tests for authentication

describe('Auth Flow', () => {
  it('should register a new user', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@test.com');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Login').should('exist');
  });

  it('should login with valid credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.contains('Dashboard').should('exist');
  });

  it('should logout', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.get('button').contains('Logout').click();
    cy.contains('Login').should('exist');
  });
}); 