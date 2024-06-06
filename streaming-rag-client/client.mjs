// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { LanceDB } from "langchain/vectorstores/lancedb";
import { BedrockEmbeddings } from "langchain/embeddings/bedrock";
import { connect } from "vectordb"; // LanceDB
import { PromptTemplate } from "langchain/prompts";
import { ChatBedrock } from "langchain/chat_models/bedrock";
import { StringOutputParser } from "langchain/schema/output_parser";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "langchain/schema/runnable";
import { formatDocumentsAsString } from "langchain/util/document";

const lanceDbSrc = process.env.s3BucketName;
const lanceDbTable = process.env.lanceDbTable;
const awsRegion = process.env.region;

const runChain = async ( prompt, responseStream) => {
  const db = await connect(`s3://${lanceDbSrc}/embeddings`);
  console.log("db connection successful", db);
  const table = await db.openTable(lanceDbTable);
  const streamingFormat = null; // "fetch-event-source";
  console.log("table opened", table);
  console.log("prompt", prompt);
  console.log("streamingFormat", streamingFormat);

  const embeddings = new BedrockEmbeddings({ region: awsRegion });
  console.log("embeddings", embeddings);
  const vectorStore = new LanceDB(embeddings, { table });
  console.log("vectorStore", vectorStore);
  const retriever = vectorStore.asRetriever();
  console.log("retriever", retriever);

  const promptQuery = PromptTemplate.fromTemplate(
    `Answer the following question based only on the following context:
        {context}

        Question: {question}`
  );

  const llmModel = new ChatBedrock({
    model: "anthropic.claude-v2",
    region: awsRegion,
    streaming: true,
    maxTokens: 1000,
  });

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    promptQuery,
    llmModel,
    new StringOutputParser(),
  ]);

  const stream = await chain.stream(prompt);
  for await (const chunk of stream) {
    //console.log(chunk);
    switch (streamingFormat) {
      case "fetch-event-source":
        responseStream.write(`event: message\n`);
        responseStream.write(`data: ${chunk}\n\n`);
        break;
      default:
        responseStream.write(chunk);
        break;
    }
  }
  responseStream.end();
  console.log("stream ended.");
  //return responseStream;
};

function parseBase64(message) {
  return JSON.parse(Buffer.from(message, "base64").toString("utf-8"));
}

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, _context) => {
    console.log("Event", JSON.stringify(event));
    let promptObj = event.isBase64Encoded ? parseBase64(event.body) : JSON.parse(event.body);
    //console.log('Body', body);
    console.log("Response Stream", responseStream);
    console.log("Calling runChain");
    await runChain(promptObj.prompt, responseStream);
    console.log(JSON.stringify({ "status": "complete" }));
  }
);

/*
Sample event 1:
{
    "query": "What models are available in Amazon Bedrock?",
}
Sample event 2:
{
    "query": "What models are available in Amazon Bedrock?",
    "model": "anthropic.claude-instant-v1"
}
Sample event 3:
{
    "query": "What models are available in Amazon Bedrock?",
    "model": "anthropic.claude-v2",
    "streamingFormat": "fetch-event-source"
}
*/
