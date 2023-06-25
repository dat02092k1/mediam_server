const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slugify = require('slugify');
const User = require('./User');
const Tag = require('./Tag');

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
    console.log(authorObj);
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
        author: authorObj?.toProfileJSON(user)
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

articleSchema.methods.addTags = async function (tagList) {
    const existingTags = await Tag.find({ tagName: { $in: tagList } }).lean(); //  [{'a', '1'}, {'b', '2'}]

    const existingTagNames = existingTags.map((tag) => tag.tagName); //     ['a', 'b']   

    const newTags = tagList.filter((tagName) => !existingTagNames.includes(tagName)); // ['c', 'd']

    const bulkOps = [];

     // Update existing tags               ['a', 'b']                       
     for (const tag of existingTags) {
        if(tag.articles.indexOf(this._id) === -1){
            tag.articles.push(this._id);
        }     
         
        bulkOps.push({
            updateOne: {
                filter: { _id: tag._id },
                update: { $addToSet: { articles: this._id } }
            }
        });
    }
    
    // Create new tags
    for (const newTagName of newTags) {
        const newTag = { tagName: newTagName, articles: [this._id] };
        bulkOps.push({
            insertOne: { document: newTag }
        });
    }

    if (bulkOps.length > 0) {
        await Tag.bulkWrite(bulkOps);
    }
};

articleSchema.methods.handleTags = async function (tagList) {
    const existingTags = await Tag.find({ tagName: { $in: tagList } }).lean(); //  [{'a', '1'}, {'b', '2'}]
    const existingTagNames = existingTags.map((tag) => tag.tagName);       // ['a', 'b', 'c', 'd']           

    // Remove tags that are not in the updated tagList
    const removeTags = this.tagList.filter((tagName) => !tagList.includes(tagName));
    const removingTags = await Tag.find({ tagName: { $in: removeTags } });
     
    for (const tag of removingTags) {
        if(tag.articles.map(String).includes(this._id.toString()) !== -1){
            console.log(tag.articles);  
            const updatedArticles = tag.articles.filter(articleId => !articleId.equals(this._id));
            console.log(updatedArticles);
            tag.articles = updatedArticles;    
        }             
        tag.save();
    }         

    /**
     * new: ["Coding", "Vietnam", "NodeJS", "VueJS"]
     * former: ["Coding", "C#"]
     * in DB: ["Coding", "NodeJS", "C#"]
     * new: ["Vietnam", "VueJS"] -> Create new Tag & add id article 
     * old but thua: ["C#"] -> remove id artice 
     */
    this.tagList = tagList;

    // Add new tags
    const newTags = tagList.filter((tagName) => !existingTagNames.includes(tagName));

    if (newTags) {
    for (const newTagName of newTags) {
        const newTag = { tagName: newTagName, articles: [this._id] };
        await Tag.create(newTag);
    }                
    }
}

module.exports = mongoose.model('Article', articleSchema);