# System Architecture Diagrams
## Volunteer Comments Analysis System

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer - React"
        UI[React Application<br/>Port 3000]
        Login[Login Page]
        PVPages[PV Volunteer Pages]
        AdminPages[Admin Pages]
        SuperPages[Superadmin Pages]
        VIPages[VI Volunteer Pages]
        RIPages[RI Volunteer Pages]
        TVPages[TV Volunteer Pages]
        Analytics[Analytics Dashboard]
    end
    
    subgraph "Backend Layer - Flask"
        API[Flask API Server<br/>Port 5000]
        Auth[Authentication]
        Routes[API Routes]
        Services[Business Logic]
    end
    
    subgraph "AI Services"
        Gemini[Google Gemini<br/>Text & Image Analysis]
        Groq[Groq API<br/>Audio Transcription]
        LangGraph[LangGraph<br/>Workflow Orchestration]
    end
    
    subgraph "Data Layer"
        MySQL[(MySQL Database<br/>Student Data)]
        ChromaDB[(ChromaDB<br/>Vector Database)]
        S3[AWS S3<br/>File Storage]
    end
    
    UI --> API
    API --> Auth
    API --> Routes
    Routes --> Services
    Services --> Gemini
    Services --> Groq
    Services --> LangGraph
    Services --> MySQL
    Services --> ChromaDB
    Services --> S3
    
    style UI fill:#61dafb
    style API fill:#90EE90
    style Gemini fill:#FFD700
    style MySQL fill:#4479A1
    style ChromaDB fill:#FF6B6B
```

---

## 2. User Role Hierarchy & Access Flow

```mermaid
graph TD
    Start([Student Application]) --> PV[Physical Verification<br/>PV Volunteer]
    
    PV --> AI{AI Processing<br/>LangGraph Pipeline}
    AI --> Admin[Admin Review<br/>Admin]
    
    Admin --> Decision1{Decision}
    Decision1 -->|Approved| VI[Virtual Interview<br/>VI Volunteer]
    Decision1 -->|Rejected| End1([End - Rejected])
    Decision1 -->|On Hold| PV
    
    VI --> Super1[Superadmin Review]
    Super1 --> Decision2{VI Decision}
    Decision2 -->|Pass| RI[Real Interview<br/>RI Volunteer]
    Decision2 -->|Fail| End2([End - Rejected])
    
    RI --> Super2[Superadmin Review]
    Super2 --> Decision3{RI Decision}
    Decision3 -->|Qualified| Final[Final Selection<br/>Superadmin]
    Decision3 -->|Not Qualified| End3([End - Rejected])
    
    Final --> Decision4{Final Decision}
    Decision4 -->|Selected| Edu[Educational Details<br/>Form]
    Decision4 -->|Rejected| End4([End - Rejected])
    
    Edu --> Success([Scholarship Awarded])
    
    style PV fill:#FFE4B5
    style AI fill:#FFD700
    style Admin fill:#87CEEB
    style VI fill:#98FB98
    style RI fill:#DDA0DD
    style Final fill:#FF6B6B
    style Success fill:#90EE90
```

---

## 3. AI-Powered Workflow (LangGraph Pipeline)

```mermaid
graph LR
    subgraph "Input Sources"
        Text[Text Comments<br/>Tanglish/English]
        Audio[Audio Recording<br/>WAV File]
        Images[House Photos<br/>Multiple Images]
    end
    
    subgraph "LangGraph Workflow"
        Node1[Node 1:<br/>Tanglish → English<br/>Gemini API]
        Node2[Node 2:<br/>Audio → English<br/>Groq Whisper]
        Node3[Node 3:<br/>Merge & Deduplicate<br/>Gemini API]
        Node4[Node 4:<br/>RAG Retrieval<br/>ChromaDB Search]
        Node5[Node 5:<br/>Master Analysis<br/>Gemini + RAG Context]
        Node6[Node 6:<br/>House Analysis<br/>Gemini Vision]
    end
    
    subgraph "Output"
        Result[AI Decision:<br/>• Summary Points<br/>• SELECT/REJECT/ON HOLD<br/>• Score 0-100<br/>• House Condition]
    end
    
    Text --> Node1
    Audio --> Node2
    Node1 --> Node3
    Node2 --> Node3
    Node3 --> Node4
    Node4 --> Node5
    Images --> Node6
    Node5 --> Result
    Node6 --> Result
    
    style Node1 fill:#FFE4B5
    style Node2 fill:#FFE4B5
    style Node3 fill:#87CEEB
    style Node4 fill:#FF6B6B
    style Node5 fill:#90EE90
    style Node6 fill:#DDA0DD
    style Result fill:#FFD700
```

---

## 4. RAG (Retrieval-Augmented Generation) Architecture

```mermaid
graph TB
    subgraph "New Student Case"
        Input[Volunteer Comments<br/>+ Audio + Images]
    end
    
    subgraph "Embedding Generation"
        Embed[Gemini Embedding API<br/>text-embedding-004]
    end
    
    subgraph "ChromaDB Vector Database"
        Search[Similarity Search<br/>Cosine Distance]
        Store[(Historical Cases<br/>Verified Decisions)]
    end
    
    subgraph "Context Retrieval"
        Top5[Top 5 Similar Cases:<br/>• District Match<br/>• Similar Circumstances<br/>• Past Decisions<br/>• Admin Remarks]
    end
    
    subgraph "AI Analysis"
        Context[RAG Context:<br/>Historical Patterns]
        Analysis[Master Analysis<br/>with Context]
        Decision[Informed Decision<br/>87.5% Accuracy]
    end
    
    subgraph "Knowledge Base Update"
        Save[Store New Case<br/>for Future Reference]
    end
    
    Input --> Embed
    Embed --> Search
    Search --> Store
    Store --> Top5
    Top5 --> Context
    Context --> Analysis
    Analysis --> Decision
    Decision --> Save
    Save --> Store
    
    style Input fill:#FFE4B5
    style Embed fill:#FFD700
    style Store fill:#FF6B6B
    style Top5 fill:#87CEEB
    style Decision fill:#90EE90
```

---

## 5. Complete Data Flow Diagram

```mermaid
sequenceDiagram
    participant PV as PV Volunteer
    participant Frontend as React Frontend
    participant Backend as Flask Backend
    participant AI as AI Services
    participant DB as MySQL
    participant RAG as ChromaDB
    participant S3 as AWS S3
    participant Admin as Admin
    participant Super as Superadmin
    
    Note over PV,Super: Phase 1: Physical Verification
    PV->>Frontend: Login
    Frontend->>Backend: POST /api/login
    Backend->>DB: Verify credentials
    DB-->>Backend: User data
    Backend-->>Frontend: Auth token
    
    PV->>Frontend: Upload comments + audio + images
    Frontend->>Backend: POST /temp-upload
    Backend->>S3: Store files
    S3-->>Backend: File URLs
    
    Frontend->>Backend: POST /submit-pv
    Backend->>AI: Process through LangGraph
    
    Note over AI: LangGraph Pipeline
    AI->>AI: Tanglish → English
    AI->>AI: Audio → English
    AI->>AI: Merge & Deduplicate
    AI->>RAG: Search similar cases
    RAG-->>AI: Historical context
    AI->>AI: Master Analysis + RAG
    AI->>AI: House Analysis
    AI-->>Backend: AI Decision + Score
    
    Backend->>DB: Store PV data + AI analysis
    DB-->>Backend: Success
    Backend-->>Frontend: PV Submitted
    
    Note over Admin,Super: Phase 2: Admin Review
    Admin->>Frontend: View pending students
    Frontend->>Backend: GET /admin/assign
    Backend->>DB: Fetch pending cases
    DB-->>Backend: Student list
    Backend-->>Frontend: Display students
    
    Admin->>Frontend: Review student
    Frontend->>Backend: GET /admin/decision/:id
    Backend->>DB: Get student + AI analysis
    DB-->>Backend: Complete data
    Backend-->>Frontend: Show analysis
    
    Admin->>Frontend: Make decision
    Frontend->>Backend: POST /admin/final_status_update
    Backend->>DB: Update status
    Backend->>RAG: Store case in knowledge base
    DB-->>Backend: Updated
    Backend-->>Frontend: Decision saved
    
    Note over Super: Phase 3-5: VI → RI → Final Selection
    Super->>Frontend: Assign VI volunteer
    Frontend->>Backend: POST /superadmin/api/assign-vi-volunteer
    Backend->>DB: Create VI assignment
    
    Super->>Frontend: Review final candidates
    Frontend->>Backend: GET /superadmin/api/students-for-final-decision
    Backend->>DB: Get qualified students
    DB-->>Backend: Student data
    Backend-->>Frontend: Display candidates
    
    Super->>Frontend: Make final decision
    Frontend->>Backend: POST /superadmin/api/submit-final-decision
    Backend->>DB: Update final status
    Backend->>RAG: Store final decision
    DB-->>Backend: Success
    Backend-->>Frontend: Scholarship awarded
```

---

## 6. Database Schema Overview

```mermaid
erDiagram
    Volunteer ||--o{ Student : assigns
    Volunteer ||--o{ PhysicalVerification : conducts
    Volunteer ||--o{ VirtualInterview : conducts
    Volunteer ||--o{ RealInterview : conducts
    
    Student ||--|| PhysicalVerification : has
    Student ||--|| AIAnalysis : has
    Student ||--o| VirtualInterview : has
    Student ||--o| RealInterview : has
    Student ||--o| FinalSelection : has
    Student ||--o| EducationalDetails : has
    
    Volunteer {
        string volunteerId PK
        string name
        string email
        string phone
        string password
        string role
    }
    
    Student {
        string studentId PK
        string name
        string district
        string batch
        string status
        string assignedVolunteerId FK
    }
    
    PhysicalVerification {
        int pvId PK
        string studentId FK
        string volunteerId FK
        text comments
        string audioPath
        json imagePaths
        datetime submittedAt
    }
    
    AIAnalysis {
        int analysisId PK
        string studentId FK
        json summary
        string decision
        float score
        text houseAnalysis
    }
    
    VirtualInterview {
        int viId PK
        string studentId FK
        string volunteerId FK
        string status
        text report
        datetime completedAt
    }
    
    RealInterview {
        int riId PK
        string studentId FK
        string volunteerId FK
        string status
        text assessment
        datetime completedAt
    }
    
    FinalSelection {
        int selectionId PK
        string studentId FK
        string decision
        text remarks
        string superadminId FK
        datetime decisionDate
    }
    
    EducationalDetails {
        int eduId PK
        string studentId FK
        string college
        string course
        string department
        int yearOfStudy
    }
```

---

## 7. API Architecture & Endpoints

```mermaid
graph TB
    subgraph "Client Applications"
        Web[React Web App<br/>Port 3000]
    end
    
    subgraph "API Gateway - Flask"
        Gateway[Flask Server<br/>Port 5000<br/>CORS Enabled]
    end
    
    subgraph "Authentication Routes"
        Auth1[POST /api/login]
        Auth2[GET /logout]
    end
    
    subgraph "PV Volunteer Routes"
        PV1[GET /api/assigned-students]
        PV2[POST /temp-upload]
        PV3[POST /submit-pv]
        PV4[GET /api/pv-status/:id]
    end
    
    subgraph "Admin Routes"
        Admin1[GET /admin/assign]
        Admin2[GET /admin/decision/:id]
        Admin3[POST /admin/final_status_update/:id]
        Admin4[GET /api/analytics/*]
    end
    
    subgraph "Superadmin Routes"
        Super1[GET /superadmin/api/approved-students]
        Super2[POST /superadmin/api/assign-vi-volunteer]
        Super3[GET /superadmin/api/completed-vi]
        Super4[POST /superadmin/api/submit-final-decision]
        Super5[GET /superadmin/api/final-decisions]
    end
    
    subgraph "VI/RI Volunteer Routes"
        VI1[GET /vi/api/assigned-interviews]
        VI2[POST /vi/api/submit-interview]
        RI1[GET /ri/api/assigned-interviews]
        RI2[POST /ri/api/submit-assessment]
    end
    
    Web --> Gateway
    Gateway --> Auth1
    Gateway --> Auth2
    Gateway --> PV1
    Gateway --> PV2
    Gateway --> PV3
    Gateway --> Admin1
    Gateway --> Admin2
    Gateway --> Admin3
    Gateway --> Super1
    Gateway --> Super2
    Gateway --> Super3
    Gateway --> VI1
    Gateway --> RI1
    
    style Gateway fill:#90EE90
    style Auth1 fill:#FFE4B5
    style PV1 fill:#87CEEB
    style Admin1 fill:#DDA0DD
    style Super1 fill:#FF6B6B
    style VI1 fill:#98FB98
```

---

## 8. Deployment Architecture

### Development Environment
```mermaid
graph TB
    subgraph "Developer Machine"
        subgraph "Frontend - Port 3000"
            React[React Dev Server<br/>npm start]
        end
        
        subgraph "Backend - Port 5000"
            Flask[Flask Dev Server<br/>python app.py]
        end
        
        subgraph "Local Services"
            MySQL[(MySQL<br/>localhost:3306)]
            Chroma[(ChromaDB<br/>./chroma_db)]
        end
        
        subgraph "External Services"
            Gemini[Google Gemini API]
            Groq[Groq API]
            S3[AWS S3]
        end
    end
    
    React -->|HTTP| Flask
    Flask --> MySQL
    Flask --> Chroma
    Flask --> Gemini
    Flask --> Groq
    Flask --> S3
    
    style React fill:#61dafb
    style Flask fill:#90EE90
    style MySQL fill:#4479A1
    style Chroma fill:#FF6B6B
```

### Production Environment (Proposed)
```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Apache<br/>Port 80/443<br/>SSL/TLS]
    end
    
    subgraph "Application Servers"
        App1[Gunicorn + Flask<br/>Instance 1]
        App2[Gunicorn + Flask<br/>Instance 2]
    end
    
    subgraph "Static Assets"
        Static[React Build<br/>Served by Nginx]
    end
    
    subgraph "Database Layer"
        MySQL[(MySQL RDS<br/>Primary)]
        MySQLReplica[(MySQL<br/>Read Replica)]
    end
    
    subgraph "Storage"
        S3Prod[AWS S3<br/>Production Bucket]
        ChromaProd[(ChromaDB<br/>Persistent Volume)]
    end
    
    subgraph "External APIs"
        GeminiProd[Gemini API<br/>Production Key]
        GroqProd[Groq API<br/>Production Key]
    end
    
    subgraph "Monitoring"
        Monitor[CloudWatch/<br/>Sentry]
        Logs[ELK Stack]
    end
    
    Users[Users] --> LB
    LB --> Static
    LB --> App1
    LB --> App2
    App1 --> MySQL
    App2 --> MySQL
    App1 --> MySQLReplica
    App2 --> MySQLReplica
    App1 --> S3Prod
    App2 --> S3Prod
    App1 --> ChromaProd
    App2 --> ChromaProd
    App1 --> GeminiProd
    App2 --> GeminiProd
    App1 --> GroqProd
    App2 --> GroqProd
    App1 --> Monitor
    App2 --> Monitor
    App1 --> Logs
    App2 --> Logs
    
    style LB fill:#FFD700
    style Static fill:#61dafb
    style App1 fill:#90EE90
    style App2 fill:#90EE90
    style MySQL fill:#4479A1
```

---

## 9. Security Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Security Measures"
        HTTPS[HTTPS/TLS<br/>Encryption]
        CORS[CORS Policy<br/>Origin Validation]
        Session[Session Management<br/>Secure Cookies]
        Auth[Authentication<br/>Role-Based Access]
    end
    
    subgraph "Backend Security"
        Validate[Input Validation<br/>SQL Injection Prevention]
        Sanitize[Data Sanitization<br/>XSS Prevention]
        RateLimit[Rate Limiting<br/>DDoS Protection]
    end
    
    subgraph "Data Security"
        Encrypt[Data Encryption<br/>At Rest & In Transit]
        Backup[Regular Backups<br/>Disaster Recovery]
        Audit[Audit Logs<br/>Activity Tracking]
    end
    
    subgraph "API Security"
        APIKey[API Key Management<br/>Environment Variables]
        Secrets[Secrets Manager<br/>AWS/Azure]
    end
    
    Browser --> HTTPS
    HTTPS --> CORS
    CORS --> Session
    Session --> Auth
    Auth --> Validate
    Validate --> Sanitize
    Sanitize --> RateLimit
    RateLimit --> Encrypt
    Encrypt --> Backup
    Backup --> Audit
    Auth --> APIKey
    APIKey --> Secrets
    
    style HTTPS fill:#90EE90
    style Auth fill:#FFD700
    style Encrypt fill:#FF6B6B
    style APIKey fill:#87CEEB
```

---

## 10. Analytics Dashboard Architecture

```mermaid
graph TB
    subgraph "Data Sources"
        Students[(Student Table)]
        PV[(PhysicalVerification)]
        AI[(AIAnalysis)]
        Final[(FinalSelection)]
    end
    
    subgraph "Analytics Processing"
        Aggregate[Data Aggregation<br/>SQL Queries]
        Calculate[Metrics Calculation<br/>AI vs Manual]
        Format[Data Formatting<br/>JSON Response]
    end
    
    subgraph "Frontend Visualization"
        Dashboard[Analytics Dashboard<br/>React Component]
        Charts[Recharts Library]
        
        subgraph "Visualizations"
            Pie[Gender Distribution<br/>Pie Chart]
            Bar[Stream Analysis<br/>Bar Chart]
            Area[Year Trends<br/>Area Chart]
            Metrics[AI Accuracy<br/>Metric Cards]
        end
    end
    
    Students --> Aggregate
    PV --> Aggregate
    AI --> Aggregate
    Final --> Aggregate
    
    Aggregate --> Calculate
    Calculate --> Format
    Format --> Dashboard
    Dashboard --> Charts
    Charts --> Pie
    Charts --> Bar
    Charts --> Area
    Charts --> Metrics
    
    style Dashboard fill:#61dafb
    style Calculate fill:#FFD700
    style Charts fill:#90EE90
```

---

## Legend

| Color | Meaning |
|-------|---------|
| 🟦 Blue | Frontend/UI Components |
| 🟩 Green | Backend/API Services |
| 🟨 Yellow | AI/ML Services |
| 🟥 Red | Databases/Storage |
| 🟪 Purple | External Services |
| 🟧 Orange | Security/Auth |

---

**Document Version**: 1.0  
**Created**: January 5, 2026  
**Based on**: Actual Implementation Analysis  
**Format**: Mermaid Diagrams (GitHub/Markdown Compatible)
