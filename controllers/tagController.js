const Article = require('../models/Article');
const asyncHandler = require('express-async-handler');

const getTags = asyncHandler (async (req, res) => {
    const tags = await Article.find().distinct('tagList').exec();

    res.status(200).json({
        tags: tags
    });

})

const getPopularTags = asyncHandler (async (req, res) => {
    const popularTags = await Article.aggregate([
        { $unwind: '$tagList' },
        {
          $group: {
            _id: '$tagList',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            tag: '$_id',
            count: 1
          }
        }
      ]);  

    res.status(200).json({
        tags: popularTags
    });

})

module.exports = {
    getTags, getPopularTags
};