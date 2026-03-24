# 🏥 Smart Healthcare Microservices Platform

## 📌 Overview
This project is a Smart Healthcare Microservices Platform designed to provide an efficient solution for doctor appointment booking and telemedicine services.

Patients can search doctors, book appointments, and attend video consultations, while doctors can manage schedules and provide prescriptions.

---

## 🚀 Features

### 👤 Patient
- Register & login
- Search doctors
- Book appointments
- Video consultations
- View medical records

### 🩺 Doctor
- Manage profile
- Set availability
- Handle appointments
- Provide prescriptions

### 🛠️ Admin
- Manage users
- Verify doctors
- Monitor system

---

## 🧰 Tech Stack

- Frontend: React.js + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB Atlas
- DevOps: Docker
- Auth: Firebase / JWT
- Video: Jitsi Meet

---

## 🧩 Architecture

Microservices:
- Auth Service
- Patient Service
- Doctor Service
- Appointment Service
- Payment Service
- Notification Service

---

## ⚙️ Setup

```bash
git clone https://github.com/your-username/smart-healthcare-microservices.git
cd smart-healthcare-microservices
docker-compose up --build
