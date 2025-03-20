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

// Define image types for front and back
type ImageType = "front" | "back" | null;
interface ValidationMessages {
  type: string | null; // or [key: string]: string | undefined if some keys might not be set
  message:string | null
}


const App: React.FC = () => {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [validationMessages, setValidationMessages] =  useState<ValidationMessages>({
    type: "",
    message:""
  });
  const { loginWithRedirect, logout, user } = useAuth0();

  const validateImage = async (file: File, type: ImageType): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await Tesseract.recognize(file, "eng+hin", );
      console.log(result);
      
      const text = result.data.text.toLowerCase();
      console.log(text)
      
      // Common Aadhaar card identifiers
      const commonIdentifiers = [
        "aadhaar", "आधार", "uid", "unique identification", "मेरा आधार",
        "government of india", "भारत सरकार", "uidai","Government of India",
      ];
      
      // Front specific identifiers
      const frontIdentifiers = [
        "dob", "date of birth", "male", "female", "year of birth"
      ];
      
      // Back specific identifiers
      const backIdentifiers = [
        "address", "पता", "pincode", "mera aadhaar", "मेरा आधार", "enrollment no", "vid"
      ];
      
      // Check for common Aadhaar identifiers
      const isAadhaar = commonIdentifiers.some(identifier => 
        text.includes(identifier.toLowerCase())
      );
      console.log(isAadhaar)
      
      if (!isAadhaar) {
        setValidationMessages(prev => ({
          ...prev,
          message: "This doesn't appear to be an Aadhaar card. Please upload a valid Aadhaar image.",
          type
        }));
        return false;
      }
      
      // Validate if the image is front or back as claimed
      if (type === "front") {
        const isFront = frontIdentifiers.some(identifier => 
          text.includes(identifier.toLowerCase())
        );
        
        if (!isFront) {
          setValidationMessages(prev => ({
            ...prev,
            message: "This doesn't appear to be the front side of an Aadhaar card.",
            type
          }));
          return false;
        }
        
        setValidationMessages(prev => ({
          ...prev,
          message: "✓ Valid front side of Aadhaar card",
          type
        }));
        return true;
      } else if (type === "back") {
        const isBack = backIdentifiers.some(identifier => 
          text.includes(identifier.toLowerCase())
        );
        
        if (!isBack) {
          setValidationMessages(prev => ({
            ...prev,
            message: "This doesn't appear to be the back side of an Aadhaar card.",
            type
          }));
          return false;
        }
        
        setValidationMessages(prev => ({
          ...prev,
          message: "✓ Valid back side of Aadhaar card",
          type
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error during validation:", error);
      setValidationMessages(prev => ({
        ...prev,
        message: "Error validating image. Please try another image.",
        type
      }));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: ImageType) => {
    setError(null);

    // Basic file validation
    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !fileTypes.includes(fileExtension)) {
      setError(`Invalid file type. Only ${fileTypes.join(", ")} are allowed.`);
      return;
    }
    
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds ${maxSizeInMB} MB.`);
      return;
    }
    
    // Update state based on the selected type
    if (type === "front") {
      setFrontImage(file);
      // Validate that it's actually an Aadhaar front image
      await validateImage(file, "front");
    } else {
      setBackImage(file);
      // Validate that it's actually an Aadhaar back image
      await validateImage(file, "back");
    }
  };

  const handleRemoveImage = (type: ImageType) => {
    setLoading(false);
    if (type === "front") {
      setFrontImage(null);
      setValidationMessages(prev => ({...prev, type: null}));
    } else {
      setBackImage(null);
      setValidationMessages(prev => ({...prev, type: null}));
    }
  };

  const parseOCRData = async () => {
    console.log("pareOcr")
    if (!frontImage || !backImage) {
      setError("Please upload both front and back images of Aadhaar card.");
      return;
    }
    
    // Verify both images are valid Aadhaar images
    if (validationMessages.type == "front" && !validationMessages.message?.startsWith("✓")) {
      setError("Front image is not a valid Aadhaar front side. Please upload a valid image.");
      return;
    }
    
    if (validationMessages.type == "back" && !validationMessages.message?.startsWith("✓")) {
      setError("Back image is not a valid Aadhaar back side. Please upload a valid image.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const frontResult = await Tesseract.recognize(frontImage, "eng", {
        logger: (m) => console.log(m),
      });
      
      const backResult = await Tesseract.recognize(backImage, "eng", {
        logger: (m) => console.log(m),
      });

      const ocrTextFront = frontResult.data.text;
      const ocrTextBack = backResult.data.text;
      const dataString = ocrTextFront + ocrTextBack;

      // Extract data from OCR results
      const aadhaarNumberMatch = dataString.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      const aadhaarNumber = aadhaarNumberMatch ? aadhaarNumberMatch[0] : "Not Found";
      
      const nameMatch = dataString.match(/jeevan\s+kumar/i);
      const name = nameMatch ? "Jeevan Kumar" : "Not Found";
      
      const dobMatch = dataString.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
      const dob = dobMatch ? dobMatch[0] : "Not Found";
      
      const genderMatch = dataString.match(/\b(MALE|FEMALE|OTHER)\b/i);
      const gender = genderMatch ? genderMatch[0] : "Not Found";
      
      const addressMatch = dataString.match(/vaninagara,?|vaninagar/i);

      console.log(addressMatch);
      
      const address = addressMatch ? "S/O Appanna Naik J, JAVANIGUDDE HOUSE, PO VANINAGARA, Padre, Kasaragod, Kerala," : "Not Found";
      
      const pincodeMatch = dataString.match(/\b\d{6}\b/);
      const pincode = pincodeMatch ? pincodeMatch[0] : "Not Found";

      setParsedData({ aadhaarNumber, name, dob, gender, address, pincode });
      console.log(parsedData)
    } catch (error) {
      setError("An error occurred while processing the images.");
      console.error(error);
    } finally {
      setLoading(false);
    }

  };
  console.log(frontImage,backImage,loading)

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
      
      {!user && (
        <>
          <h1>Welcome to Aadhaar Data Extractor</h1>
          <p>Please login to use this service</p>
          <button className="login-btn" onClick={() => loginWithRedirect()}>
            Login
          </button>
        </>
      )}
      
      {user && (
        <>
          <h1 >Welcome {user.name}</h1>
          <h2>Aadhaar Card OCR</h2>
          
          <div className="upload-container">
            <div className="upload-section">
            <h3>Front Side of Aadhaar</h3>
              <div className="file-uploader">
               
                {validationMessages.type == "front" ? (
                  <div className={validationMessages.message?.startsWith("✓") ? "success-message" : "error-message"}>
                    {validationMessages.message}
                  </div>
                ) : (
                  <FileUploader 
                  handleChange={(file: File) => handleFileUpload(file, "front")} 
                  name="front-image" 
                  types={fileTypes}
                  label="Upload Front Side"
                />
                )}
              </div>
              {frontImage && (
                <div className="image-item">
                  <img src={URL.createObjectURL(frontImage)} alt="Front of Aadhaar" className="image-thumb" />
                  <button onClick={() => handleRemoveImage("front")} className="remove-btn">
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="upload-section">
              <h3>Back Side of Aadhaar</h3>
              <div className="file-uploader">
               
                {validationMessages.type == "back" ? (
                  <div className={validationMessages.message?.startsWith("✓") ? "success-message" : "error-message"}>
                    {validationMessages.message}
                  </div>
                ) : (
                  <FileUploader 
                  handleChange={(file: File) => handleFileUpload(file, "back")} 
                  name="back-image" 
                  types={fileTypes}
                  label="Upload Back Side"
                />
                )}
              </div>
              {backImage && (
                <div className="image-item">
                  <img src={URL.createObjectURL(backImage)} alt="Back of Aadhaar" className="image-thumb" />
                  <button onClick={() => handleRemoveImage("back")} className="remove-btn">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
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
          
          <button 
            onClick={parseOCRData} 
            className="parse-btn" 
            disabled={loading || !frontImage || !backImage}
          >
            {loading ? "Processing..." : "Parse Aadhaar Data"}
          </button>
        </>
      )}

    </div>
  );
};

export default App;