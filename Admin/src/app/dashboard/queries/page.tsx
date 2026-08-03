"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { fetchApi } from '../../../utils/api';
import { Paperclip } from 'lucide-react';
import styles from './queries.module.css';

interface Attachment {
  url: string;
  fileName?: string;
}

interface GeotrixBill {
  _id: string;
  billNumber: string;
  title?: string;
  description?: string;
  customerName?: string;
  email?: string;
  phoneNumber?: string;
  amount?: number;
  monthlyBillAmount?: number;
  projectName?: string;
  invoiceNumber?: string;
  billDate?: string;
  dueDate?: string;
  attachment?: Attachment[];
  attachments?: Attachment[];
  extraAttachment?: Attachment[];
  createdAt: string;
}

export default function QueriesPage() {
  const [bills, setBills] = useState<GeotrixBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<GeotrixBill | null>(null);

  const loadBills = async () => {
    try {
      const response = await fetchApi('/api/geotrixbills');
      if (response.success) {
        const data = response.data?.items || response.data?.data || response.data;
        if (Array.isArray(data)) {
          setBills(data);
        } else {
          setBills([]);
        }
      }
    } catch (err) {
      console.error('Failed to load bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const closeModal = () => setSelectedBill(null);

  const renderAttachments = (files: Attachment[] | undefined, label: string) => {
    if (!files || files.length === 0) return null;
    return (
      <div className={styles.detailItem} style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
        <span className={styles.detailLabel}>{label}</span>
        <div className={styles.attachmentList}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.attachmentItem}>
              <Paperclip size={16} color="var(--muted)" />
              <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
                {file.fileName || `Attachment ${idx + 1}`}
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Geotrix Bills (Queries)</h1>
      </div>

      <Card>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table headers={['Bill Number', 'Title', 'Customer Name', 'Email', 'Phone', 'Amount', 'Date']}>
            {bills.map((bill) => (
              <tr 
                key={bill._id} 
                className={styles.rowClickable} 
                onClick={() => setSelectedBill(bill)}
              >
                <td style={{ fontWeight: 500 }}>{bill.billNumber}</td>
                <td>{bill.title || 'N/A'}</td>
                <td>{bill.customerName || 'N/A'}</td>
                <td>{bill.email || 'N/A'}</td>
                <td>{bill.phoneNumber || 'N/A'}</td>
                <td>${(bill.amount || bill.monthlyBillAmount || 0).toLocaleString()}</td>
                <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No bills found.</td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>&times;</button>
            <h2 className={styles.modalTitle}>Bill Details: {selectedBill.billNumber}</h2>
            
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Title</span>
                <span className={styles.detailValue}>{selectedBill.title || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Customer Name</span>
                <span className={styles.detailValue}>{selectedBill.customerName || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{selectedBill.email || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone Number</span>
                <span className={styles.detailValue}>{selectedBill.phoneNumber || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Amount</span>
                <span className={styles.detailValue}>${(selectedBill.amount || selectedBill.monthlyBillAmount || 0).toLocaleString()}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Created At</span>
                <span className={styles.detailValue}>{new Date(selectedBill.createdAt).toLocaleString()}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Project Name</span>
                <span className={styles.detailValue}>{selectedBill.projectName || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Invoice Number</span>
                <span className={styles.detailValue}>{selectedBill.invoiceNumber || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bill Date</span>
                <span className={styles.detailValue}>{selectedBill.billDate ? new Date(selectedBill.billDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Due Date</span>
                <span className={styles.detailValue}>{selectedBill.dueDate ? new Date(selectedBill.dueDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              
              {selectedBill.description && (
                <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.detailLabel}>Description</span>
                  <span className={styles.detailValue} style={{ whiteSpace: 'pre-wrap' }}>{selectedBill.description}</span>
                </div>
              )}

              {renderAttachments(selectedBill.attachments?.length ? selectedBill.attachments : selectedBill.attachment, 'Attachments')}
              {renderAttachments(selectedBill.extraAttachment, 'Extra Attachments')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
