import { X, Printer } from 'lucide-react';
import ReceiptTemplate from './ReceiptTemplate';

export default function BillPreviewModal({
    isOpen,
    onClose,
    billData
}) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bill-preview-overlay">
            <div className="bill-preview-modal-split">
                <div className="modal-left-panel">
                    <div className="panel-header">
                        <h2>Bill Preview</h2>
                        <button className="close-mini-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bill-info-summary">
                        <div className="info-row">
                            <span>Bill Number:</span>
                            <strong>{billData.billNumber}</strong>
                        </div>
                        <div className="info-row">
                            <span>Customer:</span>
                            <strong>{billData.customerName}</strong>
                        </div>
                        <div className="info-row">
                            <span>Total Amount:</span>
                            <strong>₹{billData.total?.toFixed(2)}</strong>
                        </div>
                    </div>

                    <div className="modal-actions-footer">
                        <button className="confirm-btn-primary" onClick={handlePrint} style={{ width: '100%' }}>
                            <Printer size={18} />
                            Print Thermal Receipt
                        </button>
                    </div>
                </div>

                <div className="modal-right-preview">
                    <div className="preview-label">Receipt Preview</div>
                    <div className="receipt-scroll-container">
                        <ReceiptTemplate {...billData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
