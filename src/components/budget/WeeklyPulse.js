import { useState, useEffect } from 'react';
import { Card, ProgressBar, Row, Col, Spinner, Button } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import BucketDrilldownModal from './BucketDrilldownModal';

export default function WeeklyPulse() {
    const api = useApi();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    const [pulseData, setPulseData] = useState({
        totalBudget: 0,
        totalSpent: 0,
        buckets: []
    });

    // Modal State
    const [selectedBucket, setSelectedBucket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const now = new Date();
    const isCurrentMonth = selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
    const isFutureMonth = selectedDate > now && !isCurrentMonth;

    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

    let currentDayDisplay = daysInMonth;
    let timePacePercent = 100;

    if (isCurrentMonth) {
        currentDayDisplay = now.getDate();
        timePacePercent = (currentDayDisplay / daysInMonth) * 100;
    } else if (isFutureMonth) {
        currentDayDisplay = 0;
        timePacePercent = 0;
    }

    const getPeriodName = (dateObj) => {
        return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const changeMonth = (offset) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    useEffect(() => {
        const fetchMonthData = async () => {
            setIsLoading(true);

            const periodName = getPeriodName(selectedDate);
            const res = await api.get(`/budget/month/${periodName}`);

            if (res.ok) {
                let totalGoal = 0;
                let totalOutflow = 0;
                let allBuckets = [];

                const categories = res.body.categories || [];

                categories.forEach(cat => {
                    cat.buckets.forEach(bucket => {
                        // 1. ENGINE RULE: Determine Bucket Type
                        const type = bucket.goal_setter?.frequency || 'Monthly Need';

                        // Ignore Wealth Transfers completely (they belong on the Net Worth chart)
                        if (type === 'Wealth Transfer') return;

                        // 2. EXTRACT DATA (No Math.abs() so refunds reduce spending!)
                        const spent = parseFloat(bucket.activity || 0);
                        const assigned = parseFloat(bucket.assigned || 0);
                        const rawBlueprintGoal = parseFloat(bucket.goal_setter?.amount || bucket.goal || 0);

                        // Ignore Target Balances UNLESS money was actually spent from them
                        if (type === 'Target Balance' && spent === 0) return;

                        // 3. NORMALIZE GOALS & APPLY ENVELOPE RULES
                        let monthlyFundingTarget = assigned > 0 ? assigned : rawBlueprintGoal;
                        let barVisualCap = monthlyFundingTarget;
                        let isDanger = false;
                        let currentBurnRate = 0;

                        if (type === 'Sinking Fund') {
                            // Annual funds are budgeted monthly
                            monthlyFundingTarget = assigned > 0 ? assigned : (rawBlueprintGoal / 12);

                            // Envelope Rule UI Trick:
                            // If you drop a lump sum, scale the visual progress bar against
                            // the master Annual target so it doesn't scream Over Budget prematurely.
                            // --- THE FIX: Hardcap this at the Annual Target so true overspending turns red! ---
                            if (spent > monthlyFundingTarget) {
                                barVisualCap = rawBlueprintGoal;
                            } else {
                                barVisualCap = monthlyFundingTarget;
                            }
                        } else if (type === 'Weekly') {
                            // Normalize weekly to the length of this specific month
                            monthlyFundingTarget = assigned > 0 ? assigned : rawBlueprintGoal * (daysInMonth / 7);
                            barVisualCap = monthlyFundingTarget;
                        } else if (type === 'Target Balance') {
                            // Target balances scale the visual against the master cap
                            barVisualCap = rawBlueprintGoal > 0 ? rawBlueprintGoal : Math.max(spent, 100);
                        }

                        // 4. CALCULATE BURN RATE
                        if (monthlyFundingTarget > 0 || spent !== 0) {
                            if (barVisualCap > 0) {
                                currentBurnRate = (spent / barVisualCap) * 100;
                            } else if (spent > 0) {
                                currentBurnRate = 100;
                            } else if (spent < 0) {
                                currentBurnRate = 0;
                            }

                            // Danger Rule: You are only red if you exceed the VISUAL cap
                            // (which is the annual limit for Sinking Funds, or monthly limit for Monthly Needs)
                            isDanger = spent > barVisualCap;

                            totalGoal += monthlyFundingTarget;
                            totalOutflow += spent;

                            allBuckets.push({
                                id: bucket.id,
                                name: bucket.name,
                                type: type,
                                goal: monthlyFundingTarget,
                                masterGoal: rawBlueprintGoal,
                                visualGoal: barVisualCap,
                                spent: spent,
                                burnRate: currentBurnRate,
                                isDanger: isDanger,
                                categoryName: cat.name,
                                isLoan: bucket.is_loan,
                                totalDebt: bucket.total_debt,
                                remainingDebt: bucket.remaining_debt,
                                totalPaid: bucket.total_paid
                            });
                        }
                    });
                });

                // Sort: Danger first, then highest burn rate
                const sortedBuckets = allBuckets.sort((a, b) => {
                    if (a.isDanger && !b.isDanger) return -1;
                    if (!a.isDanger && b.isDanger) return 1;
                    return b.burnRate - a.burnRate;
                });

                setPulseData({
                    totalBudget: totalGoal > 0 ? totalGoal : parseFloat(res.body.totals.budgeted || 0),
                    totalSpent: parseFloat(res.body.totals.activity || 0), // Use net activity directly
                    buckets: sortedBuckets
                });
            } else {
                setPulseData({ totalBudget: 0, totalSpent: 0, buckets: [] });
            }
            setIsLoading(false);
        };

        fetchMonthData();
        // Added refreshTrigger so edits in the modal instantly update the UI
    }, [api, selectedDate, timePacePercent, refreshTrigger]);

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

    const budgetPacePercent = pulseData.totalBudget > 0 ? (pulseData.totalSpent / pulseData.totalBudget) * 100 : 0;
    const isBudgetSafe = budgetPacePercent <= timePacePercent;

    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-primary text-white">
            <Card.Body className="p-4 p-md-5">
                <Row className="g-4 align-items-center">

                    {/* LEFT SIDE: Macro Pacing */}
                    <Col lg={6} className="border-end-lg border-white border-opacity-25 pe-lg-5">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white bg-opacity-25 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{width: '56px', height: '56px'}}>
                                    <i className={isCurrentMonth ? "bi bi-heart-pulse fs-3" : "bi bi-clock-history fs-3"}></i>
                                </div>
                                <div>
                                    <h4 className="fw-bold mb-0">
                                        {isCurrentMonth ? "Weekly Tactical Pulse" : "Monthly Retrospective"}
                                    </h4>
                                    <p className="text-white text-opacity-75 mb-0 small">
                                        {isCurrentMonth ? "Month-to-Date Pacing & Alerts" : "Final Budget Analysis"}
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 p-1 rounded-pill border border-white border-opacity-25 shadow-sm mt-2 mt-sm-0">
                                <Button variant="link" className="text-white p-0 px-2 text-decoration-none" onClick={() => changeMonth(-1)}>
                                    <i className="bi bi-chevron-left fw-bold"></i>
                                </Button>
                                <span className="fw-bold small px-2 text-uppercase letter-spacing-1" style={{minWidth: '80px', textAlign: 'center'}}>
                                    {selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                                <Button variant="link" className="text-white p-0 px-2 text-decoration-none" onClick={() => changeMonth(1)}>
                                    <i className="bi bi-chevron-right fw-bold"></i>
                                </Button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="py-4 text-center"><Spinner animation="border" variant="light" /></div>
                        ) : (
                            <>
                                {/* Time Progress */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1 small fw-bold text-uppercase letter-spacing-1 text-white text-opacity-75">
                                        <span>Calendar Pace</span>
                                        <span>{isCurrentMonth ? `Day ${currentDayDisplay} of ${daysInMonth}` : '100% Complete'}</span>
                                    </div>
                                    <ProgressBar
                                        now={timePacePercent}
                                        className="bg-white bg-opacity-25 rounded-pill"
                                        style={{height: '10px'}}
                                        variant="info"
                                    />
                                </div>

                                {/* Budget Progress */}
                                <div>
                                    <div className="d-flex justify-content-between mb-1 small fw-bold text-uppercase letter-spacing-1 text-white text-opacity-75">
                                        <span>Budget Burn Rate</span>
                                        <span>{budgetPacePercent.toFixed(1)}% Spent</span>
                                    </div>
                                    <ProgressBar
                                        now={budgetPacePercent}
                                        className="bg-white bg-opacity-25 rounded-pill"
                                        style={{height: '10px'}}
                                        variant={isBudgetSafe ? "success" : "warning"}
                                    />
                                    <div className="mt-2 small text-white text-opacity-75">
                                        {formatCurrency(pulseData.totalSpent)} spent of {formatCurrency(pulseData.totalBudget)}
                                    </div>
                                </div>
                            </>
                        )}
                    </Col>

                    {/* RIGHT SIDE: Ranked Buckets */}
                    <Col lg={6} className="ps-lg-5">
                        <h6 className="fw-bold text-uppercase letter-spacing-1 mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-list-task text-white opacity-75"></i>
                            Bucket Pacing Ranked
                        </h6>

                        {isLoading ? (
                            <div className="py-4 text-center"><Spinner animation="grow" variant="light" size="sm" /></div>
                        ) : pulseData.totalBudget === 0 && pulseData.totalSpent === 0 ? (
                            <div className="bg-white bg-opacity-10 rounded-4 p-4 text-center text-white text-opacity-75 fst-italic">
                                No budget or spending data found for this month.
                            </div>
                        ) : pulseData.buckets.length === 0 ? (
                            <div className="bg-white bg-opacity-10 rounded-4 p-4 text-center">
                                <i className="bi bi-check-circle fs-2 text-success mb-2"></i>
                                <p className="mb-0 fw-medium">No active buckets to display.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3 pe-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {pulseData.buckets.map((bucket, idx) => {

                                    // Visual Rules Engine
                                    let barVariant = "success";
                                    if (bucket.isDanger) {
                                        barVariant = "danger";
                                    } else if (
                                        // ONLY warn on time pacing if it is a standard Monthly Need.
                                        bucket.type === 'Monthly Need' &&
                                        bucket.burnRate > timePacePercent &&
                                        isCurrentMonth
                                    ) {
                                        barVariant = "warning";
                                    }

                                    // --- NEW: Is this money coming IN (saving) or OUT (spending)? ---
                                    const isDeposit = bucket.spent < 0;
                                    const displayAmount = Math.abs(bucket.spent);

                                    return (
                                        <div
                                            key={idx}
                                            className="bg-white text-dark p-3 rounded-3 shadow-sm flex-shrink-0"
                                            style={{ cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid transparent' }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#0d6efd'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                            onClick={() => {
                                                setSelectedBucket(bucket);
                                                setShowModal(true);
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center gap-2 text-truncate pe-2">
                                                    <span className="fw-bold">{bucket.name}</span>

                                                    {/* SMART BADGES */}
                                                    {bucket.type === 'Sinking Fund' && <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25" style={{fontSize: '0.65rem'}}>ANNUAL</span>}

                                                    {bucket.type === 'Target Balance' && (
                                                        isDeposit
                                                            ? <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{fontSize: '0.65rem'}}><i className="bi bi-arrow-down-left me-1"></i>FUNDED</span>
                                                            : <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25" style={{fontSize: '0.65rem'}}><i className="bi bi-arrow-up-right me-1"></i>SPENT</span>
                                                    )}
                                                </div>

                                                {/* SMART MATH TEXT */}
                                                <span className="small fw-bold flex-shrink-0">
                                                    {isDeposit ? (
                                                        <span className="text-success">+{formatCurrency(displayAmount)} Added</span>
                                                    ) : (
                                                        <span>
                                                            {formatCurrency(displayAmount)} <span className="text-muted fw-normal">/ {formatCurrency(bucket.visualGoal)}</span>
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            {/* Progress Bar (Faded if you are depositing, since burn rate is basically 0%) */}
                                            <ProgressBar
                                                now={bucket.burnRate > 100 ? 100 : bucket.burnRate}
                                                variant={isDeposit ? "success" : barVariant}
                                                style={{height: '6px', opacity: isDeposit ? 0.3 : 1}}
                                            />

                                            {bucket.isDanger && !isDeposit && (
                                                <div className="mt-1 small text-danger fw-bold text-end">
                                                    Over by {formatCurrency(bucket.spent - bucket.visualGoal)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Col>
                </Row>
            </Card.Body>

            <BucketDrilldownModal
                show={showModal}
                onHide={() => setShowModal(false)}
                bucket={selectedBucket}
                periodName={getPeriodName(selectedDate)}
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            />

        </Card>
    );
}
