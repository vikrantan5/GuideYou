from fastapi import APIRouter, HTTPException, Depends
from utils.auth import get_current_user
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter()

class ImageAnalysisRequest(BaseModel):
    image_base64: str
    prompt: str = "Analyze this student's work and provide constructive feedback. Focus on quality, clarity, and effort."

class ChatRequest(BaseModel):
    question: str
    chat_history: list = []

@router.post("/analyze-image")
async def analyze_image(request: ImageAnalysisRequest, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"image_analysis_{current_user['sub']}",
            system_message="You are an educational AI assistant that provides constructive feedback on student work."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        image_content = ImageContent(image_base64=request.image_base64)
        user_message = UserMessage(
            text=request.prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        return {"feedback": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/doubt-solver")
async def doubt_solver(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"doubt_solver_{current_user['sub']}",
            system_message="You are a helpful educational AI assistant. Answer student questions clearly and concisely. Encourage learning by explaining concepts rather than just giving answers."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=request.question)
        response = await chat.send_message(user_message)
        
        return {"answer": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")