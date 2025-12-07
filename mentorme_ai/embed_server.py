from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2") 

class Body(BaseModel):
    text: str

@app.post("/embed")
def embed(body: Body):
    text = (body.text or "").strip()
    emb = model.encode(text).tolist()
    return {"embedding": emb, "model": "all-MiniLM-L6-v2"}

@app.get("/health")
def health():
    return {"ok": True}
