import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from fastapi import FastAPI, UploadFile, File, HTTPException
import io

# --- Configuration for Vertex AI ---
# TODO: Replace with your actual Project ID and the region you chose.
PROJECT_ID = "water-sample-analyzer"
REGION = "asia-south1"

# Initialize the Vertex AI SDK. It will use your authenticated gcloud account.
try:
    vertexai.init(project=PROJECT_ID, location=REGION)
except Exception as e:
    print(f"Error initializing Vertex AI SDK: {e}")

# --- The Prompt Template (remains the same) ---
# Prompt template for analyzing water sample images
ANALYSIS_PROMPT = """
You are a laboratory assistant. Analyze this microscopic image of a water sample and provide a concise conclusion.

Your response must only include these three sections:
- Identification: State the most likely contaminant.
- Risk Assessment: Briefly describe the potential risk associated with this contaminant.
- Reasoning: Summarize the key visual evidence that led to your identification.

This is a visual assessment, not a definitive lab test.
"""

# --- FastAPI Application ---
app = FastAPI(title="Water Sample Analysis API with Vertex AI")


@app.post("/analyze-image/")
async def analyze_water_sample(file: UploadFile = File(...)):
    """
    Accepts an image file, sends it to the Vertex AI API for analysis,
    and returns a descriptive report.
    """
    # 1. Validation check
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image or the Content-Type header is missing."
        )

    # 2. Read image content
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the image file.")

    # 3. Call the Vertex AI API for analysis
    try:
        # Load the Gemini 1.5 Pro model from Vertex AI
        model = GenerativeModel("gemini-1.5-pro")

        # Prepare the image and text parts for the multimodal prompt
        image_part = Part.from_data(data=image_bytes, mime_type=file.content_type)
        text_part = ANALYSIS_PROMPT

        # Send the request to the model
        response = model.generate_content([image_part, text_part])

        # 4. Return the generated report
        return {"report": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during Vertex AI API call: {str(e)}")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Water Sample Analysis API. Use the /analyze-image/ endpoint to submit an image."}