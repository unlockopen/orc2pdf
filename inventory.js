document.addEventListener('DOMContentLoaded', () => {
  function replaceDetailsWithList() {
    const detailsElements = document.querySelectorAll('details');

    detailsElements.forEach(details => {
      const ul = details.querySelector('ul');
      let cartouche = document.createElement('div');
      cartouche.classList.add('cartouche');

      // Create container for columns
      let columnContainer = document.createElement('div');
      columnContainer.classList.add('cartouche-columns');

      ul.querySelectorAll('li').forEach(li => {
        let key = li.querySelector('strong').textContent.replace(':', '').trim(); // Extract the bold text as the key
        let value = li.textContent.replace(key, '').replace(':', '').trim(); // Extract the remaining text as the value
        let element;

        // Skip if value is empty
        if (value === '') {
          return;
        }

        if (key === 'Title') {
          element = document.createElement('div');
          element.innerHTML = `<strong>${key}: </strong> ${value}`;
          cartouche.appendChild(element);
        } else if (key === 'URL') {
          // Create a new anchor element for the URL
          element = document.createElement('div');
          element.classList.add('cartouche-url');
          element.innerHTML = `<strong>${key}:&nbsp;</strong>${value}`;
          cartouche.appendChild(element);
        } else {
          // Create a div for other key-value pairs
          element = document.createElement('div');
          element.innerHTML = `<strong>${key}: </strong> ${value}`;
          columnContainer.appendChild(element);
        }
      });

      // Append containers to the cartouche

      if (columnContainer.children.length > 0) {
        cartouche.appendChild(columnContainer);
      }

      if (cartouche.children.length > 0) {
        // Replace the details element with the cartouche div element
        details.parentNode.replaceChild(cartouche, details);
      }
    });
  }

  // Replace all details elements with their corresponding ul elements when the page loads
  replaceDetailsWithList();
});
