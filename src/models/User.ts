import db from '../config/db.js';

export interface User {
  id: string;
  fullname: string;
  email: string;
  address: string;
  phone: string;
  department?: string | null;
  role: 'student' | 'admin';
}

type Role = 'student' | 'admin';

const tableNames = {
  student: 'Students',
  admin: 'Admins'
} as const;

const idFields = {
  student: 'student_id',
  admin: 'admin_id'
} as const;

export class UserModel {
  private static getTable(role: Role) {
    return tableNames[role];
  }

  private static getIdField(role: Role) {
    return idFields[role];
  }

  private static rowToUser(row: any, role: Role) {
    return {
      id: row[this.getIdField(role)] ?? row.id,
      fullname: row.fullname ?? row.name,
      email: row.email,
      address: row.address,
      phone: row.phone,
      department: role === 'student' ? row.department : null,
      role
    };
  }

  static async findByEmailAndPassword(email: string, password: string, role: Role): Promise<User | null> {
    try {
      const table = this.getTable(role);
      const query = `SELECT * FROM ${table} WHERE email = ? AND password = ? LIMIT 1`;
      const [rows] = await db.query(query, [email, password]) as any;
      const users = Array.isArray(rows) ? rows : [];

      if (users.length === 0) {
        return null;
      }

      return this.rowToUser(users[0], role);
    } catch (error) {
      console.error('Database error in findByEmailAndPassword:', error);
      throw error;
    }
  }

  static async findByEmail(email: string, role?: Role): Promise<User | null> {
    try {
      if (role) {
        const table = this.getTable(role);
        const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ? LIMIT 1`, [email]) as any;
        const users = Array.isArray(rows) ? rows : [];
        return users.length === 0 ? null : this.rowToUser(users[0], role);
      }

      const [studentRows] = await db.query('SELECT * FROM Students WHERE email = ? LIMIT 1', [email]) as any;
      const students = Array.isArray(studentRows) ? studentRows : [];
      if (students.length > 0) {
        return this.rowToUser(students[0], 'student');
      }

      const [adminRows] = await db.query('SELECT * FROM Admins WHERE email = ? LIMIT 1', [email]) as any;
      const admins = Array.isArray(adminRows) ? adminRows : [];
      return admins.length === 0 ? null : this.rowToUser(adminRows[0], 'admin');
    } catch (error) {
      console.error('Database error in findByEmail:', error);
      throw error;
    }
  }

  static async findById(id: string, role: Role): Promise<User | null> {
    try {
      const table = this.getTable(role);
      const idField = this.getIdField(role);
      const [rows] = await db.query(`SELECT * FROM ${table} WHERE ${idField} = ? LIMIT 1`, [id]) as any;
      const users = Array.isArray(rows) ? rows : [];
      return users.length === 0 ? null : this.rowToUser(users[0], role);
    } catch (error) {
      console.error('Database error in findById:', error);
      throw error;
    }
  }

  static async create(userData: {
    id: string;
    fullname: string;
    email: string;
    address: string;
    phone: string;
    department?: string;
    password: string;
    role: Role;
  }): Promise<void> {
    try {
      const insertQuery = userData.role === 'admin'
        ? 'INSERT INTO Admins (admin_id, fullname, email, address, phone, password) VALUES (?, ?, ?, ?, ?, ?)'
        : 'INSERT INTO Students (student_id, fullname, email, address, phone, department, password) VALUES (?, ?, ?, ?, ?, ?, ?)';

      const params = userData.role === 'admin'
        ? [userData.id, userData.fullname, userData.email, userData.address, userData.phone, userData.password]
        : [userData.id, userData.fullname, userData.email, userData.address, userData.phone, userData.department, userData.password];

      await db.query(insertQuery, params);
    } catch (error) {
      console.error('Database error in create:', error);
      throw error;
    }
  }

  static async update(id: string, role: Role, updateData: Partial<{
    fullname: string;
    email: string;
    address: string;
    phone: string;
    department: string | null;
    password: string;
  }>): Promise<void> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (updateData.fullname) {
        updates.push('fullname = ?');
        params.push(updateData.fullname);
      }
      if (updateData.email) {
        updates.push('email = ?');
        params.push(updateData.email);
      }
      if (updateData.address) {
        updates.push('address = ?');
        params.push(updateData.address);
      }
      if (updateData.phone) {
        updates.push('phone = ?');
        params.push(updateData.phone);
      }
      if (role === 'student' && updateData.department !== undefined) {
        updates.push('department = ?');
        params.push(updateData.department);
      }
      if (updateData.password) {
        updates.push('password = ?');
        params.push(updateData.password);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      const table = this.getTable(role);
      const idField = this.getIdField(role);
      params.push(id);
      const query = `UPDATE ${table} SET ${updates.join(', ')} WHERE ${idField} = ?`;
      await db.query(query, params);
    } catch (error) {
      console.error('Database error in update:', error);
      throw error;
    }
  }

  static async getAllStudents(): Promise<User[]> {
    try {
      const [rows] = await db.query('SELECT * FROM Students') as any;
      const students = Array.isArray(rows) ? rows : [];

      return students.map((student: any) => ({
        id: student.student_id,
        fullname: student.fullname,
        email: student.email,
        address: student.address,
        phone: student.phone,
        department: student.department,
        role: 'student'
      }));
    } catch (error) {
      console.error('Database error in getAllStudents:', error);
      throw error;
    }
  }

  static async getAllAdminIds(): Promise<string[]> {
    try {
      const [rows] = await db.query('SELECT admin_id FROM Admins') as any;
      const admins = Array.isArray(rows) ? rows : [];
      return admins.map((admin: any) => admin.admin_id).filter(Boolean);
    } catch (error) {
      console.error('Database error in getAllAdminIds:', error);
      throw error;
    }
  }
}
