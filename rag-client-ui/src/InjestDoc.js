import React from "react";
import { useState } from "react";
import AWS from "aws-sdk";

export default function UploadForm({props}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fileSize = file.size / 1024 / 1024; // Convert to MB

    if (!file) return;

    if (fileSize > 5) {
      // Max 5MB
      setSelectedFile(null);
      setUploadStatus("Error: File size exceeds limit (5MB)");
      return;
    }
    console.log(file.type);
    if (!["application/pdf"].includes(file.type)) {
      setSelectedFile(null);
      setUploadStatus("Error: Only Pdf files allowed");
      return;
    }

    setSelectedFile(file);
    setUploadStatus("");
  };

  const uploadFileToS3 = async () => {
    try {
      const s3 = new AWS.S3({
        accessKeyId: props.accessKeyId,
        secretAccessKey: props.secretAccessKey,
        region: props.region, // Replace with your bucket's region
        s3BucketName: props.s3BucketName, // Replace with your bucket name
      });
      const s3BucketName = props.s3BucketName;
      
      if (!selectedFile) return;

      await emptyBucket(s3, s3BucketName); // Empty bucket before upload
    
      setUploadStatus("uploading");

      const params = {
        Bucket: s3BucketName+"/documents",
        Key: selectedFile.name,
        Body: selectedFile,
      };

      await s3.upload(params).promise();
      setSelectedFile(null);
      setUploadStatus("Successful. Please wait for a minute for embedding completion.");
    } catch (error) {
      console.error(error);
      setUploadStatus("error");
    }
  };
  const emptyBucket = async () => {
    try {
      
      const s3 = new AWS.S3({
        accessKeyId: props.accessKeyId,
        secretAccessKey: props.secretAccessKey,
        region: props.region, // Replace with your bucket's region
        s3BucketName: props.s3BucketName, // Replace with your bucket name
      });
      const s3BucketName = props.s3BucketName;
      console.log("Emptying Bucket", s3, s3BucketName);

      const params = { Bucket: s3BucketName };
      console.log("params:", params);
      const listResponse = await s3.listObjectsV2(params).promise();

      if (listResponse.Contents.length === 0) {
        console.log("Bucket already empty");
        return;
      }

      const deleteParams = {
        Bucket: s3BucketName,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
        },
      };

      await s3.deleteObjects(deleteParams).promise();
      console.log("Bucket emptied successfully");
    } catch (error) {
      console.error("Error emptying bucket:", error);
    }
  };
  return (
    <div className="upload">
      <h4>Upload Document To Create Vector Store</h4>
      <input id="fileInput" type="file" onChange={handleFileChange} />
      <button className="submitBtn" onClick={uploadFileToS3}>
        Upload
      </button>
      <p>{uploadStatus}</p>
    </div>
  );
}
