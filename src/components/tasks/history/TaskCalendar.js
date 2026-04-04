import { useState, useEffect } from 'react';
import { Button, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

export default function TaskCalendar({ taskId, target = 1 }) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());

  // Fetch Data on change
  useEffect(() => {
    if (!taskId) return;

    (async () => {
      setLoading(true);
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth() + 1;

      const response = await api.get(`/habits/${taskId}/calendar?year=${year}&month=${month}`);
      if (response.ok) {
        setCalendarData(response.body);
      } else {
        setCalendarData([]);
      }
      setLoading(false);
    })();
  }, [api, taskId, viewDate]);

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  // --- Visual Logic ---
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getFirstDayPadding = () => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  };

  const getCellColor = (count, goal) => {
    if (count === 0) return null;

    const percentage = Math.min(count / Math.max(goal, 1), 1);
    const palette = [
      '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5',
      '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'
    ];
    const index = Math.max(0, Math.ceil(percentage * 10) - 1);
    return palette[index];
  };

  const isMetGoal = (count) => count >= target;

  return (
    <div className="bg-surface rounded-4 shadow-sm border p-4">

        {/* Header Controls */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            {/* FIX: Removed 'bg-dark-subtle'.
                Now using 'bg-transparent' with 'text-secondary' (Grey) for the arrow.
                This ensures high contrast against the dark card background. */}
            <Button
                variant="outline-secondary"
                className="rounded-circle border-secondary-subtle bg-transparent text-secondary p-0 d-flex align-items-center justify-content-center"
                style={{width: '32px', height: '32px'}}
                onClick={() => changeMonth(-1)}
            >
                <i className="bi bi-chevron-left"></i>
            </Button>

            <h5 className="mb-0 fw-bold">
                {viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </h5>

            <Button
                variant="outline-secondary"
                className="rounded-circle border-secondary-subtle bg-transparent text-secondary p-0 d-flex align-items-center justify-content-center"
                style={{width: '32px', height: '32px'}}
                onClick={() => changeMonth(1)}
            >
                <i className="bi bi-chevron-right"></i>
            </Button>
        </div>

        {/* Content */}
        {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
            <div className="calendar-grid">
                <div className="d-grid mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-secondary small fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {[...Array(getFirstDayPadding())].map((_, i) => <div key={`pad-${i}`}></div>)}

                    {calendarData.map((dayData) => {
                        const localDate = new Date(dayData.date + 'T00:00:00');

                        const isToday = new Date().toDateString() === localDate.toDateString();
                        const color = getCellColor(dayData.count, target);
                        const metGoal = isMetGoal(dayData.count);
                        const hasActivity = dayData.count > 0;
                        const intensity = hasActivity ? Math.min(dayData.count / Math.max(target, 1), 1) : 0;
                        const textColor = intensity > 0.5 ? 'text-white' : 'text-dark';

                        return (
                            <OverlayTrigger
                                key={dayData.date}
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-${dayData.date}`}>
                                        <div className="text-center text-white">
                                            <strong>{localDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                                            <div className="small mt-1">
                                                Completed: {dayData.count} / {target}
                                            </div>
                                        </div>
                                    </Tooltip>
                                }
                            >
                                <div
                                    className={`rounded-3 position-relative d-flex align-items-center justify-content-center ${!color ? 'bg-dark-subtle border border-secondary-subtle' : ''}`}
                                    style={{
                                        aspectRatio: '1/1',
                                        backgroundColor: color || undefined,
                                        border: isToday ? '2px solid #ffc107' : (!color ? undefined : '1px solid transparent'),
                                        cursor: 'default',
                                        transition: 'transform 0.1s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <span
                                        className={`position-absolute top-0 start-0 m-1 small fw-bold ${hasActivity ? `${textColor} opacity-75` : 'text-secondary'}`}
                                        style={{fontSize: '0.6rem'}}
                                    >
                                        {dayData.day}
                                    </span>

                                    {metGoal && hasActivity && (
                                        <i className="bi bi-check-lg text-white" style={{fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}></i>
                                    )}
                                </div>
                            </OverlayTrigger>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
}
