
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Complaint, UserProfile } from '@/types';
import { Timestamp } from 'firebase/firestore';

const formatDate = (date: Timestamp | undefined) => {
    if (!date) return '-';
    return new Date(date.seconds * 1000).toLocaleDateString();
};

const prepareData = (complaints: Complaint[], actionTakers: UserProfile[]) => {
    return complaints.map(c => {
         const assignee = actionTakers.find(u => u.uid === c.assignedTo);
         return {
             ID: c.complaintId,
             Category: c.category,
             Severity: c.severity,
             Status: c.status,
             AssignedTo: assignee ? assignee.name : 'Unassigned',
             Date: formatDate(c.createdAt),
             Description: c.description
         };
    });
};

export const exportToCSV = (complaints: Complaint[], actionTakers: UserProfile[]) => {
    const data = prepareData(complaints, actionTakers);
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `complaints_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToXLSX = (complaints: Complaint[], actionTakers: UserProfile[]) => {
    const data = prepareData(complaints, actionTakers);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");
    XLSX.writeFile(workbook, `complaints_export_${Date.now()}.xlsx`);
};

export const exportToPDF = (complaints: Complaint[], actionTakers: UserProfile[]) => {
    const doc = new jsPDF();
    const data = prepareData(complaints, actionTakers);
    
    doc.text("Complaints Report", 14, 22);
    
    autoTable(doc, {
        startY: 30,
        head: [['ID', 'Category', 'Severity', 'Status', 'Assigned To', 'Date']],
        body: data.map(row => [row.ID, row.Category, row.Severity, row.Status, row.AssignedTo, row.Date]),
    });
    
    doc.save(`complaints_export_${Date.now()}.pdf`);
};
