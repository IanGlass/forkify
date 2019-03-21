import 'babel-polyfill';
import axios from 'axios';

export default class Search {
    constructor(query) {
        this.query = query;
    }
    async getResults() {
        const proxy = 'https://cors-anywhere.herokuapp.com/';
        const key = 'd80d1126bf8f4e995204150dcd2b8da7';
        try {
            const res = await axios(`${proxy}http://food2fork.com/api/search?key=${key}&q=${this.query}`);
            this.recipes = res.data.recipes;
        } catch (error) {
            alert(error);
        }
    };
}