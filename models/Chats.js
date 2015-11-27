/**
 * Created by parkeraldricmar on 15-11-25.
 */
module.exports = function(app){
    var ChatSchema = new app.mongoose.Schema({
        fromId: { type: app.mongoose.SchemaTypes.ObjectId, ref: 'Users'},
        toId: { type: app.mongoose.SchemaTypes.ObjectId, ref: 'Users'},
        messages: [{ type: app.mongoose.SchemaTypes.ObjectId, ref: 'ChatMessages'}]
    });

    return app.mongoose.model('Chats', ChatSchema);
};