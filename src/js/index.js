import Search from './models/Search';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import PHE from 'print-html-element';

import {elements, renderLoader, clearLoader} from './views/base';

/** Global state of the app , stores objects containing promises
 * - Search object containing all recipes
 * - Shopping list object
 * - Liked recipes 
*/
const states = {};

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


