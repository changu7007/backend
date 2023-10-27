import { IncomingForm } from "formidable";
const formidableMiddleware = (req, res, next) => {
  const form = new IncomingForm();

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Error parsing the form." });
    }
    // Convert single-item arrays to strings
    for (let key in fields) {
      if (fields[key].length === 1 && Array.isArray(fields[key])) {
        fields[key] = fields[key][0];
      }
    }
    // Convert single-item arrays to strings
    // for (let key in files) {
    //   if (files[key].length === 1 && Array.isArray(files[key])) {
    //     files[key] = files[key][0];
    //   }
    // }
    // Attach fields and files to request object
    req.fields = fields;
    req.files = files;

    next(); // Pass control to the next middleware
  });
};
export default formidableMiddleware;
