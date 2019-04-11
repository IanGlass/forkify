import {elements} from './base'
import {limitRecipeTitle} from './searchView'

/**
 * Toggles the like button of the currently displayed recipe if the recipe has been liked.
 * @param {boolean} isLiked True/False if recipe has been liked.
 */
export const toggleLikeButton = isLiked => {
    const iconString = isLiked ? 'icon-heart' : 'icon-heart-outlined';
    document.querySelector('.recipe__love use').setAttribute('href', `img/icons.svg#${iconString}`);
};

/**
 * Displays/hides the menu if there are any likes or not.
 * @param {number} numberLikes Number of likes in the likes model.
 */
export const toggleLikeMenu = numberLikes => {
    elements.likesMenu.style.visibility = numberLikes > 0 ? 'visible' : 'hidden';
};

/**
 * Render a like in the likes panel. May be called multiple times depending on the number of likes in the likes model.
 * @param {object} like Like object containing the id, title, image url, and any recipe labels.
 */
export const renderLike = like => {
    const markUp = `
    <li>
        <a class="likes__link" href="#${like.id}">
            <figure class="likes__fig">
                <img src="${like.image}" alt="${like.title}">
            </figure>
            <div class="likes__data">
                <h4 class="likes__name">${limitRecipeTitle(like.title)}</h4>
                <p class="results__labels"><b>diet</b>:${like.dietLabels.toString()}</p>
                <p class="results__labels"><b>health</b>:${like.healthLabels.toString()}</p>
                <p class="results__labels"><b>caution</b>:${like.cautions.toString()}</p>
            </div>
        </a>
    </li>
    `;
    elements.likesList.insertAdjacentHTML('beforeend', markUp);
};

/**
 * Removes a like from the likes panel if the recipe is unliked.
 * @param {string} id ID of the like to remove from the likes panel.
 */
export const deleteLike = id => {
    const element = document.querySelector(`.likes__link[href="#${id}"]`).parentElement;
    if (element) element.parentElement.removeChild(element);
}