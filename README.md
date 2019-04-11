# all-the-food

<p align="center">
<img src="https://github.com/IanGlass/all-the-food/blob/master/all-the-food.png" width="900">
</p>


all-the-food is a recipe searching website that makes use of the edamam recipe searching API to fetch a list of recipes based on some parameters:
* A query string such as 'pasta' or 'chicken';
* A diet parameter, which determines dietary preferences such as low-carb or low-fat;
* A health parameter, which determines dietary restrictions such as peanut-free or vegan.

Once a search is made, the recipes panel will be populated with a paginated list of recipes. A recipe can then be selected for viewing, including:
* An image of the recipe;
* Cooking time;
* Number of servings, which can be changed and updates the ingredients list;
* The ingredients list.

The recipe view also includes a link to the recipe origin for cooking instructions, allows the recipe to be added to a favourites list and allows the recipe ingredients to be added to a shopping list. The shopping list concatenates similar ingredients to make shopping easier and can be printed with the 'print shopping list' button.

https://all-the-food.herokuapp.com/

### Search

#### Search Controller
The search controller is essentially the entry point for app functionality. An event listener is attached to the search button and return key to call the `controlSearch` function. This renders a rotating loader while `controlSearch` fetches the search query, health and diet parameters and makes an AJAX call to fetch the recipes. When this promise returns, the loader is removed and the recipes panel is populated using the `searchView`.
```javascript
/** 
 * Controls the search recipe function and displays the list of recipes found.
 */
const controlSearch = async () => {
    const query = searchView.getInput();

    // If there is a query, then search
    if (query) {
        // Clear the recipe result list and clear the input
        searchView.clearResults();

        // Render loader to show search is happening
        renderLoader(elements.searchResults);

        // Get the diet and health filter
        let labels = searchView.getLabels();
        
        states.search = new Search(query, labels.diet, labels.health);

        await states.search.getResults();

        clearLoader();
        searchView.renderResults(states.search.recipes);
    }
}

/** 
 * Initiates a search when enter is pressed.
 */
elements.searchForum.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
});
```

#### Search View

```javascript
/**
 * Returns the user input of the search panel.
 */
export const getInput = () => elements.searchInput.value;

/**
 * Reduces the size of a recipe title so it fits in the 
 * @param {*} title 
 * @param {*} limit 
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

// Render a single recipe, which will be called in a loop to render all recipes
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
```

#### Search Model

