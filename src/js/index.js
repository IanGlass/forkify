import Search from './models/Search';
import * as searchView from './views/searchView';
import {elements} from './views/base';

/** Global state of the app 
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

        states.search = new Search(query);

        await states.search.getResults();

        console.log(states.search.recipes);
        searchView.renderResults(states.search.recipes);
    }
}

elements.searchForum.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
})