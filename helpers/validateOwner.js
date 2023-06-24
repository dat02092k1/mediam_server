const validateOwner = async (userId, res, id) => {
    try {
        console.log(userId, id);
        if (userId !== id.toString()) {
            return res.status(403).json({ error: 'Only the author can delete his article' });  
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = validateOwner;