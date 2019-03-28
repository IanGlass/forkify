import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import {elements, renderLoader, clearLoader} from './views/base';

/** Global state of the app , stores objects containing promises
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes 
*/
const states = {};

/** Controls the search recipe function and displays the list of recipes found.
 */
const controlSearch = async () => {
    const query = searchView.getInput();

    // If there is a query, then search
    if (query) {
        // Clear the recipe result list and clear the input
        searchView.clearResults();

        // Render loader to show search is happening
        renderLoader(elements.searchResults);

        states.search = new Search(query);

        await states.search.getResults();

        clearLoader();
        searchView.renderResults(states.search.recipes);
    }
}

/** Initiates a search when enter is pressed.
 */
elements.searchForum.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
})

/** Adds an on-click event listener to switch pages when a button is pressed to paginate up to 10 recipes at a time.
 */
elements.searchResults.addEventListener('click', event => {
    // Get the button class
    const button = event.target.closest('.btn-inline');
    if (button) {
        searchView.renderResults(states.search.recipes, parseInt(button.dataset.goto, 10));
    }
})

// Restore status of likes on page load
window.addEventListener('load', () => {
    states.likes = new Likes();

    // Restore the likes states
    states.likes.readStorage();

    // Toggle the likes menu if any likes are present
    likesView.toggleLikeMenu(states.likes.getNumberLikes());

    // Render the current likes status
    states.likes.likes.forEach(like => likesView.renderLike(like));
});

const controlRecipe = async () => {
    // Grab the recipe id from the URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Clear the recipe before adding loader
        recipeView.clearRecipe();

        // Highlight the selected search item if there is one
        if (states.search) searchView.highlightSelected(id);

        // Load spinner while fetching the recipe
        renderLoader(elements.recipe);

        states.recipe = new Recipe(id);

        // states.recipe.author = "The Pioneer Woman";
        // states.recipe.cookingTime = 90;
        // states.recipe.id = "46956";
        // states.recipe.image = "http://static.food2fork.com/fruitpizza9a19.jpg";
        // states.recipe.ingredients = [
        //         {count: "1.33", unit: "cup", ingredient: "shortening"},
        //         {count: "1.50", unit: "cup", ingredient: "sugar"},
        //         {count: "1.00", unit: "tsp", ingredient: "orange zest"},
        //         {count: "1.00", unit: "tsp", ingredient: "vanilla"},
        // ];
        // states.recipe.length = 17;
        // states.recipe.servings = 4;
        // states.recipe.title = "Deep Dish Fruit Pizza";
        // states.recipe.url = "http://thepioneerwoman.com/cooking/2012/01/fruit-pizza/";

        try {
            await states.recipe.getRecipe();

            // Render the recipe
            clearLoader(elements.recipe);
            recipeView.renderRecipe(states.recipe, states.likes.isLiked(id));
        } catch (error) {
            alert('Error processing recipe! \nLikely an invalid recipe ID');
        }
    }
};

// Load a recipe when a recipe is chosen or the page is reloaded i.e. user saved page as bookmark
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// Add event listener to increase/decrease # of servings buttons on recipe page OR handle favourite recipe button OR handle add to shopping list button 
elements.recipe.addEventListener('click', event => {
    if (event.target.matches('.btn-decrease, .btn-decrease *') && states.recipe.servings > 1) {
        states.recipe.updateServings('dec');
        recipeView.updateServings(states.recipe);
    } else if (event.target.matches('.btn-increase, .btn-increase *')) {
        states.recipe.updateServings('inc');
        recipeView.updateServings(states.recipe);
    } else if (event.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlShoppingList();
    } else if (event.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
})

const controlShoppingList = function() {
    // Only create a new list if it doesn't exist or lose all previous information
    if (!states.list) {
        states.list = new List();
    }

    // Add all the items from the current recipe to the shopping list
    states.recipe.ingredients.forEach(ingredient => {
        const item = states.list.addItem(ingredient);
        listView.renderItem(item);
    });
}

const controlLike = function() {
    if (!states.likes) {
        states.likes = new Likes();
    }
    const currentID = states.recipe.id;
    // Handle if recipe has been liked yet or not
    console.log(states);
    if (!states.likes.isLiked(currentID)) {
        const newLike = states.likes.addLike(
            currentID, 
            states.recipe.title, 
            states.recipe.author, 
            states.recipe.image
        );
        likesView.toggleLikeButton(true);

        likesView.renderLike(newLike);
    } else {
        states.likes.deleteLike(currentID);
        likesView.toggleLikeButton(false);
        likesView.deleteLike(currentID);
    }

    // Toggle if the likes menu should be shown yet
    likesView.toggleLikeMenu(states.likes.getNumberLikes());

}

// Handle delete and update shopping list item events
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
})

