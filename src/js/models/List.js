import uniqid from 'uniqid'

export default class shoppingList {
    constructor() {
        this.items = [];
    }

    addItem(ingredient) {
        const item = {
            id: uniqid(),
            count: ingredient.count,
            unit: ingredient.unit,
            ingredient: ingredient.ingredient
        };
        this.items.push(item);
        return item;
    }

    deleteItem(id) {
        this.items.splice(this.items.findIndex(element => element.id === id), 1);
    }

    updateCount(id, newCount) {
        this.items.find(element => element.id === id).count = newCount;
    }
}