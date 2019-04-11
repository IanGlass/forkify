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
```

#### Search Model
The `Search` model begins by fetching a list of recipes based on pre-defined search parameters and storing them in the `Search` object. For each recipe, the ingredients are standardized to ensure they fit in a format that is compatible with the rest of the app. Recipes who's ingredients could not be standards are initialised with an empty ingredients list, which allows the recipe to be removed from the list in `tidyRecipes`. Recipes are given a unique ID and their number of servings is mapped out into recipe.servings.
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
     * @param {array} ingredients Array containing the ingredients list for a particular recipe.
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
     * @param {string} id ID of the recipe to update
     * @param {string} type One of 'dec' or 'inc' indicating if the number of servings should increment or decrement by one.
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

