const Article = require('../models/Article');
const User = require('../models/User');

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

module.exports =
{
    createArticle, getArticleBySlug
}