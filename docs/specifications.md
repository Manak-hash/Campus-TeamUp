# Project Specifications Document

## Campus TeamUp Application

**Team Members:**  
- [@Manak-hash](https://github.com/Manak-hash)
- [@o-alharrar](https://github.com/o-alharrar)
- [@aymensada](https://github.com/aymensada)

## 1. Project Overview

This project consists of developing a web-based platform called **Campus TeamUp** for university students. The application helps students create project posts, find teammates, and join projects based on needed skills.

The platform is designed to simplify team formation inside the university environment by offering a structured way to publish projects and manage join requests.

The system is based on:
- A frontend interface for students and admins
- A PHP backend API for handling requests
- A relational database for storing users, projects, applications, and related data

The goal is to demonstrate full-stack web development concepts such as authentication, CRUD operations, role management, file upload, and API integration. 

## 2. Objectives

- Create a platform where students can publish project ideas
- Allow students to search and browse available projects
- Let students apply to join projects with a motivation message
- Allow project owners to accept or reject applicants
- Display the final team members for each project
- Provide an admin area for moderation and management

## 3. Functional Requirements

### User Features
- Register and log in to the platform
- Create and update a personal profile
- Add skills and personal information
- Browse and search projects
- Create, edit, and delete their own projects
- Apply to join open projects
- Track the status of their applications
- Bookmark projects for later
- Receive notifications about application results

### Project Owner Features
- View applications received for their projects
- Accept or reject applicants
- Manage project status (open, full, closed)
- View team members in each project

### Admin Features
- View all users and projects
- Delete inappropriate users or projects
- Change user roles
- Access platform statistics

## 4. Technical Requirements

### Frontend
- React
- TypeScript
- Tailwind CSS
- Responsive and simple interface

### Backend
- PHP
- REST API
- PDO for database access
- JWT or token-based authentication

### Database
- MySQL [SQLite currently]
- Tables for users, projects, skills, applications, bookmarks, notifications, and team members

## 5. Application Structure

- `frontend/` → User interface
- `backend/` → PHP API
- `database/schema.sql` → Database schema
- `.env` → Environment configuration

Possible main files:
- `index.php` → API entry point
- `api.php` → Route definitions
- `schema.sql` → Database structure

## 6. User Flow

1. User opens the platform
2. User registers or logs in
3. User completes profile and adds skills
4. User browses available projects
5. User creates a project or applies to join one
6. Project owner reviews applications
7. Applicant is accepted or rejected
8. Team members are displayed on the project page

## 7. Project Environment

- The system must run on a standard PHP server
- The frontend and backend are separated
- The database stores all application data
- The platform must work on desktop and mobile
- All user actions must be properly processed and secured

## 8. Expected Deliverables

- Source code of frontend and backend
- Database schema file
- [README](../README.md) with setup instructions
- Environment example files
- Working demo of the application

## 9. Constraints

- Backend must be developed in PHP
- Database must be relational
- No real-time features are required
- No mobile app is required
- The project must stay simple and clear for the module scope

## 10. Expected Result

At the end of the project, the application should allow students to create projects, find teammates, apply to projects, and manage team formation through a simple and functional web platform.