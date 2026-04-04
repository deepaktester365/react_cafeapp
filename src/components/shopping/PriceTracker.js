import { useState, useEffect } from 'react';
import { Container, Card, Form, InputGroup, Badge, Row, Col, Button } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { decimalToFraction } from '../../utils/mathUtils';

export default function PriceTracker() {
    const api = useApi();

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Data State
    const [activeItem, setActiveItem] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch suggestions from our Master Dictionary when typing
    useEffect(() => {
        if (searchQuery.length > 1 && !activeItem) {
            const delayDebounce = setTimeout(async () => {
                const res = await api.get('/shopping/dictionary');
                if (res.ok) {
                    const lowerQ = searchQuery.toLowerCase();
                    const filtered = res.body.filter(item => item.name.toLowerCase().includes(lowerQ));
                    setSuggestions(filtered.slice(0, 5)); // Show top 5 matches
                }
            }, 300);
            return () => clearTimeout(delayDebounce);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, activeItem, api]);

    // 2. Fetch price history when an item is selected
    const fetchPriceHistory = async (itemName) => {
        setSearchQuery(itemName);
        setActiveItem(itemName);
        setSuggestions([]);
        setIsLoading(true);

        const res = await api.get(`/shopping/price-tracker?name=${encodeURIComponent(itemName)}`);
        if (res.ok) {
            setHistoryData(res.body);
        } else {
            setHistoryData(null);
        }
        setIsLoading(false);
    };

    const handleClear = () => {
        setSearchQuery('');
        setActiveItem(null);
        setHistoryData(null);
    };

    // Helper to format currency
    const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <Container className="py-4 max-w-800">
            <div className="text-center mb-5">
                <h2 className="fw-bold"><i className="bi bi-graph-up-arrow text-success me-2"></i>Price Tracker</h2>
                <p className="text-muted">Find the cheapest store for your groceries.</p>
            </div>

            {/* --- THE SMART SEARCH BAR --- */}
            <div className="position-relative mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                <InputGroup size="lg" className="shadow-sm rounded-pill overflow-hidden border">
                    <InputGroup.Text className="bg-white border-0 ps-4 text-muted"><i className="bi bi-search"></i></InputGroup.Text>
                    <Form.Control
                        className="border-0 shadow-none bg-white py-3 fw-medium"
                        placeholder="Search for an ingredient (e.g., Olive Oil)"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (activeItem) setActiveItem(null); // Reset active item if they start typing again
                        }}
                    />
                    {searchQuery && (
                        <Button variant="white" className="border-0 pe-4 text-muted hover-dark" onClick={handleClear}>
                            <i className="bi bi-x-circle-fill"></i>
                        </Button>
                    )}
                </InputGroup>

                {/* Autocomplete Dropdown */}
                {suggestions.length > 0 && !activeItem && (
                    <Card className="position-absolute w-100 mt-2 shadow-lg border-0 rounded-4 z-3 animation-fade-in overflow-hidden">
                        {suggestions.map((sug, idx) => (
                            <div
                                key={idx}
                                className="p-3 border-bottom cursor-pointer hover-bg-light transition-all d-flex justify-content-between align-items-center"
                                onClick={() => fetchPriceHistory(sug.name)}
                            >
                                <span className="fw-bold text-dark">{sug.name}</span>
                                <Badge bg="light" text="muted" className="rounded-pill border">{sug.count} purchases</Badge>
                            </div>
                        ))}
                    </Card>
                )}
            </div>

            {/* --- THE RESULTS DASHBOARD --- */}
            {isLoading && <div className="text-center py-5"><div className="spinner-border text-success"></div></div>}

            {!isLoading && historyData && historyData.leaderboard.length === 0 && (
                <div className="text-center py-5 text-muted fst-italic bg-light rounded-4">No price history found for "{activeItem}".</div>
            )}

            {!isLoading && historyData && historyData.leaderboard.length > 0 && (
                <div className="animation-slide-up">
                    <Row className="g-4 mb-5">
                        <Col md={12}>
                            <h5 className="fw-bold text-success mb-3 text-header-caps"><i className="bi bi-trophy-fill me-2"></i>Store Leaderboard</h5>
                            <Row className="g-3">
                                {historyData.leaderboard.map((store, idx) => {
                                    const isWinner = idx === 0;
                                    return (
                                        <Col sm={6} md={4} key={idx}>
                                            <Card className={`h-100 border-0 shadow-sm rounded-4 ${isWinner ? 'bg-success-subtle border-success' : 'bg-white'}`}>
                                                <Card.Body className="p-4 text-center">
                                                    {isWinner && <Badge bg="success" className="position-absolute top-0 start-50 translate-middle rounded-pill shadow-sm px-3 py-2">Cheapest</Badge>}
                                                    <h5 className={`fw-bold mt-2 ${isWinner ? 'text-success' : 'text-dark'}`}>{store.store}</h5>
                                                    <div className="display-6 fw-bold my-2" style={{ letterSpacing: '-1px' }}>
                                                        {formatMoney(store.normalized_price)}
                                                    </div>
                                                    <div className="text-muted small fw-bold text-header-caps">per {store.base_unit}</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Col>
                    </Row>

                    <h5 className="fw-bold text-muted mb-3 text-header-caps"><i className="bi bi-clock-history me-2"></i>Purchase History</h5>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                        {historyData.history.map((hist, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white hover-light transition-all">
                                <div>
                                    <div className="fw-bold text-dark fs-5">{formatMoney(hist.raw_total_price)} <span className="text-muted fs-6 fw-normal">at {hist.store}</span></div>
                                    <div className="text-muted small">
                                        {new Date(hist.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2 mb-1 fs-6">
                                        {decimalToFraction(hist.raw_qty)} {hist.raw_unit}
                                    </Badge>
                                    <div className="small fw-bold text-muted text-header-caps">
                                        {formatMoney(hist.normalized_price)} / {hist.base_unit}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>
            )}
        </Container>
    );
}
