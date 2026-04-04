import { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Card, Collapse, ProgressBar } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import StatusBadge from '../common/StatusBadge';

export default function ReceiptModal({ receipt, show, onHide, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const api = useApi();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (show && receipt) {
      setIsEditing(false);
      setSelectedFile(null);
      setShowImage(false);
      setIsSaving(false);
      setUploadProgress(0);

      const dataCopy = JSON.parse(JSON.stringify(receipt));
      dataCopy.items = dataCopy.items.map(item => ({
        ...item,
        line_total: (item.qty * item.unit_price)
      }));
      setEditData(dataCopy);
    }
  }, [show, receipt]);

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
    }, 300);

    const formData = new FormData();
    formData.append('store_name', editData.store_name);
    formData.append('date', editData.date);
    formData.append('total_amount', parseFloat(editData.total_amount).toFixed(2));

    const itemsToSend = editData.items.map(({ line_total, ...rest }) => rest);
    formData.append('items', JSON.stringify(itemsToSend));
    if (selectedFile) formData.append('receipt_image', selectedFile);

    try {
        const response = await api.put(`/shopping_purchase/${receipt.id}`, formData);
        clearInterval(interval);
        if (response.ok) {
            setUploadProgress(100);
            setTimeout(() => {
                onUpdate(response.body);
                setIsEditing(false);
                onHide();
                setIsSaving(false);
            }, 500);
        } else {
            setIsSaving(false);
        }
    } catch (e) {
        clearInterval(interval);
        setIsSaving(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editData.items];
    const item = newItems[index];

    if (field === 'line_total' || field === 'qty') {
        if (value === "") {
            item[field] = "";
            if (field === 'line_total') item.unit_price = 0;
        } else {
            item[field] = value;
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                if (field === 'line_total') item.unit_price = numValue / (parseFloat(item.qty) || 1);
                else if (field === 'qty') {
                    const total = parseFloat(item.line_total) || 0;
                    item.unit_price = numValue !== 0 ? total / numValue : 0;
                }
            }
        }
    } else {
      item[field] = value;
    }
    setEditData({ ...editData, items: newItems });
  };

  const getCalculatedTax = () => {
    if (!editData) return 0;
    const itemsTotal = editData.items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);
    const grandTotal = parseFloat(editData.total_amount) || 0;
    return grandTotal - itemsTotal;
  };

  if (!receipt || !editData) return null;

  return (
    <Modal show={show} onHide={onHide} centered size={isEditing ? "lg" : "md"} contentClassName="border-0 shadow rounded-4">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold text-primary">
          {isEditing ? 'Edit Purchase' : 'Receipt Details'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={isEditing ? "p-4" : "p-0"}>
        {/* ================= VIEW MODE ================= */}
        {!isEditing && (
          <div className="bg-surface-50 pb-4 rounded-bottom-4">
            <div className="mx-auto bg-surface shadow-sm" style={{ maxWidth: '90%', borderTop: '6px solid var(--nook-text)', borderBottom: '2px dashed #ccc' }}>
              <div className="text-center p-4 border-bottom">
                <h3 className="fw-bold text-uppercase mb-1" style={{letterSpacing: '1px'}}>{receipt.store_name}</h3>
                <div className="text-body-50 small">
                    {new Date(receipt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="p-4 pb-2">
                {receipt.items.map((item, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                        {item.qty > 1 && <StatusBadge variant="light" label={`${item.qty}x`} className="bg-surface-50 me-2 text-body-50 border" />}
                        <span className="fw-medium">{item.name}</span>
                    </div>
                    <span className="fw-bold text-currency">${(item.qty * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                 <div className="d-flex justify-content-between align-items-center border-top pt-2 text-body-50">
                    <span className="text-header-caps">Tax / Fees</span>
                    <span className="text-currency">${receipt.tax.toFixed(2)}</span>
                 </div>
              </div>
              <div className="p-3 d-flex justify-content-between bg-surface align-items-center" style={{backgroundColor: 'var(--nook-text)'}}>
                <span className="text-uppercase small fw-bold text-body-75" style={{letterSpacing:'2px'}}>Total</span>
                <span className="h3 mb-0 fw-bold text-body-75 text-currency">${receipt.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center mt-4 px-4">
              <div className="d-flex justify-content-center gap-2 mb-3">
                 {receipt.receipt && (
                    <Button variant="outline-secondary text-body" size="sm" onClick={() => setShowImage(!showImage)} className="rounded-pill px-3">
                        <i className={`bi ${showImage ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i> {showImage ? 'Hide Scan' : 'View Scan'}
                    </Button>
                 )}
                 <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="rounded-pill px-3">
                    <i className="bi bi-pencil-fill me-1"></i> Edit
                 </Button>
              </div>
              <Collapse in={showImage}>
                 <div className="mt-2">
                    <Card className="border-0 shadow-sm overflow-hidden rounded-3">
                       <Card.Body className="p-0 bg-dark">
                          <img src={receipt.receipt} alt="Receipt Scan" className="img-fluid" style={{opacity: 0.95}} />
                       </Card.Body>
                       <Card.Footer className="bg-surface text-body-50 small py-2">
                          <a href={receipt.receipt} target="_blank" rel="noreferrer" className="text-decoration-none fw-bold">Open Full Image</a>
                       </Card.Footer>
                    </Card>
                 </div>
              </Collapse>
            </div>
          </div>
        )}

        {/* ================= EDIT MODE ================= */}
        {isEditing && (
          <Form>
            <div className="row g-3 mb-4">
              <div className="col-md-7">
                <Form.Label className="text-header-caps">Store Name</Form.Label>
                <InputGroup>
                    {/* FIX: Changed bg-light to bg-body-secondary */}
                    <InputGroup.Text className="bg-surface border-end-0 text-body-50"><i className="bi bi-shop"></i></InputGroup.Text>
                    <Form.Control
                        type="text" value={editData.store_name}
                        onChange={e => setEditData({ ...editData, store_name: e.target.value })}
                        className="fw-bold border-start-0" disabled={isSaving}
                    />
                </InputGroup>
              </div>
              <div className="col-md-5">
                <Form.Label className="text-header-caps">Date</Form.Label>
                <Form.Control
                  type="date" value={new Date(editData.date).toISOString().split('T')[0]}
                  onChange={e => setEditData({ ...editData, date: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <Card className="border shadow-sm mb-4 rounded-3 overflow-hidden">
               {/* FIX: Changed bg-light to bg-body-secondary */}
               <Card.Header className="nook-surface border-bottom py-2">
                  <div className="row g-0 text-header-caps">
                      <div className="col-8 ps-2">Item</div>
                      <div className="col-1 text-center">Qty</div>
                      <div className="col-1 text-center">Unit</div>
                      <div className="col-2 text-end pe-2">Price</div>
                  </div>
               </Card.Header>
               <Card.Body className="p-0">
                  {editData.items.map((item, idx) => (
                    <div key={idx} className="row g-0 align-items-center border-bottom py-2 px-2 hover-bg-light">
                      <div className="col-8">
                        <Form.Control size="sm" type="text"
                          className="border-0 bg-transparent fw-medium shadow-none p-0 text-body"
                          value={item.name} placeholder="Item Name"
                          onChange={e => handleItemChange(idx, 'name', e.target.value)} disabled={isSaving}
                        />
                      </div>
                      <div className="col-1">
                        <Form.Control size="sm" type="number"
                          className="border-0 bg-transparent text-center shadow-none text-body-75 p-0"
                          value={item.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)} disabled={isSaving}
                        />
                      </div>
                      <div className="col-1">
                        <Form.Control size="sm" type="text"
                          className="border-0 bg-transparent text-center shadow-none text-body-75 p-0"
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)} disabled={isSaving}
                        />
                      </div>
                      <div className="col-2 text-end">
                          <div className="d-flex justify-content-end align-items-center">
                            <span className="text-body-75 small">$</span>
                            <Form.Control size="sm" type="number" step="0.01"
                                className="border-0 bg-transparent text-center shadow-none fw-bold text-currency p-0 text-body-75"
                                style={{maxWidth:'80px'}}
                                value={item.line_total}
                                onChange={e => handleItemChange(idx, 'line_total', e.target.value)} disabled={isSaving}
                            />
                          </div>
                      </div>
                    </div>
                  ))}
               </Card.Body>
               <Card.Footer className="bg-surface border-0 py-3">
                  <div className="d-flex justify-content-end align-items-center mb-2">
                    <span className="text-body-50 small me-3">Calculated Tax:</span>
                    <span className="text-body-50 text-currency">${getCalculatedTax().toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-end align-items-center">
                    <span className="text-header-caps me-3">Grand Total</span>
                    <InputGroup style={{ width: '140px' }} size="sm">
                        <InputGroup.Text className="bg-surface border fw-bold text-success">$</InputGroup.Text>
                        <Form.Control
                            type="number" inputMode="decimal" step="0.01"
                            className="border-start-0 fw-bold fs-6 text-center text-primary text-currency bg-transparent shadow-none"
                            value={editData.total_amount}
                            onChange={e => setEditData({ ...editData, total_amount: e.target.value })}
                            disabled={isSaving}
                        />
                    </InputGroup>
                  </div>
               </Card.Footer>
            </Card>

            <div className="mb-4">
                <Form.Label className="text-header-caps">Update Receipt Photo</Form.Label>
                <div className="position-relative">
                    <input
                        key={isEditing ? "edit-file" : "view-file"}
                        type="file" accept="image/*" capture="environment"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="position-absolute w-100 h-100 opacity-0"
                        style={{cursor: 'pointer', zIndex: 10}}
                        disabled={isSaving}
                    />
                    <div className={`p-4 rounded-3 border-2 bg-surface border text-center transition-all ${selectedFile ? 'bg-success-subtle border-success' : 'bg-body-secondary border-secondary-subtle'}`}>
                        {selectedFile ? (
                            <div className="text-success fw-bold"><i className="bi bi-check-circle-fill me-2"></i>{selectedFile.name}</div>
                        ) : (
                            <div className="text-body-50 opacity-75"><i className="bi bi-cloud-upload fs-3 d-block mb-1"></i><span className="small fw-bold">Click or drag image here</span></div>
                        )}
                    </div>
                </div>
            </div>

            {isSaving && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between text-body-50 small mb-1 px-1">
                        <span>{selectedFile ? 'Uploading Image & Saving...' : 'Saving Changes...'}</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <ProgressBar now={uploadProgress} variant={uploadProgress === 100 ? "success" : "primary"} animated={uploadProgress < 100} style={{height: '6px'}} />
                </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <Button variant="light" onClick={() => setIsEditing(false)} className="rounded-pill px-4" disabled={isSaving}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} className="px-4 fw-bold rounded-pill" disabled={isSaving}>
                {isSaving ? 'Processing...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
