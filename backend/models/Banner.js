const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: {
    type: String, 
    required: true, 
  },
  title: {
    type: String, 
    required: true, 
  },
  description: {
    type: String, 
  },
  link: {
    type: String, 
  },
  toggled: {
    type: Boolean, 
    default: true, 
  },
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;