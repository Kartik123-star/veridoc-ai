# VeriDoc AI — Real-Time Identity Document Screening System

> **Smart India Hackathon (SIH) 2026**  
> **Problem Statement Code:** SIH26188  
> **Problem Statement Title:** AI-Based Fake Identity & Document Screening System  
> **Sponsoring Agency:** Ministry of Home Affairs (MHA)  
> **Theme:** Smart Automation | **Category:** Software  
> **Team Name:** Spades  

---

## 🌐 Live Interactive Deployment
- **Production Web Application:** [https://s-eight-lake.vercel.app/](https://s-eight-lake.vercel.app/)

---

## 📌 Executive Overview
VeriDoc AI is an automated, real-time forensic screening platform engineered for immigration checkposts, regional transport offices, and law enforcement desks. The platform ingests digital identity credentials, verifies layout uniformity, detects pixel-level manipulations using Error Level Analysis (ELA), and generates an Authenticity Trust Score (0%–100%) in sub-1.2 seconds.

### Core Highlights:
- **Zero-Retention Privacy:** Ephemeral in-memory analysis; zero storage of raw citizen identity documents.
- **Multi-Credential Support:** Screening heuristics for Passports, Indian ID documents, PAN cards, and Voter IDs.
- **Explainable AI (XAI):** Pinpoints tampered regions via interactive bounding boxes rather than an opaque black-box percentage.
- **Immutable Audit Logging:** Full chain-of-custody tracking recording accountable officer IDs, timestamps, and terminal IP addresses.

---

## 🛠️ Technology Stack
- **Frontend UI:** React 19, Vite, Tailwind CSS (Tactical Gov-Sec Dark Interface)
- **Forensic Pipeline / Engine:** Python, OpenCV (Pixel Forensics & Error Level Analysis), OCR Engines
- **Backend Architecture:** Java (Spring Boot) REST API microservices, Node.js runtime
- **Storage & Security:** PostgreSQL (Audit trail), In-Memory Buffers, AES-256 at rest, TLS 1.3 in transit

---

## 🚀 Local Development Setup

To run the client interface locally:
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kartik123-star/veridoc-ai.git
   cd veridoc-ai
   ```
2. **Install dependencies:**
    ```bash
   npm install
     ```
3. **Launch local dev server:**
    ```bash
   npm run dev
    ```
4. **Access the application:**
   Open `http://localhost:5173` in your browser.
