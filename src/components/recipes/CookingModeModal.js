import { useState, useEffect, useRef } from 'react';
import { Modal, Button, ProgressBar, Row, Col, Badge } from 'react-bootstrap';
import { decimalToFraction } from '../../utils/mathUtils';

// --- HELPER: TIME FORMATTER ---
const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- HELPER: WEB AUDIO CHIME ---
const playTimerChime = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const playBeep = (startTime) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, startTime); // A5 note
            gain.gain.setValueAtTime(1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
            osc.start(startTime);
            osc.stop(startTime + 0.5);
        };

        playBeep(ctx.currentTime);
        playBeep(ctx.currentTime + 0.2); // Double beep!
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export default function CookingModeModal({ show, onHide, recipe }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [checkedItems, setCheckedItems] = useState(new Set());

    // --- TIMER STATE ---
    const [activeTimers, setActiveTimers] = useState([]);
    const activeTimersRef = useRef(activeTimers); // Keep a ref for the interval closure

    useEffect(() => {
        activeTimersRef.current = activeTimers;
    }, [activeTimers]);

    // --- THE TICKER ENGINE (NOW WITH LOOPING) ---
    useEffect(() => {
        if (!show) return;
        let tickCount = 0;

        const interval = setInterval(() => {
            tickCount++;

            setActiveTimers(prev => {
                let chimePlayed = false;

                return prev.map(t => {
                    // 1. Counting down
                    if (t.isRunning && t.remaining > 0) {
                        const nextRemaining = t.remaining - 1;
                        if (nextRemaining === 0) {
                            if (!chimePlayed) {
                                playTimerChime();
                                chimePlayed = true;
                            }
                            return { ...t, remaining: 0, isRunning: false, isRinging: true };
                        }
                        return { ...t, remaining: nextRemaining };
                    }

                    // 2. Looping Alarm
                    if (t.isRinging && tickCount % 3 === 0) {
                        if (!chimePlayed) {
                            playTimerChime();
                            chimePlayed = true;
                        }
                    }

                    return t;
                });
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [show]);

    if (!show || !recipe) return null;

    const totalPages = (recipe.steps?.length || 0) + 1;
    const progress = (currentIndex / (totalPages - 1)) * 100;

    const toggleCheck = (id) => {
        const next = new Set(checkedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCheckedItems(next);
    };

    const handleNext = () => { if (currentIndex < totalPages - 1) setCurrentIndex(prev => prev + 1); };
    const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

    const getIngredientDetails = (id) => recipe.ingredients?.find(ing => ing.id === id);
    const getEquipmentDetails = (id) => recipe.equipment?.find(eq => eq.id === id);
    const getComponentDetails = (id) => {
        for (const step of (recipe.steps || [])) {
            const out = (step.outputs || []).find(o => o.id === id);
            if (out) return out;
        }
        return null;
    };

    // --- SMART PARSER ---
    const extractTimeSuggestions = (text) => {
        if (!text) return [];
        // Looks for: 15 mins, 2 hours, 30 secs, 1.5 hrs
        const regex = /(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|minute|minutes|min|mins|second|seconds|sec|secs)\b/gi;
        const matches = [...text.matchAll(regex)];

        return matches.map(match => {
            const val = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            let secs = 0;
            if (unit.startsWith('h')) secs = val * 3600;
            else if (unit.startsWith('m')) secs = val * 60;
            else if (unit.startsWith('s')) secs = val;

            return { label: match[0], totalSeconds: secs };
        });
    };

    const startNewTimer = (label, totalSeconds) => {
        const newTimer = {
            id: `timer_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            label,
            totalSeconds,
            remaining: totalSeconds,
            isRunning: true,
            isRinging: false, // Add this!
            stepIndex: currentIndex
        };
        setActiveTimers(prev => [...prev, newTimer]);
    };

    const toggleTimer = (id) => {
        setActiveTimers(prev => prev.map(t => {
            if (t.id === id) {
                if (t.isRinging) return { ...t, isRinging: false }; // Stop the alarm loop!
                if (t.remaining === 0) return { ...t, remaining: t.totalSeconds, isRunning: true }; // Restart
                return { ...t, isRunning: !t.isRunning }; // Pause/Play
            }
            return t;
        }));
    };

    const dismissTimer = (id) => {
        setActiveTimers(prev => prev.filter(t => t.id !== id));
    };

    // --- GLOBAL FLOATING TIMERS UI ---
    const renderGlobalTimers = () => {
        if (activeTimers.length === 0) return null;
        return (
            <div className="d-flex flex-wrap gap-2 px-4 px-md-5 pt-3 justify-content-center">
                {activeTimers.map(t => {
                    const isDone = t.remaining === 0;
                    return (
                        <div key={t.id} className={`d-flex align-items-center rounded-pill shadow-sm border px-3 py-1 transition-all ${t.isRinging ? 'bg-danger text-white border-danger animate-pulse' : (isDone ? 'bg-light border-secondary text-muted' : 'bg-white border-primary-subtle')}`}>
                            <div className="fw-bold me-2" style={{fontVariantNumeric: 'tabular-nums'}}>
                                {formatTime(t.remaining)}
                            </div>
                            <div className={`small me-3 ${t.isRinging ? 'text-white-50' : 'text-muted'}`}>{t.label}</div>

                            <i className={`bi cursor-pointer me-2 fs-5 ${t.isRinging ? 'bi-stop-circle-fill text-white' : (t.isRunning ? 'bi-pause-circle' : (isDone ? 'bi-arrow-clockwise' : 'bi-play-circle'))}`}
                               onClick={() => toggleTimer(t.id)} title={t.isRinging ? "Stop Alarm" : (isDone ? "Restart" : "Play/Pause")}></i>
                            <i className="bi bi-x-circle cursor-pointer fs-5 opacity-75 hover-opacity-100"
                               onClick={() => dismissTimer(t.id)} title="Dismiss"></i>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- PAGE 0: MISE EN PLACE ---
    const renderMiseEnPlace = () => (
        <div className="animation-fade-in py-3">
            <div className="text-center mb-5 mx-auto" style={{ maxWidth: '800px' }}>
                {recipe.image_url && (
                    <img src={recipe.image_url} alt={recipe.name} className="img-fluid rounded-4 shadow-sm border mb-4" style={{ maxHeight: '250px', objectFit: 'cover', width: '100%' }} />
                )}
                <h2 className="fw-bold display-6 mb-2">Mise en Place</h2>
                <p className="text-muted fs-5 mb-1">Gather your ingredients and tools before you begin.</p>
                <p className="text-primary fw-medium small text-header-caps"><i className="bi bi-hand-index-thumb me-1"></i> Tap items to check them off</p>
            </div>

            <Row className="g-4 justify-content-center mx-auto" style={{ maxWidth: '1000px' }}>
                {/* Ingredients Checklist */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <Col md={6}>
                        <div className="bg-surface rounded-4 p-4 shadow-sm border h-100">
                            <h6 className="fw-bold mb-3 d-flex align-items-center text-primary text-header-caps">
                                <i className="bi bi-basket me-2"></i> Ingredients to Gather
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                {recipe.ingredients.map(ing => {
                                    const isChecked = checkedItems.has(`ing_${ing.id}`);
                                    return (
                                        <div key={`ing_${ing.id}`} className={`d-flex justify-content-between align-items-center p-2 rounded-3 border transition-all cursor-pointer ${isChecked ? 'bg-light border-light opacity-50 text-muted' : 'bg-primary-subtle border-primary-subtle text-primary hover-shadow-sm'}`} onClick={() => toggleCheck(`ing_${ing.id}`)}>
                                            <div className="d-flex align-items-center">
                                                <div className={`rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm transition-all ${isChecked ? 'bg-secondary text-white' : 'bg-white'}`} style={{width: '36px', height: '36px'}}>
                                                    <i className={`bi ${isChecked ? 'bi-check-lg' : 'bi-basket'}`}></i>
                                                </div>
                                                <span className={`fw-bold me-2 ${isChecked ? 'text-decoration-line-through' : ''}`} style={{minWidth: '70px'}}>
                                                    {ing.quantity ? decimalToFraction(ing.quantity) : ''} {ing.unit === 'Other' ? ing.custom_unit : ing.unit}
                                                </span>
                                                <span className={`fw-medium ${isChecked ? 'text-decoration-line-through' : ''}`}>{ing.name}</span>
                                            </div>
                                            <i className={`bi fs-5 ms-2 transition-all ${isChecked ? 'bi-check-circle-fill text-secondary' : 'bi-circle text-primary opacity-50'}`}></i>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                )}

                {/* Equipment Checklist */}
                {recipe.equipment && recipe.equipment.length > 0 && (
                    <Col md={6}>
                        <div className="bg-surface rounded-4 p-4 shadow-sm border h-100">
                            <h6 className="fw-bold mb-3 d-flex align-items-center text-secondary text-header-caps">
                                <i className="bi bi-tools me-2"></i> Tools to Gather
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                {recipe.equipment.map(eq => {
                                    const isChecked = checkedItems.has(`eq_${eq.id}`);
                                    return (
                                        <div key={`eq_${eq.id}`} className={`d-flex justify-content-between align-items-center p-2 rounded-3 border transition-all cursor-pointer ${isChecked ? 'bg-light border-light opacity-50 text-muted' : 'bg-light border text-secondary hover-shadow-sm'}`} onClick={() => toggleCheck(`eq_${eq.id}`)}>
                                            <div className="d-flex align-items-center">
                                                <div className={`rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm transition-all ${isChecked ? 'bg-secondary text-white' : 'bg-white'}`} style={{width: '36px', height: '36px'}}>
                                                    <i className={`bi ${isChecked ? 'bi-check-lg' : 'bi-tools'}`}></i>
                                                </div>
                                                <span className="me-2" style={{minWidth: '70px'}}></span>
                                                <span className={`fw-medium ${isChecked ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{eq.name}</span>
                                            </div>
                                            <i className={`bi fs-5 ms-2 transition-all ${isChecked ? 'bi-check-circle-fill text-secondary' : 'bi-circle text-secondary opacity-50'}`}></i>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                )}
            </Row>
        </div>
    );

    // --- ACTUAL COOKING STEPS ---
    const renderStep = () => {
        const currentStep = recipe.steps[currentIndex - 1];
        if (!currentStep) return null;

        const hasInputs = currentStep.links && currentStep.links.length > 0;
        const hasOutputs = currentStep.outputs && currentStep.outputs.length > 0;

        // Let the Smart Parser find times!
        const suggestions = extractTimeSuggestions(currentStep.instruction);

        return (
            <div className="animation-fade-in pb-5">
                {/* --- TOP: TYPOGRAPHY UPGRADE --- */}
                <div className="mb-4 mx-auto" style={{ maxWidth: '800px' }}>
                    <div className="d-flex justify-content-center mb-4">
                        <Badge bg="primary" className="px-4 py-2 rounded-pill fs-6 fw-bold shadow-sm text-header-caps">
                            Step {currentStep.order_index} of {recipe.steps.length}
                        </Badge>
                    </div>
                    <div className="fs-4 lh-lg text-body-80 fw-medium text-start mx-auto px-3" style={{ whiteSpace: 'pre-wrap' }}>
                        {currentStep.instruction}
                    </div>
                </div>

                {/* --- SUGGESTED TIMERS --- */}
                {suggestions.length > 0 && (
                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-5 mx-auto" style={{ maxWidth: '800px' }}>
                        {suggestions.map((sug, idx) => (
                            <Button
                                key={idx}
                                variant="outline-primary"
                                className="rounded-pill fw-bold d-flex align-items-center shadow-sm"
                                onClick={() => startNewTimer(sug.label, sug.totalSeconds)}
                            >
                                <i className="bi bi-play-fill fs-5 me-1"></i> Start {sug.label} Timer
                            </Button>
                        ))}
                    </div>
                )}

                {/* Step Image */}
                {currentStep.image_url && (
                    <div className="text-center mb-5 mx-auto" style={{ maxWidth: '800px' }}>
                        <img src={currentStep.image_url} alt={`Step ${currentStep.order_index}`} className="img-fluid rounded-4 shadow-sm border" style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }} />
                    </div>
                )}

                {/* --- BOTTOM: THE DASHBOARD --- */}
                <Row className="g-4 justify-content-center mx-auto" style={{ maxWidth: '1000px' }}>

                    {/* LEFT CARD: Inputs */}
                    {hasInputs && (
                        <Col md={hasOutputs ? 6 : 8} lg={hasOutputs ? 6 : 8}>
                            <div className="bg-surface rounded-4 p-4 shadow-sm border h-100">
                                <h6 className="fw-bold mb-3 d-flex align-items-center text-muted text-header-caps">
                                    <i className="bi bi-arrow-down-right-square me-2"></i> Used in this step
                                </h6>
                                <div className="d-flex flex-column gap-2">
                                    {currentStep.links.filter(l => l.ingredient_id).map((link, idx) => {
                                        const ing = getIngredientDetails(link.ingredient_id);
                                        if (!ing) return null;
                                        return (
                                            <div key={`ing_${idx}`} className="d-flex align-items-center p-2 rounded-3 bg-primary-subtle border border-primary-subtle text-primary">
                                                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{width: '36px', height: '36px'}}><i className="bi bi-basket"></i></div>
                                                <span className="fw-bold me-2" style={{minWidth: '70px'}}>{link.usage_text}</span>
                                                <span className="fw-medium">{ing.name}</span>
                                            </div>
                                        );
                                    })}

                                    {currentStep.links.filter(l => l.linked_output_id).map((link, idx) => {
                                        const comp = getComponentDetails(link.linked_output_id);
                                        if (!comp) return null;
                                        return (
                                            <div key={`comp_${idx}`} className="d-flex align-items-center p-2 rounded-3 border" style={{backgroundColor: '#f3e8ff', borderColor: '#e9d5ff', color: '#6b21a8'}}>
                                                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{width: '36px', height: '36px'}}><i className="bi bi-box-seam"></i></div>
                                                <span className="fw-bold me-2" style={{minWidth: '70px'}}>{link.usage_text}</span>
                                                <span className="fw-medium">{comp.name}</span>
                                            </div>
                                        );
                                    })}

                                    {currentStep.links.filter(l => l.equipment_id).map((link, idx) => {
                                        const eq = getEquipmentDetails(link.equipment_id);
                                        if (!eq) return null;
                                        return (
                                            <div key={`eq_${idx}`} className="d-flex align-items-center p-2 rounded-3 bg-light border text-secondary">
                                                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{width: '36px', height: '36px'}}><i className="bi bi-tools"></i></div>
                                                <span className="fw-bold me-2" style={{minWidth: '70px'}}>{link.usage_text || 'Use'}</span>
                                                <span className="fw-medium text-dark">{eq.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Col>
                    )}

                    {/* RIGHT CARD: Outputs */}
                    {hasOutputs && (
                        <Col md={hasInputs ? 6 : 8} lg={hasInputs ? 6 : 8}>
                            <div className="bg-surface rounded-4 p-4 shadow-sm border h-100">
                                <h6 className="fw-bold mb-3 d-flex align-items-center text-success text-header-caps">
                                    <i className="bi bi-stars me-2"></i> This step yields
                                </h6>
                                <div className="d-flex flex-column gap-2">
                                    {currentStep.outputs.map((out, idx) => (
                                        <div key={`out_${idx}`} className="d-flex align-items-center p-2 rounded-3 bg-success-subtle border border-success-subtle text-success">
                                            <div className="bg-white rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{width: '36px', height: '36px'}}><i className="bi bi-check-circle"></i></div>
                                            <span className="fw-bold me-2" style={{minWidth: '70px'}}>{out.quantity ? decimalToFraction(out.quantity) : ''} {out.unit}</span>
                                            <span className="fw-medium">{out.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                    )}
                </Row>
            </div>
        );
    };

    return (
        <Modal show={show} onHide={onHide} fullscreen animation={false} className="cooking-mode-modal">
            <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4 px-md-5 align-items-start">
                <Modal.Title className="fw-bold text-muted fs-6 text-header-caps mt-2">
                    {recipe.name} {currentIndex > 0 ? `• Step ${currentIndex} of ${recipe.steps?.length}` : '• Mise en place'}
                </Modal.Title>

                {/* INJECT GLOBAL TIMERS INTO THE HEADER! */}
                <div className="flex-grow-1">
                    {renderGlobalTimers()}
                </div>
            </Modal.Header>

            <div className="px-4 px-md-5 pt-3">
                <ProgressBar now={progress} style={{ height: '6px' }} className="rounded-pill bg-light" variant="primary" />
            </div>

            <Modal.Body className="p-4 p-md-5 d-flex flex-column" style={{ overflowY: 'auto' }}>
                <div className="container-fluid max-w-1200 mx-auto flex-grow-1">
                    {currentIndex === 0 ? renderMiseEnPlace() : renderStep()}
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0 p-4 p-md-5 bg-white sticky-bottom shadow-lg-top">
                <div className="container-fluid max-w-1200 mx-auto d-flex justify-content-between align-items-center px-0">
                    <Button variant="light" size="lg" className="rounded-pill px-4 px-md-5 fw-bold border" onClick={handlePrev} disabled={currentIndex === 0}>
                        <i className="bi bi-arrow-left me-2"></i> Back
                    </Button>
                    <Button variant="primary" size="lg" className="rounded-pill px-4 px-md-5 fw-bold shadow-sm" onClick={currentIndex === totalPages - 1 ? onHide : handleNext}>
                        {currentIndex === 0 ? 'Start Cooking' : (currentIndex === totalPages - 1 ? 'Finish' : 'Next')}
                        {currentIndex < totalPages - 1 && <i className="bi bi-arrow-right ms-2"></i>}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}
