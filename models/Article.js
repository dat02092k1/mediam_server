const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slugify = require('slugify');
const User = require('./User');

const articleSchema = new mongoose.Schema({
    slug: {
        type: String,
        lowercase: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    tagList: [{
        type: String
    }],
    favouritesCount: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }] 
},
    {
        timestamps: true
    });

    articleSchema.plugin(uniqueValidator);

    articleSchema.pre('save', async function (next) {
        if (this.isModified('title')) {
          const slug = slugify(this.title, { lower: true, replacement: '-' });
      
          // Check if the generated slug already exists
          const slugRegex = new RegExp(`^${slug}(-[0-9]*)?$`, 'i');
          const articlesWithSameSlug = await this.constructor.find({ slug: slugRegex });
      
          if (articlesWithSameSlug.length > 0) {
            // Append a unique identifier to the slug
            this.slug = `${slug}-${articlesWithSameSlug.length + 1}`;
          } else {
            this.slug = slug;
          }
        }
      
        next();
      });      
    
    articleSchema.methods.updateFavoriteCount = async function () {
        const favoriteCount = await User.count({
            favouriteArticles: {$in: [this._id]}
        });
    
        this.favouritesCount = favoriteCount;
    
        return this.save();
    }

    // user is the logged-in user
    articleSchema.methods.toArticleResponse = async function (user) {
    const authorObj = await User.findById(this.author).exec();
    return {
        slug: this.slug,
        title: this.title,
        description: this.description,
        body: this.body,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        favorited: user ? user.isFavourite(this._id) : false,
        favoritesCount: this.favouritesCount,
        author: authorObj.toProfileJSON(user)
    }
}

articleSchema.methods.addComment = function (commentId) {
    if(this.comments.indexOf(commentId) === -1){
        this.comments.push(commentId);
    }
    return this.save();
};

articleSchema.methods.removeComment = function (commentId) {
    if(this.comments.indexOf(commentId) !== -1){
        this.comments.remove(commentId);
    }
    return this.save();
};

module.exports = mongoose.model('Article', articleSchema);