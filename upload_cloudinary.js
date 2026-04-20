const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({ 
  cloud_name: 'di6r3oggs', 
  api_key: '624134459765584', 
  api_secret: 'Um6QoySn8er6aK5vm_0gWv5XB3I' 
});

cloudinary.uploader.upload('imms_manual.html', 
  { resource_type: "raw", public_id: "imms_manual.html", use_filename: true }, 
  function(error, result) {
      if (error) {
         console.error(error);
      } else {
         console.log("SUCCESS_URL=" + result.secure_url);
      }
  });
