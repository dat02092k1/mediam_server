const Article = require('../models/Article');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Tag = require('../models/Tag');

const asyncHandler = require('express-async-handler');

const createArticle = asyncHandler(async (req, res) => {
    const { article } = req.body;
    console.log(article);
    const author = await User.findById(req.user.userId).exec();

    if (!article || !article.title || !article.description || !article.body) {
        return res.status(400).json({ message: 'All fields are required'})
    } 

    const newArc = await Article.create({
        title: article.title,
        description: article.description,
        body: article.body
    });

    newArc.author = req.user.userId;

    if (Array.isArray(article.tagList) && article.tagList?.length > 0) {
        newArc.tagList = article.tagList;
            // if in Tags exist a tag with equal tag, add article._id
    }

    await newArc.save();
    
    if (Array.isArray(article.tagList) && article.tagList?.length > 0) {
        await newArc.addTags(article.tagList);
    }

    return res.status(200).json({
        article: await newArc.toArticleResponse(author)
    })

})

const getArticleBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const id = req.user.userId;

    const article = await Article.findOne({slug}).exec();
    const user = await User.findById(id).exec();

    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }

    return res.status(200).json({
        article: await article.toArticleResponse(user)
    })
})

const getArtcleByPage = asyncHandler (async (req, res) => {
    let limit = parseInt(req.query.limit) || 10;
    let offset = parseInt(req.query.offset) || 0;

    const userId = req.user.userId;
    const user = await User.findById(userId).exec();

    const filteredArticles = await Article.find({_id: { $in: user.favouriteArticles }})
        .limit((limit))
        .skip((offset))
        .exec(); 

    const articleCount = await Article.count({_id: {$in: user.favouriteArticles }});

    return res.status(200).json({
        articles: await Promise.all(filteredArticles.map(async article => { return await article.toArticleResponse(user)})),
        articleCount
    })
})

const getArticleByQuery = asyncHandler (async (req, res) => {
    let limit = parseInt(req.query.limit) || 10;
    let offset = parseInt(req.query.offset) || 0;
    let query = {};
    
    if (req.query.limit) {
        limit = req.query.limit;
    }

    if (req.query.offset) {
        offset = req.query.offset;
    }

    if (req.query.tag) {
        query.tagList = {$in: [req.query.tag]}
        console.log(query.tagList)
    }

    if (req.query.author) {
        const author = await User.findOne({username: req.query.author}).exec();
        if (author) {
            query.author = author._id;
        }
    }

    if (req.query.favorited) {
        const favoriter = await User.findOne({username: req.query.favorited}).exec();
        if (favoriter) {
            query._id = {$in: favoriter.favouriteArticles}
        }
    }
     
    const filteredArticles = await Article.find(query)
        .limit((limit))
        .skip((offset))
        .sort({createdAt: 'desc'}).exec();
     
    const articleCount = await Article.count(query);
     
    if (req.loggedin) {
        console.log('logged in')
        const loginUser = await User.findById(req.user.userId).exec();
         
        return res.status(200).json({
            articles: await Promise.all(filteredArticles.map(async article => { return await article.toArticleResponse(loginUser)})),
            articlesCount: articleCount
        });
    } else {
        console.log('not logged in')
        return res.status(200).json({
            articles: await Promise.all(filteredArticles.map(async article => {
                return await article.toArticleResponse(false);
            })),
            articlesCount: articleCount
        });
    }
})

const deleteArticle = asyncHandler (async (req, res) => {
    const { slug } = req.params;
    const id = req.user.userId;

    const article = await Article.findOne({slug}).populate('comments').populate('tagList.articles').exec();
                                 
    if (!article) return res.status(404).json({ message: 'Article not found' });

    if (article.author.toString() !== id.toString()) {
        return res.status(403).json({
            message: "Only the author can delete his article"
        })
    }

    // Delete all comments related to the article
    await Comment.deleteMany({ article: article._id });
     
    // Remove the article reference from all tags
    await Tag.updateMany({ articles: article._id }, { $pull: { articles: article._id } });

     // Delete the article
    const target = await Article.deleteOne({slug: slug});

    res.status(200).json({
            message: "Article successfully deleted!!!"
        }) 
})

const updateArticle = asyncHandler (async (req, res) => {
    const { slug } = req.params;
    const id  = req.user.userId;
    const { article } = req.body;
     
    const existArc = await Article.findOne({slug}).exec();
    const currentUser = await User.findById(id).exec();

    if (existArc.author.toString() !== id) {
        return res.status(403).json({
            message: "Only the author can delete his article"
        })
    }
 
    if (article.title) {
        existArc.title = article.title;
    }
    if (article.description) {
        existArc.description = article.description;
    }
    if (article.body) {
        existArc.body = article.body;
    }
    if (article.tagList) {
        await existArc.handleTags(article.tagList);
    }
     
    await existArc.save(); 

    const updatedArticle = await existArc.toArticleResponse(currentUser);
    return res.status(200).json({ article: updatedArticle });
})

const favoriteArticle = asyncHandler (async (req, res) => {
    const id = req.user.userId;

    const { slug } = req.params;

    const currentUser = await User.findById(id).exec();

    if (!currentUser) {
        return res.status(401).json({
            message: "User Not Found"
        });
    }

    const article = await Article.findOne({slug}).exec();

    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }

    await currentUser.favorite(article._id);

    const updatedArticle = await article.updateFavoriteCount();

    return res.status(200).json({
        article: await updatedArticle.toArticleResponse(currentUser)
    });
});

const unFavoriteArticle = asyncHandler (async (req, res) => {
    const id = req.user.userId;

    const { slug } = req.params;

    const currentUser = await User.findById(id).exec();

    if (!currentUser) {
        return res.status(401).json({
            message: "User Not Found"
        });
    }

    const article = await Article.findOne({slug}).exec();

    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }

    await currentUser.unfavorite(article._id);

    const updatedArticle = await article.updateFavoriteCount();

    return res.status(200).json({
        article: await updatedArticle.toArticleResponse(currentUser)
    });
});

const validateOwner = async (req, res, id) => {
    try {
        if (req.user.id !== id.toString()) {
            res.status(403).json({ error: 'Only the author can delete his article' });  
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports =
{
    createArticle, getArticleBySlug, deleteArticle, updateArticle, favoriteArticle, unFavoriteArticle, getArtcleByPage, getArticleByQuery 
}