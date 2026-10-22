# Tourism Tour & Vehicle Booking System

## Project Information
This project is developed as part of the ICT3183 – Group Project module at University of Ruhuna.

- Degree: Bachelor of ICT  
- Year: 3rd Year – 1st Semester  
- Project Type: Real-World ICT Group Project  

---

## Client Information
- **Business Name:** Ceylon Best Tours  
- **Contact Person:** Mr. Dilshan  
- **Business Type:** Local tourism & tour vehicle service  

---

## Project Team – TechNova

| Name | Registration Number |
|------|--------------------|
| R.P.J.M. Ruvanpathirana | TG/2022/1351 |
| G.R.K.M.T. Rathnayaka | TG/2022/1380 |
| W.K.G. Rajapaksha | TG/2022/1382 |
| W.M.A.K. Keshali | TG/2022/1419 |

---

## Project Overview
This is a web-based tourism tour & vehicle booking system developed for Ceylon Best Tours.

The system allows:
- Tourists to plan and book trips  
- Business owners to manage bookings, vehicles, pricing, and reports  

---

## Key Features

### Customer (Tourist)
- Register & login  
- Plan custom trips (days, destinations, adults, children)  
- Book pre-defined tour packages  
- View booking history  
- View total trip cost before confirmation  

### Admin
- Secure login  
- Manage customers  
- Create, update, delete tour packages  
- Manage vehicles & pricing  
- View all bookings  
- View expenses & income  
- Generate reports  

---

## Expense Handling
Expenses are automatically calculated during booking.

No manual driver expense entry required.

**Cost Includes:**
- Vehicle cost  
- Driver service  
- Distance / duration  

---

## Technologies Used

- Frontend: React  
- Backend: Node.js  
- Database: MySQL  
- API Testing: Postman  

---

## Installation & Setup Guide

### Prerequisites
- Node.js  
- MySQL  
- Git  

---

### Clone Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tourism_db
JWT_SECRET=your_secret
```

Run backend:

```bash
npm start
```

---

### Database Setup

```sql
CREATE DATABASE tourism_db;
```

(Optional)

```bash
mysql -u root -p tourism_db < database.sql
```

---

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## Run System

- Backend → http://localhost:5000  
- Frontend → http://localhost:3000  

---

## Project Structure

```
tourism-booking-system/
├── frontend/
├── backend/
├── database/
└── README.md
```

---

## API Documentation

### Auth
- POST `/api/auth/register`  
- POST `/api/auth/login`  

### Customer
- GET `/api/customer/profile`  
- GET `/api/customer/bookings`  

### Packages
- GET `/api/packages`  
- POST `/api/packages`  
- PUT `/api/packages/:id`  
- DELETE `/api/packages/:id`  

### Bookings
- POST `/api/bookings/custom`  
- POST `/api/bookings/package`  
- GET `/api/bookings`  

### Vehicles
- GET `/api/vehicles`  
- POST `/api/vehicles`  
- PUT `/api/vehicles/:id`  
- DELETE `/api/vehicles/:id`  

---

## Database Design

Tables:
- users  
- packages  
- vehicles  
- bookings  
- booking_details  

---

## System Architecture

```
React (Frontend)
      ↓
Node.js API
      ↓
MySQL Database
```

---

## Cost Calculation

Total Cost =  
Vehicle Cost (distance × price_per_km) +  
Driver Cost (daily rate × days)

---

## Security

- JWT Authentication  
- Password hashing  
- Role-based access  

---

## Testing

- Postman  
- Manual testing  

---

## Academic Purpose

- Work with real client  
- Apply software engineering concepts  
- Develop full-stack system  
- Practice teamwork & GitHub  

---

## Acknowledgement

We thank **Mr. Dilshan** of *Ceylon Best Tours* for providing real-world requirements and feedback during the project development.

---

## Future Improvements

- Online payments  
- Google Maps integration  
- Mobile app  
- Reviews & ratings  

---

## Version Control

- GitHub repository used  
- Branches:
  - main  
  - dev  
  - feature branches  
