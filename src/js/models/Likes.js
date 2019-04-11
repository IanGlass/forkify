/**
 * Stores the global liked recipes list which are displayed in the likes panel
 */
export default class Likes {
    constructor() {
        this.likes = [];
    }

    /**
     * Adds a new like object to the this.likes array when the like button is pressed on a particular recipe
     * @param {string} id The id of the particular like to add
     * @param {string} title The recipe title
     * @param {string} image URL to the recipe image
     * @param {array} dietLabels Array of labels to describe dietary information of the recipe
     * @param {array} healthLabels Array of labels to describe health information of the recipe
     * @param {array} cautions Array of labels to describe cation information of the recipe
     */
    addLike(id, title, image, dietLabels, healthLabels, cautions) {
        const like = {
            id,
            title,
            image,
            dietLabels,
            healthLabels,
            cautions
        };
        this.likes.push(like);

        // this.persistData();

        return like;
    }

    /**
     * Removes a like from the this.likes array if the like already exists
     * @param {string} id The id of the particular like to remove
     */
    deleteLike(id) {
        this.likes.splice(this.likes.findIndex(element => element.id === id), 1);
        this.persistData();
    }

    /**
     * Tests if the like exists in the this.likes array to update the like button when a recipe is rendered
     * @param {*} id The id of the particular like
     */
    isLiked(id) {
        return this.likes.findIndex(element => element.id === id) !== -1;
    }

    /**
     * Returns the current number of likes in the this.likes array
     */
    getNumberLikes() {
        return this.likes.length;
    }
}