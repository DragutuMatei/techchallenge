// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const busboy = require("busboy");
// const cors = require("cors");

// const app = express();
// const port = 5000;

// // Middleware for CORS and JSON body parsing
// app.use(cors());
// app.use(express.json());

// // Function to sanitize the username
// const sanitizeUsername = (username) => {
//   return username ? username.replace(/\s+/g, "_") : "anonymous_user";
// };

// // Endpoint to handle file uploads using busboy
// app.post("/upload-images", (req, res) => {
//   const bb = busboy({ headers: req.headers });
//   const fields = {};
//   const files = [];

//   // When a field is detected in the form
//   bb.on("field", (name, val) => {
//     console.log(name, val);
//     fields[name] = val;
//   });

//   // When a file is detected in the form
//   bb.on("file", (fieldname, file, filename, encoding, mimetype) => {
//     const username = fields.username || "anonymous_user";
//     const sanitizedUsername = sanitizeUsername(username);

//     const userFolder = path.join(__dirname, "uploads", sanitizedUsername);
//     if (!fs.existsSync(userFolder)) {
//       fs.mkdirSync(userFolder, { recursive: true });
//     }

//     console.log(userFolder);
//     console.log(filename);
//     // Define the file path
//     const filePath = path.join(userFolder, filename.filename);
//     const writeStream = fs.createWriteStream(filePath);
//     file.pipe(writeStream);

//     // Store file info
//     files.push({ name: filename, path: filePath });

//     file.on("end", () => {
//       console.log(`${filename} uploaded successfully`);
//     });
//   });

//   bb.on("finish", () => {
//     const uploadedFiles = files.map((file) => ({
//       url: `uploads/${sanitizeUsername(fields.username)}/${file.name}`,
//       name: file.name,
//     }));

//     res.json({
//       message: "Images uploaded successfully",
//       images: uploadedFiles,
//     });
//   });

//   req.pipe(bb); // Pipe the incoming request to busboy
// });

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

const express = require("express");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = 5000;

// Middleware to allow CORS
app.use(cors());
app.use(express.json({ limit: "500mb" }));

// Function to sanitize the username (replace spaces with underscores)
const sanitizeUsername = (username) => {
  console.log(username);
  return username ? username.replace(/\s+/g, "_") : "anonymous_user"; // Replace spaces with underscores
};

const clearUserFolder = (folderPath) => {
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // If it's a subdirectory, we can recursively delete it
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      // If it's a file, delete it
      fs.unlinkSync(filePath);
    }
  });
};

// Endpoint to handle file uploads
app.post("/upload-images", (req, res) => {
  const form = new formidable.IncomingForm();
  // Set the folder where files will be uploaded
  form.uploadDir = path.join(__dirname, "uploads");
  form.keepExtensions = true; // Keep original file extensions

  // Parse the incoming form data
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).send("Error in uploading files");
    }

    // Get the username from the fields (or default to 'anonymous_user')
    const username = fields.username || "anonymous_user";
    const sanitizedUsername = sanitizeUsername(username[0]); // Sanitize the username to ensure a valid folder name

    // Create a folder for the user if it doesn't exist
    const userFolder = path.join(form.uploadDir, sanitizedUsername);
    if (fs.existsSync(userFolder)) {
      clearUserFolder(userFolder);
    } else {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    const movedFiles = [];
    files.images.forEach((file) => {
      // Log file properties for debugging
      console.log("Processing file:", file.originalFilename + ".png");

      const newLocation = path.join(
        userFolder,
        file.originalFilename + Math.random() + ".png"
      );
      console.log("Moving file to:", newLocation);

      // Ensure the file path is available and move it
      if (!file.filepath) {
        return res.status(400).send("File missing temporary path");
      }

      fs.renameSync(file.filepath, newLocation); // Move the file to the user folder
      const fileData = fs.readFileSync(newLocation);
      const base64Image = fileData.toString("base64");

      movedFiles.push({
        base64: `data:${file.mimetype};base64,${base64Image}`, // Prefix with MIME type
      });
    });

    // Return the list of uploaded files
    res.json({
      message: "Images uploaded successfully",
      images: movedFiles,
    });
  });
});

app.post("/save-images", (req, res) => {
  try {
    const username = req.body.username || "anonymous_user";
    const sanitizedUsername = sanitizeUsername(username); // Sanitize the username to ensure a valid folder name

    // Create the user's folder if it doesn't exist
    const userFolder = path.join(__dirname, "uploads", sanitizedUsername);

    // Clear the existing files in the folder before uploading new ones
    clearUserFolder(userFolder);

    const movedFiles = [];

    // Process each Base64 image and save it to disk
    JSON.parse(req.body.images).forEach((image, index) => {
      const base64Image = image.base64; // The Base64 string sent from the frontend
      const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64"); // Decode the Base64 string

      // Generate a unique filename for the image
      const fileName = `image_${Date.now()}_${index}.png`; // You can change the file format if needed

      // Save the image to disk
      const filePath = path.join(userFolder, fileName);
      fs.writeFileSync(filePath, imageBuffer); // Write the image data to a file

      movedFiles.push({
        base64: `data:image/png;base64,${imageBuffer.toString("base64")}`, // Return the Base64 string of the image
        name: fileName,
      });
    });

    // Return the list of uploaded images
    res.json({
      message: "Images uploaded successfully",
      images: movedFiles,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).send("Error in uploading images");
  }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
