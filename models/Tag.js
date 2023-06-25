const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const tagSchema = new mongoose.Schema({
    tagName: {
        type: String,
        required: true,
        unique: true
    },
    articles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }]
})

tagSchema.plugin(uniqueValidator);

tagSchema.methods.addTag = function (articleId) {
    if(this.articles.indexOf(articleId) === -1){
        this.articles.push(articleId);
    }
};

tagSchema.methods.removeTag = function (articleId) {
    if(this.articles.indexOf(articleId) !== -1){
        this.articles.remove(articleId);
    }
    return this.save();
};

module.exports = mongoose.model('Tag', tagSchema);
