/**
 * Created by ahmedel-baz on 15-11-07.
 */
module.exports = function(app){
    var ActivitySchema = new app.mongoose.Schema({
        actor: { type: app.mongoose.SchemaTypes.ObjectId, ref: 'Users'},
        type: String,
        target: {
            _id: { type: app.mongoose.SchemaTypes.ObjectId },
            email: String,
            displayName: String
        },
        created_at: { type: Date, required: true, default: Date.now }
    });

    return app.mongoose.model('Activities', ActivitySchema);
};