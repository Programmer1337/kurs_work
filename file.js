const {Schema, model, Types} = require('mongoose')
const schema = new Schema({
    name: {type: String,unique:false},
    format: {type: String,unique:false},
    content: {type: String,unique:false}
})

module.exports = model('File', schema)