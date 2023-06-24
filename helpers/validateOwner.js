const validateOwner = async (req, res, id) => {
    try {
        if (req.user.id !== id) {
            return res.status(403).json({ error: 'Only the author can delete his article' });  
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = validateOwner;