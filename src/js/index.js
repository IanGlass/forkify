import Search from './models/Search';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import {elements, renderLoader, clearLoader} from './views/base';
import { Decipher } from 'crypto';

/** Global state of the app , stores objects containing promises
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes 
*/
const states = {};
window.states = states;

// window.test = new Recipes('chicken');
// window.test.getResults();

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
});

/** Adds an on-click event listener to switch pages when a button is pressed to paginate up to 10 recipes at a time.
 */
elements.searchResults.addEventListener('click', event => {
    // Get the button class
    const button = event.target.closest('.btn-inline');
    if (button) {
        searchView.renderResults(states.search.recipes, parseInt(button.dataset.goto, 10));
    }
});

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
        // Clear the recipe panel
        recipeView.clearRecipe();

        // Highlight the selected search item if there is one
        if (states.search) searchView.highlightSelected(id);

        // Render the recipe
        recipeView.renderRecipe(states.search.recipes[states.search.recipes.findIndex(recipe => recipe.id === id)], states.likes.isLiked(id));
    }
};

// Load a recipe when a recipe is chosen or the page is reloaded i.e. user saved page as bookmark
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// Add event listener to increase/decrease # of servings buttons on recipe page OR handle favourite recipe button OR handle add to shopping list button 
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

    // Grab the recipe id from the URL
    const id = window.location.hash.replace('#', '');

    // Add all the items from the current recipe to the shopping list
    states.search.recipes[states.search.recipes.findIndex(recipe => recipe.id === id)].ingredients.forEach(ingredient => {
        states.list.addItem(ingredient);
        // listView.renderItem(item);
    });
    listView.refreshList(states.list.items);
}

const controlLike = function() {
    if (!states.likes) {
        states.likes = new Likes();
    }

    // Grab the recipe id from the URL
    const id = window.location.hash.replace('#', '');
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
