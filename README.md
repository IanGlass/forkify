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

        // Get the diet filter
        let diet;
        for (let index = 0; index < elements.dietPanel.children.length; index++) {
            if (JSON.parse(elements.dietPanel.children[index].dataset.active)) {
                diet = elements.dietPanel.children[index].id;
            }
        }

        // Get the health filter
        let health;
        for (let index = 0; index < elements.healthPanel.children.length; index++) {
            if (JSON.parse(elements.healthPanel.children[index].dataset.active)) {
                health = elements.healthPanel.children[index].id;
            }
        }
        
        states.search = new Search(query, diet, health);

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

#### Search Model
