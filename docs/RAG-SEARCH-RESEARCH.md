# RAG and Internet Search for Ollama - Research Notes

Date: 2026-02-17

## Current Stack

- **Frontend:** Next.js 14 (TypeScript)
- **LLM:** Ollama with qwen2.5 model
- **API:** Next.js API routes (`/api/chat/prompt`)

## Challenge

The current flow has no access to search/internet:
```
User → Next.js Frontend → /api/chat/prompt → Ollama (qwen2.5)
```

The LLM runs in isolation with no tools to access external data.

---

## Options for Adding Search/RAG

### Option 1: Ollama with Native Tool Calling (Recommended)

**How it works:** Qwen2.5 supports native tool calling via Ollama's API. Define tools as JSON schemas, pass them to the model, and handle tool calls in a response loop.

**Implementation in `route.ts`:**
```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }
        },
        required: ["query"]
      }
    }
  }
]
```

**Agent loop flow:**
1. Send prompt + tools to Ollama
2. Check for `tool_calls` in response
3. Execute the tool (e.g., call search API)
4. Add tool result to messages
5. Send back to Ollama for final response

**Pros:**
- No additional dependencies
- Runs entirely locally
- Full control over tools

**Cons:**
- Need to implement the agent loop yourself

**Resources:**
- [Ollama Tool Calling Docs](https://docs.ollama.com/capabilities/tool-calling)
- [Qwen Function Calling](https://qwen.readthedocs.io/en/stable/framework/function_call.html)

---

### Option 2: LangChain with Ollama

**How it works:** Use LangChain's agent framework with Ollama as the LLM. LangChain provides pre-built tool integrations and handles the agent loop automatically.

**Implementation (Python backend):**
```python
from langchain_ollama import ChatOllama
from langchain_community.tools import TavilySearchResults

llm = ChatOllama(model="qwen2.5")
tools = [TavilySearchResults(api_key="...")]
agent = create_agent(llm, tools)
```

**Search API options:**
- **Tavily**ily.com - tav (free tier available)
- **Serper** - serper.dev
- **Brave Search** - brave.com/search/api

**Pros:**
- Easy integration with search APIs
- Built-in agent loop and retry logic
- Many pre-built tool integrations

**Cons:**
- Adds Python dependency
- Need a Python backend service or API route

**Resources:**
- [LangChain Ollama Integration](https://python.langchain.com/docs/integrations/chat/ollama/)
- [LangChain Tools](https://python.langchain.com/docs/integrations/tools/)

---

### Option 3: RAG (Retrieval Augmented Generation)

**For RAG**, you need to:

1. **Chunk documents** into smaller pieces
2. **Create embeddings** using a local embedder (e.g., `nomic-embed-text` via Ollama)
3. **Store in vector database** (Chroma, FAISS, or Milvus)
4. **Query relevant chunks** based on user question
5. **Feed context** to the LLM

**Implementation:**
```python
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. Load and chunk documents
text_splitter = RecursiveCharacterTextSplitter()
chunks = text_splitter.split_documents(documents)

# 2. Create embeddings and store
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = Chroma.from_documents(chunks, embeddings)

# 3. Retrieve relevant context
retriever = vectorstore.as_retriever()
docs = retriever.invoke(user_question)

# 4. Feed to LLM
context = "\n".join([doc.page_content for doc in docs])
prompt = f"Context: {context}\n\nQuestion: {user_question}"
```

**Vector DB options:**
- **Chroma** - chromadb.dev (easiest)
- **FAISS** - by Meta (no server needed)
- **Milvus** - milvus.io (production-ready)

**Resources:**
- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
- [LlamaIndex](https://docs.llamaindex.ai/) - Designed specifically for RAG

---

### Option 4: Custom Middleware in Next.js

**How it works:** Add a search endpoint in Next.js that handles the search logic. The model decides when it needs info, you extract the query, call the API, return results.

**Implementation:**
1. Add `/api/search` endpoint in Next.js
2. Modify `route.ts` to detect search intent
3. Call search API, feed results back to model

**Pros:**
- Full control over behavior
- Stays within existing Next.js stack

**Cons:**
- More custom code to write
- Need to handle "when to search" logic

---

## Recommendation

| Approach | Best For |
|----------|----------|
| **Option 1** (Native Tool Calling) | Staying local, minimal deps |
| **Option 2** (LangChain) | Quick setup, many integrations |
| **Option 3** (RAG) | Private knowledge base |
| **Option 4** (Middleware) | Maximum control in Next.js |

**Suggested next step:** Start with **Option 1** since qwen2.5 already supports tool calling and it keeps everything in your existing stack.

---

## Environment Variables for Search APIs

When implementing, you'll need:
- `TAVILY_API_KEY` - for Tavily search
- `SERPER_API_KEY` - for Serper
- `BRAVE_API_KEY` - for Brave Search

Store in `.env.local` and never commit to git.
