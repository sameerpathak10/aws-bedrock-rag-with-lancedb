# Serverless Embedding with Amazon Bedrock and LanceDB

This is an example of serverless document ingestion pipeline that automates the calculation of embeddings, so that they can be used in the context of a Retrieval Augmented Generation application. This sample makes use of Amazon Bedrock to provide access to Amazon Titan Embedding model and LanceDB to store and provide access to the calculated vectors.

![alt text](/documents/RAG-With-LanceDB.png)

## Wait, what do we mean with embedding?

In the realm of Natural Language Processing (NLP), embeddings are a pivotal concept that enable the translation of textual information into numerical form that machines can understand and process. At its core, the process involves vectorization, where words, phrases, or even entire documents are mapped to vectors of real numbers, creating a high-dimensional space where each dimension corresponds to a feature learned from the text. These features could range from syntactic patterns to contextual cues that encapsulate the semantics of the language.

The magic of embeddings lies in their ability to capture the essence of language in a metric space—a mathematical space where distances between points (in this case, word vectors) are meaningful. In such a space, the distance between vectors correlates with the linguistic or semantic similarity between the entities they represent. For instance, synonyms or contextually similar words are positioned closer together, while antonyms are further apart. This spatial arrangement is achieved through models like Word2Vec or BERT, which employ neural networks to learn these representations by ingesting massive corpora of text and considering the co-occurrence of words within varying contexts. The resultant embeddings are a sophisticated blend of tokenization and vectorial representation, enabling nuanced language applications from sentiment analysis to information retrieval.

## How does it work?
The ingestion process starts when a file is uploaded to the Amazon S3 bucket deployed by this sample, under the path `./documents`.  
A notification is sent to an Amazon Lambda function which downloads the uploaded document, makes use of Amazon Titan Embedding via Amazon Bedrock to calculate embeddings, and stores the resulting embeddings on the same Amazon S3 bucket, under the path `./embeddings`. 

## Deploy
Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the AWS Pricing page for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

### Requirements

- AWS CLI already configured with Administrator permission
- AWS SAM CLI installed - minimum version 1.94.0 (sam --version)
- NodeJS 18 (minumum)

### Deploy this demo

We will be using AWS SAM.

Deploy the project to the cloud:

```
sam build
sam deploy -g # Guided deployments
```

When asked about functions that may not have authorization defined, answer (y)es. The access to those functions will be open to anyone, so keep the app deployed only for the time you need this demo running.

Next times, when you update the code, you can build and deploy with:

```
sam build && sam deploy
```

## Testing

### Install Dependencies
Install the dependencies with  
```bash
cd ./streaming-rag-client
nvm use
npm i
npm run start
```

```

## Cleanup
First of all, you want to empty the bucket used to store both documents and embeddings.  
You can find the bucket name as `DocumentBucketName` the stack outputs like so
```bash
sam list stack-outputs --stack-name <your-stack-name>
```

Once you've emptied the bucket, issue the following
```bash
sam delete
```

Reference: 
-   https://community.aws/content/2d1B5srtVqbVYnlm9ixKNJf4p1M/serverless-retrieval-augmented-generation-rag-on-aws 
-   https://lancedb.github.io/lancedb/ 
