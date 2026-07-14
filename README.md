# 📚 Document Summary Assistant

An intelligent document summarization tool that extracts text from PDFs and images and generates smart summaries using Google's Gemini AI.


## 🌐 Live Demo

- **Frontend:** [https://document-summary-assistant.vercel.app](https://document-summary-assistant-xi.vercel.app/)
- **Backend API:** [https://document-summary-assistant-1-yebb.onrender.com](https://document-summary-assistant-1-yebb.onrender.com/)
- **API Documentation:** [https://document-summary-assistant-1-yebb.onrender.com/docs](https://document-summary-assistant-1-yebb.onrender.com/docs)

## ✨ Features

### 📤 Document Upload
- Drag & drop or click to upload
- Supports PDF, PNG, JPG formats
- Max file size: 10MB
- Real-time upload progress

### 📄 Text Extraction
- **PDF Parsing:** Extracts text while maintaining formatting
- **OCR Technology:** Extracts text from scanned images using Tesseract
- Smart preprocessing for better OCR accuracy

### 🤖 AI-Powered Summarization
- **Three Length Options:**
  - 📄 **Short:** 2-3 sentences (Quick overview)
  - 📄 **Medium:** 2-3 paragraphs (Detailed summary)
  - 📄 **Long:** Comprehensive with bullet points (Full analysis)
- Powered by Google Gemini AI
- Intelligent key point extraction
- Professional, well-structured output

### 🎨 User Experience
- 🌓 **Dark/Light Mode** - Toggle themes with one click
- ✨ **Animated UI** - Smooth transitions and micro-interactions
- 📱 **Mobile-Responsive** - Works on all devices
- ⚡ **Loading States** - Progress indicators for all actions
- 🎯 **Error Handling** - Clear, user-friendly error messages

### 📋 Summary Management
- 📋 **Copy to Clipboard** - One-click copy
- 💾 **Download as TXT** - Save summaries locally
- 📊 **Word/Character Count** - See summary length

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **Tailwind CSS** | Styling & Theming |
| **Axios** | HTTP Client |
| **React Dropzone** | File Upload |
| **React Loader Spinner** | Loading Animations |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API Framework |
| **Python 3.12** | Programming Language |
| **pdfplumber** | PDF Text Extraction |
| **Tesseract** | OCR for Images |
| **Pillow** | Image Processing |
| **Google Gemini AI** | Summarization |
| **Uvicorn** | ASGI Server |

### Deployment
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend Hosting |
| **Render** | Backend Hosting |

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone [https://github.com/iamsaqib7804/Document-Summary-Assistant.git](https://github.com/iamsaqib7804/Document-Summary-Assistant)
cd Document-Summary-Assistant


