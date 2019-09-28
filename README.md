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

<p align="center">
https://all-the-food.herokuapp.com/
</p>

## Search and Recipes

<p align="center">
<img src="https://github.com/IanGlass/all-the-food/blob/master/recipes_panel.png" width="300">
</p>

<details>
<summary>Search Controller</summary>
The search controller is essentially the entry point for app functionality. An event listener is attached to the search button and return key, to call the `controlSearch` function. This renders a rotating loader while `controlSearch` fetches the search query, health and diet parameters and makes an AJAX call to fetch the recipes. When this promise returns, the loader is removed and the recipes panel is populated using the `searchView`.

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

/**
 * Deals with diet filter dropdown buttons
 */
elements.dietPanel.addEventListener('click', event => {
    // Turn all buttons off first, forEach not working ???
    for (let index = 0; index < event.target.parentElement.children.length; index++) {
        event.target.parentElement.children[index].dataset.active = false;
        event.target.parentElement.children[index].style.backgroundImage = "linear-gradient(to right bottom, white, black)";
    }
    // Activate the selected button
    event.target.dataset.active = true;
    event.target.style.backgroundImage = "linear-gradient(to right bottom, #FBDB89, #F48982)";

    // Change diet-btn text to selected filter
    document.querySelector('.diet-btn').textContent = event.target.textContent === 'None' ? 'Diet Filter' : event.target.textContent;
});

/**
 * Deals with health filter dropdown buttons
 */
elements.healthPanel.addEventListener('click', event => {
    // Turn all buttons off first, forEach not working ???
    for (let index = 0; index < event.target.parentElement.children.length; index++) {
        event.target.parentElement.children[index].dataset.active = false;
        event.target.parentElement.children[index].style.backgroundImage = "linear-gradient(to right bottom, white, black)";
    }
    // Activate the selected button
    event.target.dataset.active = true;
    event.target.style.backgroundImage = "linear-gradient(to right bottom, #FBDB89, #F48982)";

    // Change health-btn text to selected filter
    document.querySelector('.health-btn').textContent = event.target.textContent === 'None' ? 'Health Filter' : event.target.textContent;
});

/**
 * Prompts the print from browser to only print the current shopping list
 */
document.querySelector('.print-btn').addEventListener('click', event => {
    PHE.printElement(document.querySelector('.shopping'));
});
```

</details>

<details>
<summary>Search Model</summary>

The `Search` model begins by fetching a list of recipes based on pre-defined search parameters and storing them in the `Search` object. For each recipe, the ingredients are standardized to ensure they fit in a format that is compatible with the rest of the app. Recipes who's ingredients could not be standardized are initialised with an empty ingredients list, which allows the recipe to be removed from the list in `tidyRecipes`. Recipes are given a unique ID and their number of servings is mapped out into recipe.servings.
```javascript
/**
 * The search object is used to create an initiate an AJAX call to fetch recipes and store the digested recipes in an array.
 */
export default class Search {
    constructor(query, diet, health) {
        this.query = query;
        this.diet = diet;
        this.health = health
    }

    /**
     * Asynchronous call to the edamam API to fetch a list of recipes based on the search query, health label and diet label.
     */
    async getResults() {
        try {
            const res = await axios(`${proxy}https://api.edamam.com/search?q=${this.query}&app_id=${id}&app_key=${key}&from=0&to=50${this.diet === 'none' ? '': '&diet=' + this.diet}${this.health === 'none' ? '': '&health=' + this.health}`);
            this.recipes = res.data.hits.map(hit => hit.recipe);
            this.recipes.forEach((recipe, index) => this.recipes[index].ingredients = this.standardizeIngredients(recipe.ingredientLines));
            this.tidyRecipes();
            this.createIDs();
            this.storeServings();
        } catch (error) {
            alert(error);
        }
    };

    /**
     * Removes any recipes which have an ingredient length of zero, indicating the recipe was not digested properly.
     */
    tidyRecipes() {
        this.recipes = this.recipes.filter(recipe => recipe.ingredients.length > 0);
    }

    /**
     * Stores the yield property into a servings property for tidiness.
     */
    storeServings() {
        this.recipes.forEach((recipe, index) => this.recipes[index].servings = this.recipes[index].yield);
    }

    /**
     * Creates unique IDs from the provided URIs
     */
    createIDs() {
        this.recipes.forEach((recipe, index) => this.recipes[index].id = recipe.uri.substring(recipe.uri.indexOf('_') + 1, recipe.uri.length));
    }

    /**
     * Formats the ingredients list for each recipe into a form compatible with this program. Failed conversions return an empty ingredient list which is later used to completely remove the recipe from the recipes list.
     * @param {Array} ingredients Array containing the ingredients list for a particular recipe.
     */
    standardizeIngredients(ingredients) {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounce', 'ounces', 'ozs', 'teaspoon', 'teaspoons', 'cups', 'pounds', 'pound', 'grams', 'gram', 'tsps'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'lbs', 'lbs', 'lbs', 'g', 'g', 'ml', 'tsp'];
        const units = [...unitsShort, 'kg','g'];

        try {
            ingredients = ingredients.map(element => {
                // Normalize units
                let ingredient = element.toLowerCase();
                unitsLong.forEach((unit, index) => {
                    ingredient = ingredient.replace(unit, unitsShort[index]);
                });
                
                // Remove parenthesis and contents
                ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");

                // Deal with bad unicode fractions
                ingredient = ingredient.replace(String.fromCharCode(188), ' 1/4');
                ingredient = ingredient.replace(String.fromCharCode(189), ' 1/2');
                ingredient = ingredient.replace(String.fromCharCode(190), ' 3/4');
                ingredient = ingredient.replace(String.fromCharCode(8532), ' 2/3');

                // First remove any trailing units which are suggestive at the end of recipes which breaks things i.e. 1 chicken, about 2-8 pounds AND separate unit from count if they aren't spaced properly
                unitsShort.forEach((unit) => {
                    const commaIndex = ingredient.indexOf(',');
                    // If there is a comma then there may be more information with extra units
                    if (commaIndex > - 1){
                        const ind = ingredient.substring(commaIndex, ingredient.length).indexOf(unit);
                        // If the extra unit has been found, then remove everything after the comma for cleaness
                        if (ind > - 1) {
                            ingredient = ingredient.replace(ingredient.substring(commaIndex, ingredient.length), '');
                        }
                    }

                    const unitIndex = ingredient.indexOf(unit);
                    // If unit found
                    if (unitIndex > 0) {
                        // If there isn't a space before the unit AND there is a space after (for checking 'g'), add one
                        if (ingredient[unitIndex - 1] !== ' ' && ingredient[unitIndex + 1] === ' ') {
                            ingredient = ingredient.slice(0, unitIndex) + ' ' + ingredient.slice(unitIndex);
                        }
                    }
                });

                // Parse ingredients into count, unit and ingredient
                const arrayIngredients = ingredient.split(' ');

                // Remove any white space from the beginning of the ingredient
                if (arrayIngredients[0] === "") arrayIngredients.shift();

                // Find where in the array the unit is
                const unitIndex = arrayIngredients.findIndex(element2 => units.includes(element2));

                let objectIngredient;
                // This block deals with all the cases of recipe formats
                if (unitIndex > -1) {
                    // Grab all the ingredient counts i.e. 1 or 2 1/2
                    let count = '';
                    const arrayCount = arrayIngredients.slice(0, unitIndex);
                    if (arrayCount.length === 1 ) {
                            count = eval(arrayIngredients[0].replace('-', '+')).toFixed(2);
                    } else {
                        count = eval(arrayIngredients.slice(0, unitIndex).join('+')).toFixed(2);
                    }
                    // Something went wrong in count conversion
                    if (count == 0) {
                        count = arrayIngredients[0];
                    }
                    objectIngredient = {
                        count,
                        unit: arrayIngredients[unitIndex],
                        ingredient: arrayIngredients.slice(unitIndex + 1).join(' ')
                    }

                } else if (parseFloat(arrayIngredients[0], 10)) {
                    // There is no unit but first element is a number
                    objectIngredient = {
                        count: parseFloat(arrayIngredients[0], 10),
                        unit: '',
                        ingredient: arrayIngredients.slice(1).join(' ')
                    }
                } else if (unitIndex === -1) {
                    objectIngredient = {
                        count: 1,
                        unit: '',
                        ingredient: ingredient.replace(',', '')
                    }
                }

                // Some post splitting tidy ups
                objectIngredient.ingredient = objectIngredient.ingredient.replace('-', '').replace('-', '');
                // Remove any starting white space
                if (objectIngredient.ingredient[0] === ' ') objectIngredient.ingredient = objectIngredient.ingredient.substring(1, ingredient.length);

                return objectIngredient;
            });
            return ingredients;
        } catch(error) {
            return []
        }
    };

    /**
     * Updates the number of servings and the count of each ingredient for a recipe.
     * @param {String} id ID of the recipe to update
     * @param {String} type One of 'dec' or 'inc' indicating if the number of servings should increment or decrement by one.
     */
    updateServings (id, type) {
        const index = this.recipes.findIndex(recipe => recipe.id === id);

        const newServings = type === 'dec' ? this.recipes[index].servings - 1: this.recipes[index].servings + 1;

        this.recipes[index].ingredients.forEach(ingredient => {
            ingredient.count = ingredient.count * (newServings / this.recipes[index].servings);
        })

        this.recipes[index].servings = newServings;
    };
}
```

</details>

<details>
<summary>Search View</summary>
The `searchView` containes all the methods for reading an manipulating the search and recipes panel. `getInput` and `getLabels` are called from `controlRecipe` to get the search query and search parameters. Once the `Search` model has digested the recipe list, `renderResults` gets called by `controlRecipe` which renders each recipe individually, limits their display title length, and renders the recipe navigation buttons. 

```javascript
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
```
</details>

## Recipe
The recipes panel shares information with the search controller in the search model, which has the list of digested recipes stored.

<p align="center">
<img src="https://github.com/IanGlass/all-the-food/blob/master/recipe.png" width="500">
</p>

<details>
<summary>Recipe Controller</summary>
`controlRecipe` gets called on a URL hash change, which contains the id of the recipe to view when a recipe from the recipes panel is clicked. At this point the recipe view gets cleared and the recipe gets rendered.

```javascript
/**
 * Loads the recipe selected from the recipes panel into the main recipe view
 */
const controlRecipe = () => {
    // Grab the recipe id from the URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Clear the recipe panel
        recipeView.clearRecipes();

        // Highlight the selected search item if there is one
        if (states.search) searchView.highlightSelected(id);

        // Render the recipe
        recipeView.renderRecipe(states.search.recipes[states.search.recipes.findIndex(recipe => recipe.id === id)], states.likes.isLiked(id));
    }
};

// Load a recipe when a recipe is chosen
['hashchange'].forEach(event => window.addEventListener(event, controlRecipe));

/** 
 * Adds an on-click event listener to switch pages when a button is pressed to paginate up to 10 recipes at a time.
 */
elements.searchResults.addEventListener('click', event => {
    // Get the button class
    const button = event.target.closest('.btn-inline');
    if (button) {
        searchView.renderResults(states.search.recipes, parseInt(button.dataset.goto, 10));
    }
});
```

</details>

<details>
<summary>Recipe View</summary>
`renderRecipe` gets called by `controlRecipe`, displaying the recipe title, image, cooking time, servings, its like status, URL to the original recipe and then loops through the ingredients array, calling `createIngredient` for every ingredient. For each call of `createIngredient`, `formatCount` is called to turn the ingredient count into a human readable fraction. `updateServings` is attached to the buttons next to the number of servings, in increments/decrements the number of servings respectively.

```javascript
/**
 * Removes all the recipes from the recipe search panel.
 */
export const clearRecipes = () => {
    elements.recipe.innerHTML = '';
};

/** Formats the count of an ingredient into a human readable fraction. Gets called for every recipe in createIngredient().
 * @param {Integer} count The value to be formated into a human readable fraction.
 * @return {String} The human readable fraction.
 */
const formatCount = count => {
    if (count) {
        // Disseminate count into an integer and decimal number for fractional formatting 
        const [int, dec] = count.toString().split('.').map(element => parseInt(element, 10));

        if (!dec) {
            return count;
        } else if (int === 0) {
            const fraction = new Fraction(count);
            return `${fraction.numerator}/${fraction.denominator}`;
        } else {
            const fraction = new Fraction(count - int);
            return `${int} ${fraction.numerator}/${fraction.denominator}`;
        }
    }
    return '?';
};

 /**
  * Returns the markUp for a single ingredient for a recipe. Called from renderRecipe().
  * @param {Object} ingredient The ingredient object to be rendered.
  */
const createIngredient = ingredient => `
    <li class="recipe__item">
        <svg class="recipe__icon">
            <use href="img/icons.svg#icon-check"></use>
        </svg>
        <div class="recipe__count">${formatCount(ingredient.count)}</div>
        <div class="recipe__ingredient">
            <span class="recipe__unit">${ingredient.unit}</span>
            ${ingredient.ingredient}
        </div>
    </li>
`;

/**
 * Renders a single recipe into the recipe view.
 * @param {Object} recipe The recipe object to render.
 * @param {Boolean} isLiked Determines if the like button should be active or not. If the like already exists in the likes array.
 */
export const renderRecipe = (recipe, isLiked) => {
    const markUp = `
    <figure class="recipe__fig">
        <img src="${recipe.image}" alt="${recipe.label}" class="recipe__img">
        <h1 class="recipe__title">
            <span>${recipe.label}</span>
        </h1>
    </figure>

    <div class="recipe__details">
        <div class="recipe__info">
            <svg class="recipe__info-icon">
                <use href="img/icons.svg#icon-stopwatch"></use>
            </svg>
            <span class="recipe__info-data recipe__info-data--minutes">${recipe.totalTime}</span>
            <span class="recipe__info-text"> minutes</span>
        </div>
        <div class="recipe__info">
            <svg class="recipe__info-icon">
                <use href="img/icons.svg#icon-man"></use>
            </svg>
            <span class="recipe__info-data recipe__info-data--people">${recipe.servings}</span>
            <span class="recipe__info-text"> servings</span>

            <div class="recipe__info-buttons">
                <button class="btn-tiny btn-decrease">
                    <svg>
                        <use href="img/icons.svg#icon-circle-with-minus"></use>
                    </svg>
                </button>
                <button class="btn-tiny btn-increase">
                    <svg>
                        <use href="img/icons.svg#icon-circle-with-plus"></use>
                    </svg>
                </button>
            </div>

        </div>
        <button class="recipe__love">
            <svg class="header__likes">
                <use href="img/icons.svg#icon-heart${isLiked ? '' : '-outlined'}"></use>
            </svg>
        </button>
    </div>



    <div class="recipe__ingredients">
        <ul class="recipe__ingredient-list">
            ${recipe.ingredients.map(element => createIngredient(element)).join('')}
        </ul>

        <button class="btn-small recipe__btn--add">
            <svg class="search__icon">
                <use href="img/icons.svg#icon-shopping-cart"></use>
            </svg>
            <span>Add to shopping list</span>
        </button>
    </div>

    <div class="recipe__directions">
        <h2 class="heading-2">How to cook it</h2>
        <p class="recipe__directions-text">
            This recipe was carefully designed and tested. Please check out directions at their website.
        </p>
        <a class="btn-small recipe__btn" href="${recipe.url}" target="_blank">
            <span>Directions</span>
            <svg class="search__icon">
                <use href="img/icons.svg#icon-triangle-right"></use>
            </svg>

        </a>
    </div>
    `;
    elements.recipe.insertAdjacentHTML('afterbegin', markUp);
}

/**
 * Updates the number of servings in the currently displayed recipe.
 * @param {Object} recipe Recipe object containing the number of servings and ingredients array.
 */
export const updateServings = recipe => {
    // Update servings
    document.querySelector('.recipe__info-data--people').textContent = recipe.servings;

    const countElements = Array.from(document.querySelectorAll('.recipe__count'));
    countElements.forEach((element, index) => {
        element.textContent = formatCount(recipe.ingredients[index].count);
    })
}
```
</details>

## Shopping List

<p align="center">
<img src="https://github.com/IanGlass/all-the-food/blob/master/shopping.png" width="300">
</p>

<details>
<summary>Shopping Controller</summary>

The `controlShoppingList` controller only gets invoked when one of the 'Add to shopping list' button on one of the recipes gets clicked. The same event listener also controls increase and decrease of the number of servings using the `search` model and updates the `recipeView` by first reading the current recipe id from the URL. `controlShoppingList` calls the `list` model for each ingredient in the current recipe and then re-renders the entire shopping list. An event listener is also attached to the shopping list to remove a particular shopping list item through `list.deleteItem` or update the count of an item using `list.updateCount`.

```javascript
/**
 * Add event listener to increase/decrease # of servings buttons on recipe page OR handle favourite recipe button OR handle add to shopping list button
 */
elements.recipe.addEventListener('click', event => {
    // Grab the recipe id from the URL
    const id = window.location.hash.replace('#', '');
    const currentRecipe = states.search.recipes[states.search.recipes.findIndex(recipe => recipe.id === id)];
    
    if (event.target.matches('.btn-decrease, .btn-decrease *') && currentRecipe.servings > 1) {
        states.search.updateServings(id, 'dec');
        recipeView.updateServings(currentRecipe);
    } else if (event.target.matches('.btn-increase, .btn-increase *')) {
        states.search.updateServings(id, 'inc');
        recipeView.updateServings(currentRecipe);
    } else if (event.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlShoppingList(id);
    } else if (event.target.matches('.recipe__love, .recipe__love *')) {
        controlLike(id);
    }
});

/**
 * Adds the currently selected recipe igredient list to the global states.list object and displays it in the shopping list
 */
const controlShoppingList = function(id) {
    // Only create a new list if it doesn't exist or lose all previous information
    if (!states.list) {
        states.list = new List();
    }

    // Add all the items from the current recipe to the shopping list
    states.search.recipes[states.search.recipes.findIndex(recipe => recipe.id === id)].ingredients.forEach(ingredient => {
        states.list.addItem(ingredient);
    });
    listView.refreshList(states.list.items);
}

/**
 * Handle delete and update shopping list item events
 */
elements.shopping.addEventListener('click', event => {
    const id = event.target.closest('.shopping__item').dataset.itemid;

    // Only delete if delete button was pressed
    if (event.target.matches('.shopping__delete, .shopping__delete *')) {
        states.list.deleteItem(id);

        listView.deleteItem(id);
    } else if (event.target.matches('.shopping__count-value')) {
        // Handle the count update in the shopping list
        const value = parseFloat(event.target.value, 10);
        states.list.updateCount(id, value);
    }
});
```

</details>

<details>
<summary>Shopping Model</summary>

The `shoppingList` model contains an array of objects containing all the current shopping list items. It also contains methods to add, delete and update a specific ingredient item.

```javascript
/**
 * Stores all the ingredients for all recipes which have been added and collates them
 */
export default class shoppingList {
    constructor() {
        this.items = [];
    }

    /**
     * Adds a single ingredient to the this.items array representing the entire shopping list. This may be called multiple times for a single recipe added to the shopping list. A unique id is generated for each shopping list item
     * @param {Object} ingredient The ingredient object to be added to the shopping list, consisting at minimum of count, unit and ingredient elements
     */
    addItem(ingredient) {
        // First check if we have a similar item already in the list and collate if units are also the same. Only want to find first match
        const index = this.items.findIndex(element => stringSimilarity.compareTwoStrings(element.ingredient, ingredient.ingredient) > 0.9);
        if (index > - 1 && (ingredient.unit === this.items[index].unit)) {
            this.items[index].count = (parseFloat(this.items[index].count) + parseFloat(ingredient.count));
        } else {
            const item = {
                id: uniqid(),
                count: ingredient.count,
                unit: ingredient.unit,
                ingredient: ingredient.ingredient
            };
            this.items.push(item);
        }
    }

    /**
     * Removes an item from the shopping list model
     * @param {String} id Id of the item to be removed
     */
    deleteItem(id) {
        this.items.splice(this.items.findIndex(element => element.id === id), 1);
    }

    /**
     * Updates the count of an ingredient
     * @param {String} id The id of the shopping list item to be updated
     * @param {String} newCount The new count of the shopping list item
     */
    updateCount(id, newCount) {
        this.items.find(element => element.id === id).count = newCount;
    }
}
```

</details>

<details>
<summary>Shopping View</summary>

The `listView` contains two methods: 
* One for refreshing the entire shopping list by first removing all items and then iterating through the `list.items` array and rendering each item, and;
* One for removing an specific shopping list item from the view. 

```javascript
/**
 * Refreshes the entire shopping list whenever an update is made to the list model.
 * @param {Array} items Array of all the shopping list items.
 */
export const refreshList = items => {
    // First clear the current items in the view.
    elements.shopping.innerHTML = '';
    // Add all the items in the shopping list.
    items.forEach(item => {
        const markUp = `
        <li class="shopping__item" data-itemid=${item.id}>
            <div class="shopping__count">
                <input type="number" value="${item.count}" step="${item.count}" class="shopping__count-value">
                <p>${item.unit}</p>
            </div>
            <p class="shopping__description">${item.ingredient}</p>
            <button class="shopping__delete btn-tiny">
                <svg>
                    <use href="img/icons.svg#icon-circle-with-cross"></use>
                </svg>
            </button>
        </li>
    `;
    elements.shopping.insertAdjacentHTML('beforeend', markUp);
    });   
}

/**
 * Removes a single shopping list item from the shopping list.
 * @param {String} id  ID of the shopping list ingredient to remove from the view.
 */
export const deleteItem = id => {
    const item = document.querySelector(`[data-itemid="${id}"]`);
    if (item) {
        item.parentElement.removeChild(item);
    }
}
```
</details>

## Likes

<details>
<summary>Likes Controller</summary>

Like the shopping list controller (`controlShoppingList`), `controlLike` is attached to an on click event listener on the recipe display. When the like button is pressed on a particular recipe, the current recipe is fetched from the `search.recipes` array and a new like object is added to the `likes.likes` array IF the current recipe is not already liked. This is tested using the `isLiked` method in the `likes` model. If the recipe is already liked, then it is removed from the `likes.likes` array and the likes panel is updated accordingly.

```javascript
/**
 * Adds the currently selected recipe to the global states.likes object and renders the like panel if there is atleast one like
 */
const controlLike = function(id) {
    if (!states.likes) {
        states.likes = new Likes();
    }

    const currentRecipe = states.search.recipes[states.search.recipes.findIndex(recipe => recipe.id === id)];

    // Handle if recipe has been liked yet or not
    if (!states.likes.isLiked(id)) {
        const newLike = states.likes.addLike(
            id,
            currentRecipe.label, 
            currentRecipe.image,
            currentRecipe.dietLabels,
            currentRecipe.healthLabels,
            currentRecipe.cautions
        );
        likesView.toggleLikeButton(true);

        likesView.renderLike(newLike);
    } else {
        states.likes.deleteLike(id);
        likesView.toggleLikeButton(false);
        likesView.deleteLike(id);
    }

    // Toggle if the likes menu should be shown yet
    likesView.toggleLikeMenu(states.likes.getNumberLikes());

}

/**
 * Restore status of likes on page load
 */
window.addEventListener('load', () => {
    states.likes = new Likes();

    // Toggle the likes menu if any likes are present
    likesView.toggleLikeMenu(states.likes.getNumberLikes());

    // Render the current likes status
    states.likes.likes.forEach(like => likesView.renderLike(like));
});
```

</details>

<details>
<summary>Likes Model</summary>
The `likes` model has four methods:
* `addLike` - Adds a new like to the `likes` array;
* `deleteLike` - Removes the selected like from the `likes` array;
* `isLiked` - Returns a boolean if the current recipe is already liked, to decide if the current recipe should be added or removed from the `likes` array;
* `getNumberOfLikes` - Returns the length of the `likes` array, to determine if the likes panel should be displayed.

```javascript
/**
 * Stores the global liked recipes list which are displayed in the likes panel
 */
export default class Likes {
    constructor() {
        this.likes = [];
    }

    /**
     * Adds a new like object to the this.likes array when the like button is pressed on a particular recipe
     * @param {String} id The id of the particular like to add
     * @param {String} title The recipe title
     * @param {String} image URL to the recipe image
     * @param {Array} dietLabels Array of labels to describe dietary information of the recipe
     * @param {Array} healthLabels Array of labels to describe health information of the recipe
     * @param {Array} cautions Array of labels to describe cation information of the recipe
     */
    addLike(id, title, image, dietLabels, healthLabels, cautions) {
        const like = {
            id,
            title,
            image,
            dietLabels,
            healthLabels,
            cautions
        };
        this.likes.push(like);

        return like;
    }

    /**
     * Removes a like from the this.likes array if the like already exists
     * @param {String} id The id of the particular like to remove
     */
    deleteLike(id) {
        this.likes.splice(this.likes.findIndex(element => element.id === id), 1);
    }

    /**
     * Tests if the like exists in the this.likes array to update the like button when a recipe is rendered
     * @param {*} id The id of the particular like
     */
    isLiked(id) {
        return this.likes.findIndex(element => element.id === id) !== -1;
    }

    /**
     * Returns the current number of likes in the this.likes array
     */
    getNumberLikes() {
        return this.likes.length;
    }
}
```

</details>

<details>
<summary>Likes View</summary>

`toggleLikeButton` and `toggleLikeMenu` toggles whether the like button for the current recipe or the likes panel should be displayed respectively. Likewise, `renderLike` adds a single like to the likes panel and will be invoked once for every like in the `likes` array.

```javascript
/**
 * Toggles the like button of the currently displayed recipe if the recipe has been liked.
 * @param {Boolean} isLiked True/False if recipe has been liked.
 */
export const toggleLikeButton = isLiked => {
    const iconString = isLiked ? 'icon-heart' : 'icon-heart-outlined';
    document.querySelector('.recipe__love use').setAttribute('href', `img/icons.svg#${iconString}`);
};

/**
 * Displays/hides the menu if there are any likes or not.
 * @param {number} numberLikes Number of likes in the likes model.
 */
export const toggleLikeMenu = numberLikes => {
    elements.likesMenu.style.visibility = numberLikes > 0 ? 'visible' : 'hidden';
};

/**
 * Render a like in the likes panel. May be called multiple times depending on the number of likes in the likes model.
 * @param {Object} like Like object containing the id, title, image url, and any recipe labels.
 */
export const renderLike = like => {
    const markUp = `
    <li>
        <a class="likes__link" href="#${like.id}">
            <figure class="likes__fig">
                <img src="${like.image}" alt="${like.title}">
            </figure>
            <div class="likes__data">
                <h4 class="likes__name">${limitRecipeTitle(like.title)}</h4>
                <p class="results__labels"><b>diet</b>:${like.dietLabels.toString()}</p>
                <p class="results__labels"><b>health</b>:${like.healthLabels.toString()}</p>
                <p class="results__labels"><b>caution</b>:${like.cautions.toString()}</p>
            </div>
        </a>
    </li>
    `;
    elements.likesList.insertAdjacentHTML('beforeend', markUp);
};

/**
 * Removes a like from the likes panel if the recipe is unliked.
 * @param {String} id ID of the like to remove from the likes panel.
 */
export const deleteLike = id => {
    const element = document.querySelector(`.likes__link[href="#${id}"]`).parentElement;
    if (element) element.parentElement.removeChild(element);
}
```

</details>
