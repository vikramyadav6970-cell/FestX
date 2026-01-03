# 🎪 FestX - Unified College Event & Resource Management System

<div align="center">

![FestX Banner](https://img.shields.io/badge/FestX-Event%20Management-6366f1?style=for-the-badge&logo=react&logoColor=white)

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Netlify-00C7B7?style=for-the-badge)](YOUR_NETLIFY_URL_HERE)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**Built at HackStrom 2025 by Team VEDABYTE**

[Live Demo](https://festxv.netlify.app/) • [Report Bug](https://github.com/vikramyadav6970-cell/FestX/issues) • [Request Feature](https://github.com/vikramyadav6970-cell/FestX/issues)

</div>

---

## 📋 Problem Statement

> Colleges lack a unified platform for events, funds, and hall management — leading to miscommunication, conflicts, and inefficient operations.

---

## 💡 Solution

**FestX** is a comprehensive web-based platform that unifies:
- 🎪 Event Management
- 🏛️ Venue/Hall Booking
- 📊 Registration & Attendance Tracking
- 🔔 Real-time Notifications

All in one place with role-based access control.

---

## ✨ Features

### 👨‍💼 Admin Dashboard
- ✅ Approve/Reject organizer requests
- ✅ Approve/Reject event requests
- ✅ Create high-priority official events
- ✅ Override venue conflicts
- ✅ Event calendar view
- ✅ User management
- ✅ Send platform-wide alerts

### 🎪 Organizer Dashboard
- ✅ Create events with custom registration forms
- ✅ Venue availability check
- ✅ Reschedule events
- ✅ View registered students
- ✅ QR code scanner for attendance
- ✅ Send notifications to students
- ✅ Assign volunteers

### 👨‍🎓 Student Dashboard
- ✅ Browse approved events
- ✅ Register for events
- ✅ Get unique QR code per registration
- ✅ View registration history
- ✅ Receive notifications

### 🔥 Key Highlights
- 📱 **QR-Based Attendance** - Unique QR per registration, one-time scan
- 🚫 **Duplicate Prevention** - Can't register twice for same event
- 📅 **Venue Conflict Detection** - Prevents double booking
- 🔔 **Real-time Notifications** - Instant updates on changes
- 🌙 **Dark/Light Theme** - User preference support
- 📱 **Responsive Design** - Works on all devices

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, Vite |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Backend** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **QR Code** | react-qr-code, html5-qrcode |
| **Hosting** | Netlify |

---

## 🚀 Live Demo

🔗 **[Visit FestX](YOUR_NETLIFY_URL_HERE)**

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@festx.com | admin123 |
| Organizer | organizer@festx.com | org123 |
| Student | student@festx.com | student123 |

---

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Landing Page
![Landing Page](screenshots/landing.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

### Event Creation
![Event Creation](screenshots/create-event.png)

### QR Scanner
![QR Scanner](screenshots/qr-scanner.png)

### Student QR Code
![Student QR](screenshots/student-qr.png)

</details>

---

## 🏃‍♂️ Run Locally

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vikramyadav6970-cell/FestX.git
   cd FestX