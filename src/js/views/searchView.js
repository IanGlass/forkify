import {elements} from './base'

export const getInput = () => elements.searchInput.value;

export const limitRecipeTitle = (title, limit = 17) => {
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

// Render a single recipe, which will be called in a loop to render all recipes
const renderRecipe = recipe => {
    const markup = `
    <li>
        <a class="results__link results__link" href="#${recipe.recipe_id}">
            <figure class="results__fig">
                <img src=${recipe.image_url} alt="${recipe.title}">
            </figure>
            <div class="results__data">
                <h4 class="results__name">${limitRecipeTitle(recipe.title)}</h4>
                <p class="results__author">${recipe.publisher}</p>
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

// Renders the buttons to change pages on the recipes list
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

export const clearResults = () => {
    // Clear the input field
    elements.searchInput.value = '';

    // Clear all results in recipe list
    elements.searchResultList.innerHTML = '';

    // Clear the buttons
    elements.searchResultsPages.innerHTML = '';
};

export const highlightSelected = id => {
    // Remove any highlighted items first
    const resultsArray = Array.from(document.querySelectorAll('.results__link'));
    resultsArray.forEach(element => {
        element.classList.remove('results__link--active');
    })

    // Select the element with the id href attribute
    document.querySelector(`.results__link[href="#${id}"]`).classList.add('results__link--active');
};