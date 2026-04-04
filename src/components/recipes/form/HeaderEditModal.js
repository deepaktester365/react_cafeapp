import { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form, Badge } from 'react-bootstrap';

export default function HeaderEditModal({ show, onHide, onSave, initialBasicInfo, initialTags, initialMainImage, existingImageUrl }) {

    // Use local state so if the user clicks "Cancel", we don't overwrite the master form's state
    const [basicInfo, setBasicInfo] = useState({});
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [mainImage, setMainImage] = useState(null);

    useEffect(() => {
        if (show) {
            setBasicInfo({ ...initialBasicInfo });
            setTags([...initialTags]);
            setMainImage(initialMainImage);
            setTagInput('');
        }
    }, [show, initialBasicInfo, initialTags, initialMainImage]);

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) setTags([...tags, val]);
            setTagInput('');
        }
    };

    const handleSave = () => {
        if (!basicInfo.name.trim()) return alert("Recipe needs a name!");
        onSave({ basicInfo, tags, mainImage });
    };

    if (!show) return null;

    // Determine what image to show in the preview
    const previewUrl = mainImage ? URL.createObjectURL(mainImage) : existingImageUrl;

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" contentClassName="border-0 shadow-lg rounded-4">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fs-5 fw-bold">Edit Recipe Details</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Row className="g-3">
                    <Col md={12}>
                        <Form.Control size="lg" className="fw-bold" value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})} placeholder="Recipe Title (e.g., Mom's Lasagna)" />
                    </Col>
                    <Col md={12}>
                        <Form.Control as="textarea" rows={2} value={basicInfo.description} onChange={e => setBasicInfo({...basicInfo, description: e.target.value})} placeholder="Add a description or story behind this recipe..." />
                    </Col>
                    <Col sm={3}>
                        <Form.Label className="text-header-caps small text-muted mb-1">Servings</Form.Label>
                        <Form.Control type="number" size="sm" value={basicInfo.servings} onChange={e => setBasicInfo({...basicInfo, servings: e.target.value})} />
                    </Col>
                    <Col sm={3}>
                        <Form.Label className="text-header-caps small text-muted mb-1">Prep (min)</Form.Label>
                        <Form.Control type="number" size="sm" value={basicInfo.prep_time} onChange={e => setBasicInfo({...basicInfo, prep_time: e.target.value})} />
                    </Col>
                    <Col sm={3}>
                        <Form.Label className="text-header-caps small text-muted mb-1">Cook (min)</Form.Label>
                        <Form.Control type="number" size="sm" value={basicInfo.cook_time} onChange={e => setBasicInfo({...basicInfo, cook_time: e.target.value})} />
                    </Col>
                    <Col sm={3}>
                        <Form.Label className="text-header-caps small text-muted mb-1">Author</Form.Label>
                        <Form.Control size="sm" value={basicInfo.author} onChange={e => setBasicInfo({...basicInfo, author: e.target.value})} placeholder="Source/Author" />
                    </Col>
                </Row>

                <div className="bg-surface-50 p-3 rounded-4 border mt-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label className="fw-bold small mb-2">Cover Photo</Form.Label>
                            {previewUrl && (
                                <div className="mb-2 rounded-3 overflow-hidden border shadow-sm" style={{ height: '120px', width: '100%', backgroundColor: 'var(--nook-surface-50)' }}>
                                    <img src={previewUrl} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                </div>
                            )}
                            <Form.Control type="file" size="sm" accept="image/*" onChange={e => setMainImage(e.target.files[0])} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="fw-bold small mb-2">Tags</Form.Label>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <Badge bg="primary-subtle" text="primary" key={tag} className="rounded-pill fw-normal">
                                        {tag} <i className="bi bi-x ms-1" style={{cursor:'pointer'}} onClick={() => setTags(tags.filter(t => t !== tag))}></i>
                                    </Badge>
                                ))}
                            </div>
                            <Form.Control size="sm" placeholder="Type tag and press Enter" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                        </Col>
                    </Row>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" className="rounded-pill px-4 fw-bold" onClick={onHide}>Cancel</Button>
                <Button variant="primary" className="rounded-pill px-4 fw-bold" onClick={handleSave}>Save Details</Button>
            </Modal.Footer>
        </Modal>
    );
}
