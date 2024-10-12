import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import "./App.css";  // Import the CSS file

// Firebase configuration (use your own config)
const firebaseConfig = {
  apiKey: "AIzaSyCTiv0L_KrFgejo5vUM3jQkTFCltuJjWYM",
  authDomain: "techchallenge-1ef83.firebaseapp.com",
  projectId: "techchallenge-1ef83",
  storageBucket: "techchallenge-1ef83.appspot.com",
  messagingSenderId: "636793795279",
  appId: "1:636793795279:web:a46a008424edcb9c1bbdba",
  measurementId: "G-FH4WHG23G0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const takePicture = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      setImages((prev) => [...prev, blob]);
    });
  };

  const uploadImages = async () => {
    setIsLoading(true);
    setMessage("Uploading images...");

    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });
    formData.append("username", user.email);

    try {
      const response = await axios.post("http://localhost:5000/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages([]); // Clear the images after upload
      setNewImages(response.data.images);
      setMessage("Images uploaded successfully! Select the ones to submit.");
    } catch (error) {
      setMessage("Error uploading images.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitSelection = async () => {
    setIsLoading(true);
    setMessage("Submitting your selection...");

    try {
      await axios.post(
        "http://localhost:5000/save-images",
        { images: JSON.stringify(selectedImages), username: user.email }
      );
      setImages([]);
      setSelectedImages([]);
      setNewImages([]);
      setMessage("Selection saved successfully!");
    } catch (error) {
      setMessage("Error submitting your selection.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {!user ? (
        <button onClick={handleLogin} className="login-btn">Login with Google</button>
      ) : (
        <div className="user-panel">
          <p className="welcome-message">Welcome, {user.email}</p>
          <button onClick={handleLogout} className="logout-btn">Logout</button>

          <div className="camera-panel">
            <video ref={videoRef} autoPlay className="camera-video"></video>
            <button onClick={startCamera} className="camera-btn">Start Camera</button>
            <button onClick={takePicture} className="capture-btn">Capture</button>
          </div>

          <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }}></canvas>

          <div className="image-gallery">
            <h3>Captured Images</h3>
            {images.map((image, index) => (
              <div key={index} className="image-item">
                <img src={URL.createObjectURL(image)} alt={`img-${index}`} width={100} />
              </div>
            ))}
            {newImages.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image.base64} alt={`img-${index}`} width={100} />
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedImages((prev) => [...prev, image]);
                    } else {
                      setSelectedImages((prev) => prev.filter((img) => img !== image));
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <div className="buttons">
            <button onClick={uploadImages} className="upload-btn" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload Images"}
            </button>
            {newImages.length > 0 && (
              <button onClick={submitSelection} className="submit-btn" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Selection"}
              </button>
            )}
          </div>

          {message && <div className="status-message">{message}</div>}
        </div>
      )}
    </div>
  );
};

export default App;
