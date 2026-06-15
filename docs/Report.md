# Campus TeamUp - Technical Implementation Report

**Team Members:**  
- [@Manak-hash](https://github.com/Manak-hash)  
- [@o-alharrar](https://github.com/o-alharrar)  
- [@aymensada](https://github.com/aymensada)

**Date:** June 2026  
**Project:** University Team Formation Platform  

---

## 1. Project Overview

Campus TeamUp is a web-based platform for university students to form project teams by publishing ideas, specifying required skills, and managing join requests through structured applications.

![Landing Page](../screenshots/landing-page.png)

### Technology Stack

**Frontend:** React 18+, TypeScript, Tailwind CSS, Vite, React Router v6, Axios  
**Backend:** PHP 8.5+, Slim 4, SQLite 3, PDO, Session-based authentication  

**Architecture:** React Frontend → REST API → SQLite Database

---

## 2. Authentication Module

### Purpose
Secure user registration, login, profile management, and avatar upload.

![Login Page](../screenshots/login-page.png)

### Implementation
- **Frontend:** Login/register pages, profile editor, React Context for global auth state
- **Backend API:** AuthController with session-based auth, AuthMiddleware for route protection
- **Database:** users table (id, name, email, password_hash, avatar_url, role)

### PHP Libraries Used
- `password_hash()` / `password_verify()` - Secure password hashing
- `session_start()` / `$_SESSION` - Session management
- PDO prepared statements - SQL injection protection
- Slim 4 middleware - Request interception and auth validation

### Learning Outcomes
- Session vs token-based authentication trade-offs
- Password security (never store plaintext)
- Middleware pattern for protecting routes

---

## 3. Projects Module

### Purpose
Project creation, browsing with filters, and skill-based matching.

![Explore Projects](../screenshots/explore-projects.png)

### Implementation
- **Frontend:** Project listing with search/filters, detail pages, create/edit forms
- **Backend API:** ProjectController with CRUD operations, skill match algorithm
- **Database:** projects, skills, project_skills (many-to-many junction table)

### Key Features
- RESTful API endpoints (GET, POST, PUT, DELETE)
- URL slug generation for SEO-friendly URLs
- Skill match algorithm calculating percentage match
- Search and category filtering

### PHP Libraries Used
- Slim 4 routing - HTTP method to controller mapping
- Route parameters - Dynamic URL extraction
- PDO complex queries - JOINs for related data
- Validator helper - Input validation

### Learning Outcomes
- RESTful API design principles
- Many-to-many database relationships
- Search/filter implementation in SQL

---

## 4. Applications & Team Formation

### Purpose
Apply to projects, accept/reject requests, auto-build teams.

![Project Detail](../screenshots/project-detail.png)

### Implementation
- **Frontend:** Application forms, status tracking, team member display
- **Backend API:** ApplicationController with status management, automatic member addition on acceptance
- **Database:** applications, project_members tables with status enums

### Key Features
- State machine pattern (pending → accepted/rejected)
- Database transactions for atomic operations
- Max members enforcement
- Role-based operations (only owner can accept)

### PHP Libraries Used
- Database transactions - `$this->db->beginTransaction()`, `commit()`, `rollBack()`
- Foreign key constraints - Referential integrity
- Aggregation queries - COUNT() for limits

### Learning Outcomes
- State management in applications
- Team composition logic
- Data integrity with transactions
- Role-based access control

---

## 5. User Dashboard & Bookmarks

### Purpose
Central hub for owned projects, team memberships, applications, saved projects.

![User Dashboard](../screenshots/user-dashboard.png)

### Implementation
- **Frontend:** Dashboard with cards, quick actions, bookmark toggle
- **Backend API:** My-owned and my-teams endpoints, BookmarkController
- **Database:** bookmarks table, COUNT() queries for statistics

### Key Features
- Aggregated data display (member counts, pending applications)
- Service layer pattern for API calls
- Pagination for large datasets
- Bookmark save/unsave functionality

### PHP Libraries Used
- Subqueries - Single-query statistics calculation
- Query optimization - Reduce N+1 problems
- Slim CORS middleware - Cross-origin requests
- Pagination - LIMIT/OFFSET

### Learning Outcomes
- Service layer pattern benefits
- Performance considerations (pagination, eager loading)
- User experience design (aggregated data, action indicators)

---

## 6. Admin Panel

### Purpose
Platform moderation, user management, project oversight.

![Admin Dashboard](../screenshots/admin-dashboard.png)

### Implementation
- **Frontend:** Admin dashboard with stats cards, user/project tables
- **Backend API:** AdminController with stats, user/project management endpoints
- **Database:** Aggregation queries for statistics, role checks

### Key Features
- Statistics aggregation (users, projects, applications counts)
- Role-based access control (admin-only routes)
- Safety checks (no self-deletion)
- Moderation workflows (user role changes, project deletion)

### PHP Libraries Used
- Admin middleware - Role verification
- Authorization checks - Permission validation
- COUNT(), GROUP BY - Statistics generation
- Safe deletion patterns

### Learning Outcomes
- Role-based access control (RBAC)
- Admin safety patterns
- SQL aggregation for statistics
- Moderation UI design

---

## 7. GitHub Collaboration

### Team Contributions

| Team Member | Commits | Focus Areas                                   |
|-------------|---------|-----------------------------------------------|
| Manak       | 8+      | Setup, admin, my-projects API, docs           |
| o-alharrar  | 9+      | Auth, applications, skill matching, listing   |
| aymensada   | 7+      | Profiles, notifications, bookmarks, seed data |

### Development Timeline

**Phase 0 (Manak):** Repository setup, backend/frontend scaffolding  
**Phase 1 (o-alharrar):** Authentication system, AuthMiddleware  
**Phase 2 (Collaborative):** Projects CRUD, skill matching, listing UI  
**Phase 3 (o-alharrar):** Applications system, team formation  
**Phase 4 (Manak):** Admin panel, moderation endpoints  
**Phase 5 (All):** Skill scoring, bookmarks, notifications, polish  

### Collaboration Tools
- GitHub Issues for task tracking
- Pull requests for code review
- Feature branches for isolated development
- Clear commit messages for attribution

---

## 8. Technical Challenges & Learning

### Frontend/Backend Integration
**Challenge:** Understanding React-PHP communication via REST API  
**Solution:** Service layer pattern with centralized API calls  
**Key Libraries:** Axios, React Context, TypeScript  
**Learning:** REST principles, async programming, state management

### PHP Backend Development
**Challenge:** Learning modern PHP 8.5+ and Slim 4 framework  
**Solution:** Studied docs, implemented middleware architecture  
**Key Libraries:** Slim 4, PSR-7 interfaces, PHP-DOTENV  
**Learning:** Modern PHP features, middleware pattern, SOLID principles

### Database Design
**Challenge:** Many-to-many relationships and query optimization  
**Solution:** Junction tables, foreign keys, subqueries  
**Key Libraries:** PDO, transactions, prepared statements  
**Learning:** Data modeling, query optimization, referential integrity

### GitHub Collaboration
**Challenge:** Coordinating 3 developers, avoiding conflicts  
**Solution:** Clear ownership, code reviews, communication  
**Tools:** Issues, PRs, feature branches, Git history  
**Learning:** Distributed version control, code review, team coordination

---

## 9. Conclusion

### Project Status
✅ Phases 0-4 complete (setup, auth, projects, applications, admin)  
⏳ Phase 5 in progress (ship & refine)

### Key Achievements
- Working full-stack application meeting all specifications
- Secure authentication with RBAC
- RESTful API with proper error handling
- Admin panel for moderation
- Skill matching for better teams
- GitHub collaboration with clear attribution

### Future Improvements
- Email notifications
- Advanced search (full-text)
- Test coverage expansion
- CI/CD pipeline
- Real-time notifications
- Mobile app

### Learning Summary
This project provided experience in full-stack development, modern PHP, React ecosystem, database design, and team collaboration using Git workflows and agile practices.

Campus TeamUp demonstrates the team's ability to design, implement, and deploy a complete web application while learning new technologies and collaborating effectively.

---

**Appendix: API Endpoints**

**Auth:** POST /api/register, POST /api/login, GET /api/profile, PUT /api/profile  
**Projects:** GET /api/projects, POST /api/projects, PUT /api/projects/{id}, DELETE /api/projects/{id}  
**Applications:** POST /api/projects/{id}/applications, GET /api/applications/mine, PUT /api/applications/{id}  
**Admin:** GET /api/admin/stats, GET /api/admin/users, DELETE /api/admin/users/{id}
