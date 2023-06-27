const cron = require("node-cron");
const Tag = require('../models/Tag');

async function cronJob() {
  const tags = await Tag.deleteMany(
    { articles: { $exists: true, $size: 0 } }
  );
    console.log(tags);
}

cron.schedule("5 10 * * *", cronJob, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
});

module.exports = cronJob;