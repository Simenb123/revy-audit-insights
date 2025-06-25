import React from 'react';

const page = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Test</title>
</head>
<body>
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script>
const response = ` + "`" + `Svar fra AI.\n<!-- KNOWLEDGE_ARTICLES: [{\"id\":1,\"title\":\"Artikkel 1\",\"reference_code\":\"A1\"},{\"id\":2,\"title\":\"Artikkel 2\",\"reference_code\":\"A2\"}] -->` + "`" + `;
const match = response.match(/<!-- KNOWLEDGE_ARTICLES: (.*?) -->/);
const articles = match ? JSON.parse(match[1]) : [];
const App = () => React.createElement('div', {},
  React.createElement('p', {}, 'Kilder'),
  React.createElement('ul', {}, articles.map(a => React.createElement('li', { key: a.id }, React.createElement('a', { href: '/fag/artikkel/' + a.id }, a.title))))
);
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
</script>
</body>
</html>`;

describe('Knowledge article links', () => {
  it('shows links from metadata in Kilder section', () => {
    cy.visit('data:text/html;charset=utf-8,' + encodeURIComponent(page));
    cy.contains('Kilder').should('be.visible');
    cy.get('a').should('have.length', 2);
    cy.contains('Artikkel 1');
    cy.contains('Artikkel 2');
  });
});
