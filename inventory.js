document.addEventListener('DOMContentLoaded', () => {
  function replaceDetailsWithList() {
    const detailsElements = document.querySelectorAll('details');

    detailsElements.forEach(details => {
      const ul = details.querySelector('ul');
      let cartouche = document.createElement('div');
      cartouche.classList.add('cartouche');

      // Create containers for title, URL, and other elements
      let titleContainer = document.createElement('div');
      titleContainer.classList.add('cartouche-title');

      let urlContainer = document.createElement('div');
      urlContainer.classList.add('cartouche-url');

      let contentContainer = document.createElement('div');
      contentContainer.classList.add('cartouche-content');

      ul.querySelectorAll('li').forEach(li => {
        let key = li.querySelector('strong').textContent.replace(':', '').trim(); // Extract the bold text as the key
        let value = li.textContent.replace(key, '').replace(':', '').trim(); // Extract the remaining text as the value
        let element;

        // Skip if value is empty
        if (value === '') {
          return;
        }

        if (key === 'Title') {
          // Create a new h4 element for the title
          element = document.createElement('div');
          element.innerHTML = `<strong>${key}:</strong> ${value}`;
          contentContainer.appendChild(element);
          titleContainer.appendChild(element);
        } else if (key === 'URL') {
          // Create a new anchor element for the URL
          element = document.createElement('div');
          element.innerHTML = `<strong>${key}:</strong> ${value}`;
          contentContainer.appendChild(element);
          urlContainer.appendChild(element);
        } else {
          // Create a div for other key-value pairs
          element = document.createElement('div');
          element.innerHTML = `<strong>${key}:</strong> ${value}`;
          contentContainer.appendChild(element);
        }
      });

      // Append containers to the cartouche
      if (titleContainer.children.length > 0) {
        cartouche.appendChild(titleContainer);
      }
      if (urlContainer.children.length > 0) {
        cartouche.appendChild(urlContainer);
      }
      if (contentContainer.children.length > 0) {
        cartouche.appendChild(contentContainer);
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
