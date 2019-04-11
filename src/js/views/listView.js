import {elements} from './base'

/**
 * Refreshes the entire shopping list whenever an update is made to the list model.
 * @param {array} items Array of all the shopping list items.
 */
export const refreshList = items => {
    // First clear the current items in the view.
    elements.shopping.innerHTML = '';
    // Add all the items in the shopping list.
    items.forEach(item => {
        const markUp = `
        <li class="shopping__item" data-itemid=${item.id}>
            <div class="shopping__count">
                <input type="number" value="${item.count}" step="${item.count}" class="shopping__count-value">
                <p>${item.unit}</p>
            </div>
            <p class="shopping__description">${item.ingredient}</p>
            <button class="shopping__delete btn-tiny">
                <svg>
                    <use href="img/icons.svg#icon-circle-with-cross"></use>
                </svg>
            </button>
        </li>
    `;
    elements.shopping.insertAdjacentHTML('beforeend', markUp);
    });   
}

/**
 * Removes a single shopping list item from the shopping list.
 * @param {string} id  ID of the shopping list ingredient to remove from the view.
 */
export const deleteItem = id => {
    const item = document.querySelector(`[data-itemid="${id}"]`);
    if (item) {
        item.parentElement.removeChild(item);
    }
}