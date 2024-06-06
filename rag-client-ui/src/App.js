// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "./styles.css";
import React from "react";
import { useState, useEffect } from "react";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import UploadForm from "./InjestDoc";

export default function App() {
  const [searchQuery, setSearchQuery] = useState();
  const [chat, setChat] = useState([]);
  const [isValid, setIsValid] = useState(true);

  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [s3BucketName, setS3BucketName] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    // Retrieve environment variables (replace with your actual retrieval logic)
    setAccessKeyId(process.env.REACT_APP_AWS_ACCESS_KEY_ID);
    setSecretAccessKey(process.env.REACT_APP_AWS_SECRET_ACCESS_KEY);
    setRegion(process.env.REACT_APP_AWS_REGION);
    setS3BucketName(process.env.REACT_APP_S3_BUCKET_NAME);
  }, []);

  const s3Config = {
    accessKeyId,
    secretAccessKey,
    region, // Replace with your region
    s3BucketName, // Replace with your bucket name
  };
  
  const streamData = async () => {
    const credentials = {
      accessKeyId,
      secretAccessKey,
      region,
    };

    setChat([]);
    const sigv4 = new SignatureV4({
      service: "lambda",
      region: process.env.REACT_APP_AWS_REGION,
      credentials,
      sha256: Sha256,
    });

    const apiUrl = new URL(process.env.REACT_APP_LAMBDA_ENDPOINT_URL);

    const query = document.getElementById("searchQuery").value;
    if (query.length < 1) {
      setIsValid(false);
      return;
    }
    setIsValid(true);
    setSearchQuery(query);

    let body = JSON.stringify({
      prompt: query,
      //model: "anthropic.claude-instant-v1",
      // Other model examples that you can use.
      // model: "anthropic.claude-3-haiku-20240307-v1:0",
      // model: "anthropic.claude-3-sonnet-20240229-v1:0",
      // model: "mistral.mistral-large-2402-v1:0",
    });

    let signed = await sigv4.sign({
      body,
      method: "POST",
      hostname: apiUrl.hostname,
      path: apiUrl.pathname.toString(),
      protocol: apiUrl.protocol,
      headers: {
        "Content-Type": "application/json",
        host: apiUrl.hostname,
      },
    });

    try {
      console.log("Calling Lambda Function URL");
      let response = await fetch(apiUrl, {
        method: signed.method,
        headers: signed.headers,
        body: body,
        mode: "cors",
      });
      
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

      console.log("reader", reader);
      while (true) {
        const { value, done } = await reader.read();        

        if (done) break;
        setChat((data) => [...data, value]);
      }
    } catch (err) {
      console.log("Something went wrong");
      console.log("Error", err);
      return;
    }
  };

  return (
    <div className="main">
      <h1>Retrival Augumented Generation(RAG) using LanceDB</h1>
      <div >
        <UploadForm props={s3Config}></UploadForm>
      </div>
      <div className="response">
        {!isValid && <p style={{ color: "red" }}>Prompt is required</p>}
        <div className="prompt">
          <span className="label">Ask a question: </span>
          <input id="searchQuery" required></input>
          <br></br>
          <button className="submitBtn" onClick={() => streamData()}>
            Submit Question
          </button>
        </div>
        
      </div>
      <div className="response">
        <p>
          <b>Question:</b> {searchQuery}
          <br></br>
          <br></br>
          <b>Response:</b> {chat.join("")}
        </p>
      </div>
    </div>
  );
}
