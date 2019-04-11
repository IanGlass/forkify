import uniqid from 'uniqid'
import stringSimilarity from 'string-similarity'

/**
 * Stores all the ingredients for all recipes which have been added and collates them
 */
export default class shoppingList {
    constructor() {
        this.items = [];
    }

    /**
     * Adds a single ingredient to the this.items array representing the entire shopping list. This may be called multiple times for a single recipe added to the shopping list. A unique id is generated for each shopping list item
     * @param {object} ingredient The ingredient object to be added to the shopping list, consisting at minimum of count, unit and ingredient elements
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
     * @param {string} id Id of the item to be removed
     */
    deleteItem(id) {
        this.items.splice(this.items.findIndex(element => element.id === id), 1);
    }

    /**
     * Updates the count of an ingredient
     * @param {string} id The id of the shopping list item to be updated
     * @param {string} newCount The new count of the shopping list item
     */
    updateCount(id, newCount) {
        this.items.find(element => element.id === id).count = newCount;
    }
}