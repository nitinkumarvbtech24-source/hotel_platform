import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
    FileText, 
    Download, 
    Upload, 
    FileSpreadsheet, 
    Eye,
    X
} from 'lucide-react';
import ReceiptTemplate from './ReceiptTemplate';
import '../Styles/settings.css';

export default function BillLogs({ hotelId, slots = [] }) {
    const [activeTab, setActiveTab] = useState('offline'); // 'offline' or 'online'
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Preview Modal State
    const [selectedBill, setSelectedBill] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    
    // Filter State
    const [filterDate, setFilterDate] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterSlot, setFilterSlot] = useState('');
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (hotelId) {
            fetchBills();
        }
    }, [hotelId]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            // Note: If you don't have an index for createdAt, you might need to create one in Firebase Console.
            // For now, we'll fetch all and sort in memory if the query fails, but standard fetch should be fine.
            const billsRef = collection(db, 'hotels', hotelId, 'bills');
            const snap = await getDocs(billsRef);
            
            const fetchedBills = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort by createdAt descending
            fetchedBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBills(fetchedBills);
        } catch (error) {
            console.error("Error fetching bills: ", error);
        }
        setLoading(false);
    };

    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const isOnline = bill.type === 'online';
            
            // Tab Filter
            if (activeTab === 'offline' && isOnline) return false;
            if (activeTab === 'online' && !isOnline) return false;
            
            // Date Filter
            if (filterDate) {
                let billDateStr = '';
                if (bill.createdAt && typeof bill.createdAt === 'string') {
                    billDateStr = bill.createdAt.split('T')[0];
                } else if (bill.createdAt && typeof bill.createdAt.toDate === 'function') {
                    billDateStr = bill.createdAt.toDate().toISOString().split('T')[0];
                } else if (bill.timestamp && typeof bill.timestamp.toDate === 'function') {
                    billDateStr = bill.timestamp.toDate().toISOString().split('T')[0];
                }
                if (billDateStr !== filterDate) return false;
            }

            // Service Type Filter
            let currentService = bill.serviceType || bill.deliveryMethod || 'Dine In';
            
            // Normalize currentService if it's in raw format
            const normalizationMap = {
                'dinein': 'Dine In',
                'camp': 'Camp Delivery',
                'doorstep': 'Doorstep Delivery'
            };
            if (normalizationMap[currentService]) {
                currentService = normalizationMap[currentService];
            }

            if (filterService && currentService !== filterService) return false;

            // Time Slot Filter
            if (filterSlot && bill.timeSlot && !bill.timeSlot.includes(filterSlot)) return false;

            return true;
        });
    }, [bills, activeTab, filterDate, filterService, filterSlot]);

    const exportExcel = () => {
        if (filteredBills.length === 0) return alert('No bills to export');
        
        const exportData = filteredBills.map((b, i) => ({
            "S.No": i + 1,
            "Bill Number": b.billNumber || 'N/A',
            "Delivery Method": b.serviceType || 'Dine In',
            "Location": b.location || 'N/A',
            "Customer Name": b.customerName || 'N/A',
            "Mobile": b.customerMobile || 'N/A',
            "Email": b.customerEmail || 'N/A',
            "Timeslot": b.timeSlot || 'N/A',
            "Items Count": b.items?.length || 0,
            "Total (₹)": (b.total || 0).toFixed(2),
            "Date": new Date(b.createdAt).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bills");
        XLSX.writeFile(wb, `Bills_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportPDF = () => {
        if (filteredBills.length === 0) return alert('No bills to export');

        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Bill Logs Report', 14, 22);
        
        const tableColumn = ["S.No", "Bill No", "Type", "Location", "Customer", "Mobile", "Timeslot", "Items", "Total"];
        const tableRows = [];

        filteredBills.forEach((b, i) => {
            const rowData = [
                i + 1,
                b.billNumber || 'N/A',
                b.serviceType || 'Dine In',
                b.location || 'N/A',
                b.customerName || 'N/A',
                b.customerMobile || 'N/A',
                b.timeSlot || 'N/A',
                b.items?.length || 0,
                `Rs ${(b.total || 0).toFixed(2)}`
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        doc.save(`Bills_Export_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportBackup = () => {
        if (bills.length === 0) return alert('No data to backup');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bills));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `hotel_bills_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportBills = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedBills = JSON.parse(event.target.result);
                if (!Array.isArray(importedBills)) throw new Error('Invalid format');
                
                let addedCount = 0;
                for (const bill of importedBills) {
                    if (bill.id) {
                        const existing = bills.find(b => b.id === bill.id);
                        if (!existing) {
                            await setDoc(doc(db, 'hotels', hotelId, 'bills', bill.id), bill);
                            addedCount++;
                        }
                    }
                }
                alert(`Successfully imported ${addedCount} new bills.`);
                fetchBills();
            } catch (error) {
                console.error("Import error", error);
                alert('Failed to parse backup file. Please ensure it is a valid JSON backup.');
            }
        };
        reader.readAsText(file);
    };

    const openPreview = (bill) => {
        setSelectedBill(bill);
        setShowPreview(true);
    };

    return (
        <div className="bill-logs-container">
            <div className="bill-logs-header">
                <div className="logs-nav">
                    <button 
                        className={`log-nav-btn ${activeTab === 'offline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offline')}
                    >
                        Offline Bills
                    </button>
                    <button 
                        className={`log-nav-btn ${activeTab === 'online' ? 'active' : ''}`}
                        onClick={() => setActiveTab('online')}
                    >
                        Online Bills
                    </button>
                </div>
                
                <div className="export-action-group">
                    <button className="action-btn excel-btn" onClick={exportExcel}>
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                    <button className="action-btn pdf-btn" onClick={exportPDF}>
                        <FileText size={16} /> Export PDF
                    </button>
                    <button className="action-btn backup-btn" onClick={exportBackup}>
                        <Download size={16} /> Export Backup
                    </button>
                    <button className="action-btn import-btn" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> Import Bills
                    </button>
                    <input type="file" accept=".json" style={{display: 'none'}} ref={fileInputRef} onChange={handleImportBills} />
                </div>
            </div>

            <div className="filter-bar glass-card">
                <div className="filter-group">
                    <label>Date Filter</label>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </div>
                
                {activeTab === 'online' && (
                    <>
                        <div className="filter-group">
                            <label>Service Type</label>
                            <select value={filterService} onChange={e => setFilterService(e.target.value)}>
                                <option value="">All Services</option>
                                <option value="Dine In">Dine In</option>
                                <option value="Camp Delivery">Camp Delivery</option>
                                <option value="Doorstep Delivery">Doorstep Delivery</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Time Slot</label>
                            <select value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
                                <option value="">All Slots</option>
                                {slots.map(slot => (
                                    <option key={slot.id} value={slot.name}>
                                        {slot.name} ({slot.start} - {slot.end})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                
                {(filterDate || filterService || filterSlot) && (
                    <button className="clear-filter-btn" onClick={() => { setFilterDate(''); setFilterService(''); setFilterSlot(''); }}>
                        Clear Filters
                    </button>
                )}
            </div>

            <div className="glass-card table-wrapper">
                {loading ? (
                    <div className="loading-state">Loading bills...</div>
                ) : (
                    <table className="industrial-table bill-logs-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Bill Number</th>
                                <th>Delivery Method</th>
                                <th>Location</th>
                                <th>Customer Name</th>
                                <th>Mobile</th>
                                <th>Email</th>
                                <th>Timeslot</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.length > 0 ? (
                                filteredBills.map((bill, index) => (
                                    <tr key={bill.id}>
                                        <td>{index + 1}</td>
                                        <td><strong>{bill.billNumber || 'N/A'}</strong></td>
                                        <td>
                                            <span className={`method-pill ${ (bill.serviceType || bill.deliveryMethod || 'Dine In') === 'Dine In' ? 'offline' : 'online'}`}>
                                                {bill.serviceType || bill.deliveryMethod || 'Dine In'}
                                            </span>
                                        </td>
                                        <td>{bill.location || 'N/A'}</td>
                                        <td>{bill.customerName || 'N/A'}</td>
                                        <td>{bill.customerMobile || 'N/A'}</td>
                                        <td>{bill.customerEmail || 'N/A'}</td>
                                        <td>{bill.timeSlot || 'N/A'}</td>
                                        <td>{bill.items?.length || 0} items</td>
                                        <td><strong>₹{(bill.total || 0).toFixed(2)}</strong></td>
                                        <td>
                                            <button className="preview-mini-btn" onClick={() => openPreview(bill)}>
                                                <Eye size={16} /> Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="11" className="empty-table-msg">
                                        No bills found for this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && selectedBill && (
                <div className="modal-overlay">
                    <div className="modal-content preview-modal-content">
                        <button className="close-modal-btn" onClick={() => setShowPreview(false)}>
                            <X size={24} />
                        </button>
                        <h2>Bill Preview - {selectedBill.billNumber}</h2>
                        
                        <div className="receipt-preview-area">
                            <ReceiptTemplate 
                                hotel={{
                                    name: selectedBill.hotelName || 'Hotel Name',
                                    address: 'Hotel Address', // We might not have this saved in old bills
                                    phone: selectedBill.ownerMobile || 'N/A'
                                }}
                                billNumber={selectedBill.billNumber}
                                customerName={selectedBill.customerName}
                                items={selectedBill.items || []}
                                subtotal={selectedBill.subtotal || 0}
                                tax={selectedBill.tax || 0}
                                deliveryCharge={selectedBill.deliveryCharge || 0}
                                total={selectedBill.total || 0}
                                paymentMethod={selectedBill.paymentMethod || 'Cash'}
                                serviceType={selectedBill.serviceType || 'Dine In'}
                                createdAt={selectedBill.createdAt}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
