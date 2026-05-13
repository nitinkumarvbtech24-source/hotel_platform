import { X, Printer, QrCode } from 'lucide-react';
import ReceiptTemplate from './ReceiptTemplate';

export default function BillPreviewModal({
    isOpen,
    onClose,
    billData,
    onConfirmBill
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
                        <h2>Checkout Details</h2>
                        <button className="close-mini-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="payment-config-section">
                        <div className="config-group">
                            <label>Payment Method</label>
                            <div className="payment-grid">
                                {['Cash', 'UPI', 'Card'].map(method => (
                                    <button
                                        key={method}
                                        className={`method-btn ${billData.paymentMethod === method ? 'active' : ''}`}
                                        onClick={() => billData.setPaymentMethod(method)}
                                    >
                                        <div className="method-dot"></div>
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {billData.paymentMethod === 'UPI' && (
                            <div className="upi-config-card">
                                <div className="qr-header">
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={billData.dynamicQr}
                                            onChange={(e) => billData.setDynamicQr(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Dynamic UPI QR
                                    </label>
                                </div>

                                <div className="qr-preview-box">
                                    <QrCode size={160} color="var(--primary-olive)" />
                                    <p>Scan to Pay ₹{billData.total?.toFixed(2)}</p>
                                </div>
                            </div>
                        )}

                        {billData.paymentMethod === 'Card' && (
                            <div className="card-info-box">
                                <p>Ensure card machine is connected and ready.</p>
                            </div>
                        )}
                    </div>

                    <div className="modal-actions-footer">
                        <button className="secondary-btn-outline" onClick={handlePrint}>
                            <Printer size={18} />
                            Print KOT
                        </button>
                        <button className="confirm-btn-primary" onClick={onConfirmBill}>
                            Confirm & Generate Bill
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