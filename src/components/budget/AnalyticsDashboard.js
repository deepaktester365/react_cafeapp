import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, ButtonGroup, Button, Spinner, Form } from 'react-bootstrap';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { useApi } from '../../contexts/ApiProvider';
import WeeklyPulse from './WeeklyPulse';

const CATEGORY_COLORS = [
    '#0d6efd', '#20c997', '#ffc107', '#fd7e14', '#e83e8c',
    '#6f42c1', '#0dcaf0', '#198754', '#dc3545', '#6c757d',
    '#0a58ca', '#1aa179', '#cc9a06', '#ca6510', '#ba3170'
];

export default function AnalyticsDashboard() {
    const api = useApi();

    const [netWorthData, setNetWorthData] = useState([]);
    const [spendingData, setSpendingData] = useState([]);
    const [dataKeys, setDataKeys] = useState([]);
    const [hiddenCategories, setHiddenCategories] = useState({});

    const [isLoading, setIsLoading] = useState(true);

    const [timeframe, setTimeframe] = useState(6);
    const [stepSize, setStepSize] = useState('month');
    const [groupBy, setGroupBy] = useState('category');

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        setHiddenCategories(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    // --- Select/Deselect All Handlers ---
    const handleShowAll = () => setHiddenCategories({});
    const handleHideAll = () => {
        const allHidden = {};
        dataKeys.forEach(key => { allHidden[key] = true; });
        setHiddenCategories(allHidden);
    };

    const renderLegendText = (value) => {
        const isHidden = hiddenCategories[value];
        return (
            <span style={{
                color: isHidden ? '#adb5bd' : '#495057',
                textDecoration: isHidden ? 'line-through' : 'none',
                transition: 'all 0.2s ease'
            }}>
                {value}
            </span>
        );
    };

    useEffect(() => {
        setHiddenCategories({});
    }, [groupBy]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);

            const [nwRes, spendRes] = await Promise.all([
                api.get(`/budget/analytics/net-worth?months=${timeframe}&step=${stepSize}`),
                api.get(`/budget/analytics/spending?months=${timeframe}&step=${stepSize}&group_by=${groupBy}`)
            ]);

            if (nwRes.ok) setNetWorthData(nwRes.body.items || []);
            if (spendRes.ok) {
                setSpendingData(spendRes.body.items || []);
                setDataKeys(spendRes.body.categories || []);
            }

            setIsLoading(false);
        };
        fetchAnalytics();
    }, [api, timeframe, stepSize, groupBy]);

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

    const currentNetWorth = netWorthData.length > 0 ? netWorthData[netWorthData.length - 1].net_worth : 0;
    const startingNetWorth = netWorthData.length > 0 ? netWorthData[0].net_worth : 0;
    const netChange = currentNetWorth - startingNetWorth;
    const isPositive = netChange >= 0;

    const NetWorthTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-3 shadow-sm border">
                    <p className="text-muted small fw-bold text-uppercase mb-1">{label}</p>
                    <p className="fs-5 fw-bold text-dark mb-0">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    const SpendingTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const visiblePayload = payload.filter(entry => !hiddenCategories[entry.name]);
            const total = visiblePayload.reduce((sum, entry) => sum + entry.value, 0);

            return (
                <div className="bg-white p-3 rounded-3 shadow-sm border" style={{minWidth: '200px'}}>
                    <p className="text-muted small fw-bold text-uppercase mb-2 border-bottom pb-2">
                        {label} <span className="float-end text-dark">{formatCurrency(total)}</span>
                    </p>
                    {[...visiblePayload].sort((a, b) => b.value - a.value).map((entry, index) => (
                        <div key={index} className="d-flex justify-content-between small mb-1">
                            <span style={{ color: entry.color }} className="fw-medium text-truncate pe-3" style={{maxWidth: '180px'}}>
                                <i className="bi bi-circle-fill me-2 small"></i>{entry.name}
                            </span>
                            <span className="fw-bold">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // --- NEW: Smart Y-Axis Formatter ---
    const formatYAxis = (value) => {
        if (value === 0) return "$0";
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
        return `$${value}`;
    };

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-primary me-2"></i> Financial Analytics</h2>
                    <p className="text-muted mb-0">Track your net worth and spending trends.</p>
                </div>

                <div className="d-flex flex-wrap gap-2">
                    <Form.Select
                        size="sm"
                        className="fw-medium border shadow-sm"
                        style={{width: '130px'}}
                        value={stepSize}
                        onChange={e => setStepSize(e.target.value)}
                    >
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                    </Form.Select>

                    <ButtonGroup className="shadow-sm">
                        <Button variant={timeframe === 3 ? "primary" : "white"} size="sm" className="border fw-medium" onClick={() => setTimeframe(3)}>3m</Button>
                        <Button variant={timeframe === 6 ? "primary" : "white"} size="sm" className="border fw-medium" onClick={() => setTimeframe(6)}>6m</Button>
                        <Button variant={timeframe === 12 ? "primary" : "white"} size="sm" className="border fw-medium" onClick={() => setTimeframe(12)}>1y</Button>
                        <Button variant={timeframe === 36 ? "primary" : "white"} size="sm" className="border fw-medium" onClick={() => setTimeframe(36)}>3y</Button>
                        <Button variant={timeframe === 60 ? "primary" : "white"} size="sm" className="border fw-medium" onClick={() => setTimeframe(60)}>5y</Button>
                    </ButtonGroup>
                </div>
            </div>

            <WeeklyPulse />

            <Row className="g-4">
                {/* 1. NET WORTH CHART */}
                <Col xs={12}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Card.Body className="p-4 p-md-5">
                            <Row className="mb-5 align-items-end">
                                <Col md={6}>
                                    <h6 className="text-muted fw-bold text-uppercase letter-spacing-1 mb-2">Total Net Worth</h6>
                                    <h1 className="display-4 fw-bold text-dark mb-0">
                                        {isLoading ? <Spinner animation="grow" variant="primary" size="sm"/> : formatCurrency(currentNetWorth)}
                                    </h1>
                                </Col>
                                <Col md={6} className="text-md-end mt-3 mt-md-0">
                                    <div className="text-muted small fw-bold text-uppercase mb-1">Change</div>
                                    <div className={`fs-4 fw-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                                        {isPositive ? '+' : ''}{formatCurrency(netChange)}
                                        <i className={`bi ${isPositive ? 'bi-arrow-up-right' : 'bi-arrow-down-right'} ms-2`}></i>
                                    </div>
                                </Col>
                            </Row>

                            <div style={{ height: '350px', width: '100%' }}>
                                {isLoading ? (
                                    <div className="h-100 d-flex align-items-center justify-content-center"><Spinner animation="border" variant="primary" /></div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} dy={10} minTickGap={30} />
                                            {/* --- UPDATED: Net Worth YAxis --- */}
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} tickFormatter={formatYAxis} width={65} dx={-10} />
                                            <Tooltip content={<NetWorthTooltip />} />
                                            <Area type="monotone" dataKey="net_worth" stroke="#0d6efd" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" animationDuration={1500} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. SPENDING CHART */}
                <Col xs={12}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Card.Body className="p-4 p-md-5">

                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end mb-4">
                                <div>
                                    <h5 className="fw-bold mb-2 mb-sm-0 d-flex align-items-center gap-3">
                                        Spending Breakdown
                                        <div className="fw-normal small mt-1">
                                            <Button variant="link" className="text-decoration-none p-0 text-primary small fw-medium me-2" onClick={handleShowAll}>Show All</Button>
                                            <span className="text-muted opacity-50 me-2">|</span>
                                            <Button variant="link" className="text-decoration-none p-0 text-muted small" onClick={handleHideAll}>Hide All</Button>
                                        </div>
                                    </h5>
                                </div>
                                <div className="d-flex align-items-center gap-2 bg-light p-1 rounded-3 border shadow-sm mt-3 mt-sm-0">
                                    <Button size="sm" variant={groupBy === 'category' ? 'white' : 'transparent'} className={`rounded-2 fw-medium border-0 ${groupBy === 'category' ? 'shadow-sm' : 'text-muted'}`} onClick={() => setGroupBy('category')}>Category</Button>
                                    <Button size="sm" variant={groupBy === 'bucket' ? 'white' : 'transparent'} className={`rounded-2 fw-medium border-0 ${groupBy === 'bucket' ? 'shadow-sm' : 'text-muted'}`} onClick={() => setGroupBy('bucket')}>Bucket</Button>
                                    <Button size="sm" variant={groupBy === 'vendor' ? 'white' : 'transparent'} className={`rounded-2 fw-medium border-0 ${groupBy === 'vendor' ? 'shadow-sm' : 'text-muted'}`} onClick={() => setGroupBy('vendor')}>Vendor</Button>
                                </div>
                            </div>

                            <div style={{ height: '500px', width: '100%' }}>
                                {isLoading ? (
                                    <div className="h-100 d-flex align-items-center justify-content-center"><Spinner animation="border" variant="primary" /></div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={spendingData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />

                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} dy={10} minTickGap={30}/>
                                            {/* --- UPDATED: Spending YAxis --- */}
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} tickFormatter={formatYAxis} width={65} dx={-10} />
                                            <Tooltip content={<SpendingTooltip />} cursor={{fill: 'rgba(0,0,0,0.04)'}} />

                                            <Legend
                                                wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem', cursor: 'pointer' }}
                                                onClick={handleLegendClick}
                                                formatter={renderLegendText}
                                            />

                                            {dataKeys.map((key, idx) => (
                                                <Bar
                                                    key={key}
                                                    dataKey={key}
                                                    stackId="a"
                                                    fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                                                    radius={idx === dataKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                                    animationDuration={1500}
                                                    hide={hiddenCategories[key] === true}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
