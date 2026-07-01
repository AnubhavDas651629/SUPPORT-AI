from fastapi import FastAPI

app = FastAPI(
    title="SupportAI",
    description="AI-powered customer support platform",
    version="0.1.0",
)

@app.get("/")
async def root():
    return {"message": "Welcome to SupportAI"}

