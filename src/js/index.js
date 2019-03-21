import Search from './models/Search';
import * as searchView from './views/searchView';
import {elements, renderLoader, clearLoader} from './views/base';

/** Global state of the app , stores objects containing promises
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes 
*/
const states = {};

const controlSearch = async () => {
    const query = searchView.getInput();
    console.log(query);

    // If there is a query, then search
    if (query) {
        // Clear the recipe result list and clear the input
        searchView.clearResults();

        // Render loader to show search is happening
        renderLoader(elements.searchResults);

        states.search = new Search(query);

        await states.search.getResults();

        console.log(states.search.recipes);
        clearLoader();
        searchView.renderResults(states.search.recipes);
    }
}

elements.searchForum.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
})