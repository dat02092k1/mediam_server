const Article = require('../models/Article');
const User = require('../models/User');
const Comment = require('../models/Comment');
const validateOwner = require('../helpers/validateOwner');
const asyncHandler = require('express-async-handler');

const addCommentToArticle = asyncHandler (async (req, res) => {
    const id = req.user.userId;

    const commenter = await User.findById(id).exec();

    if (!commenter) {
        return res.status(401).json({
            message: "User Not Found"
        });
    }

    const { slug } = req.params;

    const article = await Article.findOne({slug}).exec();

    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }

    const { body } = req.body.comment;

    const newComment = await Comment.create({
        body: body,
        author: commenter._id,
        article: article._id
    });

    await article.addComment(newComment._id);

    const comment = await newComment.toCommentResponse(commenter);
    res.status(200).json({
        comment
    })
}) 

const getCommentsOfArticle = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const article = await Article.findOne({slug}).exec();

    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }
    console.log(article);
    const loggedin = req.loggedin;

    if (loggedin) {
        const loginUser = await User.findById(req.user.userId).exec();
        return await res.status(200).json({
            comments: await Promise.all(article.comments.map(async commentId => {
                const commentObj = await Comment.findById(commentId).exec();
                return await commentObj.toCommentResponse(loginUser);
            }))
        })
    }
    else {
        return await res.status(200).json({
            comments: await Promise.all(article.comments.map(async (commentId) => {
                const commentObj = await Comment.findById(commentId).exec();
                // console.log(commentObj);
                const temp =  await commentObj.toCommentResponse(false);
                // console.log(temp);
                return temp;
            }))
        })

    }
})

const editComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { body } = req.body.comment;

    const comment = await Comment.findById(id); 

    if (!comment) {
        return res.status(404).json({
            message: "Comment Not Found"
        });
    } 

    if (req.user.userId.toString() !== comment.author.toString()) {
        return res.status(403).json({
            message: "Only the author can delete his article"
        })
    }

    comment.body = body;

    await comment.save();

    res.status(200).json(comment);
})

const deleteComment = asyncHandler (async (req, res) => {
    const { id, slug } = req.params;
    const userId = req.user.userId;

    const commenter = await User.findById(userId).exec();

    if (!commenter) {
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

    const comment = await Comment.findById(id).exec();

    if (req.user.userId.toString() !== comment.author.toString()) {
        return res.status(403).json({
            message: "Only the author can delete his article"
        })
    }

    await article.removeComment(comment._id);

    await Comment.deleteOne({ _id: comment._id });

    return res.status(200).json({
        message: "comment has been successfully deleted!!!"
    });

})
module.exports = {
    addCommentToArticle, getCommentsOfArticle, editComment, deleteComment
}