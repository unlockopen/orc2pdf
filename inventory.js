document.addEventListener('DOMContentLoaded', () => {
  function restructureInventoryItems() {
    // Select all the items in the inventory
    const items = Array.from(document.querySelectorAll('li')).filter(item => item.querySelector('details'));

    items.forEach(item => {
      if (!item.parentElement.classList.contains('inventory-list')) {
        // Skip items that are not part of the inventory list
        item.parentElement.classList.add('inventory-list');
      }
      // Extract the data for the current item
      const extractedItem = extractItemData(item);

      // Create a new div element to hold the extracted item details
      const structuredItem = createStructuredItem(extractedItem);

      // Replace the original li item with the new structured item
      item.innerHTML = structuredItem.innerHTML;

    });
  }

  function extractItemData(item) {
    let extractedItem = { metadata: {} };

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

    // Remove the <details> block to avoid duplication
    let details = tempDiv.querySelector('details');
    if (details) details.remove();

    // Extract the cleaned HTML content as the Text block
    extractedItem.Text = tempDiv.innerHTML.trim();

    // Extract details from the unordered list inside the details element
    details = item.querySelector('details'); // Re-select <details> from the original item
    if (!details) return extractedItem;

    let ul = details.querySelector('ul');
    if (!ul) return extractedItem;

    ul.querySelectorAll('li').forEach(li => {
      let strong = li.querySelector('strong');
      if (!strong) return;

      let key = strong.textContent.replace(':', '').trim();
      let value = li.textContent.replace(key, '').replace(':', '').trim();

      if (key === 'Title') {
        extractedItem[key] = value;
      } else {
        extractedItem['metadata'][key] = value;
      }
    });

    return extractedItem;
  }

  function createStructuredItem(itemData) {
    // Create a new div element to hold the structured item
    let structuredItem = document.createElement('div');

    let itemTitle = document.createElement('h4');
    itemTitle.textContent = itemData.Title || 'Untitled';

    let textContent = document.createElement('div');
    textContent.innerHTML = itemData.Text;
    textContent.classList.add('item-text');

    let itemMetadata = document.createElement('div');
    itemMetadata.classList.add('item-metadata');

    for (let key in itemData.metadata) {
      let metadataItem = createLabeledMetadata(key, itemData.metadata[key]);
      itemMetadata.appendChild(metadataItem);
    }

    let itemContent = document.createElement('div');
    itemContent.classList.add('item-content');
    itemContent.append(textContent);
    itemContent.append(itemMetadata);

    // Add the items to the structured item
    structuredItem.appendChild(itemTitle);
    structuredItem.appendChild(itemContent);

    // replace the return value with a debug nessage
    return structuredItem;
  }

  function createLabeledMetadata(key, value) {
    // Create a new paragraph element for the metadata and add a label
    let labeledMetadata = document.createElement('p');
    let label = document.createElement('strong');
    label.textContent = key + ': ';
    labeledMetadata.appendChild(label);
    if (key === 'URL') {
      let link = document.createElement('a');
      link.href = value;
      link.textContent = value;
      labeledMetadata.appendChild(link);
    } else {
      labeledMetadata.appendChild(document.createTextNode(value));
    }
    return labeledMetadata;
  }

  function restructureTableOfContent() {
    // Select the table of contents by finding the first <h2> element and its following <ul>
    const tocHeader = document.querySelector('h2');
    if (!tocHeader) return;
    const tocList = tocHeader.nextElementSibling;
    if (!tocList || tocList.tagName !== 'UL') return;
    tocList.classList.add('table-of-content');
  };

  // Add 'table-of-content' class to the first <ul> after the first <h2>
  restructureTableOfContent();


  restructureInventoryItems();
});
