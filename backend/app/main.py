from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import pytesseract
from PIL import Image
import io
import os
from dotenv import load_dotenv
import google.generativeai as genai
import time
import json
from typing import List, Optional
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# Set seed for consistent language detection
DetectorFactory.seed = 0

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-3-flash-preview')

# Language mapping for display
LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh-cn': 'Chinese (Simplified)',
    'ja': 'Japanese',
    'ar': 'Arabic',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ko': 'Korean',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'id': 'Indonesian',
    'ms': 'Malay',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'ur': 'Urdu',
    'fa': 'Persian'
}

# Store chat history per session (in production, use a database)
chat_sessions = {}

@app.get("/")
def read_root():
    return {"message": "Document Summary Assistant API"}

@app.get("/models")
async def list_models():
    """Debug endpoint to see available models"""
    try:
        models = genai.list_models()
        available_models = []
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        return {"available_models": available_models}
    except Exception as e:
        return {"error": str(e)}

@app.get("/languages")
async def get_languages():
    """Get list of supported languages"""
    return {"languages": LANGUAGES}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        if file.filename.lower().endswith('.pdf'):
            text = extract_pdf_text(content)
        elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            text = extract_image_text(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, PNG, or JPG.")
        
        if not text or text.strip() == "":
            raise HTTPException(status_code=400, detail="No text could be extracted from the document.")
        
        # Detect language automatically
        try:
            detected_lang = detect(text)
        except LangDetectException:
            detected_lang = 'en'  # Default to English if detection fails
        
        return {
            "text": text,
            "filename": file.filename,
            "detected_language": detected_lang,
            "detected_language_name": LANGUAGES.get(detected_lang, 'Unknown')
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

def extract_pdf_text(content: bytes):
    """Extract text from PDF using pdfplumber"""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")

def extract_image_text(content: bytes):
    """Extract text from image using Tesseract OCR"""
    try:
        image = Image.open(io.BytesIO(content))
        image = image.convert('L')
        # Tesseract can also detect language, but we'll keep it simple
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Image OCR failed: {str(e)}")

@app.post("/summarize")
async def summarize_document(data: dict):
    """Generate summary using Gemini API with length control and language support"""
    try:
        text = data.get("text", "")
        length = data.get("length", "medium")
        target_language = data.get("language", "en")
        
        if not text:
            raise HTTPException(status_code=400, detail="No text provided for summarization")
        
        # Detect source language
        try:
            source_lang = detect(text)
            source_lang_name = LANGUAGES.get(source_lang, 'Unknown')
        except LangDetectException:
            source_lang = 'en'
            source_lang_name = 'English'
        
        length_instructions = {
            "short": """
                LENGTH: SHORT (2-3 sentences maximum)
                - Provide only the most essential information
                - Be extremely concise
                - Focus on the main idea only
            """,
            "medium": """
                LENGTH: MEDIUM (2-3 paragraphs)
                - Provide a clear overview with main points
                - Use 2-3 well-structured paragraphs
                - Include key details and supporting information
            """,
            "long": """
                LENGTH: LONG (Comprehensive - 4-6 paragraphs)
                - Provide a thorough analysis
                - Structure with clear sections
                - Include executive summary, main findings, and conclusions
                - Use bullet points (•) for key points
            """
        }
        
        # Language instruction
        target_lang_name = LANGUAGES.get(target_language, 'English')
        language_instruction = f"""
        LANGUAGE: The document is in {source_lang_name} ({source_lang}).
        Please provide the summary in {target_lang_name} ({target_language}).
        """
        
        prompt = f"""
        You are an expert document summarizer. Create a summary of the document below.

        DOCUMENT TEXT:
        {text[:15000]}

        {length_instructions.get(length, length_instructions['medium'])}

        {language_instruction}

        FORMATTING REQUIREMENTS:
        - Start directly with the summary
        - Use proper paragraph breaks
        - Use bullet points (•) only for LONG summaries
        - Keep the tone professional and clear
        - Write entirely in {target_lang_name}

        SUMMARY:
        """
        
        print(f"📝 Generating {length} summary in {target_lang_name}...")
        
        max_retries = 2
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = model.generate_content(prompt)
                
                if not response or not response.text:
                    raise Exception("Empty response from Gemini")
                
                summary_text = response.text.strip()
                
                # Clean up unwanted prefixes
                summary_text = summary_text.replace("Here is a summary:", "")
                summary_text = summary_text.replace("Summary:", "")
                summary_text = summary_text.strip()
                
                return {
                    "summary": summary_text,
                    "length": length,
                    "source_language": source_lang,
                    "source_language_name": source_lang_name,
                    "target_language": target_language,
                    "target_language_name": target_lang_name,
                    "word_count": len(summary_text.split())
                }
                
            except Exception as e:
                error_str = str(e).lower()
                if "quota" in error_str or "rate" in error_str:
                    if attempt < max_retries - 1:
                        print(f"⏳ Rate limit hit, retrying in {retry_delay}s...")
                        time.sleep(retry_delay)
                        continue
                    else:
                        raise HTTPException(
                            status_code=429,
                            detail="⏳ Rate limit exceeded. Please wait a moment and try again."
                        )
                else:
                    raise e
        
        raise HTTPException(status_code=500, detail="Failed to generate summary")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Summary error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

@app.post("/chat")
async def chat_with_document(data: dict):
    """Chat with your document - Ask questions about the content"""
    try:
        text = data.get("text", "")
        question = data.get("question", "")
        session_id = data.get("session_id", "default")
        language = data.get("language", "en")
        
        if not text:
            raise HTTPException(status_code=400, detail="No document text provided")
        if not question:
            raise HTTPException(status_code=400, detail="No question provided")
        
        # Get chat history for this session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        history = chat_sessions[session_id]
        
        # Build context from chat history (last 5 exchanges)
        context = ""
        if history:
            context = "\nPrevious conversation:\n"
            for h in history[-5:]:
                context += f"Q: {h['question']}\nA: {h['answer']}\n"
        
        # Language instruction
        lang_name = LANGUAGES.get(language, 'English')
        
        prompt = f"""
        You are a helpful assistant that answers questions about a document.
        
        DOCUMENT:
        {text[:15000]}
        
        {context}
        
        CURRENT QUESTION: {question}
        
        INSTRUCTIONS:
        1. Answer the question based ONLY on the document content
        2. If the answer is not in the document, say "I couldn't find that information in the document."
        3. Be specific and cite relevant parts of the document when possible
        4. Provide the answer in {lang_name} ({language})
        5. Keep answers clear and concise
        
        ANSWER:
        """
        
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise Exception("Empty response from Gemini")
        
        answer = response.text.strip()
        
        # Save to history
        chat_sessions[session_id].append({
            "question": question,
            "answer": answer,
            "timestamp": time.time()
        })
        
        return {
            "answer": answer,
            "question": question,
            "session_id": session_id,
            "language": language
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id not in chat_sessions:
        return {"history": []}
    return {"history": chat_sessions[session_id]}

@app.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session"""
    if session_id in chat_sessions:
        chat_sessions[session_id] = []
    return {"message": "Chat history cleared"}

@app.post("/detect-language")
async def detect_document_language(data: dict):
    """Detect the language of the document"""
    try:
        text = data.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
        
        try:
            detected_lang = detect(text)
            confidence = 1.0  # langdetect doesn't provide confidence, but we can approximate
        except LangDetectException:
            detected_lang = 'en'
            confidence = 0.5
        
        return {
            "language": detected_lang,
            "language_name": LANGUAGES.get(detected_lang, 'Unknown'),
            "confidence": confidence
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)