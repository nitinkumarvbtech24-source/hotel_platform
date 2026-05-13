export default function ReceiptTemplate({
    hotel,
    billNumber,
    customerName,
    items,
    subtotal,
    tax,
    deliveryCharge,
    total,
    paymentMethod,
    serviceType,
    createdAt
}) {
    const groupedCounters = items.reduce((acc, item) => {
        const counter = item.counterNumber || '1';
        if (!acc[counter]) acc[counter] = [];
        acc[counter].push(item);
        return acc;
    }, {});

    const counterIds = Object.keys(groupedCounters);
    const mainCounterId = counterIds[0];
    const subCounterIds = counterIds.slice(1);

    return (
        <div className="receipt-wrapper">
            {/* MAIN RECEIPT - Only shows Items from Counter 1 + Full Financials */}
            <div className="thermal-receipt main-bill">
                <div className="receipt-header">
                    <h2>{hotel.name}</h2>
                    <p>{hotel.address}</p>
                    <p>{hotel.phone}</p>
                </div>

                <div className="receipt-meta">
                    <div className="meta-row">
                        <span>Bill: <strong>{billNumber}</strong></span>
                        <span>{new Date(createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-row">
                        <span>Time: {new Date(createdAt).toLocaleTimeString()}</span>
                        <span className="counter-tag">Counter #{mainCounterId}</span>
                    </div>
                </div>

                {customerName && (
                    <div className="receipt-customer">
                        Customer: <strong>{customerName}</strong>
                    </div>
                )}

                <table className="receipt-table">
                    <thead>
                        <tr>
                            <th>Dish</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedCounters[mainCounterId]?.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.name}</td>
                                <td>{item.qty || item.quantity || 1}</td>
                                <td>{item.price}</td>
                                <td>{((item.qty || item.quantity || 1) * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="receipt-divider"></div>

                <div className="receipt-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {tax > 0 && (
                        <div className="summary-row">
                            <span>Taxes</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                    )}
                    {deliveryCharge > 0 && (
                        <div className="summary-row">
                            <span>Delivery</span>
                            <span>₹{deliveryCharge.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="summary-row grand-total">
                        <span>Total Bill</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="receipt-footer">
                    <p>Payment: {paymentMethod} | Service: {serviceType}</p>
                    <p className="thank-you">THANK YOU! VISIT AGAIN</p>
                </div>
            </div>

            {/* SUB-BILLS - For other counters */}
            {subCounterIds.map(counterId => (
                <div key={counterId} className="thermal-receipt sub-bill">
                    <div className="sub-header">
                        <div className="sub-title">COUNTER TICKET</div>
                        <div className="sub-meta">
                            <span>#{billNumber}</span>
                            <span>{new Date(createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="sub-counter-badge">COUNTER #{counterId}</div>
                    </div>

                    <table className="receipt-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedCounters[counterId].map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.qty || item.quantity || 1}</td>
                                    <td>{((item.qty || item.quantity || 1) * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="sub-footer">
                        <span>* Part of Bill {billNumber}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
