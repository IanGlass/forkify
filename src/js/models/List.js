import uniqid from 'uniqid'
import stringSimilarity from 'string-similarity'

export default class shoppingList {
    constructor() {
        this.items = [];
    }

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

    deleteItem(id) {
        this.items.splice(this.items.findIndex(element => element.id === id), 1);
    }

    updateCount(id, newCount) {
        this.items.find(element => element.id === id).count = newCount;
    }
}