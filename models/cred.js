const mongoose = require('mongoose');

const schema = mongoose.Schema;

let user = new schema({
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    count: {
        type: Number,
        default: 0
    }
})


mongoose.model('user', user)