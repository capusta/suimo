var hash = require('../config/hash.js'),
crypto = require('../config/mycrypto.js'),
validator = require('validator');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define("User", {
            username: {type: DataTypes.STRING, unique: true, allowNull: false,
                validate: {
                    isAlphanumeric: true,
                    len: {
                        args: [1,20],
                        msg: "Username too short or too long"
                    }
                }},
            phash: {type: DataTypes.STRING(255), unique: false, allowNull: false
            },
            salt: {type: DataTypes.STRING, unique: false, allowNull: false, defaultValue:crypto.generate()
            },
            usertype: {type: DataTypes.STRING, allowNull: false, defaultValue: 'user',
            set: function(v){
                //no one is allowed to change this.
            },
                get: function(){
                    return this.getDataValue('usertype');
                }
            },
            name: {type: DataTypes.STRING, allowNull: true, defaultValue: 'Weary Traveler',
                validate: {
                    len: [1,100]
                },
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('name', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('name'));
                    return ans.slice(5,ans.length-5);
                }
            },
            addressOne: {type: DataTypes.STRING, allowNull: true, defaultValue: '123 Pilsburry Drive',
                validate: {
                    len: [1,200]
                },
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    this.setDataValue('addressOne', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('addressOne'));
                    return ans.slice(5,ans.length-5);
                }
            },
            addressTwo: {type: DataTypes.STRING, allowNull: true, defaultValue: 'City, State/Country, Zip',
                validate: {
                    len: [0,200]
                },
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('addressTwo', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('addressTwo'));
                    return ans.slice(5,ans.length-5);
                }
            },
            email: {type: DataTypes.STRING, allowNull: true, defaultValue: 'user@domain.com',
                validate: {
                    isEmail: function(v){
                        if(!validator.isEmail(crypto.decrypt(v))){
                            throw  new Error("Not Valid Email");
                        }
                    }
                },
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('email', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('email'));
                    return ans.slice(5,ans.length-5);
                }
            },
            verifiedEmail: {type: DataTypes.STRING, allowNull: true, defaultValue: 'none@notvalid.com',
                validate: {
                    isEmail: function(v){
                        if(!validator.isEmail(crypto.decrypt(v))){
                            throw  new Error("Not Valid Email");
                        }
                    }
                },
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('verifiedEmail', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('verifiedEmail'));
                    return ans.slice(5,ans.length-5);
                }
            },
            homeBTC: {type: DataTypes.STRING, allowNull: false, defaultValue: "1BTCorgHwCg6u2YSAWKgS17qUad6kHmtQW",
                validate: {
                    isLength: function(v){
                        if(!validator.isLength(crypto.decrypt(v), 27, 34)){
                            throw  new Error("Not Valid Bitcoin Address")
                        }
                    }
                },
                set: function(v){
                    return this.setDataValue('homeBTC', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('homeBTC'));
                }
            },
            //once a user pays, we will make sure that one of the input addresses into the blockchain matches the
            //address listed on the profile.  if nothing matches, we will save the hash to come back to it
            paymentBTC: {type: DataTypes.STRING, allowNull: true,
                validate: {
                    isLength: function(v){
                        if(!validator.isLength(crypto.decrypt(v), 27, 200)){
                            throw  new Error("Not Valid Bitcoin Address")
                        }
                    }
                },
                set: function(v){
                    return this.setDataValue('paymentBTC', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    var v = this.getDataValue('paymentBTC');
                    if(v !== null && v != '0'){
                        return crypto.decrypt(this.getDataValue('paymentBTC'));
                    }
                    else{
                        return v;
                    }
                }
            },
            //for password resets and stuff
            oneTimeSecret: {type: DataTypes.STRING, allowNull:true,
                validate: {
                    len: [1,200]
                },
                set: function(v){
                    //format for encoding is [random 5] + [action] + [comma] + username + [random 5]
                    var n = (crypto.generate(5))+(v)+","+this.getDataValue('username')+crypto.generate(5);
                    return this.setDataValue('oneTimeSecret', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    //we have an instance method to decode this because this could be anything
                    return (this.getDataValue('oneTimeSecret'));
                }
            },
            //tracks what the user thinks is going to happen next.
            stepNumber: {type: DataTypes.STRING, allowNull: false, defaultValue: "0",
                validate: {
                    len: [1,50]
                }
            },
            //for future use, maybe
            bitMessegeAddr: {type: DataTypes.STRING, allowNull: true, defaultValue: 'none',
                validate: {
                    isLength: function(v){
                        if(!validator.isLength(crypto.decrypt(v), 0, 50)){
                            throw  new Error("Not Valid Bit Messege Address")
                        }
                    }
                },
                set: function(v){
                    return this.setDataValue('bitMessegeAddr', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('bitMessegeAddr'));
                }
            },
            BTCverified: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 'FALSE',
                set: function(v){
                    result = this.getDataValue('paymentBTC') == this.getDataValue('homeBTC');
                    return this.setDataValue('BTCverified', result);
                },
                get: function(){
                    return this.getDataValue('paymentBTC') == this.getDataValue('homeBTC');
                }
            },
            emailVerified: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 'FALSE',
                set: function(v){
                    var a = crypto.decrypt(this.getDataValue('email'));
                    var b = crypto.decrypt(this.getDataValue('verifiedEmail'));
                    a = a.slice(5,a.length-5);
                    b = b.slice(5, b.length-5);
                    return this.setDataValue('emailVerified', (a == b));
                },
                get: function(){
                    a = crypto.decrypt(this.getDataValue('email'));
                    b = crypto.decrypt(this.getDataValue('verifiedEmail'));
                    a = a.slice(5,a.length-5);
                    b = b.slice(5, b.length-5);
                    return (a == b);
                }
            },
            emailCount: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            alert: {type: DataTypes.STRING, allowNull: true, defaultValue: ''}
    }, {
        classMethods: {
        signup: function(uname, pword, done) {
            var s = crypto.generate();
            hash(pword, s, function(err, ret_hash){
                if (err) {done(err, null, {message: "bad hash"})}
                console.log('addming new user ' + uname + ' pass ' + pword)
                global.db.User.build({ username: uname.toLowerCase(), phash: ret_hash.toString('base64'), salt: s}).save()
                    .success(function(u){console.log(uname + " signed up");
                        done(null, u);})
                    .error(function(err){
                        console.log("User model got error on signup " + err);
                        done(err, null);
                    })
            })
        }},

        instanceMethods: {
            /*Every user is an object pulled from the database.  Every user can validate their own password.*/
            validPassword: function(pword, answer) {
                var myhash = this.phash;
                var uname = this.username;
                var s = this.salt;
                     hash(pword, s, function (err, ret_hash) {
                        if (err) {answer(false); return;}
                        if (ret_hash.toString('base64') !== myhash) {
                            console.log(uname + " password is INcorrect");
                            answer(false);
                     }
                     else {
                            answer(true);
                     }});
              },
            /*Allows a user to change their password, assuming the request is authenticated.*/
            changepassword: function(p, callback){
                //kind of strange notation, but cannot call "this" in the hash function */
                usr=this;
                s = crypto.generate();
                //New salt is generated every single time a password is changed.
                hash(p, s, function(err, ret_hash){
                    if (err){
                             console.log("password change for user " + usr.username + " failed ");
                             callback(false)
                         }
                    else {
                        try {
                            usr.updateAttributes({phash: ret_hash.toString('base64'), salt: s});
                            console.log("password changed for " + usr.username);
                            callback(true);
                        } catch (e) {
                            console.log("user.js - unable to change password for " + usr.username)
                            callback(false);
                        }
                    }
                })
            },
            resetpassword: function(callback){
                //cannot call "this" in the hash function
                usr=this;
                //generate a random 10 letter password
                p = crypto.generate(10);
                //then generate a random 32 byte salt ... lol, salt is longer than the password
                s = crypto.generate();
                hash(p, s, function(err, ret_hash){
                    if (err){
                        console.log("user.js - password change for user " + usr.username + " failed ");
                        callback(false);
                    }
                    else {
                        console.log("new password generated for " + usr.username);
                        usr.updateAttributes({phash: ret_hash.toString('base64'), salt: s});
                        callback(p);
                    }
                })
            },
            removeOneTimeSecret: function(callback){
                //breaking my abstraction a little bit
                this.setDataValue('oneTimeSecret', null);
                callback(null);
            },
            getSecretAction: function(callback){
                try {
                    ans = crypto.decrypt(this.getDataValue('oneTimeSecret'));
                    callback(null, ans);
                } catch(err){
                    callback(err, null);
                }
            },
            hasCashCardAlert: function(){
                i = this.getDataValue('alert');
                if(i !== null && ~i.indexOf('c')){
                    this.updateAttributes({alert: i.replace(/c/g,'')});
                    return true;
                } else {return false}
            },
            hasMessegesAlert: function(){
                i = this.getDataValue('alert');
                if(i !== null && ~i.indexOf('m')){
                    this.updateAttributes({alert: i.replace(/m/g,'')});
                    return true;
                } else { return false;}
            }
        }
        }
    )
}


