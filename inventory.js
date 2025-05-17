document.addEventListener('DOMContentLoaded', () => {
  function restructureInventoryItems() {
    // Select all the li elements containing a div with the class "metadata"
    const items = Array.from(document.querySelectorAll('li')).filter(item => item.querySelector('.metadata'));

    items.forEach(item => {
      // Extract the data for the current item
      const extractedItem = extractItemData(item);

      // Create a new div element to hold the extracted item details
      const structuredItem = createStructuredItem(extractedItem);

      // Replace the original li item with the new structured item
      item.innerHTML = structuredItem.innerHTML;
    });
  }

  function extractItemData(item) {
    let extractedItem = { columns: {} };

    // Parse the HTML content of the list item
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = item.innerHTML;

    // Remove the starting anchor tag
    let firstAnchor = tempDiv.querySelector('a');
    if (firstAnchor) firstAnchor.remove();

    // Remove the " - " from the first <p>
    let firstParagraph = tempDiv.querySelector('p');
    if (firstParagraph) {
      firstParagraph.innerHTML = firstParagraph.innerHTML.replace(/^\s*-\s*/, '');
    }

    // Extract the cleaned HTML content as the Text block
    extractedItem.Text = tempDiv.innerHTML.trim();

    // Extract details from the unordered list inside the details element
    metadataDiv = item.querySelector('metadata');
    if (!metadataDiv) return extractedItem;

    let ul = metadataDiv.querySelector('ul');
    if (!ul) return extractedItem;

    ul.querySelectorAll('li').forEach(li => {
      let strong = li.querySelector('strong');
      if (!strong) return;

      let key = strong.textContent.replace(':', '').trim();
      let value = li.textContent.replace(key, '').replace(':', '').trim();
      extractedItem[key] = value;
    });

    return extractedItem;
  }

  function createStructuredItem(itemData) {
    let structuredItem = document.createElement('li');
    structuredItem.classList.add('inventory-item');

    let itemTitle = document.createElement('h4');
    itemTitle.textContent = itemData.Title || 'Untitled';

    let textContent = document.createElement('div');
    textContent.innerHTML = itemData.Text;
    textContent.classList.add('item-text');

    let itemMetadata = document.createElement('div');
    itemMetadata.classList.add('item-metadata');

    if (itemData.URL) {
      let url = document.createElement('p');
      url.classList.add('cartouche-url');
      url.innerHTML = `<strong>URL:&nbsp;</strong><a href="${itemData.URL}" target="_blank">${itemData.URL}</a>`;
      itemMetadata.appendChild(url);
    }

    for (let key in itemData.columns) {
      let item = document.createElement('p');
      item.innerHTML = `<strong>${key}: </strong> ${itemData.columns[key]}`;
      itemMetadata.appendChild(item);
    }

    let itemContent = document.createElement('div');
    itemContent.classList.add('item-content');
    itemContent.append(textContent);
    itemContent.append(itemMetadata);

    // Add the items to the structured item
    structuredItem.appendChild(itemTitle);
    structuredItem.appendChild(itemContent);

    //      return structuredItem;
  }

  restructureInventoryItems();
});
