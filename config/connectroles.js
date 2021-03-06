/* configures our authorization module */
module.exports = function(user){
    user.use('access profile', function(req){
        if (req.isAuthenticated()){
            return (req.user.dataValues.usertype === 'user' || req.user.dataValues.usertype === 'admin');
    }});

    user.use('access admin page', function(req){
        if (req.isAuthenticated()){
            return (req.user.dataValues.usertype === 'admin');
        } else {
            console.log("no admin access")
            return false;
        }
    });

    user.use(function(req){
        return false;
    })
};
