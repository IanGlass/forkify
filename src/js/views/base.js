export const elements = {
    searchForum: document.querySelector('.search'),
    searchInput: document.querySelector('.search__field'),
    searchResultList: document.querySelector('.results__list'),
    searchResults: document.querySelector('.results'),
    searchResultsPages: document.querySelector('.results__pages'),
    recipe: document.querySelector('.recipe'),
    shopping: document.querySelector('.shopping__list'),
    likesMenu: document.querySelector('.likes__field'),
    likesList: document.querySelector('.likes__list'),
    dietPanel: document.querySelector('.diet-dropdown-panel'),
    healthPanel: document.querySelector('.health-dropdown-panel')
};

export const elementStrings = {
    loader: 'loader'
};

/**
 * Renders a loader in the recipes panel when an AJAX call is made.
 * @param {Element} parent The recipes panel representing the parent element of where the loader will be rendered.
 */
export const renderLoader = parent => {
    const loader = `
        <div class="${elementStrings.loader}"><
            <svg>
                <use href="img/icons.svg#icon-cw"></use>
            </svg>
        </div>
    `;
    parent.insertAdjacentHTML('afterbegin', loader);
};

/**
 * Removes the loader from the recipes panel after the AJAX call has finished and we have recipes to render.
 */
export const clearLoader = () => {
    const loader = document.querySelector(`.${elementStrings.loader}`);
    if (loader) loader.parentElement.removeChild(loader);
};