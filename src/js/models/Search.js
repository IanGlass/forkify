import axios from 'axios';
import {id, key, proxy} from '../config';

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