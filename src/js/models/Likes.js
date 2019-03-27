export default class Likes {
    constructor() {
        this.likes = [];
    }

    addLike(id, title, author, image) {
        const like = {
            id,
            title,
            author,
            image
        };
        this.likes.push(like);

        this.persistData();

        return like;
    }

    deleteLike(id) {
        this.likes.splice(this.likes.findIndex(element => element.id === id), 1);
        this.persistData();
    }

    // Test if we have a like in the array for the given recipe id
    isLiked(id) {
        return this.likes.findIndex(element => element.id === id) !== -1;
    }

    getNumberLikes() {
        return this.likes.length;
    }

    persistData() {
        localStorage.setItem('likes', JSON.stringify(this.likes));
    }

    readStorage() {
        const storage = JSON.parse(localStorage.getItem('likes'));

        if (storage) this.likes = storage;
    }

}