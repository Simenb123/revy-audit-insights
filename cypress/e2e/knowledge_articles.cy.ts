const page = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>
  <div id="content">
    Svar fra AI.
    <!-- KNOWLEDGE_ARTICLES: [{"id":1,"title":"Artikkel 1","reference_code":"A1"},{"id":2,"title":"Artikkel 2","reference_code":"A2"}] -->
  </div>
  <script>
    const raw = document.getElementById('content').innerHTML;
    const match = raw.match(/<!-- KNOWLEDGE_ARTICLES: (.*?) -->/);
    const articles = match ? JSON.parse(match[1]) : [];
    if (articles.length) {
      const container = document.createElement('div');
      container.innerHTML = '<p>Kilder</p>';
      const list = document.createElement('ul');
      articles.forEach(a => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '/fag/artikkel/' + a.id;
        link.textContent = a.title;
        li.appendChild(link);
        list.appendChild(li);
      });
      container.appendChild(list);
      document.body.appendChild(container);
    }
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
