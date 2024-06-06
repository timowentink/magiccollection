const csvFileUrls = [
    'Manabox_Collection_Mitch.csv',
    'Manabox_Collection_Timo.csv',
    'Manabox_Collection_Jorrit.csv',
    'Manabox_Collection_Job.csv',
];

const collectionTables = document.getElementById('collectionTables');

let currentOverlay = null;
let dataTable = null;

function loadCSVFiles() {
    collectionTables.innerHTML = '';
    const mergedCollection = [];

    csvFileUrls.forEach((url) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: async function (results) {
                const collectorName = extractCollectorName(url);
                for (const row of results.data) {
                    row['Collector'] = collectorName;
                    mergedCollection.push(row);
                }
                if (csvFileUrls.indexOf(url) === csvFileUrls.length - 1) {
                    createMergedTable(mergedCollection);
                }
            },
        });
    });
}

async function getCardDetails(scryfallId) {
    try {
        const response = await fetch(`https://api.scryfall.com/cards/${scryfallId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch card details');
        }
        const cardData = await response.json();

        let imageUrl = '';
        if (cardData.layout === 'double_faced_token' || cardData.layout === 'transform' || cardData.layout === 'modal_dfc' || cardData.layout === 'modal_reversible_card') {
            // Use the first face of the card
            imageUrl = cardData.card_faces[0].image_uris.normal;
        } else {
            imageUrl = cardData.image_uris.normal;
        }

        const price = cardData.prices && cardData.prices.eur;
        return { imageUrl, price: price ? `\u20AC${price}` : 'N/A' };
    } catch (error) {
        console.error('Error fetching card details:', error);
        return { imageUrl: '', price: 'N/A' };
    }
}



function extractCollectorName(url) {
    const matches = url.match(/(.+\/|^)Manabox_Collection_(.+)\.csv$/);
    if (matches && matches.length > 2) {
        return matches[2];
    }
    return 'Unknown Collector';
}

function createMergedTable(mergedCollection) {
    const table = document.createElement('table');
    table.id = 'example';
    table.className = 'display';

    const columnsToDisplay = [
        'Collector',
        'Name',
        'Foil',
        'Quantity',
        'Set code',
        'Collector number',
        'Rarity',
        'Binder Name',
    ];

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    columnsToDisplay.forEach((column) => {
        const th = document.createElement('th');
        th.textContent = column === 'Collector number' ? '#' : column;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const columns = table.querySelectorAll('th');

    // Create a footer row for individual column search
    const tfoot = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    columnsToDisplay.forEach((column, index) => {
        const th = document.createElement('th');

        footerRow.appendChild(th);
    });

    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);

    const tbody = document.createElement('tbody');
    mergedCollection.forEach((row) => {
        const tr = document.createElement('tr');
        columnsToDisplay.forEach(async (column) => {
            const td = document.createElement('td');
            if (column === 'Name') {
                const iconContainer = document.createElement('i');
                iconContainer.className = 'ph ph-eye';

                const anchor = document.createElement('a');
                anchor.href = '#';

                iconContainer.addEventListener('click', async (event) => {
                    event.preventDefault();
                    if (row['Scryfall ID']) {
                        const { imageUrl, price } = await getCardDetails(row['Scryfall ID']);
                        if (imageUrl) {
                            displayImageOverlay(imageUrl, price, anchor);
                        }
                    }
                });

                anchor.appendChild(iconContainer);
                td.appendChild(anchor);

                td.appendChild(document.createTextNode(row['Name']));
            } else if (column === 'Foil') {
                if (row['Foil'].toLowerCase() === 'foil') {
                    td.innerHTML = '<span class="foil">foil</span>';
                } else if (row['Foil'].toLowerCase() === 'normal') {
                    td.innerHTML = '<span class="normal">normal</span>';
                } else if (row['Foil'].toLowerCase() === 'etched') {
                    td.innerHTML = '<span class="etched">etched</span>';
                } else {
                    td.textContent = row[column];
                }
            } else if (column === 'Rarity') {
                const rarityValue = row['Rarity'].toLowerCase();
                switch (rarityValue) {
                    case 'common':
                        td.innerHTML = '<span class="common">C</span>';
                        break;
                    case 'uncommon':
                        td.innerHTML = '<span class="uncommon">U</span>';
                        break;
                    case 'rare':
                        td.innerHTML = '<span class="rare">R</span>';
                        break;
                    case 'mythic':
                        td.innerHTML = '<span class="mythic">M</span>';
                        break;
                    default:
                        td.textContent = row[column];
                }
            } else {
                td.textContent = row[column];
            }
            tr.appendChild(td);
        });

        tr.classList.add(`collector-${row['Collector'].replace(/\s/g, '-')}`);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    collectionTables.appendChild(table);

    // Initialize DataTables with additional options
    dataTable = $(table).DataTable({
        paging: true,
        initComplete: function () {
            this.api().columns().every(function () {
                const column = this;
                const title = column.header().textContent;

                const input = document.createElement('input');
                input.placeholder = `Search ${title}`;
                column.footer().appendChild(input);

                input.addEventListener('keyup', function () {
                    if (column.search() !== this.value) {
                        column.search(this.value).draw();
                    }
                });
            });
        },
        fixedHeader: {
            header: true,
            footer: true
        }
    });
}


function displayImageOverlay(imageUrl, price, anchor) {
    if (currentOverlay) {
        document.body.removeChild(currentOverlay);
        currentOverlay = null;
    }

    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    const img = document.createElement('img');
    img.src = imageUrl;
    overlay.appendChild(img);

    // Display card price
    const priceDiv = document.createElement('div');
    priceDiv.className = 'card-price';
    priceDiv.textContent = `Price: ${price}`;
    overlay.appendChild(priceDiv);

    document.body.appendChild(overlay);

    currentOverlay = overlay;

    document.body.addEventListener('click', (event) => {
        if (currentOverlay && !overlay.contains(event.target) && anchor !== event.target) {
            document.body.removeChild(overlay);
            currentOverlay = null;
        }
    });

    const rect = anchor.getBoundingClientRect();
    overlay.style.top = rect.bottom + 'px';
    overlay.style.left = rect.left + 'px';
}
loadCSVFiles();
