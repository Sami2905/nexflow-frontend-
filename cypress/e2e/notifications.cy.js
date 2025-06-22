// Cypress E2E tests for notifications

describe('Notifications', () => {
  before(() => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="email"]').type('notifmember@example.com');
    cy.get('input[name="password"]').type('testpass');
    cy.get('button[type="submit"]').click();
  });

  it('should show notification bell with unread count', () => {
    cy.get('button').find('svg').should('exist'); // Bell icon
    cy.get('.badge-error').should('exist'); // Unread badge
  });

  it('should open dropdown and show notifications', () => {
    cy.get('button').find('svg').click();
    cy.contains('Notifications').should('exist');
    cy.get('.dropdown-content').should('exist');
    cy.get('.dropdown-content ul li').should('have.length.greaterThan', 0);
  });

  it('should mark a notification as read', () => {
    cy.get('button').find('svg').click();
    cy.get('.dropdown-content ul li').first().within(() => {
      cy.contains('Mark as read').click();
    });
    cy.get('.badge-error').should('not.exist');
  });
}); 