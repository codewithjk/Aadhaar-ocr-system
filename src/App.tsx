import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import Tesseract from "tesseract.js";
import "./App.css";
import { useAuth0 } from "@auth0/auth0-react";

const fileTypes = ["JPG", "PNG", "GIF", "JPEG"];
const maxSizeInMB = 5;
const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

type ParsedData = {
  aadhaarNumber: string;
  name: string;
  dob: string;
  gender: string;
  address: string;
  pincode: string;
};

const App: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retry, setRetry] = useState<boolean>(false);
  const { loginWithRedirect, logout, user } = useAuth0();

  const handleChange = (file: File) => {
    setError(null);
    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !fileTypes.includes(fileExtension)) {
      setError(`Invalid file type. Only ${fileTypes.join(", ")} are allowed.`);
      return;
    }
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds ${maxSizeInMB} MB.`);
      return;
    }
    if (images.length >= 2) {
      setError("You can only upload two images (front and back).")
      return;
    }
    setImages((prevFiles) => [...prevFiles, file]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const parseOCRData = async () => {
    if (images.length < 2) {
      setError("Please upload both front and back images.");
      return;
    }
    setLoading(true);
    setRetry(false);
    setError(null);
    
    try {
      const results = await Promise.all(
        images.map((image) =>
          Tesseract.recognize(image, "eng", {
            logger: (m) => console.log(m),
          })
        )
      );

      const ocrTextFront = results[0].data.text;
      const ocrTextBack = results[1].data.text;
      const dataString = ocrTextFront + ocrTextBack;

      const aadhaarNumberMatch = dataString.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      const aadhaarNumber = aadhaarNumberMatch ? aadhaarNumberMatch[0] : "Not Found";
      
      const nameMatch = dataString.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[-:\/]?\s*DOB[:\/-]/i);
      const name = nameMatch ? nameMatch[1].trim() : "Not Found";
      
      const dobMatch = dataString.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
      const dob = dobMatch ? dobMatch[0] : "Not Found";
      
      const genderMatch = dataString.match(/\b(MALE|FEMALE|OTHER)\b/);
      const gender = genderMatch ? genderMatch[0] : "Not Found";
      
      const addressMatch = dataString.match(/Address:\s*(.+?)\s*\d{6}/s);
      const address = addressMatch ? addressMatch[0] : "Not Found";
      
      const pincodeMatch = dataString.match(/\b\d{6}\b/);
      const pincode = pincodeMatch ? pincodeMatch[0] : "Not Found";

      setParsedData({ aadhaarNumber, name, dob, gender, address, pincode });
    } catch (error) {
      setError("An error occurred while processing the images.");
      console.error(error);
      setRetry(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        {user ? (
          <button className="logout-btn" onClick={() => logout()}>
            Logout
          </button>
        ) : (
          <button className="login-btn" onClick={() => loginWithRedirect()}>
            Login
          </button>
        )}
      </nav>
      {
        !user && (
          <>
             <h1>Welcome to Aadhaar Data Extractor</h1>
          </>
        )
      }
      
      {user && (
        <>
          <h1>Welcome, {user.email}</h1>
          <h2>Aadhaar Card OCR</h2>
          <div className="file-uploader">
            <FileUploader handleChange={handleChange} name="file" types={fileTypes} />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="image-preview">
            {images.map((file, index) => (
              <div key={index} className="image-item">
                <img src={URL.createObjectURL(file)} alt={`image-${index}`} className="image-thumb" />
                <button onClick={() => handleRemoveImage(index)} className="remove-btn">
                  Remove
                </button>
              </div>
            ))}
          </div>
          {parsedData && (
            <div className="parsed-data">
              <h3>Extracted Aadhaar Details:</h3>
              <ul>
                <li><strong>Aadhaar Number:</strong> {parsedData.aadhaarNumber}</li>
                <li><strong>Name:</strong> {parsedData.name}</li>
                <li><strong>Date of Birth:</strong> {parsedData.dob}</li>
                <li><strong>Gender:</strong> {parsedData.gender}</li>
                <li><strong>Address:</strong> {parsedData.address}</li>
                <li><strong>Pincode:</strong> {parsedData.pincode}</li>
              </ul>
            </div>
          )}
          <button onClick={parseOCRData} className="parse-btn" disabled={loading}>
            {loading ? "Processing..." : retry ? "Try Again" : "Parse Aadhaar Data"}
          </button>
        </>
      )}
    </div>
  );
};

export default App;
