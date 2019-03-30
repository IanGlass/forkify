import {elements} from './base'
import {limitRecipeTitle} from './searchView'


export const toggleLikeButton = isLiked => {
    const iconString = isLiked ? 'icon-heart' : 'icon-heart-outlined';
    document.querySelector('.recipe__love use').setAttribute('href', `img/icons.svg#${iconString}`);
};

export const toggleLikeMenu = numberLikes => {
    elements.likesMenu.style.visibility = numberLikes > 0 ? 'visible' : 'hidden';
};

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

export const deleteLike = id => {
    const element = document.querySelector(`.likes__link[href="#${id}"]`).parentElement;
    if (element) element.parentElement.removeChild(element);
}