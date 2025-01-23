import React, { useEffect, useState } from 'react';
import { FileUploader } from "react-drag-drop-files";
import './App.css';
import Tesseract from 'tesseract.js';

// Allowed file types and max file size (5MB)
const fileTypes = ["JPG", "PNG", "GIF","JPEG"];
const maxSizeInMB = 5; // Max file size: 5MB
const maxSizeInBytes = maxSizeInMB * 1024 * 1024; // Convert to bytes

// Type for parsed OCR data
type ParsedData = {
  aadhaarNumber: string;
  name: string;
  dob: string;
  gender: string;
  address: string;
  pincode: string;
};

type FileType = File;

const App: React.FC = () => {
  const [images, setImages] = useState<FileType[]>([]); // State to store the selected images
  const [error, setError] = useState<string | null>(null); // State for error messages
  const [parsedData, setParsedData] = useState<ParsedData  | null>(null); // Parsed data after OCR
  const [loading, setLoading] = useState<boolean>(false);
  // Handle file selection and validation
  const handleChange = (file: File) => {
    setError(null); // Reset error message

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (fileExtension && !fileTypes.includes(fileExtension)) {
      setError(`Invalid file type. Only ${fileTypes.join(', ')} are allowed.`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds the limit of ${maxSizeInMB} MB.`);
      return;
    }

    // If there are already two files, prevent adding more
    if (images.length >= 2) {
      setError("You can only upload two images (front and back of Aadhaar card).");
      return;
    }

    // Add the valid file to the state
    setImages((prevFiles) => [...prevFiles, file]);
  };

  // Handle file removal
  const handleRemoveImage = (index: number) => {
    setImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
// Function to parse Aadhaar data using Tesseract.js OCR
const parseOCRData = async () => {
  if (images.length < 2) {
    setError("Please upload both front and back images of the Aadhaar card.");
    return;
  }

  setLoading(true); // Start loading state

  try {
    const results = await Promise.all(images.map((image) => 
      Tesseract.recognize(
        image,
        'eng', // Language for OCR, 'eng' is English
        {
          logger: (m) => console.log(m), // Optional logger to view OCR process
        }
      )
    ));

    // Assuming the OCR result for each image is returned as plain text
    const ocrTextFront = results[0].data.text;
    const ocrTextBack = results[1].data.text;
    console.log(ocrTextBack,ocrTextFront)

    // Mock extraction of data from OCR text (you'd likely use regex or other methods)
    const mockParsedData: ParsedData = {
      aadhaarNumber: "1234 5678 9101",
      name: "John Doe",
      dob: "01/01/1990",
      gender: "Male",
      address: "1234 Elm Street, Springfield",
      pincode: "123456",
    };

    // Set parsed data state
    setParsedData(mockParsedData);
  } catch (error) {
    setError("An error occurred while processing the images.");
    console.error(error);
  } finally {
    setLoading(false); // End loading state
  }
};


  return (
    <div className="app">
      <h1>Aadhaar Card Image Upload</h1>

      {/* File Upload */}
      <div className='file-uploader'>
      <FileUploader handleChange={handleChange} name="file" types={fileTypes} />

      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Display the images */}
      <div className="image-preview">
        {images.length > 0 && images.map((file, index) => (
          <div key={index} className="image-item">
            <img
              src={URL.createObjectURL(file)}
              alt={`image-${index}`}
              className="image-thumb"
            />
            <button onClick={() => handleRemoveImage(index)} className="remove-btn">
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Display the parsed data */}
      {parsedData && (
        <div className="parsed-data">
          <h3>Parsed Data:</h3>
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

      {/* Button to parse the OCR data */}
      <button onClick={parseOCRData} className="parse-btn">
        Parse Aadhaar Data
      </button>
    </div>
  );
};

export default App;
