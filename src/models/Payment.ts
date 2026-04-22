import db from '../config/db.js';

export interface Fee {
  id: number;
  name: string;
  amount: number;
  description: string;
  category: string;
  academic_year: string;
}

export interface PaymentSubmission {
  id?: number;
  student_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_date: Date;
  status: 'pending' | 'approved' | 'rejected';
  permit_number?: string;
  admin_id?: string;
}

export class FeeModel {
  static async getAllFees(): Promise<Fee[]> {
    try {
      const [rows] = await db.query('SELECT * FROM Fees ORDER BY category, name') as any;
      const fees = Array.isArray(rows) ? rows : [];

      return fees.map((fee: any) => ({
        id: fee.fee_id || fee.id,
        name: fee.name,
        amount: parseFloat(fee.amount),
        description: fee.description,
        category: fee.category,
        academic_year: fee.academic_year
      }));
    } catch (error) {
      console.error('Database error in getAllFees:', error);
      throw error;
    }
  }

  static async getFeesByCategory(category: string): Promise<Fee[]> {
    try {
      const [rows] = await db.query('SELECT * FROM Fees WHERE category = ? ORDER BY name', [category]) as any;
      const fees = Array.isArray(rows) ? rows : [];

      return fees.map((fee: any) => ({
        id: fee.fee_id || fee.id,
        name: fee.name,
        amount: parseFloat(fee.amount),
        description: fee.description,
        category: fee.category,
        academic_year: fee.academic_year
      }));
    } catch (error) {
      console.error('Database error in getFeesByCategory:', error);
      throw error;
    }
  }
}

export class PaymentModel {
  static async createSubmission(submission: Omit<PaymentSubmission, 'id' | 'upload_date'>): Promise<number> {
    try {
      const [result] = await db.query(
        'INSERT INTO PaymentSubmissions (student_id, filename, original_filename, file_path, file_size, mime_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          submission.student_id,
          submission.filename,
          submission.original_filename,
          submission.file_path,
          submission.file_size,
          submission.mime_type,
          submission.status
        ]
      ) as any;

      return (result as any).insertId;
    } catch (error) {
      console.error('Database error in createSubmission:', error);
      throw error;
    }
  }

  static async getSubmissionsByStudent(studentId: string): Promise<PaymentSubmission[]> {
    try {
      const [rows] = await db.query(
        'SELECT * FROM PaymentSubmissions WHERE student_id = ? ORDER BY upload_date DESC',
        [studentId]
      ) as any;
      const submissions = Array.isArray(rows) ? rows : [];

      return submissions.map((sub: any) => ({
        id: sub.submission_id || sub.id,
        student_id: sub.student_id,
        filename: sub.filename,
        original_filename: sub.original_filename,
        file_path: sub.file_path,
        file_size: sub.file_size,
        mime_type: sub.mime_type,
        upload_date: new Date(sub.upload_date),
        status: sub.status,
        permit_number: sub.permit_number,
        admin_id: sub.admin_id
      }));
    } catch (error) {
      console.error('Database error in getSubmissionsByStudent:', error);
      throw error;
    }
  }

  static async updateSubmissionStatus(submissionId: number, status: 'approved' | 'rejected', adminId?: string, permitNumber?: string, reason?: string): Promise<boolean> {
    try {
      let query = 'UPDATE PaymentSubmissions SET status = ?';
      const params: any[] = [status];

      if (permitNumber) {
        query += ', permit_number = ?';
        params.push(permitNumber);
      }

      if (adminId) {
        query += ', admin_id = ?';
        params.push(adminId);
      }

      if (reason) {
        query += ', rejection_reason = ?';
        params.push(reason);
      }

      query += ' WHERE submission_id = ?';
      params.push(submissionId);

      const [result] = await db.query(query, params);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Database error in updateSubmissionStatus:', error);
      throw error;
    }
  }

  static async getAllSubmissions(limit: number = 50, offset: number = 0): Promise<Array<PaymentSubmission & { student_name: string }>> {
    try {
      const [rows] = await db.query(
        `SELECT ps.*, students.fullname as student_name 
         FROM PaymentSubmissions ps 
         LEFT JOIN Students students ON ps.student_id = students.student_id 
         ORDER BY ps.upload_date DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      ) as any;
      const submissions = Array.isArray(rows) ? rows : [];

      return submissions.map((sub: any) => ({
        id: sub.submission_id || sub.id,
        student_id: sub.student_id,
        student_name: sub.student_name || 'Unknown',
        filename: sub.filename,
        original_filename: sub.original_filename,
        file_path: sub.file_path,
        file_size: sub.file_size,
        mime_type: sub.mime_type,
        upload_date: new Date(sub.upload_date),
        status: sub.status,
        permit_number: sub.permit_number,
        admin_id: sub.admin_id
      }));
    } catch (error) {
      console.error('Database error in getAllSubmissions:', error);
      throw error;
    }
  }

  static async getStats(): Promise<{ total: number; approved: number; pending: number; rejected: number }> {
    try {
      const [rows] = await db.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM PaymentSubmissions
      `) as any;

      const result = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : {};

      return {
        total: result.total || 0,
        approved: result.approved || 0,
        pending: result.pending || 0,
        rejected: result.rejected || 0
      };
    } catch (error) {
      console.error('Database error in getStats:', error);
      throw error;
    }
  }

  static async getMonthlyStats(): Promise<Array<{ month: string; total: number; approved: number; rejected: number }>> {
    try {
      const [rows] = await db.query(`
        SELECT 
          DATE_FORMAT(upload_date, '%Y-%m') as month,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM PaymentSubmissions
        GROUP BY DATE_FORMAT(upload_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `) as any;

      const submissions = Array.isArray(rows) ? rows : [];

      return submissions.map((row: any) => ({
        month: row.month,
        total: row.total || 0,
        approved: row.approved || 0,
        rejected: row.rejected || 0
      }));
    } catch (error) {
      console.error('Database error in getMonthlyStats:', error);
      throw error;
    }
  }

  static async getSubmissionById(submissionId: number): Promise<PaymentSubmission & { student_name: string } | null> {
    try {
      const [rows] = await db.query(
        `SELECT ps.*, students.fullname as student_name 
         FROM PaymentSubmissions ps 
         LEFT JOIN Students students ON ps.student_id = students.student_id 
         WHERE ps.submission_id = ?`,
        [submissionId]
      ) as any;

      const submissions = Array.isArray(rows) ? rows : [];
      if (submissions.length === 0) return null;

      const sub = submissions[0] as any;
      return {
        id: sub.submission_id || sub.id,
        student_id: sub.student_id,
        student_name: sub.student_name || 'Unknown',
        filename: sub.filename,
        original_filename: sub.original_filename,
        file_path: sub.file_path,
        file_size: sub.file_size,
        mime_type: sub.mime_type,
        upload_date: new Date(sub.upload_date),
        status: sub.status,
        permit_number: sub.permit_number,
        admin_id: sub.admin_id
      };
    } catch (error) {
      console.error('Database error in getSubmissionById:', error);
      throw error;
    }
  }
}