# CivicSense AI 🌍

### AI-Powered Civic Complaint Management System

CivicSense AI transforms unstructured citizen complaints into organized, actionable information using artificial intelligence.

## 🚀 Problem Statement

Citizens often report civic issues such as garbage accumulation, damaged roads, water supply problems, and broken streetlights. These complaints can be difficult to organize, categorize, and prioritize manually.

CivicSense AI helps streamline this process by converting natural-language complaints into structured records.

## ✨ Features

- **AI-Powered Analysis:** Analyzes citizen complaints using Google's Gemini API.
- **Automatic Categorization:** Classifies complaints into civic issue categories.
- **Information Extraction:** Identifies relevant details such as location and duration.
- **Priority Assessment:** Applies predefined rules to flag potential safety-related issues.
- **Action Recommendations:** Suggests practical next steps for human reviewers.
- **Complaint Management:** Saves records in SQLite and tracks complaint status.
- **Dashboard:** Displays complaint records and analysis results.

## 🛠️ Technologies Used

- Python
- Flask
- Google Gemini API
- SQLite
- HTML
- CSS
- JavaScript

## ⚙️ Local Setup

1. Clone this repository.
2. Create and activate a Python virtual environment.
3. Install dependencies:

   `pip install -r requirements.txt`

4. Create a `.env` file in the project root containing:

   `GEMINI_API_KEY=your_api_key_here`

   `GEMINI_MODEL=your_supported_model_name`

5. Start the application:

   `python app.py`

6. Open `http://127.0.0.1:5000` in your browser.

## 🔐 Security

API credentials should be stored in environment variables and must never be committed to the repository.

Complaint priorities are preliminary assessments based on predefined rules and should be verified by a human reviewer.

## 🎯 Project Goal

To make civic complaint handling more organized, accessible, and efficient through AI-assisted analysis.

---

**Developed for Prompt War 2026.**
