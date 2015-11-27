/**
 * Created by ahmedel-baz on 15-11-04.
 */
var UserController = function(app) {

    var Users = app.models.Users;
    var Profiles = app.models.Profiles;
    var Activities = app.models.Activities;
    var activityLogger = app.activityLogger;
    var Topics = app.models.Topics;
    var Reviews = app.models.Reviews;

//  Logs in the user
//  @returns {Response} All the users in the database.
    this.getAllUsers = function (req, res, next) {
        Users.find({}, Users.defaultFilter)
            .populate('profile')
            .exec(function (err, users) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send({error: true, message: "An internal server error occurred."});
                }
                res.send({error: false, data: users});
            });
    };

//  Updates the target user
//  @paramarg {String} userId         The ID of the User to be changed.
//  @bodyarg {String} displayName     The new User displayName (optional).
//  @bodyarg {String} description     The new User description (optional).
//  @bodyarg {String} image           The new User image (optional).
//  @returns {Response}               The result of the update operation.
    this.updateUser = function (req, res, next) {
        var userId = req.params.userId;
        var displayName = req.body.displayName;
        var description = req.body.profile.description;
        var image = req.body.profile.image;
        var actorId = req.session.userId;
        Users.findById(userId)
            .populate('profile')
            .exec(function (err, user) {
                if (typeof displayName !== 'undefined')
                    user.displayName = displayName;

                user.save(function (err) {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send({error: true, message: "An internal server error occurred."});
                    } else {
                        var profile = user.profile;
                        if (typeof description != 'undefined')
                            profile.description = description;
                        if (typeof image != 'undefined')
                            profile.image = image;
                        profile.save(function (err) {
                            if (err) {
                                console.log(err.message);
                                res.status(500).send({error: true, message: "An internal server error occurred."});
                            } else {
                                activityLogger.logActivity(actorId,"update_user",user);
                                res.send({error: false});
                            }
                        });
                    }
                });
            });
    };

//  Changes the password of the User
//  @bodyarg {String} oldPass           The User's Current Password.
//  @bodyarg {String} newPass           The new User Password.
//  @bodyarg {String} confirmNewPass    The new User Password Confirmation.
//  @returns {Response}                 The result of the update operation.
    this.changePass = function (req, res, next) {
        var userId = req.session.userId;
        var oldPass = req.body.oldPass;
        var newPass = req.body.newPass;
        var confirmNewPass = req.body.confirmNewPass;
        var actorId = req.session.userId;
        if (typeof oldPass === "undefined") {
            var errMsg = "Error: Old Password not sent.";
            console.log(errMsg);
            res.status(400).send({error: true, message: errMsg});
        } else if (typeof newPass === "undefined" || typeof confirmNewPass === "undefined") {
            var errMsg = "Error: Password or Password Confirmation not sent.";
            console.log(errMsg);
            res.status(400).send({error: true, message: errMsg});
        } else if (newPass != confirmNewPass) {
            var errMsg = "Error: Password and Password Confirmation do not match.";
            console.log(errMsg);
            res.status(400).send({error: true, message: errMsg});
        } else {
            Users.findById(userId, function (err, user) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send({error: true, message: "An internal server error occurred."});
                } else if (!user) {
                    var errMsg = "Error: User not found!";
                    console.log(errMsg);
                    res.status(400).send({error: true, message: errMsg});
                } else if (oldPass != user.password) {
                    var errMsg = "Error: Old password is not correct.";
                    console.log(errMsg);
                    res.status(400).send({error: true, message: errMsg});
                } else {
                    user.password = newPass;
                    user.save(function (err) {
                        if (err) {
                            console.log(err.message);
                            res.status(500).send({error: true, message: "An internal server error occurred."});
                        }
                        activityLogger.logActivity(actorId,"update_pass",user);
                        res.send({error: false});
                    });
                }
            });
        }
    };

//  Gets the target User
//  @paramarg {String} userId           The requested User's ID.
//  @returns {Response}                 The requested User with Profile populated, will also populate Activities and Connections if Actor is admin.
    this.getUser = function (req, res, next) {
        var actorId = req.session.userId;
        var userId = req.params.userId;
        Users.findById(actorId, Users.defaultFilter)
            .populate('profile')
            .exec(function (err, actor) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send({error: true, message: "An internal server error occurred."});
                } else if(actor.authorization == "SAdmin" || actor.authorization == "Admin"){
                    Users.findById(userId, Users.defaultFilter)
                        .populate('profile').populate('activities').populate('connections')
                        .exec(function (err, user) {
                            if (err) {
                                console.log(err.message);
                                res.status(500).send({error: true, message: "An internal server error occurred."});
                            } else {
                                activityLogger.logActivity(actorId,"view_user",user);
                                res.send({error: false, data: user});
                            }
                        });
                }else{

                    Users.findById(userId, Users.defaultFilter)
                        .populate('profile')
                        .exec(function (err, user) {
                            if (err) {
                                console.log(err.message);
                                res.status(500).send({error: true, message: "An internal server error occurred."});
                            } else {
                                activityLogger.logActivity(actorId,"view_user",user);
                                res.send({error: false, data: user});
                            }
                        });
                }
            });

    };

//  Gets the User who is signed in.
//  @returns {Response}                 The User who is signed in.
    this.getActor = function (req, res, next) {
        var userId = req.session.userId;
        Users.findById(userId, Users.defaultFilter)
            .populate('profile')
            .exec(function (err, user) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send({error: true, message: "An internal server error occurred."});
                } else {
                    res.send({error: false, data: user});
                }
            });
    };

//  Deletes the target User
//  @paramarg {String} userId           The ID of the User to be deleted.
//  @returns {Response}                 The result of the delete operation.
    this.deleteUser = function (req, res, next) {
        var userId = req.params.userId;
        var actorId = req.session.userId;
        Users.findById(userId).populate('profile').exec(function (err, user) {
            if (err) {
                console.log(err.message);
                res.status(500).send({error: true, message: "An internal server error occurred."});
            } else if(user.authorization == "SAdmin"){
                console.log("Removing the Super Administrator is prohibited");
                res.status(500).send({error: true, message: "An internal server error occurred."});
            }else{
                Profiles.remove({_id: user.profile._id}, function (err) {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send({error: true, message: "An internal server error occurred."});
                    } else {
                        Users.remove({_id: user._id}, function (err) {
                            if (err) {
                                console.log(err.message);
                                res.status(500).send({error: true, message: "An internal server error occurred."});
                            } else {
                                activityLogger.logActivity(actorId,"delete_user",user);
                                console.log("User " + userId + " Removed Successfully");
                                res.send({error: false, message: "User " + user.email + " Removed Successfully"});
                            }
                        });
                    }
                });
            }
        });
    };

//    userId(param)     String
//    authorization     String
//  Sets the authorization level of the target User
//  @paramarg {String} userId           The ID of the User to be updated.
//  @bodyarg {String} authorization     The level of authorization to be set. Options include "User" and "Admin".
//  @returns {Response}                 The result of the update operation.
    this.setAuthorization = function (req, res, next) {
        var userId = req.params.userId;
        var authorization = req.body.authorization;
        var actorId = req.session.userId;
        Users.findById(userId)
            .populate('profile')
            .exec(function (err, user) {

                if(authorization == "User" || authorization == "Admin")
                    user.authorization = authorization;

                user.save(function (err) {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send({error: true, message: "An internal server error occurred."});
                    } else {
                        activityLogger.logActivity(actorId,(authorization == "Admin")?"set_admin":"demote_admin",user);
                        res.send({error: false, message: "User " + user.email + " Authorization Set Successfully to " + authorization});
                    }
                });

            });
    };

// Creates a new topic (of name topic) and adds it to the list of topics associated with the tutor with ID tutor_id.
// @paramarg {
    this.addTopic = function(req, res, next) {
        var tutorId = req.params.userId;


            //(app.mongoose.SchemaTypes.ObjectId tutor_id, String topic)

    };

    //this.getTopics
    //
    //this.removeTopic
};

module.exports = UserController;