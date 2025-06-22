/// <reference types="cypress" />

// This test covers the full project flow: login, project creation, invite, bug creation, assign, status change, comment, attachment, edit/delete, dashboard widgets

describe('Full Project & Bug Tracker Flow', () => {
  const user = { email: 'test@example.com', password: 'password123' };
  const member = { email: 'member@example.com', password: 'password123' };
  const projectName = `Test Project ${Date.now()}`;
  const bugTitle = `Bug ${Date.now()}`;

  before(() => {
    // Optionally, create users via API or ensure they exist
  });

  it('Logs in as main user', () => {
    cy.visit('/login');
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('button[type=submit]').click();
    cy.contains('Dashboard', { timeout: 10000 }).should('exist');
  });

  it('Creates a new project', () => {
    cy.contains('Create Project').click();
    cy.get('input[name=name], input[placeholder="Project Name"]').type(projectName);
    cy.get('textarea[name=description], textarea[placeholder="Description"]').type('A project for E2E testing.');
    cy.get('button[type=submit], button').contains(/create/i).click();
    cy.contains(projectName, { timeout: 10000 }).should('exist');
  });

  it('Invites a member to the project', () => {
    cy.contains(projectName).click();
    cy.contains('Team').click();
    cy.get('input[type=email]').type(member.email);
    cy.get('button').contains(/invite/i).click();
    cy.contains(member.email, { timeout: 10000 }).should('exist');
  });

  it('Creates a bug in the project', () => {
    cy.contains('Tickets').click();
    cy.contains('+ Create Ticket').click();
    cy.get('input[name=title]').type(bugTitle);
    cy.get('textarea[name=description]').type('This is a test bug.');
    cy.get('select[name=priority]').select('High');
    cy.get('button[type=submit]').contains(/create/i).click();
    cy.contains(bugTitle, { timeout: 10000 }).should('exist');
  });

  it('Assigns the bug to a member', () => {
    cy.contains(bugTitle).parent().contains('Edit').click();
    cy.get('select[name=assignedTo]').select(member.email);
    cy.get('button').contains(/save/i).click();
    cy.contains(bugTitle).parent().should('contain', member.email);
  });

  it('Changes bug status via Kanban', () => {
    cy.contains('Kanban').click();
    cy.get('[aria-label="Ticket avatar for ' + bugTitle + '"]').trigger('mousedown', { which: 1 });
    cy.get('[aria-label="Closed"]').trigger('mousemove').trigger('mouseup', { force: true });
    cy.contains('Closed').parent().should('contain', bugTitle);
  });

  it('Adds a comment and attachment to the bug', () => {
    cy.contains('Kanban').click();
    cy.get('[aria-label="Ticket avatar for ' + bugTitle + '"]').click();
    cy.get('input[placeholder="Add a comment..."]').type('This is a test comment.');
    cy.get('button').contains(/post/i).click();
    cy.contains('This is a test comment.').should('exist');
    // Attachment (optional, requires a file in fixtures)
    cy.get('input[type=file]').selectFile('cypress/fixtures/example.json', { force: true });
    cy.get('button').contains(/upload/i).click();
    cy.contains('example.json').should('exist');
    cy.get('button[aria-label="Close"]').click();
  });

  it('Edits and deletes the bug', () => {
    cy.contains('Tickets').click();
    cy.contains(bugTitle).parent().contains('Edit').click();
    cy.get('input[name=title]').clear().type(bugTitle + ' Edited');
    cy.get('button').contains(/save/i).click();
    cy.contains(bugTitle + ' Edited').should('exist');
    cy.contains(bugTitle + ' Edited').parent().contains('Delete').click();
    cy.contains('Are you sure').should('exist');
    cy.get('button').contains(/delete/i).click();
    cy.contains(bugTitle + ' Edited').should('not.exist');
  });

  it('Checks dashboard widgets', () => {
    cy.visit('/');
    cy.contains('Enhanced Dashboard').should('exist');
    cy.contains('Project Summaries').should('exist');
    cy.contains('Bugs by Status').should('exist');
    cy.contains(projectName).should('exist');
  });
}); 