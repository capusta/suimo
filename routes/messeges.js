fs      = require('fs'),
    b64 = require('../config/base64url'),
    email = require("../node_modules/emailjs/email"),
    path = require('path'),
    templateDir = path.join(__dirname, '../templates'),
    emailTemplates = require("email-templates");

var server = email.server.connect({
    user: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    ssl: true});

module.exports = function(app, passport, usr){

    app.post('/admin/sendmessege', usr.can('access admin page'), function(req, res){
        if(req.isAuthenticated()) {
            global.db.Message.sendMessege(req.body.fromUser, req.body.toUser, req.body.m, function(isOK){
                if(isOK) {
                    req.flash('info','messege sent')
                    res.redirect("admin")
                } else {
                    req.flash('info','user not found')
                    res.redirect('admin')
                }
            });
         } else {
            res.redirect("login")
        }
    });

    app.get('/secret/:id', function(req, res){
        global.db.User.find( { where: {oneTimeSecret: b64.urlDecode(req.params.id)}}).success(function(u){
            if(u == null){
                console.log("got a secret messege but could not  find the user");
                if(req.isAuthenticated()){
                    res.write('Invalid Code');
                    res.end();
                    return;
                } else {
                    req.flash('error','Incorrect Code - please check again');
                    res.redirect("login");
                    return;
                }
            }
            u.getSecretAction(function(err, actn){
                //this is a model instance method that will decode the one time encrypted action
                if(err){
                    console.log('unable to get secret action for user ' + u.username)
                    console.log(err.message)
                    return;
                }
                    var command = actn.toString('utf8').slice(5,actn.length-5).split(",")[0];
                    console.log('command is ' + command + " for " + u.username)
                    if (command === 'verify_email'){
                        u.verifiedEmail = u.email;
                        u.emailVerified = true;
                        u.removeOneTimeSecret(function(err){
                            if(err){console.log('unable to delete "verify email" onetimeSecret')}
                        });
                        u.save();
                        req.flash('error','Email Verified, Please Log In')
                        res.redirect("login")
                        return;
                    };
                    if (command === 'resetpassword'){
                        u.resetpassword(function(p){
                            // variable p should be a new password generated by the user model
                            if(p){
                                locals = {username: u.username, pass: p};
                                emailTemplates(templateDir, function(err, template){
                                    template('pass_reset', locals, function(err, html, text){
                                        if (err) {
                                            console.log("error in making the reset password template " + err.message);
                                        } else {
                                            server.send({
                                                from: "Suimo <info@suimo.pw>",
                                                to: u.name+"<"+ u.email + ">",
                                                subject: "SuiMo - Password Reset",
                                                attachment:
                                                    [
                                                        {data: html, alternative: true}
                                                    ]
                                            }, function(err, message) {
                                                if(message) {
                                                    console.log("user password reset " + u.username + " messege sent"); }
                                                else {console.log("messeges.js - error in sending pass reset email for " + u.username)}
                                            });
                                        }});
                                });
                                u.removeOneTimeSecret(function(err){})
                                req.flash('error','Please check your email for your new password.');
                                res.redirect("login");
                            }
                            else {
                                console.log('messeges.js - error setting new password')
                            }
                        })
                    }
                    if (command === 'delete_user') {
//                        u.removeOneTimeSecret(function(err){
//                            if(err) { console.log(' unable to remove the "delete user" one time secret')}});

                        global.db.User.find( { where: {username: 'admin'}}).success(function(adminuser){
                            u.getMoneycards().success(function(cards){
                                console.log('got ' + cards.length + ' moneycards - xfer to admin');
                                async.forEach(cards, function(item, callback){
                                    u.removeMoneycard(item).success(function(){
                                        adminuser.addMoneycard(item);
                                        callback();
                                    })
                                })
                            });
                            u.getMesseges().success(function(messeges){
                                console.log('got ' + messeges.length + ' messeges to delete');
                                async.forEach(messeges, function(item, callback){
                                    item.destroy();
                                });
                            });
                            u.getPayments().success(function(payments){
                                console.log('got ' + payments.length + ' payments to archive under admin');
                                async.forEach(payments, function(p, callback){
                                    u.removePayment(p).success(function(){
                                        adminuser.addPayment(p);
                                        p.archived = true;
                                        p.save();
                                        callback();
                                    })
                                })
                            });
                            u.destroy();
                            req.logout();
                            req.flash('error','Your account has been deleted')
                            res.redirect("login")
                        });
                    }
                })
            }).error(function(e){
                console.log('got sercret messege error on finding user from database');
            })
        //res.redirect("login");
        });
}
