import {elements} from './base'
import {Fraction} from 'fractional'

/**
 * Removes all the recipes from the recipe search panel.
 */
export const clearRecipes = () => {
    elements.recipe.innerHTML = '';
};

/** Formats the count of an ingredient into a human readable fraction. Gets called for every recipe in createIngredient().
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

 /**
  * Returns the markUp for a single ingredient for a recipe. Called from renderRecipe().
  * @param {object} ingredient The ingredient object to be rendered.
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

/**
 * Renders a single recipe into the recipe view.
 * @param {object} recipe The recipe object to render.
 * @param {boolean} isLiked Determines if the like button should be active or not. If the like already exists in the likes array.
 */
export const renderRecipe = (recipe, isLiked) => {
    const markUp = `
    <figure class="recipe__fig">
        <img src="${recipe.image}" alt="${recipe.label}" class="recipe__img">
        <h1 class="recipe__title">
            <span>${recipe.label}</span>
        </h1>
    </figure>

    <div class="recipe__details">
        <div class="recipe__info">
            <svg class="recipe__info-icon">
                <use href="img/icons.svg#icon-stopwatch"></use>
            </svg>
            <span class="recipe__info-data recipe__info-data--minutes">${recipe.totalTime}</span>
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
            This recipe was carefully designed and tested. Please check out directions at their website.
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

/**
 * Updates the number of servings in the currently displayed recipe.
 * @param {object} recipe Recipe object containing the number of servings and ingredients array.
 */
export const updateServings = recipe => {
    // Update servings
    document.querySelector('.recipe__info-data--people').textContent = recipe.servings;

    const countElements = Array.from(document.querySelectorAll('.recipe__count'));
    countElements.forEach((element, index) => {
        element.textContent = formatCount(recipe.ingredients[index].count);
    })
}