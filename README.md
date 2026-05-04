# 🫀 JeevanSetu - Organ Donation & Real-Time Matching Platform

JeevanSetu is a comprehensive, full-stack MERN (MongoDB, Express, React, Node.js) web application designed to bridge the gap between organ donors and recipients. 

The platform facilitates a secure and verified environment where users can register as Donors, Recipients, or Hospitals. Its standout feature is a **Real-Time Match Radar** powered by WebSockets, which instantly notifies recipients when a verified donor matches their exact clinical requirements.

## ✨ Key Features

- **🛡️ Secure Role-Based Access:** Distinct, feature-rich dashboards tailored specifically for Donors, Recipients, and Hospital administrators.
- **🏥 Hospital Verification System:** Donors must submit their profiles and medical reports to registered hospitals for clinical verification before becoming "Active" in the ecosystem.
- **📡 Real-Time Match Radar (Live Updates):** Utilizing Socket.io, the recipient dashboard actively scans and instantly updates with exact donor matches (blood group & organ) the very second a hospital verifies a donor. No page refreshes needed!
- **💬 Direct Secure Messaging:** A built-in, real-time chat interface enabling secure communication between matched recipients and donors to coordinate next steps.
- **📄 Automated Donor Cards:** Instant, dynamic PDF generation for official "Donor Pledges," allowing active donors to download and carry their donor cards.
- **🎨 Beautiful & Responsive UI:** Designed with a vibrant, warm aesthetic featuring glass-morphism panels, micro-animations, and fully responsive mobile-first layouts.

## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- Context API (for Global State Management)
- CSS3 (Vanilla CSS with Custom Design Tokens & Variables)
- Socket.io-client (Real-time updates)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ORM)
- JSON Web Tokens (JWT) for secure authentication
- Socket.io (WebSocket Server for live matching and chat)
- PDFKit (Dynamic PDF generation)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) and [MongoDB](https://www.mongodb.com/) installed on your local machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Deepgayakwad/JeevanSetu.git
   cd JeevanSetu
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file inside the `server` directory and add the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:5173
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Setup the Frontend:**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   ```
   Create a `.env` file inside the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   Start the frontend application:
   ```bash
   npm run dev
   ```

## 🌐 Usage Workflow

1. **Hospital Registration:** A hospital registers and logs in.
2. **Donor Registration:** A user registers as a Donor, selects their blood group, pledges organs, and uploads a medical report. They send a verification request to a listed Hospital.
3. **Verification:** The hospital reviews the donor's medical report and clicks "Verify". 
4. **Recipient Matching:** A recipient with an active organ request is sitting on their dashboard. As soon as the hospital verifies the donor, the donor instantly pops up on the recipient's "Real-Time Match Radar".
5. **Connection:** The recipient can view the match, initiate a secure chat, or download the donor's official card.

## 👨‍💻 Author

Made by **Dipak Gayakwad**
