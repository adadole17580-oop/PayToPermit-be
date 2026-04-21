# Database Setup Instructions

## Prerequisites
- MySQL Server installed and running
- MySQL command line client or MySQL Workbench

## Setup Steps

### 1. Create the Database
Run the schema.sql file to create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or use MySQL Workbench to execute the schema.sql file.

### 2. Environment Configuration
Update the `.env` file in the backend root directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=paytopermit
PORT=3000
```

### 3. Default Users
The schema creates these default users:

**Admin Users:**
- Email: admin@paytopermit.com, Password: admin123
- Email: finance@paytopermit.com, Password: finance123

**Student Users:**
- Email: john.doe@university.edu, Password: student123
- Email: jane.smith@university.edu, Password: student123
- Email: mike.johnson@university.edu, Password: student123

### 4. File Upload Directory
Create the uploads directory for payment proof files:

```bash
mkdir uploads
```

### 5. Start the Backend Server

**For Windows (if PowerShell execution policy allows):**
```bash
npm run dev
```

**Alternative for Windows (if PowerShell blocks scripts):**
```bash
npx tsx watch src/index.ts
```

**For production:**
```bash
npm run build
npm start
```

## Database Schema Overview

### Tables:
- **Admins**: Administrator accounts
- **Students**: Student accounts
- **Fees**: Available fees for payment
- **PaymentSubmissions**: Student payment proof uploads
- **Notifications**: System notifications for users

### Relationships:
- PaymentSubmissions → Students (many-to-one)
- PaymentSubmissions → Admins (many-to-one, optional)
- Notifications → Students/Admins (many-to-one)
