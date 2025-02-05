import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import Tesseract from "tesseract.js";
import "./App.css";

// Allowed file types and max size (5MB)
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

  // Handle file selection and validation
  const handleChange = (file: File) => {
    setError(null);

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !fileTypes.includes(fileExtension)) {
      setError(`Invalid file type. Only ${fileTypes.join(", ")} are allowed.`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds ${maxSizeInMB} MB.`);
      return;
    }

    // Limit to 2 images (front and back of Aadhaar)
    if (images.length >= 2) {
      setError("You can only upload two images (front and back).");
      return;
    }

    setImages((prevFiles) => [...prevFiles, file]);
  };

  // Remove selected image
  const handleRemoveImage = (index: number) => {
    setImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // Function to parse Aadhaar data using OCR
  const parseOCRData = async () => {
    if (images.length < 2) {
      setError("Please upload both front and back images.");
      return;
    }

    setLoading(true);
    setRetry(false);
    setError(null);

    const timeout = setTimeout(() => {
      setLoading(false);
      setRetry(true);
      setError("OCR processing took too long. Please try again.");
    }, 30000); // 30 seconds timeout

    try {
      const results = await Promise.all(
        images.map((image) =>
          Tesseract.recognize(image, "eng", {
            logger: (m) => console.log(m),
          })
        )
      );

      clearTimeout(timeout); // Clear timeout if processing is successful

      const ocrTextFront = results[0].data.text;
      const ocrTextBack = results[1].data.text;
      const dataString = ocrTextFront + ocrTextBack;

      console.log("OCR Result:", dataString);

      // Extract Aadhaar Number (12-digit pattern)
      const aadhaarNumberMatch = dataString.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      const aadhaarNumber = aadhaarNumberMatch ? aadhaarNumberMatch[0] : "Not Found";

      // Extract Name (Assuming first uppercase word)
      const nameMatch = dataString.match(/(?:Government of India\s+)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[\-:\/]?\s*DOB[:\/\-]/i);
      console.log(nameMatch)
      const name = nameMatch ? nameMatch[1].trim() : "Not Found";

      // Extract Date of Birth (DD/MM/YYYY format)
      const dobMatch = dataString.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
      const dob = dobMatch ? dobMatch[0] : "Not Found";

      // Extract Gender (Male/Female)
      const genderMatch = dataString.match(/\b(MALE|FEMALE|OTHER)\b/);
      const gender = genderMatch ? genderMatch[0] : "Not Found";

      // Extract Address (Find "Address:" and get following text)
      const addressMatch = dataString.match(/Address:\s*(.+?)\s*\d{6}/s)
      const address = addressMatch ?addressMatch[0]  : "Not Found";

      // Extract Pincode (6-digit number)
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
      <h1>Aadhaar Card OCR</h1>

      {/* File Upload */}
      <div className="file-uploader">
        <FileUploader handleChange={handleChange} name="file" types={fileTypes} />
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Image Preview */}
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

      {/* Parsed Data */}
      {parsedData && (
        <div className="parsed-data">
          <h3>Extracted Aadhaar Details:</h3>
          <ul>
            <li>
              <strong>Aadhaar Number:</strong> {parsedData.aadhaarNumber}
            </li>
            <li>
              <strong>Name:</strong> {parsedData.name}
            </li>
            <li>
              <strong>Date of Birth:</strong> {parsedData.dob}
            </li>
            <li>
              <strong>Gender:</strong> {parsedData.gender}
            </li>
            <li>
              <strong>Address:</strong> {parsedData.address}
            </li>
            <li>
              <strong>Pincode:</strong> {parsedData.pincode}
            </li>
          </ul>
        </div>
      )}

      {/* Parse Button */}
      <button onClick={parseOCRData} className="parse-btn" disabled={loading}>
        {loading ? "Processing..." : retry ? "Try Again" : "Parse Aadhaar Data"}
      </button>
    </div>
  );
};

export default App;
