const Article = require('../models/Article');
const User = require('../models/User');
const validateOwner = require('../helpers/validateOwner');

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
    }

    await newArc.save();
    console.log(author);

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

const deleteArticle = asyncHandler (async (req, res) => {
    const { slug } = req.params;
    const { userId } = req.user.userId;

    const article = await Article.findOne({slug}).exec();

    validateOwner(req, res, article.author);

    await Article.deleteOne({slug: slug});
        res.status(200).json({
            message: "Article successfully deleted!!!"
        }) 
})

const updateArticle = asyncHandler (async (req, res) => {
    const { slug } = req.params;
    const { id } = req.user.userId;
    const { article } = req.body;

    const existArc = await Article.findOne({slug}).exec();
    const currentUser = await User.findById(id).exec();

    validateOwner(req, res, article.author);

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
        existArc.tagList = article.tagList;
    }

    await existArc.save(); 

    const updatedArticle = await target.toArticleResponse(currentUser);
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

module.exports =
{
    createArticle, getArticleBySlug, deleteArticle, updateArticle, favoriteArticle, unFavoriteArticle 
}