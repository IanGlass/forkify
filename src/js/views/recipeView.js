import {elements} from './base'
import {Fraction} from 'fractional'

export const clearRecipe = () => {
    elements.recipe.innerHTML = '';
};

/** Fromats the number of an ingredient into a human readable fraction. Gets called for every recipe in createIngredient().
 * @param {integer} count The value to be formated into a human readable fraction.
 * @return {string} The human readable fraction.
 */
const formatCount = count => {
    if (count) {
        // Disseminate count into an integer and decimal number for fractional formatting 
        const [int, dec] = count.toString().split('.').map(element => parseInt(element, 10));

        if (!dec) {
            return count;
        } else if (int === 0) {
            const fraction = new Fraction(count);
            return `${fraction.numerator}/${fraction.denominator}`;
        } else {
            const fraction = new Fraction(count - int);
            return `${int} ${fraction.numerator}/${fraction.denominator}`;
        }
    }
    return '?';
};

/** Adds an incredient into the recipe
 */
const createIngredient = ingredient => `
    <li class="recipe__item">
        <svg class="recipe__icon">
            <use href="img/icons.svg#icon-check"></use>
        </svg>
        <div class="recipe__count">${formatCount(ingredient.count)}</div>
        <div class="recipe__ingredient">
            <span class="recipe__unit">${ingredient.unit}</span>
            ${ingredient.ingredient}
        </div>
    </li>
`;

export const renderRecipe = (recipe, isLiked) => {

    const markUp = `
    <figure class="recipe__fig">
        <img src="${recipe.image}" alt="${recipe.title}" class="recipe__img">
        <h1 class="recipe__title">
            <span>${recipe.title}</span>
        </h1>
    </figure>

    <div class="recipe__details">
        <div class="recipe__info">
            <svg class="recipe__info-icon">
                <use href="img/icons.svg#icon-stopwatch"></use>
            </svg>
            <span class="recipe__info-data recipe__info-data--minutes">${recipe.cookingTime}</span>
            <span class="recipe__info-text"> minutes</span>
        </div>
        <div class="recipe__info">
            <svg class="recipe__info-icon">
                <use href="img/icons.svg#icon-man"></use>
            </svg>
            <span class="recipe__info-data recipe__info-data--people">${recipe.servings}</span>
            <span class="recipe__info-text"> servings</span>

            <div class="recipe__info-buttons">
                <button class="btn-tiny btn-decrease">
                    <svg>
                        <use href="img/icons.svg#icon-circle-with-minus"></use>
                    </svg>
                </button>
                <button class="btn-tiny btn-increase">
                    <svg>
                        <use href="img/icons.svg#icon-circle-with-plus"></use>
                    </svg>
                </button>
            </div>

        </div>
        <button class="recipe__love">
            <svg class="header__likes">
                <use href="img/icons.svg#icon-heart${isLiked ? '' : '-outlined'}"></use>
            </svg>
        </button>
    </div>



    <div class="recipe__ingredients">
        <ul class="recipe__ingredient-list">
            ${recipe.ingredients.map(element => createIngredient(element)).join('')}
        </ul>

        <button class="btn-small recipe__btn--add">
            <svg class="search__icon">
                <use href="img/icons.svg#icon-shopping-cart"></use>
            </svg>
            <span>Add to shopping list</span>
        </button>
    </div>

    <div class="recipe__directions">
        <h2 class="heading-2">How to cook it</h2>
        <p class="recipe__directions-text">
            This recipe was carefully designed and tested by
            <span class="recipe__by">${recipe.author}</span>. Please check out directions at their website.
        </p>
        <a class="btn-small recipe__btn" href="${recipe.url}" target="_blank">
            <span>Directions</span>
            <svg class="search__icon">
                <use href="img/icons.svg#icon-triangle-right"></use>
            </svg>

        </a>
    </div>
    `;
    elements.recipe.insertAdjacentHTML('afterbegin', markUp);
}

export const updateServings = recipe => {
    // Update servings
    document.querySelector('.recipe__info-data--people').textContent = recipe.servings;

    const countElements = Array.from(document.querySelectorAll('.recipe__count'));
    countElements.forEach((element, index) => {
        element.textContent = formatCount(recipe.ingredients[index].count);
    })
}