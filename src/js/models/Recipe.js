import axios from 'axios';
import {key, proxy} from '../config';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
        try {
            const res = await axios(`${proxy}http://food2fork.com/api/get?key=${key}&rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.image = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
            this.calculateTime();
            this.calculateServings();
            this.standardizeIngredients();
        } catch (error){
            alert(error);
        }
    }

    // Calculates the cooking time assuming each three ingredients = 15 mins
    calculateTime() {
        const numberOfIngredients = this.ingredients.length;
        const periods = Math.ceil(numberOfIngredients/3);
        this.cookingTime = periods * 15;
    }

    calculateServings() {
        this.servings = 4;
    }

    standardizeIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounce', 'ounces', 'ozs', 'teaspoon', 'teaspoons', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort, 'kg','g'];
        this.ingredients = this.ingredients.map(element => {
            // Normalize units
            let ingredient = element.toLowerCase();
            unitsLong.forEach((unit, index) => {
                ingredient = ingredient.replace(unit, unitsShort[index]);
            })
            
            // Remove parenthesis
            ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");

            // Parse ingredients into count, unit and ingredient
            const arrayIngredients = ingredient.split(' ');
            // Find where in the array the unit is
            const unitIndex = arrayIngredients.findIndex(element2 => units.includes(element2));
            
            let objectIngredient;
            // This block deals with all the cases of recipe formats
            if (unitIndex > -1) {
                // Grab all the ingredient counts i.e. 1 or 2 1/2
                let count;
                const arrayCount = arrayIngredients.slice(0, unitIndex);
                if (arrayCount.length ===1 ) {
                    count = eval(arrayIngredients[0].replace('-', '+')).toFixed(2);
                } else {
                    count = eval(arrayIngredients.slice(0, unitIndex).join('+')).toFixed(2);
                }
                objectIngredient = {
                    count,
                    unit: arrayIngredients[unitIndex],
                    ingredient: arrayIngredients.slice(unitIndex + 1).join(' ')
                }

            } else if (parseInt(arrayIngredients[0], 10)) {
                // There is no unit but first element is a number
                objectIngredient = {
                    count: parseInt(arrayIngredients[0], 10),
                    unit: arrayIngredients.slice(1),
                    ingredient: arrayIngredients.slice(1).join(' ')
                }
            } else if (unitIndex === -1) {
                objectIngredient = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            }

            return objectIngredient;
        });
    }

    // Increase or decrease the ingredients count based on the number of servings
    updateServings (type) {
        const newServings = type === 'dec' ? this.servings - 1: this.servings + 1;

        this.ingredients.forEach(ingredient => {
            ingredient.count = ingredient.count * (newServings / this.servings);
        })

        this.servings = newServings;
    }
}