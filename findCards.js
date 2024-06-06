const mtgJsonData = require('mtgjson/AllPrintings.json'); // Load the MTG JSON data

// Find the HTML elements with the "card-name" class
const cardNameElements = document.querySelectorAll('.card-name');

// Create an event listener for each card name element
cardNameElements.forEach((cardNameElement) => {
    cardNameElement.addEventListener('mouseover', (event) => {
        // Get the card name from the hovered element
        const cardName = event.target.textContent;

        // Find the corresponding card data based on the card name
        const cardData = mtgJsonData.data.find((card) => card.name === cardName);

        // Check if a card image URL is available
        if (cardData && cardData.imageUrl) {
            // Create an image element
            const cardImage = new Image();
            cardImage.src = cardData.imageUrl;

            // Position the image element or display it in a tooltip
            // Example: Appending the image to the body
            document.body.appendChild(cardImage);
        }
    });
});
