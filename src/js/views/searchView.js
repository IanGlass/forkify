import {elements} from './base'

/**
 * Returns the user input of the search panel.
 */
export const getInput = () => elements.searchInput.value;

/**
 * Reduces the size of a recipe title so it fits in the 
 * @param {String} title Title of the current recipe.
 * @param {Number} limit Maximum title length to show.
 */
export const limitRecipeTitle = (title, limit = 25) => {
    const newTitle = [];
    if (title.length > limit) {
        title.split(' ').reduce((acc, curr) => {
            if (acc + curr.length <= limit) {
                newTitle.push(curr);
            }
            return acc + curr.length;
        }, 0)
        return `${newTitle.join(' ')} ...`;
    }
    return title;
}

/**
 * Returns the diet and health label 
 */
export const getLabels = () => {

    let diet;
    for (let index = 0; index < elements.dietPanel.children.length; index++) {
        if (JSON.parse(elements.dietPanel.children[index].dataset.active)) {
            diet = elements.dietPanel.children[index].id;
        }
    }

    let health;
    for (let index = 0; index < elements.healthPanel.children.length; index++) {
        if (JSON.parse(elements.healthPanel.children[index].dataset.active)) {
            health = elements.healthPanel.children[index].id;
        }
    }

    return {
        diet,
        health
    }
}

/**
 * Render a single recipe, which will be called in a loop to render all recipes
 * @param {Object} recipe Single recipe object to add to the recipes panel
 */
const renderRecipe = recipe => {
    const markup = `
    <li>
        <a class="results__link results__link" href="#${recipe.id}">
            <figure class="results__fig">
                <img src=${recipe.image} alt="${recipe.label}">
            </figure>
            <div class="results__data">
                <h4 class="results__name">${limitRecipeTitle(recipe.label)}</h4>
                <p class="results__labels"><b>diet</b>:${recipe.dietLabels.toString()}</p>
                <p class="results__labels"><b>health</b>:${recipe.healthLabels.toString()}</p>
                <p class="results__labels"><b>caution</b>:${recipe.cautions.toString()}</p>
            </div>
        </a>
    </li>`;
    elements.searchResultList.insertAdjacentHTML('beforeend', markup);
}

/** Creates a prev or next button to navigate the recipes list. Uses HTML data attributes to store the current page number.
 * @param {string} page The current page number being displayed.
 * @param {string} type The type of button either prev or next.
 */
const createButton = (page, type) => `
                <button class="btn-inline results__btn--${type}" data-goto=${type === 'prev' ? page - 1 : page + 1}>
                    <span>Page ${type === 'prev' ? page - 1 : page + 1}</span>
                    <svg class="search__icon">
                        <use href="img/icons.svg#icon-triangle-${type === 'prev' ? 'left' : 'right'}"></use>
                    </svg>
                </button>
`;

/**
 * Renders the buttons to change pages on the recipes list
 * @param {Number} page The current page number being viewed.
 * @param {Number} numberOfResults The total number of recipes.
 * @param {Number} resultsPerPage The pagination number.
 */
const renderButtons = (page, numberOfResults, resultsPerPage) => {
    // Round the total number of pages up to ensure there are enough to show all results
    const numberOfPages = Math.ceil(numberOfResults/resultsPerPage);
    
    let button;
    // Determine if we should render the next and/or back a page buttons
    if (page === 1 && numberOfPages > 1) {
        button = createButton(page, 'next');
    } else if (page < numberOfPages) {
        button = `
            ${createButton(page, 'prev')}
            ${createButton(page, 'next')}
        `
    } else if (page === numberOfPages && numberOfPages > 1) {
        button = createButton(page, 'prev')
    }

    elements.searchResultsPages.insertAdjacentHTML('afterbegin', button);
}

/**
 * Renders the entire recipes panel.
 * @param {Array} recipes Array containing the entire list of recipes fetched from Edamam.
 * @param {Number} page The current page number being viewed.
 * @param {Number} resultsPerPage Pagination number.
 */
export const renderResults = (recipes, page = 1, resultsPerPage = 10) => {
    // Make sure recipes list is cleared before populating
    clearResults();

    // Used to determine where in the recipes matrix to begin and end displaying i.e. pagination
    const start = (page - 1) * resultsPerPage;
    const end = page * resultsPerPage;

    // Increment through recipe list and render each one within pagination constraints
    recipes.slice(start, end).forEach(element => renderRecipe(element));

    renderButtons(page, recipes.length, resultsPerPage);
}

/**
 * Clears the search field, recipes panel and recipes navigation buttons
 */
export const clearResults = () => {
    // Clear the input field
    elements.searchInput.value = '';

    // Clear all results in recipe list
    elements.searchResultList.innerHTML = '';

    // Clear the buttons
    elements.searchResultsPages.innerHTML = '';
};

/**
 * Highlights the currently selected recipe in the recipes panel.
 * @param {String} id The id of the recipe to highlight. 
 */
export const highlightSelected = id => {
    // Remove any highlighted items first
    const resultsArray = Array.from(document.querySelectorAll('.results__link'));
    resultsArray.forEach(element => {
        element.classList.remove('results__link--active');
    })

    // Select the element with the id href attribute
    document.querySelector(`.results__link[href="#${id}"]`).classList.add('results__link--active');
};
